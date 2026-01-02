import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

export async function initiatePayment(req, res) {
    try {
        const { amount, phoneNumber, method = 'mcx' } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Usuário não identificado. Faça login novamente.' });
        }

        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valor inválido' });
        }

        const transaction = await Transaction.create({
            userId,
            type: 'deposit',
            amount: parseFloat(amount),
            status: 'pending',
            method,
            metadata: { phoneNumber }
        });

        // Use a shorter, more reliable ID for the payment gateway
        const paymentId = transaction._id.toString();
        transaction.paymentId = paymentId;
        await transaction.save();

        // Build CulongaPay URL - Absolute and clean
        const rawUrl = process.env.APP_URL || 'https://lumabet.vercel.app';
        const backendUrl = rawUrl.replace(/\/$/, ""); // Remove trailing slash if any
        const callbackUrl = `${backendUrl}/api/payments/callback`;

        console.log('Generating CulongaPay URL with callback:', callbackUrl);

        // Construct manually to ensure order and encoding
        const paymentUrl = `https://culonga.com/culongaPay?token=1224&preco=${amount}&callback=${encodeURIComponent(callbackUrl)}&idCliente=${userId}&idProduto=${paymentId}`;

        res.json({
            success: true,
            paymentId,
            paymentUrl,
            transactionId: transaction._id
        });
    } catch (error) {
        console.error('Initiate payment detailed error:', error);
        // We put the details in 'error' so the frontend alert(response.error) shows it
        res.status(500).json({
            error: `Erro técnico: ${error.message}`,
            details: error.stack
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

        let newBalance = undefined;
        if (transaction.status === 'success') {
            const user = await User.findById(req.user.id);
            if (user) newBalance = user.balance;
        }

        res.json({
            id: transaction._id,
            type: transaction.type,
            amount: transaction.amount,
            status: transaction.status,
            method: transaction.method,
            newBalance,
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

