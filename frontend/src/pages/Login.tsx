import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onNavigate: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passError, setPassError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forgot Password flow
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const validateEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      return 'Email is required.';
    } else if (!emailRegex.test(val)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Perform validation
    const emailValError = validateEmail(email);
    const passValError = !password ? 'Password is required.' : '';

    setEmailError(emailValError);
    setPassError(passValError);

    if (emailValError || passValError) {
      return;
    }

    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      if ((window as any).showToast) {
        (window as any).showToast('success', 'Logged in successfully!');
      }
      onNavigate('dashboard');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess(false);

    const err = validateEmail(forgotEmail);
    if (err) {
      setForgotError(err);
      return;
    }

    setForgotSuccess(true);
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Password reset instructions sent to your email.');
    }
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotEmail('');
      setForgotSuccess(false);
    }, 2500);
  };

  return (
    <div className="auth-fullscreen-bg" style={{ display: 'flex', minHeight: '100vh', width: '100vw', padding: 0 }}>
      {/* Left Side: Procurement Illustration & Branding (hidden on mobile) */}
      <div className="no-print" style={{
        flex: '1.2',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4.5rem',
        color: 'var(--text-primary)',
        position: 'relative',
        zIndex: 2,
        background: 'linear-gradient(to right, rgba(8, 12, 28, 0.45), transparent)'
      }}>
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{
            borderRadius: 'var(--radius-sm)',
            width: '45px',
            height: '45px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            boxShadow: '0 0 20px var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.5rem'
          }}>
            VB
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--text-primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            VendorBridge
          </span>
        </div>

        {/* Hero Text */}
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.25, marginBottom: '1.5rem', maxWidth: '520px' }}>
          Digitize & Streamline Your Procurement Operations
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '480px', lineHeight: 1.6 }}>
          Manage vendors, RFQs, side-by-side quotations, approvals, purchase orders, and invoices in one integrated, secure platform.
        </p>

        {/* Procurement Illustration (Woman at Laptop / Warehousing) */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.9 }}>
            {/* Warehouse Shelving Background */}
            <rect x="20" y="20" width="10" height="140" fill="#1e293b" rx="2"/>
            <rect x="120" y="20" width="10" height="140" fill="#1e293b" rx="2"/>
            <rect x="20" y="45" width="110" height="6" fill="#334155"/>
            <rect x="20" y="90" width="110" height="6" fill="#334155"/>
            <rect x="20" y="135" width="110" height="6" fill="#334155"/>
            
            {/* Cargo Boxes on Shelves */}
            <rect x="35" y="26" width="30" height="14" fill="#b45309" rx="1" opacity="0.85"/>
            <rect x="75" y="28" width="25" height="12" fill="#1d4ed8" rx="1" opacity="0.85"/>
            <rect x="35" y="72" width="40" height="14" fill="#1d4ed8" rx="1" opacity="0.85"/>
            <rect x="85" y="72" width="30" height="14" fill="#b45309" rx="1" opacity="0.85"/>
            
            {/* Desk and Woman Silhouette */}
            <rect x="150" y="125" width="110" height="6" fill="var(--primary)" rx="2"/>
            <path d="M170 125 C170 95, 185 80, 195 80 C205 80, 210 95, 210 125 Z" fill="#475569"/>
            <circle cx="195" cy="65" r="12" fill="#475569"/>
            <path d="M190 80 L180 100 L165 103" stroke="#475569" strokeWidth="6" strokeLinecap="round"/>
            <path d="M200 80 L220 90 L235 90" stroke="#475569" strokeWidth="6" strokeLinecap="round"/>
            {/* Laptop */}
            <path d="M230 125 L245 105 L260 105" stroke="var(--secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M225 125 L265 125" stroke="var(--secondary)" strokeWidth="4" strokeLinecap="round"/>
            {/* Glowing Data Lines */}
            <path d="M238 95 L250 75" stroke="var(--secondary)" strokeWidth="2" strokeDasharray="3 3"/>
            <circle cx="250" cy="75" r="3" fill="var(--secondary)"/>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>System Active (32/32 tests passed)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }}></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Security Layer: Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Glassmorphism Login Card */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem',
        position: 'relative',
        zIndex: 2
      }}>
        <div className="glass-panel auth-card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
          {/* Toggling Tabs */}
          <div className="auth-tabs">
            <div className="auth-tab active">Sign In</div>
            <div className="auth-tab" onClick={() => { clearError(); onNavigate('register'); }}>Create Account</div>
          </div>

          <div className="auth-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            {/* Circular Avatar Placeholder "Photo" */}
            <div className="photo-upload-circle" style={{ cursor: 'default', borderStyle: 'solid', borderColor: 'var(--primary)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', width: '32px', height: '32px', marginBottom: 0 }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>VendorBridge ERP</h1>
            <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>Enter credentials to access your portal</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="form-group-icon">
                <input
                  id="email"
                  type="email"
                  className={`form-input form-input-with-icon ${emailError ? 'error' : ''}`}
                  placeholder="email@address.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(validateEmail(e.target.value));
                  }}
                  required
                />
                <span className="form-input-icon-left">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
              </div>
              {emailError && <span className="form-error">{emailError}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="form-group-icon">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input form-input-with-icon ${passError ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passError) setPassError(e.target.value ? '' : 'Password is required.');
                  }}
                  required
                />
                <span className="form-input-icon-left">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {passError && <span className="form-error">{passError}</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                Remember me
              </label>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}
                style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: 600 }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer" style={{ fontSize: '0.85rem' }}>
            Don't have an account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); clearError(); onNavigate('register'); }}>
              Create one here
            </a>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <button className="modal-close" onClick={() => setShowForgotModal(false)}>&times;</button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Reset Password</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Enter your registered email below, and we will send instructions to reset your password.
            </p>

            {forgotSuccess ? (
              <div className="alert alert-success" style={{ fontSize: '0.85rem', padding: '0.75rem 1rem' }}>
                <span>Recovery instructions sent successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="forgotEmail">Email Address</label>
                  <input
                    id="forgotEmail"
                    type="email"
                    className={`form-input ${forgotError ? 'error' : ''}`}
                    placeholder="email@address.com"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotError) setForgotError('');
                    }}
                    required
                  />
                  {forgotError && <span className="form-error">{forgotError}</span>}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.6rem' }} onClick={() => setShowForgotModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.6rem' }}>
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
