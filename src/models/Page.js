import mongoose from 'mongoose';

const BlockSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['paragraph', 'heading', 'list', 'code', 'image', 'callout', 'divider', 'quote', 'table']
  },
  content: { type: mongoose.Schema.Types.Mixed },
  properties: {
    level: Number, // For headings (1-6)
    language: String, // For code blocks
    url: String, // For images/embeds
    checked: Boolean, // For task list items
    listType: String, // 'bullet', 'numbered', 'todo'
    align: String, // 'left', 'center', 'right'
    backgroundColor: String,
    textColor: String
  },
  children: [String], // IDs of nested blocks
  order: { type: Number, default: 0 },
  createdBy: String,
  createdAt: { type: Number, default: Date.now },
  updatedBy: String,
  updatedAt: { type: Number, default: Date.now }
});

const PageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  icon: String, // Emoji or icon name
  coverImage: String,
  parentId: String, // For nested pages
  workspaceId: String,
  type: {
    type: String,
    default: 'page',
    enum: ['page', 'database', 'project', 'task']
  },

  // Block-based content
  blocks: [BlockSchema],
  blockOrder: [String], // Top-level block IDs in order

  // Metadata - flexible custom properties
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Collaboration
  editors: [{
    userId: String,
    userName: String,
    lastEditedAt: Number
  }],

  // Legacy fields for backward compatibility with existing Projects
  stage: String,
  status: String,
  priority: String,
  creator: String,
  editor: String,

  // Assignees (enhanced from legacy)
  assignees: [{
    userId: String,
    userName: String,
    role: String, // 'creator', 'editor', 'reviewer'
    assignedAt: Number
  }],

  dueDate: Number,

  // Relations
  relatedPages: [String], // IDs of related pages

  // Access control
  permissions: {
    owner: String,
    editors: [String],
    viewers: [String],
    public: { type: Boolean, default: false }
  },

  // System
  archived: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  deletedAt: Number,
  createdBy: String,
  createdAt: { type: Number, default: Date.now },
  updatedAt: { type: Number, default: Date.now }
}, {
  timestamps: true
});

// Indexes for common queries
PageSchema.index({ id: 1 });
PageSchema.index({ type: 1, archived: 1 });
PageSchema.index({ createdBy: 1, createdAt: -1 });
PageSchema.index({ 'assignees.userId': 1, status: 1 });
PageSchema.index({ archived: 1, deleted: 1 });
PageSchema.index({ parentId: 1, 'blockOrder': 1 });
PageSchema.index({ title: 'text', 'blocks.content': 'text' }); // Full-text search

// Prevent model recompilation in development
export default mongoose.models.Page || mongoose.model('Page', PageSchema);
