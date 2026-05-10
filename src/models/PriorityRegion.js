import mongoose from 'mongoose';

const priorityRegionSchema = new mongoose.Schema({
  region:      { type: String, required: true },
  area:        { type: String },
  score:       { type: Number, default: 0 },
  urgency:     { type: String, enum: ['critical','high','moderate','low'], default: 'low' },
  population:  { type: String },
  shortage:    { type: String },
  lat:         { type: Number },
  lng:         { type: Number },
  waterLevel:  { type: Number },
  stockLeft:   { type: Number },
  stockNeeded: { type: Number },
  isCustom:    { type: Boolean, default: false },
  lastUpdated: { type: String },
}, { timestamps: true });

export default mongoose.model('PriorityRegion', priorityRegionSchema);
