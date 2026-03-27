import mongoose from 'mongoose';
const { Schema } = mongoose;

const AttendanceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    status: {
      type: String,
      enum: ['office', 'wfh', 'leave', 'half_day'],
      required: true,
    },
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { transform(doc, ret) { delete ret._id; delete ret.__v; return ret; } }
  }
);

// One record per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
