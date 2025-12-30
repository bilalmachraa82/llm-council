import { useState } from 'react';
import { useAuth } from '../AuthContext';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose }) {
    const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const { signIn, signUp } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (mode === 'signin') {
                await signIn(email, password);
                onClose();
            } else {
                await signUp(email, password);
                setSuccess('Check your email for a confirmation link!');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                <h2>{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
                <p className="auth-subtitle">
                    {mode === 'signin'
                        ? 'Access your Council credits'
                        : 'Start with 10 free credits'}
                </p>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    />
                    <button type="submit" disabled={loading} className="auth-submit">
                        {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-switch">
                    {mode === 'signin' ? (
                        <p>Don't have an account? <button onClick={() => setMode('signup')}>Sign Up</button></p>
                    ) : (
                        <p>Already have an account? <button onClick={() => setMode('signin')}>Sign In</button></p>
                    )}
                </div>
            </div>
        </div>
    );
}
