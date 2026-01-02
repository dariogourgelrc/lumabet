import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

let cachedPromise = null;

export async function initializeDatabase() {
    const mongodbUri = process.env.MONGODB_URI;

    if (!mongodbUri) {
        console.warn('⚠️ MONGODB_URI não definida.');
        return;
    }

    if (!cachedPromise) {
        cachedPromise = mongoose.connect(mongodbUri).then(async (m) => {
            console.log('✅ Connected to MongoDB');

            // Check if admin exists inside the connection promise
            try {
                const adminEmail = 'admin@lumabet.com';
                const adminExists = await User.findOne({ email: adminEmail });

                if (!adminExists) {
                    const hashedPassword = await bcrypt.hash('admin123', 10);
                    await User.create({
                        name: 'Administrador',
                        email: adminEmail,
                        password: hashedPassword,
                        balance: 0,
                        isAdmin: true
                    });
                    console.log('✅ Admin user created');
                }
            } catch (err) {
                console.error('Admin check error:', err);
            }
            return m;
        }).catch(err => {
            cachedPromise = null;
            console.error('❌ MongoDB connection error:', err);
            throw err;
        });
    }

    return cachedPromise;
}

export default mongoose;
