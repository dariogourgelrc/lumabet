import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, Users, Clock, AlertCircle, LogOut } from 'lucide-react';
import { getAdminStats, getAdminTransactions } from '../../services/api';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('betsim_token');
            if (!token) return;

            try {
                const [statsData, transactionsData] = await Promise.all([
                    getAdminStats(token),
                    getAdminTransactions(token)
                ]);

                setStats(statsData);
                setTransactions(transactionsData);
            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatCurrency = (val) => val.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kz';

    const statusMap = {
        'success': 'Concluído',
        'pending': 'Pendente',
        'failed': 'Falhou'
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted">Carregando dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Painel Administrativo</h1>
                    <p className="text-muted">Bem-vindo, <span className="text-primary font-bold">{user?.name}</span></p>
                </div>
                <button onClick={logout} className="flex items-center gap-2 bg-white/5 hover:bg-red-500/10 hover:text-red-500 px-6 py-3 rounded-xl transition-all font-medium border border-white/10">
                    <LogOut size={18} />
                    Sair do Painel
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <MetricCard
                    title="Total Depósitos"
                    value={formatCurrency(stats?.totalDeposits || 0)}
                    icon={DollarSign}
                    color="text-primary"
                    bg="bg-primary/10"
                    border="border-primary/20"
                />
                <MetricCard
                    title="Total Levantamentos"
                    value={formatCurrency(stats?.totalWithdrawals || 0)}
                    icon={Clock}
                    color="text-blue-400"
                    bg="bg-blue-400/10"
                    border="border-blue-400/20"
                />
                <MetricCard
                    title="Total Usuários"
                    value={stats?.totalUsers || 0}
                    icon={Users}
                    color="text-purple-400"
                    bg="bg-purple-400/10"
                    border="border-purple-400/20"
                />
                <MetricCard
                    title="Pendentes"
                    value={stats?.pendingTransactions || 0}
                    icon={AlertCircle}
                    color="text-orange-400"
                    bg="bg-orange-400/10"
                    border="border-orange-400/20"
                />
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Transações Recentes</h2>
                    <span className="text-sm text-muted">{transactions.length} transações</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-muted text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4 pl-6">ID</th>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Método</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4">Data</th>
                                <th className="p-4 pr-6">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-muted">
                                        Nenhuma transação encontrada
                                    </td>
                                </tr>
                            ) : (
                                transactions.slice(0, 20).map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 pl-6 font-mono text-xs text-muted">#{tx.id}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-white text-sm">{tx.userName}</div>
                                            <div className="text-xs text-muted">{tx.userEmail}</div>
                                        </td>
                                        <td className="p-4 text-sm text-white capitalize">{tx.type}</td>
                                        <td className="p-4 text-sm text-white uppercase">{tx.method || 'N/A'}</td>
                                        <td className="p-4 font-bold text-green-400">{tx.amount.toLocaleString('pt-AO')} Kz</td>
                                        <td className="p-4 text-xs text-muted">{new Date(tx.createdAt).toLocaleString('pt-PT')}</td>
                                        <td className="p-4 pr-6">
                                            <StatusBadge status={statusMap[tx.status] || tx.status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon: Icon, color, bg, border }) => (
    <div className={`p-6 rounded-2xl border ${border} ${bg} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-muted text-sm font-bold uppercase tracking-wider">{title}</h3>
            <div className={`p-2 rounded-lg bg-black/20 ${color}`}>
                <Icon size={20} />
            </div>
        </div>
        <p className={`text-2xl lg:text-3xl font-bold text-white`}>{value}</p>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        'Concluído': 'bg-green-500/10 text-green-500 border-green-500/20',
        'Pendente': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        'Falhou': 'bg-red-500/10 text-red-500 border-red-500/20',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles['Pendente']}`}>
            {status}
        </span>
    );
};

export default AdminDashboard;
