// models/Collection.js - New model to track overall collections
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const collectionSchema = new Schema({
  year: { type: Number, required: true, unique: true },
  totalAmount: { type: Number, default: 0 },
  monthlyBreakdown: [{
    month: { type: String, required: true }, // "January", "February", etc.
    amount: { type: Number, default: 0 },
    paymentsCount: { type: Number, default: 0 }
  }],
  lastUpdated: { type: Date, default: Date.now }
});

export default model('Collection', collectionSchema);