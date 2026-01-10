import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import './AuthStyles.css'; // Reusing Auth styles if possible, or we create a new one

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setStatus('success');
                setMessage('Se o email existir, irás receber um link em breve.');
            } else {
                const data = await response.json();
                throw new Error(data.detail || 'Erro ao processar pedido.');
            }
        } catch (error) {
            console.error("Forgot Password Error:", error);
            setStatus('error');
            setMessage('Ocorreu um erro. Tenta novamente.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Recuperar Password</h2>
                <p className="auth-subtitle">Introduz o teu email para receberes um link de reset.</p>

                {status === 'success' ? (
                    <div className="auth-success-message">
                        <p>{message}</p>
                        <Link to="/login" className="auth-link-button">Voltar ao Login</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="nome@exemplo.com"
                                className="auth-input"
                            />
                        </div>

                        {status === 'error' && <div className="auth-error">{message}</div>}

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? 'A enviar...' : 'Enviar Link de Reset'}
                        </button>

                        <div className="auth-footer">
                            <Link to="/login" className="auth-link">Voltar ao Login</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
