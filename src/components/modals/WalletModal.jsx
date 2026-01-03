import React, { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import expressLogo from '../../assets/express_logo.png';
import referenceLogo from '../../assets/referencia_logo.png';
import { initiatePayment } from '../../services/culongaPay';
import { markPaymentSuccess, checkPaymentStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const WalletModal = ({ isOpen, onClose, balance }) => {
    const { updateBalance } = useAuth();
    const [activeTab, setActiveTab] = useState('deposit');
    const [depositMethod, setDepositMethod] = useState('mcx');
    const [amount, setAmount] = useState('');
    const [paymentUrl, setPaymentUrl] = useState(null);
    const [currentTransactionId, setCurrentTransactionId] = useState(null);
    const [requestStatus, setRequestStatus] = useState(null);
    const [isChecking, setIsChecking] = useState(false);

    const shortcuts = [2000, 5000, 8000, 10000];

    const handleDeposit = async () => {
        if (!amount) return;
        setRequestStatus('loading');

        try {
            const response = await initiatePayment({
                amount: amount,
                phoneNumber: '',
                userId: 'USER-' + Date.now(),
                productId: 'DEPOSIT-' + amount
            });

            if (response.estado === "false") {
                setRequestStatus('error');
                alert(response.sms || 'Erro ao processar pagamento.');
                setRequestStatus(null);
            } else {
                setPaymentUrl(response.paymentUrl);
                setCurrentTransactionId(response.transactionId);
                setRequestStatus('iframe');
            }
        } catch (error) {
            console.error(error);
            setRequestStatus('error');
            alert('Erro de conexão. Tente novamente.');
            setRequestStatus(null);
        }
    };

    // Polling for payment status
    useEffect(() => {
        let interval;
        if (requestStatus === 'iframe' && currentTransactionId) {
            console.log('🔄 Iniciando polling para transação:', currentTransactionId);
            interval = setInterval(async () => {
                const token = localStorage.getItem('betsim_token');
                try {
                    const statusData = await checkPaymentStatus(token, currentTransactionId);
                    console.log('📡 Status da transação:', statusData.status);

                    if (statusData.status === 'success') {
                        console.log('✅ Pagamento confirmado via polling!');
                        await updateBalance(statusData.newBalance || (balance + parseFloat(amount)));
                        setRequestStatus('success');
                        if (interval) clearInterval(interval);

                        setTimeout(() => {
                            resetDeposit();
                            onClose();
                        }, 2000);
                    } else if (statusData.status === 'failed') {
                        console.log('❌ Pagamento falhou!');
                        alert('O pagamento foi recusado ou falhou.');
                        setRequestStatus(null);
                        if (interval) clearInterval(interval);
                    }
                } catch (error) {
                    console.error('Erro no polling:', error);
                }
            }, 3000); // Check every 3 seconds
        }

        return () => {
            if (interval) {
                console.log('⏹️ Parando polling');
                clearInterval(interval);
            }
        };
    }, [requestStatus, currentTransactionId]);

    // Keep handleConfirmPayment only as a manual fallback if we wanted to show the button again
    const handleConfirmPayment = async () => {
        console.log('🔴 Botão manual clicado');
        if (!currentTransactionId) return;
        setRequestStatus('loading');
        const token = localStorage.getItem('betsim_token');
        try {
            const result = await markPaymentSuccess(token, currentTransactionId);
            if (result.success) {
                await updateBalance(result.newBalance);
                setRequestStatus('success');
                setTimeout(() => {
                    resetDeposit();
                    onClose();
                }, 2000);
            } else {
                alert('Erro: ' + (result.error || 'Desconhecido'));
                setRequestStatus('iframe');
            }
        } catch (error) {
            setRequestStatus('iframe');
        }
    };

    const resetDeposit = () => {
        setRequestStatus(null);
        setAmount('');
        setPaymentUrl(null);
        setCurrentTransactionId(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/5 p-6 flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-white">Carteira</h2>
                    <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Balance Display */}
                <div className="p-6 border-b border-white/5">
                    <p className="text-muted text-sm mb-1">Saldo Disponível</p>
                    <p className="text-4xl font-bold text-primary">{balance.toLocaleString('pt-AO')} Kz</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('deposit')}
                        className={`flex-1 py-4 font-bold transition-all ${activeTab === 'deposit' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-white'}`}
                    >
                        Depositar
                    </button>
                    <button
                        onClick={() => setActiveTab('withdraw')}
                        className={`flex-1 py-4 font-bold transition-all ${activeTab === 'withdraw' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-white'}`}
                    >
                        Levantar
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'deposit' && (
                        <div className="space-y-6">
                            {/* Method Selection */}
                            {!requestStatus && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setDepositMethod('mcx')}
                                        className={`p-4 rounded-xl border-2 transition-all ${depositMethod === 'mcx' ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                                    >
                                        <img src={expressLogo} alt="Multicaixa Express" className="h-8 mx-auto mb-2" />
                                        <p className="text-xs text-white font-bold">Express</p>
                                    </button>
                                    <button
                                        onClick={() => setDepositMethod('reference')}
                                        className={`p-4 rounded-xl border-2 transition-all ${depositMethod === 'reference' ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                                    >
                                        <img src={referenceLogo} alt="Referência" className="h-8 mx-auto mb-2" />
                                        <p className="text-xs text-white font-bold">Referência</p>
                                    </button>
                                </div>
                            )}

                            {/* Deposit Form */}
                            {activeTab === 'deposit' && !requestStatus ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase block mb-2">Valor (Kz)</label>
                                        <input
                                            type="number"
                                            placeholder="Digite o valor"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all font-medium text-lg"
                                        />
                                        <div className="grid grid-cols-4 gap-2 mt-3">
                                            {shortcuts.map((val) => (
                                                <button
                                                    key={val}
                                                    onClick={() => setAmount(val.toString())}
                                                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-white text-sm font-bold transition-all"
                                                >
                                                    {val.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={handleDeposit}
                                            disabled={!amount}
                                            className="w-full bg-primary hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                        >
                                            {depositMethod === 'mcx' ? 'Continuar para Pagamento' : 'Gerar Referência'}
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {/* Loading State */}
                            {requestStatus === 'loading' && (
                                <div className="flex flex-col items-center justify-center py-10 animate-in fade-in">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <h3 className="text-white font-bold">Processando...</h3>
                                    <p className="text-muted text-xs mt-1">Aguarde um momento</p>
                                </div>
                            )}

                            {/* Payment Waiting State (No Iframe) */}
                            {requestStatus === 'external_payment' && (
                                <div className="space-y-6 animate-in fade-in text-center py-6">
                                    <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Pagamento Iniciado</h3>
                                        <p className="text-muted text-sm px-4">
                                            Uma nova janela foi aberta para você realizar o pagamento. 
                                            Se não abriu, <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">clique aqui</a>.
                                        </p>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4 mx-2 border border-white/10">
                                        <p className="text-xs text-muted mb-2">Assim que concluir o pagamento no Multicaixa Express, o sistema confirmará automaticamente.</p>
                                        <div className="flex items-center justify-center gap-2 text-xs font-mono text-primary">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                            Aguardando confirmação...
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 pt-4">
                                        <button
                                            onClick={async () => {
                                                setIsChecking(true);
                                                const token = localStorage.getItem('betsim_token');
                                                try {
                                                    const statusResponse = await checkPaymentStatus(token, currentTransactionId);
                                                    if (statusResponse.status === 'success') {
                                                        await updateBalance(statusResponse.newBalance || (balance + parseFloat(amount)));
                                                        setRequestStatus('success');
                                                        setTimeout(() => {
                                                            resetDeposit();
                                                            onClose();
                                                        }, 2000);
                                                    } else {
                                                        alert('Pagamento ainda não detectado. Aguarde alguns instantes.');
                                                    }
                                                } catch (err) {
                                                    console.error('Manual check error:', err);
                                                } finally {
                                                    setIsChecking(false);
                                                }
                                            }}
                                            disabled={isChecking}
                                            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center justify-center"
                                        >
                                            {isChecking ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                'Já realizei o pagamento'
                                            )}
                                        </button>
                                        
                                        <button
                                            onClick={resetDeposit}
                                            className="text-muted hover:text-white text-sm py-2"
                                        >
                                            Cancelar Operação
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Legacy Payment Iframe (kept just in case logic reverts but hidden via status) */}
                            {requestStatus === 'iframe' && paymentUrl && (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-white font-bold">Complete o Pagamento</h3>
                                        <button
                                            onClick={resetDeposit}
                                            className="text-muted hover:text-white text-sm"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <div className="bg-white rounded-xl overflow-hidden h-[500px] border border-white/10">
                                            <iframe
                                                src={paymentUrl}
                                                className="w-full h-full border-none"
                                                title="Pagamento"
                                            />
                                        </div>
                                        <button
                                            onClick={async () => {
                                                setIsChecking(true);
                                                const token = localStorage.getItem('betsim_token');
                                                try {
                                                    const statusResponse = await checkPaymentStatus(token, currentTransactionId);
                                                    if (statusResponse.status === 'success') {
                                                        // Assuming setStep is a state setter for a step-based flow,
                                                        // but here we directly set requestStatus to 'success'
                                                        // and trigger the balance update and modal close.
                                                        await updateBalance(statusResponse.newBalance || (balance + parseFloat(amount)));
                                                        setRequestStatus('success');
                                                        setTimeout(() => {
                                                            resetDeposit();
                                                            onClose();
                                                        }, 2000);
                                                    } else {
                                                        alert('Pagamento ainda não detectado. Aguarde um momento.');
                                                    }
                                                } catch (err) {
                                                    console.error('Manual check error:', err);
                                                    alert('Erro ao verificar pagamento. Tente novamente.');
                                                } finally {
                                                    setIsChecking(false);
                                                }
                                            }}
                                            disabled={isChecking}
                                            className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center"
                                        >
                                            {isChecking ? (
                                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                'Já realizei o pagamento'
                                            )}
                                        </button>
                                    </div>
                                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                        <p className="text-xs text-white font-medium">
                                            Aguardando confirmação do pagamento...
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-muted text-center italic">
                                        Seu saldo será atualizado automaticamente assim que completar o pagamento no aplicativo.
                                    </p>
                                </div>
                            )}

                            {/* Success State */}
                            {requestStatus === 'success' && (
                                <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95">
                                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                                        <Check size={32} strokeWidth={3} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Depósito Confirmado!</h3>
                                    <p className="text-muted text-sm">Seu saldo foi atualizado</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'withdraw' && (
                        <div className="text-center py-10">
                            <p className="text-muted">Funcionalidade em breve...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletModal;
