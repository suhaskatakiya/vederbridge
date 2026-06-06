import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface RegisterProps {
  onNavigate: (page: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { register, error, clearError } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Vendor');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [password, setPassword] = useState('');

  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passError, setPassError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const passValError = !password ? 'Password is required.' : password.length < 6 ? 'Password must be at least 6 characters.' : '';

    setEmailError(emailValError);
    setPassError(passValError);

    if (!firstName || !lastName) {
      alert('First Name and Last Name are required.');
      return;
    }

    if (emailValError || passValError) {
      return;
    }

    setIsSubmitting(true);
    // Call register helper from AuthContext
    const success = await register(
      `${firstName} ${lastName}`.trim(), 
      email, 
      password, 
      role
    );
    
    // Perform simulated registration field update if success (standard API save)
    if (success) {
      try {
        // Submit supplementary fields (Phone, Country, Additional info)
        const fetchUrl = 'http://localhost:5000/api/vendors/profile';
        const activeToken = localStorage.getItem('token');
        if (activeToken && role === 'Vendor') {
          await fetch(fetchUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            },
            body: JSON.stringify({
              company_name: `${firstName} ${lastName} Corp`,
              category: 'IT',
              gst_number: 'GST-PENDING',
              phone: phone,
              address: `${country}. ${additionalInfo}`
            })
          });
        }
      } catch (err) {
        // Silent pass
      }
      onNavigate('dashboard');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel auth-card" style={{ maxWidth: '650px', width: '100%' }}>
        <div className="auth-header">
          {/* Circular Photo Icon Placeholder matching Mockup 1 */}
          <div className="auth-logo" style={{ borderRadius: '50%', width: '80px', height: '80px', fontSize: '0.85rem', fontWeight: 600 }}>
            Photo
          </div>
          <h1 className="page-title">Register Screen</h1>
          <p className="page-subtitle">ERP Portal User Registration</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Grid fields layout matching Mockup 1 Screen 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">First Name*</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Last Name*</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address*</label>
              <input
                type="email"
                className={`form-input ${emailError ? 'error' : ''}`}
                placeholder="email@address.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(validateEmail(e.target.value));
                }}
                required
              />
              {emailError && <span className="form-error">{emailError}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role</label>
              <select
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ background: 'var(--bg-surface-solid)' }}
              >
                <option value="Procurement Officer">Procurement Officer (Admin/Officer)</option>
                <option value="Vendor">Vendor (Supplier)</option>
                <option value="Manager">Manager (Approver)</option>
                <option value="Admin">ERP Admin</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Country</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password*</label>
            <input
              type="password"
              className={`form-input ${passError ? 'error' : ''}`}
              placeholder="•••••••• (Min 6 characters)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passError) setPassError(e.target.value ? '' : 'Password is required.');
              }}
              required
            />
            {passError && <span className="form-error">{passError}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Additional Information ....</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Enter additional information..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already registered?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); clearError(); onNavigate('login'); }}>
            Login here
          </a>
        </div>
      </div>
    </div>
  );
};
