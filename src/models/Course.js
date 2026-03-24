import mongoose from 'mongoose';

const { Schema } = mongoose;

const CourseSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    courseTakerId: { type: String, required: true, index: true },
    courseTakerName: { type: String, required: true },
    status: {
      type: String,
      enum: ['planning', 'in_progress', 'completed'],
      default: 'planning',
    },
    createdBy: { type: String, index: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Course || mongoose.model('Course', CourseSchema);
