// models/PasswordResetOTP.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const passwordResetOTPSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  otp: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 minutes expiry
});

// Index for better query performance
passwordResetOTPSchema.index({ email: 1, createdAt: 1 });
passwordResetOTPSchema.index({ otp: 1, email: 1 });

export default model('PasswordResetOTP', passwordResetOTPSchema);