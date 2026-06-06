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
  
  // Photo preview state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
    const success = await register(
      `${firstName} ${lastName}`.trim(), 
      email, 
      password, 
      role
    );
    
    if (success) {
      // Store avatar in localStorage if set, for user profile page retrieval
      if (photoPreview) {
        localStorage.setItem(`avatar_${email}`, photoPreview);
      }
      
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
      
      if ((window as any).showToast) {
        (window as any).showToast('success', 'Account registered successfully!');
      }
      onNavigate('dashboard');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-fullscreen-bg" style={{ display: 'flex', minHeight: '100vh', width: '100vw', padding: 0 }}>
      {/* Left Side: Procurement Illustration & Branding (hidden on mobile) */}
      <div className="no-print" style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
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
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.25, marginBottom: '1.5rem', maxWidth: '500px' }}>
          Join the Next-Gen Procurement Network
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '450px', lineHeight: 1.6 }}>
          Register to collaborate with leading buyers, submit competitive bids, track real-time approvals, and process invoices seamlessly.
        </p>

        {/* Procurement Illustration (Simple Warehousing details) */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <svg width="240" height="150" viewBox="0 0 240 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.85 }}>
            <rect x="10" y="20" width="8" height="110" fill="#1e293b" rx="2"/>
            <rect x="100" y="20" width="8" height="110" fill="#1e293b" rx="2"/>
            <rect x="10" y="40" width="98" height="5" fill="#334155"/>
            <rect x="10" y="80" width="98" height="5" fill="#334155"/>
            <rect x="10" y="120" width="98" height="5" fill="#334155"/>
            <rect x="25" y="25" width="22" height="12" fill="#0f766e" rx="1" opacity="0.8"/>
            <rect x="60" y="25" width="25" height="12" fill="#1d4ed8" rx="1" opacity="0.8"/>
            <rect x="25" y="65" width="35" height="12" fill="#1d4ed8" rx="1" opacity="0.8"/>
            
            <circle cx="170" cy="75" r="40" fill="hsla(220, 85%, 52%, 0.15)" stroke="var(--primary)" strokeWidth="2"/>
            <path d="M150 75 L165 90 L195 60" stroke="var(--secondary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enterprise Compliant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }}></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>RBAC Isolation Enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Glassmorphism Register Card */}
      <div style={{
        flex: '1.2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        zIndex: 2
      }}>
        <div className="glass-panel auth-card" style={{ maxWidth: '650px', width: '100%', padding: '2.5rem' }}>
          {/* Toggling Tabs */}
          <div className="auth-tabs">
            <div className="auth-tab" onClick={() => { clearError(); onNavigate('login'); }}>Sign In</div>
            <div className="auth-tab active">Create Account</div>
          </div>

          <div className="auth-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            {/* Interactive Photo Upload Circle */}
            <div className="photo-upload-circle" onClick={() => document.getElementById('photo-input')?.click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="photo-upload-preview" />
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <span className="photo-upload-label">Photo</span>
                </>
              )}
            </div>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />

            <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>User Registration</h1>
            <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>Setup your VendorBridge account details</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Grid fields layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">First Name*</label>
                <div className="form-group-icon">
                  <input
                    type="text"
                    className="form-input form-input-with-icon"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <span className="form-input-icon-left">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Last Name*</label>
                <div className="form-group-icon">
                  <input
                    type="text"
                    className="form-input form-input-with-icon"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                  <span className="form-input-icon-left">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address*</label>
                <div className="form-group-icon">
                  <input
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </span>
                </div>
                {emailError && <span className="form-error">{emailError}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Number</label>
                <div className="form-group-icon">
                  <input
                    type="text"
                    className="form-input form-input-with-icon"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <span className="form-input-icon-left">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ background: 'var(--bg-surface-solid)', paddingRight: '2rem' }}
                >
                  <option value="Procurement Officer">Procurement Officer (Admin/Officer)</option>
                  <option value="Vendor">Vendor (Supplier)</option>
                  <option value="Manager">Manager (Approver)</option>
                  <option value="Admin">ERP Admin</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Country</label>
                <div className="form-group-icon">
                  <input
                    type="text"
                    className="form-input form-input-with-icon"
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                  <span className="form-input-icon-left">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password*</label>
              <div className="form-group-icon">
                <input
                  type="password"
                  className={`form-input form-input-with-icon ${passError ? 'error' : ''}`}
                  placeholder="•••••••• (Min 6 characters)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passError) setPassError(e.target.value ? '' : 'Password is required.');
                  }}
                  required
                />
                <span className="form-input-icon-left">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
              </div>
              {passError && <span className="form-error">{passError}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Additional Information</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Enter company description or remarks..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="auth-footer" style={{ fontSize: '0.85rem', marginTop: '1.25rem' }}>
            Already registered?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); clearError(); onNavigate('login'); }}>
              Login here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
