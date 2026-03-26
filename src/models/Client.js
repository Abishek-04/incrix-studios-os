import mongoose from 'mongoose';
const { Schema } = mongoose;

const ClientSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['lead', 'prospect', 'active', 'completed', 'lost'],
      default: 'lead',
      index: true
    },
    source: {
      type: String,
      enum: ['referral', 'instagram', 'linkedin', 'direct', 'classory', 'hardware', 'other'],
      default: 'direct'
    },
    service: {
      type: String,
      enum: ['content', 'design', 'development', 'hardware', 'classory', 'other'],
      default: 'other'
    },
    budget: { type: String, default: '' },
    requirements: { type: String, default: '' },
    notes: { type: String, default: '' },
    assignedTo: { type: String, default: '' },
    tags: [{ type: String }],
    createdBy: { type: String, required: true }
  },
  {
    timestamps: true,
    toJSON: { transform(doc, ret) { delete ret._id; delete ret.__v; return ret; } }
  }
);

ClientSchema.index({ status: 1, createdAt: -1 });
export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
