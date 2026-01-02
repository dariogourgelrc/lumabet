import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

export async function initializeDatabase() {
    const mongodbUri = process.env.MONGODB_URI;

    if (!mongodbUri) {
        console.warn('⚠️ MONGODB_URI não definida. O banco de dados não será conectado corretamente.');
        return;
    }

    if (mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        await mongoose.connect(mongodbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@lumabet.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Administrador',
                email: 'admin@lumabet.com',
                password: hashedPassword,
                balance: 0,
                isAdmin: true
            });
            console.log('👤 Admin user created');
        }
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
    }
}

export default mongoose;
