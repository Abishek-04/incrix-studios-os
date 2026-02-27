import mongoose from 'mongoose';

const { Schema } = mongoose;

const ProjectSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: 'text' },
    topic: { type: String, required: true },
    vertical: { type: String, required: true, index: true },
    platform: { type: String, required: true, index: true },
    contentFormat: { type: String, enum: ['LongForm', 'ShortForm'] },
    channelId: { type: String, index: true },
    role: { type: String, required: true, index: true },
    creator: { type: String, required: true, index: true },
    editor: { type: String, index: true },
    editors: [{ type: String, index: true }],
    stage: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    priority: { type: String, required: true, index: true },
    lastUpdated: { type: Number, required: true, index: true },
    dueDate: { type: Number, required: true, index: true },
    shootDate: { type: Number, index: true },
    editDate: { type: Number, index: true },
    uploadDoneDate: { type: Number, index: true },
    reshootDone: { type: Boolean, default: false, index: true },
    reshootDate: { type: Number, index: true },
    durationMinutes: { type: Number, default: 0 },
    script: { type: String, default: '' },
    tasks: [
      {
        id: String,
        text: String,
        done: Boolean
      }
    ],
    technicalNotes: { type: String, default: '' },
    reviewLink: { type: String },
    publishedLink: { type: String },
    comments: [
      {
        id: String,
        author: String,
        text: String,
        timestamp: Number
      }
    ],
    metrics: {
      views: Number,
      likes: Number,
      comments: Number,
      retention: String,
      sources: [String],
      lastUpdated: Number
    },
    hasMographNeeds: { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false, index: true }
  },
  {
    timestamps: true
  }
);

// Compound indexes for common queries
ProjectSchema.index({ creator: 1, stage: 1 });
ProjectSchema.index({ archived: 1, lastUpdated: -1 });
ProjectSchema.index({ stage: 1, status: 1 });
ProjectSchema.index({ dueDate: 1, archived: 1 });
ProjectSchema.index({ platform: 1, archived: 1 });

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
