import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    role: {
      type: String,
      required: true,
      enum: ['manager', 'creator', 'editor', 'mograph'],
      index: true
    },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, select: false },
    phoneNumber: { type: String },
    notifyViaWhatsapp: { type: Boolean, default: false },
    notifyViaEmail: { type: Boolean, default: true },
    avatarColor: { type: String, required: true },
    niche: { type: String },
    active: { type: Boolean, default: true, index: true },
    quota: {
      youtubeLong: { type: Number, default: 0 },
      youtubeShort: { type: Number, default: 0 },
      instagramReel: { type: Number, default: 0 },
      course: { type: Number, default: 0 },
      period: { type: String, enum: ['weekly', 'monthly'], default: 'weekly' }
    },
    refreshTokens: [{ type: String }],
    lastActive: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Pre-save hook to hash password
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Create index for common queries
UserSchema.index({ role: 1, active: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
