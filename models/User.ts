import mongoose from 'mongoose';

// plaidAccessToken and plaidItemId are null until the user connects a bank via Plaid Link.
// They are stored per-user so each account can independently sync real transactions.
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // lowercase enforced here and at write sites so email lookups are case-insensitive without a collation index
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, // bcrypt hash, never plaintext
  plaidAccessToken: { type: String, default: null },
  plaidItemId: { type: String, default: null },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
