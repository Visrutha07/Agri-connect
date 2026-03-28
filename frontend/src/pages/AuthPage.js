import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import './AuthPage.css';

export default function AuthPage({ mode }) {
  const [params] = useSearchParams();
  const role = params.get('role') || 'customer';
  const nav = useNavigate();
  const { login } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const [form, setForm] = useState({ name: '', phone: '', password: '', role, location: '' });
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const payload  = mode === 'register' ? form : { phone: form.phone, password: form.password };
      const { data } = await api.post(endpoint, payload);
      login(data);
      showToast(`Welcome, ${data.name}! 🌾`);
      setTimeout(() => nav(data.role === 'farmer' ? '/farmer' : '/customer'), 800);
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'register';
  const isFarmer   = role === 'farmer';

  return (
    <div className="auth-page">
      {ToastComponent}
      <div className="auth-card">
        <Link to="/" className="auth-back">← Back to Home</Link>
        <div className="auth-icon">{isFarmer ? '👨‍🌾' : '🛒'}</div>
        <h1 className="auth-title">{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="auth-sub">
          {isRegister ? `Joining as a ${role}` : `Sign in as a ${role}`}
        </p>

        <form onSubmit={submit}>
          {isRegister && (
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" placeholder="Your full name" value={form.name} onChange={change} required />
            </div>
          )}
          <div className="form-group">
            <label>Phone Number</label>
            <input name="phone" type="tel" placeholder="e.g. 9876543210" value={form.phone} onChange={change} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" placeholder="Choose a strong password" value={form.password} onChange={change} required />
          </div>
          {isRegister && (
            <div className="form-group">
              <label>Village / Area (optional)</label>
              <input name="location" placeholder="e.g. Coimbatore, Tamil Nadu" value={form.location} onChange={change} />
            </div>
          )}
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <span className="spinner" /> : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister
            ? <>Already have an account? <Link to={`/login?role=${role}`}>Sign in</Link></>
            : <>New here? <Link to={`/register?role=${role}`}>Create account</Link></>
          }
        </p>
      </div>
    </div>
  );
}
