import mongoose from 'mongoose';

const coordSchema = { lat: Number, lon: Number };

const busSchema = new mongoose.Schema({
  name:        { type: String, trim: true, default: '' },
  fromCity:    { type: String, required: true, trim: true },
  toCity:      { type: String, required: true, trim: true },
  fromCoords:  { type: coordSchema, default: null },
  toCoords:    { type: coordSchema, default: null },
  arrivalTime: { type: String, default: '' },
  frequency:   { type: String, default: 'Every day' },
  status:      { type: String, enum: ['approved', 'pending', 'rejected'], default: 'approved' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

busSchema.index({ fromCity: 1, toCity: 1 });

export default mongoose.model('Bus', busSchema);
