import mongoose from 'mongoose';

const routeRequestSchema = new mongoose.Schema({
  fromCity:    { type: String, required: true, trim: true },
  toCity:      { type: String, required: true, trim: true },
  name:        { type: String, default: '', trim: true },
  notes:       { type: String, default: '', maxlength: 500 },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  contactEmail:{ type: String, default: '' },
  arrivalTime: { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('RouteRequest', routeRequestSchema);
