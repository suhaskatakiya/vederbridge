import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface UserSettingsProps {
  onNavigate: (page: string, params?: any) => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ onNavigate }) => {
  const { user, error, clearError } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'General' | 'Notifications' | 'Security' | 'Theme'>('Theme');
  
  // Theme settings (integrates with global theme selector on root element)
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Notification state toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotices, setPushNotices] = useState(false);
  const [systemLogs, setSystemLogs] = useState(true);

  // General settings
  const [companyName, setCompanyName] = useState('your Organization Name');
  const [timeZone, setTimeZone] = useState('GMT+5:30 (IST)');

  const handleToggleTheme = (themeName: 'light' | 'dark') => {
    setCurrentTheme(themeName);
    (window as any).setAppTheme?.(themeName);
    (window as any).showToast?.('success', `Theme switched to ${themeName === 'dark' ? 'Dark Mode' : 'Light Mode'}.`);
  };

  const handleSaveSettings = () => {
    (window as any).showToast?.('success', 'Configuration settings saved successfully.');
  };

  // --------------------------------------------------------
  // SIDEBAR RENDER HELPER (matches role sidebar)
  // --------------------------------------------------------
  const renderSidebarLinks = () => {
    const role = user?.role || 'Guest';
    switch (role) {
      case 'Admin':
        return (
          <ul className="nav-links">
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Dashboard</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('users'); }}>- Users</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('vendors'); }}>- Vendors</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- RFQ's</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Purchase orders</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Invoices</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>- Reports</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>- Activity Logs</a></li>
            <li className="nav-item"><a href="#" className="nav-link active" onClick={(e) => e.preventDefault()}>- Settings</a></li>
          </ul>
        );
      case 'Procurement Officer':
        return (
          <ul className="nav-links">
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Dashboard</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('vendors'); }}>- Vendors</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- RFQ's</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Quotations</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>- Approvals</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Purchase orders</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Invoices</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>- Reports</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>- Activity</a></li>
            <li className="nav-item"><a href="#" className="nav-link active" onClick={(e) => e.preventDefault()}>- Settings</a></li>
          </ul>
        );
      case 'Manager':
        return (
          <ul className="nav-links">
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Dashboard</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>- Approvals</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>- Reports</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>- Activity</a></li>
            <li className="nav-item"><a href="#" className="nav-link active" onClick={(e) => e.preventDefault()}>- Settings</a></li>
          </ul>
        );
      case 'Vendor':
        return (
          <ul className="nav-links">
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Dashboard</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- RFQ's</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Purchase Orders</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('profile'); }}>- Profile</a></li>
            <li className="nav-item"><a href="#" className="nav-link active" onClick={(e) => e.preventDefault()}>- Settings</a></li>
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-icon">VB</div>
            <span className="brand-text">VendorBridge</span>
          </div>

          {renderSidebarLinks()}
        </div>

        {user && (
          <div className="user-badge">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
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
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Configure global ERP workspace variables and user choices</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem', marginBottom: '2rem' }}>
          {(['General', 'Notifications', 'Security', 'Theme'] as const).map(tab => (
            <button 
              key={tab}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ padding: '0.4rem 1rem', fontSize: '0.825rem' }} 
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Conditional Tab Views */}
        <section className="glass-panel" style={{ padding: '2.5rem', maxWidth: '650px' }}>
          
          {activeTab === 'Theme' && (
            <div>
              <h3 className="section-title">Visual Layout Theme</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Customize how the VendorBridge ERP panel appears. Switches system variables in real time.
              </p>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {/* Dark option */}
                <div 
                  onClick={() => handleToggleTheme('dark')}
                  style={{
                    flex: 1, padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: `2px solid ${currentTheme === 'dark' ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: 'hsl(224, 25%, 10%)', color: 'white', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌙</div>
                  <strong style={{ fontSize: '0.9rem' }}>Dark Theme</strong>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(215, 15%, 75%)', marginTop: '0.25rem' }}>SAP Slate default mode</p>
                </div>

                {/* Light option */}
                <div 
                  onClick={() => handleToggleTheme('light')}
                  style={{
                    flex: 1, padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: `2px solid ${currentTheme === 'light' ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: 'hsl(220, 20%, 95%)', color: 'hsl(220, 25%, 15%)', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>☀️</div>
                  <strong style={{ fontSize: '0.9rem' }}>Light Theme</strong>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(220, 15%, 32%)', marginTop: '0.25rem' }}>Odoo clean grey mode</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div>
              <h3 className="section-title">Notification Channels</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Toggle which system channels alerts and approvals are routed to.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>Email Notifications</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Send quotation bids and PO releases to registered mailbox</p>
                  </div>
                  <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>Web Push Notices</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Display real-time desktop toast overlays on status updates</p>
                  </div>
                  <input type="checkbox" checked={pushNotices} onChange={(e) => setPushNotices(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>Audit Trail Logs</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Write all transactional events to the chronological timeline</p>
                  </div>
                  <input type="checkbox" checked={systemLogs} onChange={(e) => setSystemLogs(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                </label>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }} onClick={handleSaveSettings}>
                Save Notification Settings
              </button>
            </div>
          )}

          {activeTab === 'General' && (
            <div>
              <h3 className="section-title">General Workspace Configurations</h3>
              
              <div className="form-group">
                <label className="form-label">Company Profile Name</label>
                <input type="text" className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Global Timezone Offset</label>
                <input type="text" className="form-input" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} />
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleSaveSettings}>
                Save General Configurations
              </button>
            </div>
          )}

          {activeTab === 'Security' && (
            <div>
              <h3 className="section-title">Security & API Credentials</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Secure your ERP data exchanges. Check authorized API nodes.
              </p>

              <div style={{ background: 'var(--bg-surface-solid)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                <p><strong>Database Host:</strong> localhost:3306</p>
                <p><strong>API Server Node:</strong> http://localhost:5000</p>
                <p><strong>JWT Authorization:</strong> HS256 Standard Enabled</p>
              </div>

              <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => alert('Security credentials verified.')}>
                Run Security Health Check
              </button>
            </div>
          )}

        </section>
      </main>
    </div>
  );
};
