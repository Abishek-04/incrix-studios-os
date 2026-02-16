import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Base Project Schema using Discriminator Pattern
 * Shared fields across all project types (content, design, dev)
 */
const BaseProjectSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    projectType: {
      type: String,
      required: true,
      enum: ['content', 'design', 'dev'],
      index: true
    },
    title: { type: String, required: true, index: 'text' },
    description: { type: String, default: '' },
    assignedTo: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    priority: { type: String, required: true, index: true },
    stage: { type: String, required: true, index: true },
    dueDate: { type: Number, required: true, index: true },
    lastUpdated: { type: Number, required: true, index: true },
    relatedContentProject: { type: String, index: true }, // Optional link to content project
    tasks: [
      {
        id: String,
        text: String,
        done: Boolean
      }
    ],
    comments: [
      {
        id: String,
        authorId: String,
        authorName: String,
        authorRole: String,
        text: String,
        timestamp: Number
      }
    ],
    archived: { type: Boolean, default: false, index: true }
  },
  {
    discriminatorKey: 'projectType',
    timestamps: true
  }
);

// Compound indexes for common queries
BaseProjectSchema.index({ projectType: 1, stage: 1 });
BaseProjectSchema.index({ projectType: 1, assignedTo: 1 });
BaseProjectSchema.index({ projectType: 1, archived: 1, lastUpdated: -1 });

export default mongoose.models.BaseProject || mongoose.model('BaseProject', BaseProjectSchema);
