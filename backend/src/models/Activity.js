import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  type:    { type: String, enum: ['match','alert','delivery','update'], required: true },
  message: { type: String, required: true },
  icon:    { type: String, default: 'refresh' },
}, { timestamps: true });

export default mongoose.model('Activity', activitySchema);
