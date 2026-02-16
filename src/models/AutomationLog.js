import mongoose from 'mongoose';

const { Schema } = mongoose;

const AutomationLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    automationRuleId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, index: true },
    igMediaId: { type: String, index: true },
    igCommentId: { type: String, index: true },
    igUserId: { type: String, index: true },
    igUsername: { type: String },
    commentText: { type: String },

    dmStatus: {
      type: String,
      enum: ['queued', 'sent', 'failed', 'rate_limited', 'deduped', 'keyword_filtered'],
      required: true,
      index: true,
    },
    dmSentAt: { type: Date },
    errorMessage: { type: String },
    responseTimeMs: { type: Number }, // Time from comment webhook to DM sent
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
AutomationLogSchema.index({ channelId: 1, createdAt: -1 });
AutomationLogSchema.index({ automationRuleId: 1, createdAt: -1 });
AutomationLogSchema.index({ igUserId: 1, channelId: 1, createdAt: -1 }); // For dedup lookups
AutomationLogSchema.index({ dmStatus: 1, createdAt: -1 });

export default mongoose.models.AutomationLog || mongoose.model('AutomationLog', AutomationLogSchema);
