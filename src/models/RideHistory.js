import mongoose from 'mongoose';

const rideHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bus:  { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  fromCity: String,
  toCity:   String,
}, { timestamps: true });

export default mongoose.model('RideHistory', rideHistorySchema);
