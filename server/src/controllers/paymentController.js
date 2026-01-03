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
        console.log('--- CULONGAPAY CALLBACK DATA ---');
        console.log('Method:', req.method);
        console.log('Raw Query:', JSON.stringify(req.query, null, 2));
        console.log('Raw Body:', JSON.stringify(req.body, null, 2));

        const data = { ...req.query, ...req.body };
        const { estado, sms } = data;
        let compraData = data.compra;

        // Try to parse 'compra' if it's a string
        if (typeof compraData === 'string') {
            try {
                compraData = JSON.parse(compraData);
            } catch (e) {
                console.warn('⚠️ Could not parse compra string:', compraData);
            }
        }

        // Extremely aggressive parameter extraction
        let paymentId = data.idProduto || data.idproduto || data.produto || data.id_venda || data.external_id;
        let callbackStatus = estado || data.status || data.success;

        if (compraData) {
            paymentId = paymentId || compraData.idProduto || compraData.idproduto || compraData[1]; // Doc says 2nd position
            callbackStatus = callbackStatus || (compraData.referencia ? 'true' : undefined);
            console.log('Parsed compra data:', compraData);
        }

        console.log('FINAL RESOLVED -> Status:', callbackStatus, 'ID:', paymentId);

        if (!paymentId) {
            console.error('❌ FATAL: No payment identifier found in callback');
            return res.status(200).send('OK');
        }

        // Find transaction by paymentId
        let transaction = await Transaction.findOne({ paymentId });

        if (!transaction) {
            // Backup search: maybe the gateway returned our DB _id directly
            const transactionById = await Transaction.findById(paymentId).catch(() => null);
            if (!transactionById) {
                console.warn('❌ Transaction not found for:', paymentId);
                return res.status(200).send('OK');
            }
            transaction = transactionById;
        }

        if (transaction.status === 'success') {
            console.log('ℹ️ Transaction already successful:', paymentId);
            return res.redirect('https://lumabet.vercel.app/?payment=success');
        }

        const isSuccess = String(callbackStatus).toLowerCase() === 'true' ||
            String(callbackStatus) === '1' ||
            String(callbackStatus).toLowerCase() === 'success';

        const finalStatus = isSuccess ? 'success' : 'failed';

        transaction.status = finalStatus;
        transaction.updatedAt = Date.now();

        if (finalStatus === 'success') {
            const user = await User.findById(transaction.userId);
            if (user) {
                // Ensure type safety for balance addition
                const currentBalance = Number(user.balance) || 0;
                const depositAmount = Number(transaction.amount) || 0;
                user.balance = currentBalance + depositAmount;
                await user.save();
                console.log(`✅ BALANCE UPDATED: User ${user.email} received ${depositAmount} Kz. New balance: ${user.balance}`);
            } else {
                console.error('❌ User not found for transaction:', transaction.userId);
            }
        }

        await transaction.save();
        console.log(`📝 Transaction ${paymentId} updated to ${finalStatus}`);

        // Handle Response
        if (req.method === 'POST') {
            return res.send('OK');
        } else {
            // It's a browser redirect
            return res.redirect(`https://lumabet.vercel.app/?payment=${finalStatus}`);
        }

    } catch (error) {
        console.error('🔥 CRITICAL CALLBACK ERROR:', error);
        res.status(200).send('OK'); // Fail gracefully for gateway
    }
}

export async function getPaymentStatus(req, res) {
    try {
        const { id } = req.params;

        // Force no-cache for Vercel
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

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

        // Allow Admin to confirm any transaction, but User only their own
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
            const currentBalance = Number(user.balance) || 0;
            const depositAmount = Number(transaction.amount) || 0;
            user.balance = currentBalance + depositAmount;
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

