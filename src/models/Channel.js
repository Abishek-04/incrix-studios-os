import mongoose from 'mongoose';

const { Schema } = mongoose;

const ChannelSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    platform: { type: String, required: true, index: true },
    name: { type: String, required: true },
    link: { type: String, required: true },
    avatarUrl: { type: String },
    email: { type: String, required: true },
    credentials: { type: String, select: false },
    memberId: { type: String, index: true },

    // Instagram-specific fields (when platform === 'instagram')
    igUserId: { type: String, index: true },
    igUsername: { type: String },
    igProfilePicUrl: { type: String },
    igBusinessAccountId: { type: String, index: true }, // IG Business Account ID (from FB Page)
    fbPageId: { type: String, index: true },
    fbPageName: { type: String },
    fbPageAccessToken: { type: String, select: false }, // Encrypted, non-expiring Page Token
    userAccessToken: { type: String, select: false }, // Encrypted long-lived User Token
    userTokenExpiry: { type: Date }, // When the User Token expires (~60 days)
    accessToken: { type: String, select: false }, // Encrypted (kept for backward compat, stores Page Token)
    tokenExpiry: { type: Date },
    tokenRefreshedAt: { type: Date },
    lastSynced: { type: Date },
    followerCount: { type: Number },
    followsCount: { type: Number },
    mediaCount: { type: Number },
    connectionStatus: {
      type: String,
      enum: ['connected', 'token_expiring', 'token_expired', 'error', 'requires_reconnect'],
      default: 'connected'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Channel || mongoose.model('Channel', ChannelSchema);
