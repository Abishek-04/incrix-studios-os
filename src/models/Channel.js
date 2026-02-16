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
    fbPageId: { type: String },
    fbPageName: { type: String },
    accessToken: { type: String, select: false }, // Encrypted
    tokenExpiry: { type: Date },
    tokenRefreshedAt: { type: Date },
    lastSynced: { type: Date },
    followerCount: { type: Number },
    mediaCount: { type: Number },
    connectionStatus: {
      type: String,
      enum: ['connected', 'token_expiring', 'token_expired', 'error'],
      default: 'connected'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Channel || mongoose.model('Channel', ChannelSchema);
