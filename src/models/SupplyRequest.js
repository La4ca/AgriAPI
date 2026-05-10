import mongoose from 'mongoose';

const supplyRequestSchema = new mongoose.Schema({
  reqId:        { type: String, unique: true },
  submittedBy:  { type: String, required: true },
  crop:         { type: String, required: true },
  quantity:     { type: String, required: true },
  from:         { type: String, required: true },
  to:           { type: String, required: true },
  urgency:      { type: String, enum: ['critical','high','moderate','low'], default: 'high' },
  notes:        { type: String, default: '' },
  status:       { type: String, enum: ['pending','approved','in_transit','delivered','rejected'], default: 'pending' },
  matchScore:   { type: Number },
  distance:     { type: String },
  truckId:      { type: String },
  driver:       { type: String },
  plate:        { type: String },
  phone:        { type: String },
  progress:     { type: Number, default: 0 },
  speed:        { type: Number, default: 0 },
  lat:          { type: Number },
  lng:          { type: Number },
  approvedBy:   { type: String },
  approvedAt:   { type: Date },
  rejectedBy:   { type: String },
  rejectedAt:   { type: Date },
  rejectReason: { type: String },
  receivedBy:   { type: String },
  receivedAt:   { type: Date },
}, { timestamps: true });

// Auto-generate reqId before save
supplyRequestSchema.pre('save', async function (next) {
  if (!this.reqId) {
    const count = await mongoose.model('SupplyRequest').countDocuments();
    this.reqId = `REQ-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('SupplyRequest', supplyRequestSchema);
