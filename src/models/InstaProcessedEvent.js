import mongoose from 'mongoose';

const instaProcessedEventSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 120 },
});

export default mongoose.models.InstaProcessedEvent || mongoose.model('InstaProcessedEvent', instaProcessedEventSchema);
