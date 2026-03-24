import mongoose from 'mongoose';

const instaUsageSchema = new mongoose.Schema({
  accountId: { type: String, required: true },
  month: { type: String, required: true },
  repliesSent: { type: Number, default: 0 },
});

instaUsageSchema.index({ accountId: 1, month: 1 }, { unique: true });

export default mongoose.models.InstaUsage || mongoose.model('InstaUsage', instaUsageSchema);
