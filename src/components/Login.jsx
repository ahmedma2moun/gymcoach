import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const userData = await response.json();
                login(userData);
                if (userData.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            } else {
                const data = await response.json();
                setError(data.message || 'Invalid credentials');
            }
        } catch {
            setError('Connection error — please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Hero */}
            <div className="login-hero">
                <div className="login-logo">
                    <div className="login-logo-icon">🏋️</div>
                    <div>
                        <div className="login-brand-name">Antigravity</div>
                        <div className="login-tagline">Gym Management</div>
                    </div>
                </div>

                <h1 className="login-headline">
                    Train.<br />
                    <span>Dominate.</span><br />
                    Repeat.
                </h1>
                <p className="login-sub">Your personalised workout hub. Log in to track every rep.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Welcome back</h2>

                {error && <div className="error-msg">⚠ {error}</div>}

                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoCapitalize="none"
                        autoCorrect="off"
                        autoFocus
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Logging in…' : 'Let\'s Go 🔥'}
                </button>

                <p className="login-footer-note">Antigravity Gym © {new Date().getFullYear()}</p>
            </form>
        </div>
    );
};

export default Login;
