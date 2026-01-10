import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './AuthStyles.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    if (!token) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="auth-title">Token Inválido</h2>
                    <p className="auth-subtitle">O link de reset é inválido ou expirou.</p>
                    <button onClick={() => navigate('/login')} className="auth-button">Voltar ao Login</button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('As passwords não coincidem.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: password }),
            });

            if (response.ok) {
                setStatus('success');
                setMessage('Password alterada com sucesso! A redirecionar...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                const data = await response.json();
                throw new Error(data.detail || 'Erro ao fazer reset da password.');
            }
        } catch (error) {
            console.error("Reset Password Error:", error);
            setStatus('error');
            setMessage(error.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Nova Password</h2>
                <p className="auth-subtitle">Define uma nova password para a tua conta.</p>

                {status === 'success' ? (
                    <div className="auth-success-message">
                        <p>{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Nova Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="auth-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmar Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="auth-input"
                            />
                        </div>

                        {status === 'error' && <div className="auth-error">{message}</div>}

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? 'A atualizar...' : 'Alterar Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
