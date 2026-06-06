import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface UserProfileProps {
  onNavigate: (page: string, params?: any) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onNavigate }) => {
  const { user, apiFetch, error, clearError } = useAuth();

  const [firstName, setFirstName] = useState(user?.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name.split(' ')[1] || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Photo avatar state (read and write to localStorage)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      const savedAvatar = localStorage.getItem(`avatar_${user.email}`);
      if (savedAvatar) {
        setPhotoPreview(savedAvatar);
      }
    }
  }, [user?.email]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        if (user?.email) {
          localStorage.setItem(`avatar_${user.email}`, base64);
          if ((window as any).showToast) {
            (window as any).showToast('success', 'Profile photo updated!');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      alert('First Name and Last Name are required.');
      return;
    }

    setIsSaving(true);
    try {
      await apiFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          country: country,
          password: newPassword || undefined
        })
      });

      // Update local storage representation
      if (user) {
        const updatedUser = {
          ...user,
          name: `${firstName} ${lastName}`.trim()
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      if ((window as any).showToast) {
        (window as any).showToast('success', 'Profile details updated successfully!');
      }
      setNewPassword('');
    } catch (err: any) {
      if ((window as any).showToast) {
        (window as any).showToast('error', err.message || 'Failed to update profile.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------
  // SIDEBAR RENDER HELPER (strictly respects role RBAC)
  // --------------------------------------------------------
  const renderSidebarLinks = () => {
    const role = user?.role || 'Guest';
    switch (role) {
      case 'Admin':
        return (
          <ul className="nav-links">
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                <span>📊</span> Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('users'); }}>
                <span>👥</span> User Management
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('vendors'); }}>
                <span>🏭</span> Vendor Management
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>
                <span>📈</span> Reports
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>
                <span>📋</span> Activity Logs
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>
                <span>⚙️</span> Settings
              </a>
            </li>
          </ul>
        );
      case 'Procurement Officer':
        return (
          <ul className="nav-links">
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                <span>📊</span> Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); /* RFQs module toggle handled in dashboard */ }}>
                <span>📄</span> RFQs
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); /* Quotations matrix toggle */ }}>
                <span>💬</span> Quotations
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); /* Compare view navigates from dashboard */ }}>
                <span>⚖️</span> Comparison
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); /* PO module */ }}>
                <span>📦</span> Purchase Orders
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); /* Invoices module */ }}>
                <span>🧾</span> Invoices
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>
                <span>📈</span> Reports
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>
                <span>📋</span> Activity Logs
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>
                <span>⚙️</span> Settings
              </a>
            </li>
          </ul>
        );
      case 'Manager':
        return (
          <ul className="nav-links">
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                <span>📊</span> Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); /* Approvals list */ }}>
                <span>✅</span> Approvals
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>
                <span>📈</span> Reports
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>
                <span>📋</span> Activity Logs
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>
                <span>⚙️</span> Settings
              </a>
            </li>
          </ul>
        );
      case 'Vendor':
        return (
          <ul className="nav-links">
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                <span>📊</span> Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); /* RFQs assigned */ }}>
                <span>📄</span> RFQs
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); /* Submit Quotations */ }}>
                <span>✏️</span> Submit Quotations
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); /* Purchase orders */ }}>
                <span>📦</span> Purchase Orders
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); /* Notifications bell */ }}>
                <span>🔔</span> Notifications
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link active" onClick={(e) => e.preventDefault()}>
                <span>👤</span> Profile
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>
                <span>⚙️</span> Settings
              </a>
            </li>
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar no-print">
        <div>
          <div className="brand">
            <div className="brand-icon">VB</div>
            <span className="brand-text">VendorBridge</span>
          </div>

          {renderSidebarLinks()}
        </div>

        {user && (
          <div className="user-badge">
            <div className="user-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
              {photoPreview ? (
                <img src={photoPreview} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
            <button onClick={clearError} style={{ background: 'transparent', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="header-row">
          <div>
            <h1 className="page-title">User Profile</h1>
            <p className="page-subtitle">Update your personal account information and credentials</p>
          </div>
        </div>

        <section className="glass-panel" style={{ padding: '2.5rem', maxWidth: '750px' }}>
          <form onSubmit={handleSaveProfile}>
            {/* Interactive Photo Upload Circle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              <div 
                className="photo-upload-circle" 
                onClick={() => document.getElementById('photo-input')?.click()}
                style={{ margin: 0, borderStyle: 'solid', borderColor: 'var(--primary)' }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="photo-upload-preview" />
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
              <div>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => document.getElementById('photo-input')?.click()}
                >
                  Upload New Photo
                </button>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Supports PNG, JPG, or GIF up to 2MB. Saved locally.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">First Name*</label>
                <div className="form-group-icon">
                  <input
                    type="text"
                    className="form-input form-input-with-icon"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address (Read-only)</label>
                <div className="form-group-icon">
                  <input
                    type="email"
                    className="form-input form-input-with-icon"
                    value={email}
                    readOnly
                    style={{ background: 'var(--bg-surface-solid)', cursor: 'not-allowed', opacity: 0.7 }}
                  />
                  <span className="form-input-icon-left">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contact Phone</label>
                <div className="form-group-icon">
                  <input
                    type="text"
                    className="form-input form-input-with-icon"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <span className="form-input-icon-left">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Country</label>
                <div className="form-group-icon">
                  <input
                    type="text"
                    className="form-input form-input-with-icon"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                  <span className="form-input-icon-left">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password (optional)</label>
                <div className="form-group-icon">
                  <input
                    type="password"
                    className="form-input form-input-with-icon"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <span className="form-input-icon-left">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};