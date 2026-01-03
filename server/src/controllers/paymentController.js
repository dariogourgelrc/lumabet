import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

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
        const paymentId = String(transaction._id);
        transaction.paymentId = paymentId;
        await transaction.save();

        // Build callback URL - Dynamic based on environment
        // Priority: process.env.BACKEND_URL -> constructed from request -> hardcoded fallback
        let backendUrl = process.env.BACKEND_URL;
        
        if (!backendUrl) {
            // Force HTTPS if not on localhost
            const protocol = req.get('host').includes('localhost') ? 'http' : 'https';
            const host = req.get('host');
            backendUrl = `${protocol}://${host}`;
        }
        
        // Ensure no trailing slash
        backendUrl = backendUrl.replace(/\/$/, '');
        
        const callbackUrl = `${backendUrl}/api/payments/callback`;

        console.log(`🚀 [INIT] ${amount} Kz | ID: ${paymentId}`);
        console.log(`👉 Callback URL: ${callbackUrl}`);

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
        console.log('--- CULONGAPAY CALLBACK START ---');
        
        // 1. Combine query and body
        let payload = { ...req.query, ...req.body };
        console.log('📦 Raw Payload:', JSON.stringify(payload));

        // 2. Parse nested 'data' JSON string if present (Common in CulongaPay redirects)
        if (payload.data && typeof payload.data === 'string') {
            try {
                const parsedData = JSON.parse(payload.data);
                console.log('📂 Parsed "data" field:', parsedData);
                payload = { ...payload, ...parsedData };
            } catch (e) {
                console.error('⚠️ Failed to parse "data" field as JSON:', e.message);
            }
        }

        // 3. Extract Fields
        let paymentId = payload.idProduto || payload.idproduto;
        let callbackStatus = payload.estado;
        let compra = payload.compra;

        // 4. Handle nested 'compra' object (CulongaPay specific structure)
        if (compra && typeof compra === 'object') {
            paymentId = paymentId || compra.idProduto || compra.idproduto || compra[1];
            // Sometimes status is inside compra? Usually it's top level.
            // If callbackStatus is undefined, check compra
            if (callbackStatus === undefined && compra.referencia) {
                callbackStatus = 'true'; // Assume success if reference exists? Careful here.
            }
        }

        console.log(`🔍 Processing Callback: ID=${paymentId}, Status=${callbackStatus}`);

        if (!paymentId) {
            console.error('❌ Callback Error: Missing idProduto');
            return res.status(200).json({ status: 'ok', message: 'Missing idProduto' });
        }

        // 5. Find Transaction
        // Try finding by _id (Mongoose ObjectId)
        // If paymentId is "10" (legacy/test), it won't be found as ObjectId.
        let transaction = null;
        
        if (mongoose.Types.ObjectId.isValid(paymentId)) {
            transaction = await Transaction.findById(paymentId);
        } else {
            // Fallback: try to find by paymentId field if you stored "10" there
            // But usually we store the ObjectId in paymentId field.
            transaction = await Transaction.findOne({ paymentId: paymentId });
        }

        if (!transaction) {
            console.error(`❌ Transaction not found in DB: ${paymentId}`);
            // Return 200 to acknowledge receipt even if we can't process it
            return res.status(200).json({ status: 'ok', message: 'Transaction not found' });
        }

        // ... Rest of logic is same ...

        // If already successful, just redirect/exit
        if (transaction.status === 'success') {
            console.log(`ℹ️ Transaction ${paymentId} already marked SUCCESS.`);
            if (req.method === 'GET') {
                 // Redirect to frontend success page
                 const frontendUrl = process.env.FRONTEND_URL || 'https://lumabet.vercel.app'; // Fallback needs update if domain changes
                 return res.redirect(`${frontendUrl}/?payment=success`);
            }
            return res.json({ status: 'ok', message: 'Already success' });
        }

        // Logic check for success
        // CulongaPay sends 'true' or '1' or sometimes just status 200 logic
        const isSuccess = String(callbackStatus).toLowerCase() === 'true' || String(callbackStatus) === '1';

        if (isSuccess) {
            console.log(`✅ Success detected for ${paymentId}. Updating user...`);

            // Find user using the ID stored in the transaction
            const user = await User.findById(transaction.userId);

            if (user) {
                const oldBalance = Number(user.balance) || 0;
                const addedAmount = Number(transaction.amount) || 0;
                user.balance = oldBalance + addedAmount;
                await user.save();

                transaction.status = 'success';
                console.log(`💰 User ${user.email} updated: ${oldBalance} -> ${user.balance}`);
            } else {
                console.error(`❌ User ${transaction.userId} not found for transaction ${paymentId}`);
                transaction.status = 'failed';
            }
        } else {
            console.log(`⚠️ Payment not successful for ${paymentId}: ${callbackStatus}`);
            transaction.status = 'failed';
        }

        transaction.updatedAt = Date.now();
        await transaction.save();

        // Response handling
        if (req.method === 'GET') {
            const frontendUrl = process.env.FRONTEND_URL || 'https://lumabet.vercel.app';
            const statusUrl = isSuccess ? 'success' : 'failed';
            return res.redirect(`${frontendUrl}/?payment=${statusUrl}`);
        } else {
            // POST/PUT/etc
            return res.status(200).json({ status: 'ok' });
        }

    } catch (error) {
        console.error('🔥 FATAL CALLBACK ERROR:', error);
        // Always return 200 to prevent gateway retries/errors
        res.status(200).json({ status: 'error', message: 'Internal error handled' });
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

