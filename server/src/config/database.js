import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
const file = join(__dirname, '../../database.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, {});

// Initialize database schema
export async function initializeDatabase() {
    await db.read();

    // Initialize with default structure if empty
    if (!db.data) {
        db.data = { users: [], transactions: [] };
    }
    if (!db.data.users) {
        db.data.users = [];
    }
    if (!db.data.transactions) {
        db.data.transactions = [];
    }

    // Create default admin user if not exists
    const adminExists = db.data.users.find(u => u.email === 'admin@lumabet.com');
    if (!adminExists) {
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.data.users.push({
            id: 1,
            name: 'Administrador',
            email: 'admin@lumabet.com',
            password: hashedPassword,
            balance: 0,
            isAdmin: true,
            createdAt: new Date().toISOString()
        });
        await db.write();
    }

    console.log('✅ Database initialized');
}

export default db;
