import mongoose from 'mongoose';

const { Schema } = mongoose;

const ChannelSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    platform: { type: String, required: true, index: true },
    name: { type: String, required: true },
    link: { type: String, required: true },
    avatarUrl: { type: String },
    email: { type: String, required: true },
    credentials: { type: String, select: false },
    memberId: { type: String, index: true }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Channel || mongoose.model('Channel', ChannelSchema);
