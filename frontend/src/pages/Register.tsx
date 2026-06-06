import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface RegisterProps {
  onNavigate: (page: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { register, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Vendor');

  // Validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passError, setPassError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      return 'Email is required.';
    } else if (!emailRegex.test(val)) {
      return 'Please enter a valid email address (e.g., name@example.com).';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Perform validation
    const nameValError = !name ? 'Full name is required.' : '';
    const emailValError = validateEmail(email);
    const passValError = !password ? 'Password is required.' : password.length < 6 ? 'Password must be at least 6 characters.' : '';

    setNameError(nameValError);
    setEmailError(emailValError);
    setPassError(passValError);

    if (nameValError || emailValError || passValError) {
      return;
    }

    setIsSubmitting(true);
    const success = await register(name, email, password, role);
    setIsSubmitting(false);

    if (success) {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-panel auth-card">
        <div className="auth-header">
          <div className="auth-logo">VB</div>
          <h1 className="page-title">Create Account</h1>
          <p className="page-subtitle">Join VendorBridge marketplace</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className={`form-input ${nameError ? 'error' : ''}`}
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(e.target.value ? '' : 'Full name is required.');
              }}
            />
            {nameError && <span className="form-error">{nameError}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className={`form-input ${emailError ? 'error' : ''}`}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(validateEmail(e.target.value));
              }}
            />
            {emailError && <span className="form-error">{emailError}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`form-input ${passError ? 'error' : ''}`}
              placeholder="•••••••• (Min 6 chars)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passError) {
                  setPassError(!e.target.value ? 'Password is required.' : e.target.value.length < 6 ? 'Password must be at least 6 characters.' : '');
                }
              }}
            />
            {passError && <span className="form-error">{passError}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">Account Role</label>
            <select
              id="role"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ background: 'var(--bg-surface-solid)' }}
            >
              <option value="Procurement Officer">Procurement Officer</option>
              <option value="Vendor">Vendor</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); clearError(); onNavigate('login'); }}>
            Sign in here
          </a>
        </div>
      </div>
    </div>
  );
};
