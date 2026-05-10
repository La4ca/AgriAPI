import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleId:   { type: String, required: true, unique: true },
  driver:      { type: String, default: '' },   // assigned via Drivers & Truckers tab
  plate:       { type: String, required: true },
  vehicleType: { type: String, default: '' },
  phone:       { type: String, default: '' },
  cargo:       { type: String },
  weight:      { type: String },
  from:        { type: String },
  to:          { type: String },
  status:      { type: String, enum: ['in_transit','loading','delivered','delayed'], default: 'loading' },
  progress:    { type: Number, default: 0 },
  lat:         { type: Number },
  lng:         { type: Number },
  speed:       { type: Number, default: 0 },
  fuel:        { type: Number, default: 100 },
  eta:         { type: String },
}, { timestamps: true });

export default mongoose.model('Vehicle', vehicleSchema);