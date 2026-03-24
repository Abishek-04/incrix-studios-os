import mongoose from 'mongoose';

const instaAutomationSchema = new mongoose.Schema(
  {
    // The Instagram account this automation belongs to
    accountId: { type: String, required: true, index: true },
    // The studio user who created it
    createdBy: { type: String, index: true },
    triggerType: { type: String, default: 'comment' },
    triggerKeyword: { type: String },
    matchType: { type: String, default: 'contains' },
    replyType: { type: String, default: 'both' },
    replyMessage: { type: String },
    compiledReplyMessage: { type: String },
    productLink: { type: String },
    targetMediaId: { type: String },
    targetMediaCaption: { type: String },
    targetMediaUrl: { type: String },
    targetMediaType: { type: String },
    active: { type: Boolean, default: true },
    commentReplies: { type: Number, default: 0 },
    dmReplies: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.InstaAutomation || mongoose.model('InstaAutomation', instaAutomationSchema);
