import { initiatePayment as apiInitiatePayment } from './api.js';

export const initiatePayment = async ({ amount, phoneNumber, productId = 'DEPOSIT', userId }) => {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('betsim_token');
        if (!token) {
            throw new Error('Não autenticado');
        }

        // Call backend API
        const response = await apiInitiatePayment(token, {
            amount,
            phoneNumber: phoneNumber || '',
            method: 'mcx'
        });

        if (!response.success) {
            return {
                estado: 'false',
                sms: response.error || 'Erro ao processar pagamento',
                code: 400
            };
        }

        // Return payment URL for iframe
        return {
            estado: 'true',
            sms: 'Pagamento iniciado',
            code: 200,
            paymentId: response.paymentId,
            paymentUrl: response.paymentUrl,
            transactionId: response.transactionId
        };

    } catch (error) {
        console.error("CulongaPay Error:", error);
        return {
            estado: 'false',
            sms: error.message || 'Erro ao processar pagamento',
            code: 500
        };
    }
};
