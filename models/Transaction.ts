import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true }, // in cents, positive = income, negative = expense
  category: { type: String, required: true }, // 'dining', 'groceries', 'coffee', 'entertainment', 'transport', 'shopping', 'health', 'travel', 'bills', 'income', 'other'
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now, index: true },
  plaidTransactionId: { type: String, default: null, index: true, sparse: true },
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
