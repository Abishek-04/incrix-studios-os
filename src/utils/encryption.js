import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.warn(
    '[Encryption] ENCRYPTION_KEY not configured or invalid length. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

/**
 * Encrypt sensitive data (e.g., access tokens, credentials)
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text in format: iv:encryptedData
 */
export function encrypt(text) {
  if (!text) return null;

  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable not configured');
  }

  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV and encrypted data separated by colon
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('[Encryption] Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return null;

  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable not configured');
  }

  try {
    // Split IV and encrypted data
    const [ivHex, encryptedData] = encryptedText.split(':');

    if (!ivHex || !encryptedData) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(ivHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Encryption] Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash data (one-way, for verification)
 * @param {string} text - Text to hash
 * @returns {string} SHA-256 hash
 */
export function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Verify if text matches hash
 * @param {string} text - Plain text
 * @param {string} hashedText - Hashed text to compare
 * @returns {boolean} True if matches
 */
export function verifyHash(text, hashedText) {
  return hash(text) === hashedText;
}

/**
 * Generate secure random string (for tokens, secrets)
 * @param {number} length - Length in bytes (default 32)
 * @returns {string} Random hex string
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

export default {
  encrypt,
  decrypt,
  hash,
  verifyHash,
  generateSecureToken,
};
