// models/PasswordResetToken.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const passwordResetTokenSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // 1 hour expiry
});

export default model('PasswordResetToken', passwordResetTokenSchema);
