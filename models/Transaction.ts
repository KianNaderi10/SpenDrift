import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Stored in cents to avoid floating-point rounding. Sign convention: negative = expense, positive = income.
  // Plaid amounts are the opposite (positive = debit), so they are negated on import.
  amount: { type: Number, required: true },
  // Valid categories: 'dining' | 'groceries' | 'coffee' | 'entertainment' | 'transport' |
  //                   'shopping' | 'health' | 'travel' | 'bills' | 'income' | 'other'
  category: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now, index: true },
  // Null for manually entered transactions. Sparse index skips nulls, keeping the unique constraint
  // only on real Plaid IDs so duplicate imports are rejected without blocking manual entries.
  plaidTransactionId: { type: String, default: null, index: true, sparse: true },
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
