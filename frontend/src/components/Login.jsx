import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthStyles.css'; // Reusing or creating new styles

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setError('');

        try {
            // Mock login implementation or basic token storage
            // In a real app, you'd call api.login(email, password)
            // For now, let's assume successful login for demonstration or standard fetch

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Falha no login');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user)); // Store user info

            // Notify parent (App.jsx) that we are logged in
            if (onLogin) onLogin(data.user);

            navigate('/'); // Go to main app
        } catch (err) {
            console.error("Login Error:", err);
            setStatus('error');
            setError(err.message);
        } finally {
            setStatus('idle');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Bem-vindo ao Council</h2>
                <p className="auth-subtitle">Entra para acederes à Câmara.</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="auth-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="auth-input"
                        />
                    </div>

                    <div className="auth-links">
                        <Link to="/forgot-password">Esqueci-me da password</Link>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? 'A entrar...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
