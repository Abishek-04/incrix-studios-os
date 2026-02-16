import mongoose from 'mongoose';

const { Schema } = mongoose;

const InstagramMediaSchema = new Schema(
  {
    channelId: {
      type: String,
      required: true,
      index: true,
    },
    igMediaId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mediaType: {
      type: String,
      enum: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS'],
      required: true,
      index: true,
    },
    mediaUrl: { type: String },
    thumbnailUrl: { type: String },
    permalink: { type: String, required: true },
    caption: { type: String },
    timestamp: { type: Date, required: true, index: true },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },

    // Automation tracking
    automationActive: { type: Boolean, default: false, index: true },
    automationRuleId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
InstagramMediaSchema.index({ channelId: 1, timestamp: -1 });
InstagramMediaSchema.index({ channelId: 1, automationActive: 1 });
InstagramMediaSchema.index({ channelId: 1, mediaType: 1 });

export default mongoose.models.InstagramMedia || mongoose.model('InstagramMedia', InstagramMediaSchema);
