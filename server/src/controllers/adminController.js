import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

export async function getAllTransactions(req, res) {
    try {
        const transactions = await Transaction.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(100);

        const mappedTransactions = transactions.map(t => ({
            id: t._id,
            type: t.type,
            amount: t.amount,
            status: t.status,
            method: t.method,
            paymentId: t.paymentId,
            createdAt: t.createdAt,
            userName: t.userId?.name || 'Unknown',
            userEmail: t.userId?.email || 'Unknown'
        }));

        res.json(mappedTransactions);
    } catch (error) {
        console.error('Get all transactions error:', error);
        res.status(500).json({ error: 'Erro ao buscar transações' });
    }
}

export async function getAllUsers(req, res) {
    try {
        const users = await User.find()
            .sort({ createdAt: -1 });

        res.json(users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            balance: u.balance,
            isAdmin: u.isAdmin,
            createdAt: u.createdAt
        })));
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
}

export async function getStats(req, res) {
    try {
        const totalUsers = await User.countDocuments();

        const transactions = await Transaction.find({ status: 'success' });

        const totalDeposits = transactions
            .filter(t => t.type === 'deposit')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalWithdrawals = transactions
            .filter(t => t.type === 'withdrawal')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });

        const recentTransactionsRaw = await Transaction.find()
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        const recentTransactions = recentTransactionsRaw.map(t => ({
            id: t._id,
            type: t.type,
            amount: t.amount,
            status: t.status,
            createdAt: t.createdAt,
            userName: t.userId?.name || 'Unknown'
        }));

        res.json({
            totalUsers,
            totalDeposits,
            totalWithdrawals,
            pendingTransactions,
            recentTransactions
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
}
