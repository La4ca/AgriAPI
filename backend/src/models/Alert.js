import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type:           { type: String, enum: ['critical','high','moderate','low'], required: true },
  title:          { type: String, required: true },
  message:        { type: String, required: true },
  region:         { type: String },
  lat:            { type: Number },
  lng:            { type: Number },
  acknowledged:   { type: Boolean, default: false },
  acknowledgedBy: { type: String },
  acknowledgedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('Alert', alertSchema);