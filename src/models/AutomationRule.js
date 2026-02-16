import mongoose from 'mongoose';

const { Schema } = mongoose;

const AutomationRuleSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    channelId: { type: String, required: true, index: true },
    mediaId: { type: String, default: null, index: true }, // null = applies to all posts

    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'draft'],
      default: 'draft',
      index: true,
    },

    // Trigger configuration
    trigger: {
      type: {
        type: String,
        enum: ['new_comment', 'keyword_comment'],
        default: 'new_comment',
      },
      keywords: [{ type: String }], // Trigger only if comment contains any keyword
      excludeKeywords: [{ type: String }], // Ignore comments containing these words
      excludeExistingFollowers: { type: Boolean, default: false }, // Future use
    },

    // DM response configuration
    response: {
      messageTemplate: { type: String, required: true },
      // Supports variables: {{username}}, {{comment_text}}, {{post_caption}}, {{post_link}}
      includeFiles: [
        {
          type: { type: String, enum: ['image', 'video', 'document'] },
          url: String, // Publicly accessible URL
          filename: String,
        },
      ],
      delaySeconds: { type: Number, default: 5, min: 0, max: 300 },
    },

    // Safety & limits
    deduplication: {
      enabled: { type: Boolean, default: true },
      windowHours: { type: Number, default: 24 },
    },
    dailyLimit: { type: Number, default: 100 },

    // Stats (updated by worker)
    stats: {
      totalTriggered: { type: Number, default: 0 },
      totalSent: { type: Number, default: 0 },
      totalFailed: { type: Number, default: 0 },
      totalDeduped: { type: Number, default: 0 },
      lastTriggeredAt: Date,
      lastSentAt: Date,
    },

    createdBy: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
AutomationRuleSchema.index({ channelId: 1, status: 1 });
AutomationRuleSchema.index({ mediaId: 1, status: 1 });
AutomationRuleSchema.index({ channelId: 1, mediaId: 1 });

export default mongoose.models.AutomationRule || mongoose.model('AutomationRule', AutomationRuleSchema);
