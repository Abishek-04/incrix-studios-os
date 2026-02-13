import mongoose, { Schema, Document } from 'mongoose';

  id: string;
  title: string;
  topic: string;
  vertical: string;
  platform: string;
  contentFormat?: 'LongForm' | 'ShortForm';
  channelId?: mongoose.Types.ObjectId;
  role: string;
  creatorId: mongoose.Types.ObjectId;
  editorId?: mongoose.Types.ObjectId;
  stage: string;
  status: string;
  priority: string;
  lastUpdated: number;
  dueDate: number;
  durationMinutes: number;
  script: string;
  tasks: { id: string; text: string; done: boolean }[];
  technicalNotes: string;
  reviewLink?: string;
  publishedLink?: string;
  comments: {
    id: string;
    authorId: mongoose.Types.ObjectId;
    text: string;
    timestamp: number;
  }[];
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    retention: string;
    sources?: string[];
    lastUpdated: number;
  };
  hasMographNeeds: boolean;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;

const ProjectSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: 'text' }, // Full-text search
    topic: { type: String, required: true },
    vertical: { type: String, required: true, index: true },
    platform: { type: String, required: true, index: true },
    contentFormat: { type: String, enum: ['LongForm', 'ShortForm'] },
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', index: true },
    role: { type: String, required: true, index: true },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    editorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    stage: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    priority: { type: String, required: true, index: true },
    lastUpdated: { type: Number, required: true, index: true },
    dueDate: { type: Number, required: true, index: true },
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
        authorId: { type: Schema.Types.ObjectId, ref: 'User' },
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
ProjectSchema.index({ creatorId: 1, stage: 1 });
ProjectSchema.index({ archived: 1, lastUpdated: -1 });
ProjectSchema.index({ stage: 1, status: 1 });
ProjectSchema.index({ dueDate: 1, archived: 1 });
ProjectSchema.index({ platform: 1, archived: 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);
