import db from '../config/database.js';

export async function initiatePayment(req, res) {
    try {
        const { amount, phoneNumber, method = 'mcx' } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valor inválido' });
        }

        await db.read();

        // Create pending transaction
        const newTransaction = {
            id: db.data.transactions.length + 1,
            userId,
            type: 'deposit',
            amount,
            status: 'pending',
            method,
            paymentId: null,
            metadata: JSON.stringify({ phoneNumber }),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        db.data.transactions.push(newTransaction);

        const paymentId = `PAY-${newTransaction.id}-${Date.now()}`;
        newTransaction.paymentId = paymentId;

        await db.write();

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
            transactionId: newTransaction.id
        });
    } catch (error) {
        console.error('Initiate payment error:', error);
        res.status(500).json({ error: 'Erro ao iniciar pagamento' });
    }
}

export async function handleCallback(req, res) {
    try {
        const { estado, idProduto, compra } = req.query;

        console.log('Payment callback received:', { estado, idProduto, compra });

        if (!idProduto) {
            return res.status(400).send('Missing payment ID');
        }

        await db.read();

        // Find transaction
        const transaction = db.data.transactions.find(t => t.paymentId === idProduto);

        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }

        // Update transaction status
        const status = estado === 'true' ? 'success' : 'failed';
        transaction.status = status;
        transaction.updatedAt = new Date().toISOString();

        // If successful, update user balance
        if (status === 'success') {
            const user = db.data.users.find(u => u.id === transaction.userId);
            if (user) {
                user.balance += transaction.amount;
            }
        }

        await db.write();

        // Redirect to frontend with status
        const redirectUrl = process.env.NODE_ENV === 'production'
            ? `https://your-domain.com/?payment=${status}`
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

        await db.read();

        const transaction = db.data.transactions.find(t =>
            t.id === parseInt(id) && t.userId === req.user.id
        );

        if (!transaction) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        res.json({
            id: transaction.id,
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
        await db.read();

        const transactions = db.data.transactions
            .filter(t => t.userId === req.user.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 50)
            .map(t => ({
                id: t.id,
                type: t.type,
                amount: t.amount,
                status: t.status,
                method: t.method,
                createdAt: t.createdAt
            }));

        res.json(transactions);
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
}

// Manually mark payment as successful (for testing in localhost)
export async function markPaymentSuccess(req, res) {
    try {
        const { id } = req.params;

        await db.read();

        const transaction = db.data.transactions.find(t =>
            t.id === parseInt(id) && t.userId === req.user.id
        );

        if (!transaction) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        if (transaction.status === 'success') {
            return res.json({ message: 'Pagamento já foi confirmado' });
        }

        // Update transaction status
        transaction.status = 'success';
        transaction.updatedAt = new Date().toISOString();

        // Update user balance
        const user = db.data.users.find(u => u.id === transaction.userId);
        if (user) {
            user.balance += transaction.amount;
        }

        await db.write();

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

