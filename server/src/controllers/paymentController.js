import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

export async function initiatePayment(req, res) {
    try {
        const { amount, phoneNumber, method = 'mcx' } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valor inválido' });
        }

        // Check DB connection
        const mongoose = (await import('mongoose')).default;
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected during payment initiation');
            return res.status(503).json({ error: 'Banco de dados temporariamente indisponível. Tente novamente em instantes.' });
        }

        // Create pending transaction in MongoDB
        const transaction = await Transaction.create({
            userId,
            type: 'deposit',
            amount: parseFloat(amount),
            status: 'pending',
            method,
            metadata: { phoneNumber }
        });

        const paymentId = `PAY-${transaction._id}-${Date.now()}`;
        transaction.paymentId = paymentId;
        await transaction.save();

        // Build CulongaPay URL (Using APP_URL for production callback)
        const backendUrl = process.env.APP_URL || 'http://localhost:3001';

        const params = new URLSearchParams({
            token: '1224',
            preco: amount,
            callback: `${backendUrl}/api/payments/callback`,
            idCliente: userId.toString(),
            idProduto: paymentId
        });

        if (phoneNumber) {
            params.append('telefone', phoneNumber);
        }

        const paymentUrl = `https://culonga.com/culongaPay?${params.toString()}`;

        res.json({
            success: true,
            paymentId,
            paymentUrl,
            transactionId: transaction._id
        });
    } catch (error) {
        console.error('Initiate payment error details:', error);
        res.status(500).json({
            error: 'Erro ao iniciar pagamento',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

export async function handleCallback(req, res) {
    try {
        const { estado, idProduto, compra } = req.query;

        console.log('Payment callback received:', { estado, idProduto, compra });

        if (!idProduto) {
            return res.status(400).send('Missing payment ID');
        }

        // Find transaction by paymentId
        const transaction = await Transaction.findOne({ paymentId: idProduto });

        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }

        if (transaction.status === 'success') {
            return res.json({ success: true, message: 'Já processado' });
        }

        const status = estado === 'true' ? 'success' : 'failed';
        transaction.status = status;

        if (status === 'success') {
            const user = await User.findById(transaction.userId);
            if (user) {
                user.balance += transaction.amount;
                await user.save();
            }
        }

        await transaction.save();

        // Redirect to frontend
        const redirectUrl = process.env.NODE_ENV === 'production'
            ? `${process.env.APP_URL}/?payment=${status}`
            : `http://localhost:5173/?payment=${status}&amount=${transaction.amount}`;

        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('Error processing callback');
    }
}

export async function getPaymentStatus(req, res) {
    try {
        const { id } = req.params;

        const transaction = await Transaction.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        res.json({
            id: transaction._id,
            type: transaction.type,
            amount: transaction.amount,
            status: transaction.status,
            method: transaction.method,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({ error: 'Erro ao buscar status' });
    }
}

export async function getPaymentHistory(req, res) {
    try {
        const transactions = await Transaction.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(transactions.map(t => ({
            id: t._id,
            type: t.type,
            amount: t.amount,
            status: t.status,
            method: t.method,
            createdAt: t.createdAt
        })));
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
}

export async function markPaymentSuccess(req, res) {
    try {
        const { id } = req.params;

        const transaction = await Transaction.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        if (transaction.status === 'success') {
            return res.json({ message: 'Pagamento já foi confirmado' });
        }

        transaction.status = 'success';

        const user = await User.findById(transaction.userId);
        if (user) {
            user.balance += transaction.amount;
            await user.save();
        }

        await transaction.save();

        res.json({
            success: true,
            message: 'Pagamento confirmado com sucesso',
            newBalance: user?.balance || 0
        });
    } catch (error) {
        console.error('Mark payment success error:', error);
        res.status(500).json({ error: 'Erro ao confirmar pagamento' });
    }
}

