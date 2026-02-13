import express from 'express';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  authenticateToken,
  AuthRequest
} from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with password field (normally excluded)
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in user document
    user.refreshTokens.push(refreshToken);
    user.lastActive = new Date();
    await user.save();

    // Return user data (password excluded by toJSON transform)
    res.json({
      success: true,
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
    const user = await User.findOne({ id: decoded.userId });

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user.id);

    res.json({
      accessToken: newAccessToken
    });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ error: 'Refresh token expired' });
    }
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user!;

    // Remove refresh token from user's list
    user.refreshTokens = user.refreshTokens.filter((t: string) => t !== refreshToken);
    await user.save();

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

// GET /api/auth/me - Get current authenticated user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    res.json({ user: req.user!.toJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/change-password - Change user password
router.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Get user with password
    const user = await User.findById(req.user!._id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
