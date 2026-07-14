import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, LogIn, UserPlus, Briefcase } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', email: '' });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await authApi.login({ username: form.username, password: form.password })
        : await authApi.register(form);
      login(res.data);
      toast.success(res.data.message || 'Welcome!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Background blobs */}
      <div style={{
        position: 'fixed', top: '20%', left: '10%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        animation: 'float 6s ease-in-out infinite', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '20%', right: '10%',
        width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        animation: 'float 8s ease-in-out infinite reverse', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px', boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
          }}>
            <Briefcase size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>EMS Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Employee Management System
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '36px', border: '1px solid var(--border-accent)' }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex', marginBottom: '28px',
            background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)',
            padding: '4px', gap: '4px',
          }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
                background: mode === m ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-muted)',
                fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: mode === m ? '0 2px 10px rgba(99,102,241,0.4)' : 'none',
                textTransform: 'capitalize',
              }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter email"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter password"
                  style={{ paddingRight: '44px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}
              style={{ padding: '12px', fontSize: '0.95rem', marginTop: '4px', justifyContent: 'center' }}>
              {loading
                ? <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />Processing...</>
                : mode === 'login'
                  ? <><LogIn size={16} />Sign In</>
                  : <><UserPlus size={16} />Create Account</>
              }
            </button>
          </form>

          {mode === 'login' && (
            <div style={{
              marginTop: '20px', padding: '12px 16px',
              background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}>
              <strong style={{ color: 'var(--accent-light)' }}>Demo credentials:</strong>
              <br />Username: <code style={{ color: 'var(--text-primary)' }}>admin</code> &nbsp;|&nbsp;
              Password: <code style={{ color: 'var(--text-primary)' }}>admin123</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
