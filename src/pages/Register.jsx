import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import logo from '../assets/lumabet_logo.png';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

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
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-primary to-green-400"></div>

                <div className="flex flex-col items-center mb-6">
                    <img src={logo} alt="Lumabet" className="h-16 w-auto object-contain mb-4" />
                    <h1 className="text-2xl font-bold text-white tracking-wide">Crie sua Conta</h1>
                    <p className="text-muted text-sm mt-1">Comece a apostar em menos de 1 minuto</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl text-center font-medium">
                            {error}
                        </div>
                    )}
                    {/* ... rest of the form ... */}

                    <div>
                        <label className="text-xs font-bold text-muted uppercase block mb-2">Nome Completo</label>
                        <input
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            placeholder="Ex: João da Silva"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-muted uppercase block mb-2">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-muted uppercase block mb-2">Senha</label>
                            <input
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                placeholder="******"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted uppercase block mb-2">Confirmar</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                placeholder="******"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-primary hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center text-lg mt-6"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : (
                            'Criar Conta Grátis'
                        )}
                    </button>
                    <p className="text-[10px] text-center text-muted">Ao criar conta você concorda com nossos Termos de Serviço.</p>
                </form>

                <div className="mt-8 text-center text-sm text-muted">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="text-white font-bold hover:text-primary transition-colors">
                        Fazer Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
