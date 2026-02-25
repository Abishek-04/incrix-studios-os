import mongoose from 'mongoose';

const { Schema } = mongoose;

const DeletedItemSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    entityType: {
      type: String,
      required: true,
      enum: ['project', 'channel', 'daily_task', 'user', 'automation_rule', 'other'],
      index: true
    },
    entityId: { type: String, required: true, index: true },
    source: { type: String, default: 'unknown', index: true },
    deletedBy: { type: String, default: 'system' },
    data: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, index: true }
  },
  {
    timestamps: true
  }
);

DeletedItemSchema.index({ createdAt: -1, entityType: 1 });

export default mongoose.models.DeletedItem || mongoose.model('DeletedItem', DeletedItemSchema);
