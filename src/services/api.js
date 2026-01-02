const API_URL = '/api';

export async function register(userData) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    return response.json();
}

export async function login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return response.json();
}

export async function getMe(token) {
    const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
}

export async function initiatePayment(token, paymentData) {
    const response = await fetch(`${API_URL}/payments/initiate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
    });
    return response.json();
}

export async function getPaymentHistory(token) {
    const response = await fetch(`${API_URL}/payments/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
}

export async function getAdminStats(token) {
    const response = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
}

export async function getAdminTransactions(token) {
    const response = await fetch(`${API_URL}/admin/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
}

// Check payment status by transaction ID
export async function checkPaymentStatus(token, transactionId) {
    const response = await fetch(`${API_URL}/payments/status/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
}

// Manually mark payment as successful (for testing)
export async function markPaymentSuccess(token, transactionId) {
    const response = await fetch(`${API_URL}/payments/mark-success/${transactionId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}
