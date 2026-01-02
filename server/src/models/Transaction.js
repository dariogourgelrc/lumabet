import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    method: { type: String, enum: ['mcx', 'reference'], required: true },
    paymentId: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

transactionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
