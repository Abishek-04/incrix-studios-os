import mongoose from 'mongoose';
import BaseProject from './BaseProject';

const { Schema } = mongoose;

/**
 * Design Project Schema
 * Extends BaseProject for design-specific fields
 */
const DesignProjectSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['logo', 'banner', 'thumbnail', 'ui-mockup', 'branding', 'social-media'],
    index: true
  },
  assignedDesigner: { type: String, required: true, index: true },
  briefing: { type: String, default: '' },
  conceptNotes: { type: String, default: '' },
  reviewNotes: { type: String, default: '' },
  designFiles: [
    {
      url: String,
      name: String,
      type: String,
      uploadedAt: Number
    }
  ],
  dimensions: { type: String }, // e.g., "1920x1080"
  colorScheme: { type: String },
  brandGuidelines: { type: String }
});

// Create discriminator
const DesignProject = BaseProject.discriminator('design', DesignProjectSchema);

export default DesignProject;
