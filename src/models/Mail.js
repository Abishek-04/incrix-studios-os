import mongoose from 'mongoose';
const { Schema } = mongoose;

const MailSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    from: { type: String, required: true, index: true },
    fromName: { type: String, required: true },
    fromAvatar: { type: String, default: '' },
    fromColor: { type: String, default: 'bg-indigo-500' },
    to: [{ type: String, required: true }],
    toNames: [{ type: String }],
    subject: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    attachments: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String, default: 'file' },
      size: { type: String, default: '' },
    }],
    isRead: { type: Map, of: Boolean, default: {} },
    isStarred: { type: Map, of: Boolean, default: {} },
    replyToId: { type: String, default: null },
    threadId: { type: String, default: null },
    isDeleted: { type: Map, of: Boolean, default: {} },
    labels: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { transform(doc, ret) { delete ret._id; delete ret.__v; return ret; } }
  }
);

MailSchema.index({ to: 1, createdAt: -1 });
MailSchema.index({ from: 1, createdAt: -1 });
MailSchema.index({ threadId: 1, createdAt: 1 });

export default mongoose.models.Mail || mongoose.model('Mail', MailSchema);
