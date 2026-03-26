import mongoose from 'mongoose';

const { Schema } = mongoose;

const ReactionSchema = new Schema(
  {
    emoji: { type: String, required: true },
    userIds: [{ type: String }],
    userNames: [{ type: String }]
  },
  { _id: false }
);

const ChatMessageSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    channelId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, default: '' },
    senderColor: { type: String, default: 'bg-indigo-600' },
    content: { type: String, default: '' },
    type: {
      type: String,
      enum: ['text', 'system', 'image', 'file'],
      default: 'text'
    },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    // Reply threading
    replyToId: { type: String, default: null },
    replyToContent: { type: String, default: '' },
    replyToSender: { type: String, default: '' },
    // Reactions
    reactions: [ReactionSchema],
    // @mentions
    mentions: [{ type: String }],
    // Soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    // Edit tracking
    editedAt: { type: Date, default: null },
    // Read receipts — stores userIds who have read up to this message
    readBy: [{ type: String }]
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

ChatMessageSchema.index({ channelId: 1, createdAt: -1 });
ChatMessageSchema.index({ channelId: 1, isDeleted: 1, createdAt: -1 });

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
