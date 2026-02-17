import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const PendingJobSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, default: () => uuidv4() },
    type: {
      type: String,
      enum: ['send_dm', 'sync_media', 'refresh_token'],
      required: true,
      index: true,
    },
    channelId: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    executeAfter: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: { type: String },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient cron queries
PendingJobSchema.index({ status: 1, executeAfter: 1 });

export default mongoose.models.PendingJob || mongoose.model('PendingJob', PendingJobSchema);
