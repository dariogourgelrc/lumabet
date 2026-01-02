import db from '../config/database.js';

export async function getAllTransactions(req, res) {
    try {
        await db.read();

        const transactions = db.data.transactions
            .map(t => {
                const user = db.data.users.find(u => u.id === t.userId);
                return {
                    id: t.id,
                    type: t.type,
                    amount: parseFloat(t.amount || 0),
                    status: t.status,
                    method: t.method,
                    paymentId: t.paymentId,
                    createdAt: t.createdAt,
                    userName: user?.name || 'Unknown',
                    userEmail: user?.email || 'Unknown'
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 100);

        res.json(transactions);
    } catch (error) {
        console.error('Get all transactions error:', error);
        res.status(500).json({ error: 'Erro ao buscar transações' });
    }
}

export async function getAllUsers(req, res) {
    try {
        await db.read();

        const users = db.data.users
            .map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                balance: u.balance,
                isAdmin: u.isAdmin,
                createdAt: u.createdAt
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
}

export async function getStats(req, res) {
    try {
        await db.read();

        const totalUsers = db.data.users.length;

        const totalDeposits = db.data.transactions
            .filter(t => t.type === 'deposit' && t.status === 'success')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        const totalWithdrawals = db.data.transactions
            .filter(t => t.type === 'withdrawal' && t.status === 'success')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        const pendingTransactions = db.data.transactions
            .filter(t => t.status === 'pending').length;

        const recentTransactions = db.data.transactions
            .map(t => {
                const user = db.data.users.find(u => u.id === t.userId);
                return {
                    id: t.id,
                    type: t.type,
                    amount: parseFloat(t.amount || 0),
                    status: t.status,
                    createdAt: t.createdAt,
                    userName: user?.name || 'Unknown'
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

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
