import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  location:    { type: String, required: true },
  province:    { type: String, default: 'Cebu' },  // filter for "Active Farms in Cebu" KPI
  crops:       [{ type: String }],
  hectares:    { type: Number, default: 0 },
  status:      { type: String, enum: ['active','inactive'], default: 'active' },
  lastHarvest: { type: String },
  contact:     { type: String },
}, { timestamps: true });

export default mongoose.model('Farmer', farmerSchema);
