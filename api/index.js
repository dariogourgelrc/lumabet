import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from '../server/src/config/database.js';
import authRoutes from '../server/src/routes/auth.js';
import paymentRoutes from '../server/src/routes/payments.js';
import adminRoutes from '../server/src/routes/admin.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
initializeDatabase();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

export default app;
