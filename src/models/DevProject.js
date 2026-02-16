import mongoose from 'mongoose';
import BaseProject from './BaseProject';

const { Schema } = mongoose;

/**
 * Dev Project Schema
 * Extends BaseProject for development-specific fields
 */
const DevProjectSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['feature', 'bugfix', 'refactor', 'infrastructure', 'optimization'],
    index: true
  },
  assignedDeveloper: { type: String, required: true, index: true },
  requirements: { type: String, default: '' },
  technicalSpec: { type: String, default: '' },
  testingNotes: { type: String, default: '' },
  deploymentNotes: { type: String, default: '' },
  repository: { type: String },
  branch: { type: String },
  pullRequest: { type: String },
  estimatedHours: { type: Number },
  actualHours: { type: Number }
});

// Create discriminator
const DevProject = BaseProject.discriminator('dev', DevProjectSchema);

export default DevProject;
