import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
