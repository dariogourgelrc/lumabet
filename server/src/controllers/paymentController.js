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

        // Build CulongaPay URL - Using most compatible Angolan parameter names
        const rawUrl = process.env.APP_URL || 'https://lumabet.vercel.app';
        const backendUrl = rawUrl.replace(/\/$/, "");
        const callbackUrl = `${backendUrl}/api/payments/callback`;

        console.log('Generating CulongaPay URL with callback:', callbackUrl);

        // Standard Angolan Gateway Parameters: valor, url_callback, idCliente, idProduto
        const params = new URLSearchParams({
            token: '1224',
            valor: amount.toString(), // Some use valor instead of preco
            preco: amount.toString(), // Keep preco for compatibility
            url_callback: callbackUrl, // Some use url_callback
            callback: callbackUrl,    // Keep callback
            url: callbackUrl,         // Some use url
            idCliente: userId,
            idProduto: paymentId
        });

        const paymentUrl = `https://culonga.com/culongaPay?${params.toString()}`;

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
        console.log('--- CALLBACK RECEIVED ---');
        console.log('Method:', req.method);
        console.log('Query:', req.query);
        console.log('Body:', req.body);

        // Merge query and body to be safe
        const data = { ...req.query, ...req.body };
        const { estado, idProduto, compra } = data;

        // Also check if they use 'status' instead of 'estado' or 'produto' instead of 'idProduto'
        const callbackStatus = estado || data.status;
        const paymentId = idProduto || data.produto || data.id_venda;

        console.log('Payment callback received:', { callbackStatus, paymentId, compra });

        if (!paymentId) {
            return res.status(400).send('Missing payment ID');
        }

        // Find transaction by paymentId
        const transaction = await Transaction.findOne({ paymentId });

        if (!transaction) {
            console.warn('Transaction not found for ID:', paymentId);
            return res.status(404).send('Transaction not found');
        }

        if (transaction.status === 'success') {
            return req.method === 'POST' ? res.send('OK') : res.redirect(`${process.env.APP_URL || ''}/?payment=success`);
        }

        const isSuccess = (callbackStatus === 'true' || callbackStatus === 'success' || callbackStatus === '1');
        const finalStatus = isSuccess ? 'success' : 'failed';

        transaction.status = finalStatus;
        transaction.updatedAt = Date.now();

        if (finalStatus === 'success') {
            const user = await User.findById(transaction.userId);
            if (user) {
                user.balance += transaction.amount;
                await user.save();
                console.log(`✅ Balance updated for user ${user.email}: +${transaction.amount}`);
            }
        }

        await transaction.save();

        if (req.method === 'POST') {
            return res.send('OK');
        } else {
            const redirectUrl = process.env.APP_URL || 'https://lumabet.vercel.app';
            return res.redirect(`${redirectUrl}/?payment=${finalStatus}`);
        }
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

