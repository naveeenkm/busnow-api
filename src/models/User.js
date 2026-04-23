import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to:   { type: String, required: true },
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 100 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  isDemo:   { type: Boolean, default: false },
  favorites:[favoriteSchema],
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
