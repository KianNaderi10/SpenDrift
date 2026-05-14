import mongoose from 'mongoose';

const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  limit: { type: Number, required: true }, // monthly limit in cents
}, { timestamps: true });

// One budget per category per user. The upsert in the POST handler relies on this to
// update instead of insert when the user changes an existing category limit.
BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

export default mongoose.models.Budget || mongoose.model('Budget', BudgetSchema);
