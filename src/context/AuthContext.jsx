import React, { createContext, useState, useContext, useEffect } from 'react';
import * as api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const token = localStorage.getItem('betsim_token');
        if (token) {
            // Verify token with backend
            api.getMe(token)
                .then(userData => {
                    if (userData.id) {
                        setUser(userData);
                    } else {
                        // Invalid token
                        localStorage.removeItem('betsim_token');
                    }
                })
                .catch(() => {
                    localStorage.removeItem('betsim_token');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.login(email, password);

            if (response.success) {
                setUser(response.user);
                localStorage.setItem('betsim_token', response.token);
                return { success: true };
            } else {
                return { success: false, message: response.error || 'Erro ao fazer login' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.register(userData);

            if (response.success) {
                setUser(response.user);
                localStorage.setItem('betsim_token', response.token);
                return { success: true };
            } else {
                return { success: false, message: response.error || 'Erro ao criar conta' };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('betsim_token');
    };

    const updateBalance = async (newBalance) => {
        if (user) {
            // Update local state immediately for UI responsiveness
            setUser({ ...user, balance: newBalance });

            // Refresh from server to get accurate balance
            const token = localStorage.getItem('betsim_token');
            if (token) {
                try {
                    const userData = await api.getMe(token);
                    if (userData.id) {
                        setUser(userData);
                    }
                } catch (error) {
                    console.error('Error refreshing balance:', error);
                }
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateBalance, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
