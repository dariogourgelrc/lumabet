import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

export async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        await db.read();

        // Check if user exists
        const existingUser = db.data.users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Este email já está cadastrado' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            id: db.data.users.length + 1,
            name,
            email,
            password: hashedPassword,
            balance: 0,
            isAdmin: false,
            createdAt: new Date().toISOString()
        };

        db.data.users.push(newUser);
        await db.write();

        // Generate token
        const tokenToken = process.env.JWT_SECRET || 'betsim_secret_key_123';
        const token = jwt.sign(
            { id: newUser.id, email, isAdmin: false },
            tokenToken,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                name,
                email,
                balance: 0,
                isAdmin: false
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        await db.read();

        // Find user
        const user = db.data.users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Generate token
        const tokenToken = process.env.JWT_SECRET || 'betsim_secret_key_123';
        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: Boolean(user.isAdmin) },
            tokenToken,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                balance: user.balance,
                isAdmin: Boolean(user.isAdmin)
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
}

export async function getMe(req, res) {
    try {
        await db.read();

        const user = db.data.users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            balance: user.balance,
            isAdmin: Boolean(user.isAdmin)
        });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
}
