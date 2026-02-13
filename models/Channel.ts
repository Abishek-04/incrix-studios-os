import mongoose, { Schema, Document } from 'mongoose';

export interface IChannel extends Document {
  id: string;
  platform: string;
  name: string;
  link: string;
  avatarUrl?: string;
  email: string;
  credentials?: string; // Should be encrypted in production
  memberId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    platform: { type: String, required: true, index: true },
    name: { type: String, required: true },
    link: { type: String, required: true },
    avatarUrl: { type: String },
    email: { type: String, required: true },
    credentials: { type: String, select: false }, // Exclude by default for security
    memberId: { type: Schema.Types.ObjectId, ref: 'User', index: true }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IChannel>('Channel', ChannelSchema);
