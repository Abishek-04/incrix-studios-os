import mongoose from 'mongoose';

const { Schema } = mongoose;

const ChatChannelSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['channel', 'dm', 'announcement'],
      default: 'channel',
      index: true
    },
    team: {
      type: String,
      enum: ['general', 'dev', 'content', 'design', 'marketing', 'editing', 'hardware', null],
      default: null
    },
    // For DM channels: exactly 2 member IDs
    // For group channels: all member IDs (empty = everyone)
    members: [{ type: String }],
    isDefault: { type: Boolean, default: false }, // auto-visible to team members
    isReadOnly: { type: Boolean, default: false }, // announcements channel
    createdBy: { type: String, required: true },
    // Cached last message for sidebar preview
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null },
    lastMessageBy: { type: String, default: '' },
    // Per-user last read timestamp { userId: Date }
    lastReadBy: { type: Map, of: Date, default: {} },
    // Pinned message IDs
    pinnedMessages: [{ type: String }],
    emoji: { type: String, default: '' }
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

ChatChannelSchema.index({ type: 1, team: 1 });
ChatChannelSchema.index({ members: 1 });

export default mongoose.models.ChatChannel || mongoose.model('ChatChannel', ChatChannelSchema);
