// models/Notification.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['payment', 'general', 'reminder'], default: 'payment' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  month: { type: String, required: true },
  amount: { type: Number, required: true },
  paidDate: { type: Date, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });

export default model('Notification', notificationSchema);