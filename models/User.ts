import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  plaidAccessToken: { type: String, default: null },
  plaidItemId: { type: String, default: null },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
