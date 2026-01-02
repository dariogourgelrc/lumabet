import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import logo from '../assets/lumabet_logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#121212] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-green-400 to-primary"></div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>

                <div className="flex flex-col items-center mb-8">
                    <img src={logo} alt="Lumabet" className="h-16 w-auto object-contain mb-4" />
                    <h1 className="text-2xl font-bold text-white tracking-wide">Bem-vindo de volta!</h1>
                    <p className="text-muted text-sm mt-1">Entre na sua conta Lumabet</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-muted uppercase block mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-muted uppercase block">Senha</label>
                            <a href="#" className="text-xs text-primary hover:underline">Esqueceu?</a>
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-primary hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-lg mt-6"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <LogIn size={20} />
                                Entrar na Conta
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-muted">
                    Não tem uma conta?{' '}
                    <Link to="/register" className="text-white font-bold hover:text-primary transition-colors">
                        Cadastre-se Grátis
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
