import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Este email já está cadastrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            balance: 0,
            isAdmin: false
        });

        const tokenSecret = process.env.JWT_SECRET || 'betsim_secret_key_123';
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, isAdmin: false },
            tokenSecret,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                balance: newUser.balance,
                isAdmin: newUser.isAdmin
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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        const tokenSecret = process.env.JWT_SECRET || 'betsim_secret_key_123';
        const token = jwt.sign(
            { id: user._id, email: user.email, isAdmin: Boolean(user.isAdmin) },
            tokenSecret,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
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
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            id: user._id,
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
