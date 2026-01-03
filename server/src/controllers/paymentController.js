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

        // Use full ID for idProduto as per documentation
        const paymentId = transaction._id.toString();
        transaction.paymentId = paymentId;
        await transaction.save();

        // Build callback URL - MUST BE ACCESSIBLE TO CULONGAPAY
        const backendUrl = 'https://lumabet.vercel.app';
        const callbackUrl = `${backendUrl}/api/payments/callback`;

        console.log('--- CULONGAPAY INITIATE ---');
        console.log('token: 1224');
        console.log('preco:', amount);
        console.log('callback:', callbackUrl);
        console.log('idCliente:', userId);
        console.log('idProduto:', paymentId);

        // Required Params: token, preco, callback, idCliente, idProduto
        const params = new URLSearchParams({
            token: '1224',
            preco: amount.toString(),
            callback: callbackUrl,
            idCliente: userId.toString(),
            idProduto: paymentId
        });

        // Redirect to CulongaPay
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
        console.log('--- CULONGAPAY CALLBACK ---');
        console.log('Method:', req.method);
        console.log('Query:', req.query);

        const { estado, sms, compra } = req.query;

        // CulongaPay sends data inside 'compra' object or directly in query
        let paymentId = req.query.idProduto;
        let callbackStatus = estado;

        if (compra && typeof compra === 'object') {
            paymentId = paymentId || compra.idProduto;
            // The doc says 'compra' is an array/object with 4 positions
        }

        console.log('Resolved Status:', callbackStatus, 'ID:', paymentId);

        if (!paymentId) {
            console.warn('⚠️ Callback ignored: No idProduto found');
            return res.status(200).send('OK'); // Always return 200 to satisfy gateway
        }

        const transaction = await Transaction.findOne({ paymentId });

        if (!transaction) {
            console.warn('⚠️ Transaction not found:', paymentId);
            return res.status(200).send('OK');
        }

        if (transaction.status === 'success') {
            return res.redirect('https://lumabet.vercel.app/?payment=success');
        }

        const isSuccess = (callbackStatus === 'true' || callbackStatus === '1');
        const finalStatus = isSuccess ? 'success' : 'failed';

        transaction.status = finalStatus;
        transaction.updatedAt = Date.now();

        if (finalStatus === 'success') {
            const user = await User.findById(transaction.userId);
            if (user) {
                user.balance += transaction.amount;
                await user.save();
                console.log(`✅ Saldo atualizado: ${user.email} +${transaction.amount}`);
            }
        }

        await transaction.save();

        // Redirect user back to home
        return res.redirect(`https://lumabet.vercel.app/?payment=${finalStatus}`);

    } catch (error) {
        console.error('Fatal Callback Error:', error);
        // Even on error, return something CulongaPay likes
        res.status(200).send('OK');
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

        const query = req.user.isAdmin ? { _id: id } : { _id: id, userId: req.user.id };
        const transaction = await Transaction.findOne(query);

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

