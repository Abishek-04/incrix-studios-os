import mongoose from 'mongoose';
const { Schema } = mongoose;

const RevenueSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    stream: {
      type: String,
      enum: ['content_monetization', 'client_services', 'courses', 'hardware', 'classory_saas'],
      required: true,
      index: true
    },
    amount: { type: Number, required: true, min: 0 },
    month: { type: String, required: true, index: true }, // "2026-03"
    description: { type: String, default: '' },
    createdBy: { type: String, required: true }
  },
  {
    timestamps: true,
    toJSON: { transform(doc, ret) { delete ret._id; delete ret.__v; return ret; } }
  }
);

RevenueSchema.index({ month: 1, stream: 1 });
export default mongoose.models.Revenue || mongoose.model('Revenue', RevenueSchema);
