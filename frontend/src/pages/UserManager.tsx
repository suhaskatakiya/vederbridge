import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface UserManagerProps {
  onNavigate: (page: string, params?: any) => void;
}

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Procurement Officer' | 'Vendor' | 'Manager';
  status: 'Active' | 'Disabled';
  created_at: string;
}

export const UserManager: React.FC<UserManagerProps> = ({ onNavigate }) => {
  const { apiFetch, user, error, clearError } = useAuth();
  
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Procurement Officer');
  const [country, setCountry] = useState('India');
  const [addInfo, setAddInfo] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/users');
      setUsers(data || []);
    } catch (err) {
      // Handled globally
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (targetUser: UserInfo) => {
    const nextStatus = targetUser.status === 'Active' ? 'Disabled' : 'Active';
    const confirm = window.confirm(`Are you sure you want to change status of ${targetUser.name} to ${nextStatus}?`);
    if (!confirm) return;

    try {
      await apiFetch(`/api/users/${targetUser.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      (window as any).showToast?.('success', `User status successfully updated to ${nextStatus}.`);
      fetchUsers();
    } catch (err: any) {
      (window as any).showToast?.('error', err.message || 'Failed to update user status.');
    }
  };

  const handleChangeRole = async (userId: number, nextRole: string) => {
    try {
      await apiFetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: nextRole })
      });
      (window as any).showToast?.('success', `User role successfully updated to ${nextRole}.`);
      fetchUsers();
    } catch (err: any) {
      (window as any).showToast?.('error', err.message || 'Failed to update user role.');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      alert('Required fields missing.');
      return;
    }

    setIsProcessing(true);
    try {
      await apiFetch('/register', {
        method: 'POST',
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim(),
          email,
          password,
          role,
          first_name: firstName,
          last_name: lastName,
          phone_number: '0000000000',
          country,
          additional_info: addInfo
        })
      });
      
      (window as any).showToast?.('success', `User ${firstName} successfully created.`);
      setIsAddUserOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setAddInfo('');
      fetchUsers();
    } catch (err: any) {
      (window as any).showToast?.('error', err.message || 'Failed to register new user.');
    } finally {
      setIsProcessing(false);
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

          <ul className="nav-links">
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Dashboard</a></li>
            <li className="nav-item"><a href="#" className="nav-link active" onClick={(e) => e.preventDefault()}>- Users</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('vendors'); }}>- Vendors</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- RFQ's</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Purchase orders</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Invoices</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>- Reports</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>- Activity Logs</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>- Settings</a></li>
          </ul>
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

      {/* Main Content Area */}
      <main className="main-content">
        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
            <button onClick={clearError} style={{ background: 'transparent', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="header-row">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage administrative privileges and user credentials</p>
          </div>

          <button className="btn btn-primary" onClick={() => setIsAddUserOpen(true)}>
            + Add User
          </button>
        </div>

        {/* Users administration table */}
        {isLoading ? (
          <div>
            <div className="skeleton" style={{ width: '100%', height: '40px', marginBottom: '0.75rem' }} />
            <div className="skeleton" style={{ width: '100%', height: '120px' }} />
          </div>
        ) : users.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No users registered.</p>
        ) : (
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        style={{
                          background: 'var(--bg-surface-solid)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Procurement Officer">Procurement Officer</option>
                        <option value="Manager">Manager</option>
                        <option value="Vendor">Vendor</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge badge-${u.status === 'Active' ? 'approved' : 'rejected'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: u.status === 'Active' ? 'var(--danger)' : 'var(--success)' }}
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.status === 'Active' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setIsAddUserOpen(false)}>✕</button>
            <h2 className="section-title">Create ERP User</h2>

            <form onSubmit={handleAddUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">First Name*</label>
                  <input type="text" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Last Name*</label>
                  <input type="text" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address*</label>
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Password*</label>
                <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)} style={{ background: 'var(--bg-surface-solid)' }}>
                    <option value="Admin">Admin</option>
                    <option value="Procurement Officer">Procurement Officer</option>
                    <option value="Manager">Manager</option>
                    <option value="Vendor">Vendor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input type="text" className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Additional notes</label>
                <textarea className="form-input" rows={2} value={addInfo} onChange={(e) => setAddInfo(e.target.value)} style={{ resize: 'none' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isProcessing}>
                Create User
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
