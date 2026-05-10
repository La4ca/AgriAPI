import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  licenseNo:  { type: String, required: true, trim: true },
  contact:    {
    type: String,
    validate: {
      validator: v => !v || /^\d{11}$/.test(v),
      message: 'Contact must be exactly 11 digits.',
    },
  },
  address:    { type: String },
  status:     { type: String, enum: ['available', 'on_duty', 'off_duty'], default: 'available' },
  // Assigned vehicle (optional)
  vehicleId:  { type: String, default: '' },
  plate:      { type: String, default: '' },
  vehicleType:{ type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Driver', driverSchema);
