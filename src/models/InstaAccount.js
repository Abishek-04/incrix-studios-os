import mongoose from 'mongoose';

const instaAccountSchema = new mongoose.Schema(
  {
    // Link to our studio user who connected this account
    connectedBy: { type: String, required: true, index: true },
    // Instagram identity fields
    instagramUserId: { type: String, index: true },
    instagramLoginId: { type: String },
    instagramTokenUserId: { type: String },
    username: { type: String },
    profilePictureUrl: { type: String },
    accountType: { type: String },
    // Token management
    accessToken: { type: String },
    permissions: [{ type: String }],
    tokenType: { type: String, default: 'bearer' },
    tokenExpiresIn: { type: Number },
    tokenExpiresAt: { type: String },
    // Metadata
    connectedAt: { type: String },
    followerCount: { type: Number, default: 0 },
    mediaCount: { type: Number, default: 0 },
    lastSynced: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.InstaAccount || mongoose.model('InstaAccount', instaAccountSchema);
