import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface VendorManagerProps {
  onNavigate: (page: string, params?: any) => void;
}

interface VendorProfile {
  id: number;
  user_id: number;
  company_name: string;
  category: string;
  gst_number: string;
  phone: string;
  address: string;
  status: 'Active' | 'Pending Approval' | 'Blocked';
  rating: string;
  contact_name: string;
  contact_email: string;
}

export const VendorManager: React.FC<VendorManagerProps> = ({ onNavigate }) => {
  const { apiFetch, user, error, clearError } = useAuth();
  
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State matching Screen 4
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Pending Approval' | 'Blocked'>('All');

  // Add Vendor Modal State
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [addCompName, setAddCompName] = useState('');
  const [addCategory, setAddCategory] = useState('IT');
  const [addGST, setAddGST] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);

      const data = await apiFetch(`/api/vendors?${queryParams.toString()}`);
      setVendors(data || []);
    } catch (err) {
      // Handled globally
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search]);

  // Dynamic counts for Mockup 2 Screen 4 tabs
  const countAll = vendors.length;
  const countActive = vendors.filter(v => v.status === 'Active').length;
  const countPending = vendors.filter(v => v.status === 'Pending Approval').length;
  const countBlocked = vendors.filter(v => v.status === 'Blocked').length;

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCompName || !addGST || !addPhone || !addEmail) {
      alert('All fields are required.');
      return;
    }

    setIsProcessing(true);
    try {
      // First create user account (simulated or explicit API register)
      await apiFetch('/register', {
        method: 'POST',
        body: JSON.stringify({
          first_name: addCompName,
          last_name: 'Corp',
          email: addEmail,
          password: 'password123',
          role: 'Vendor'
        })
      });

      // Update their profile details
      const activeToken = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/vendors/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          company_name: addCompName,
          category: addCategory,
          gst_number: addGST,
          phone: addPhone,
          address: addAddress
        })
      });

      alert('Vendor successfully created & added to Directory!');
      setAddCompName('');
      setAddGST('');
      setAddPhone('');
      setAddAddress('');
      setAddEmail('');
      setIsAddVendorOpen(false);
      fetchVendors();
    } catch (err: any) {
      alert(err.message || 'Failed to add vendor.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (vendorId: number, nextStatus: string) => {
    const confirmMsg = `Are you sure you want to change this vendor's status to ${nextStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await apiFetch(`/api/vendors/${vendorId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      alert('Vendor status updated successfully!');
      fetchVendors();
    } catch (err: any) {
      alert(err.message || 'Failed to update vendor.');
    }
  };

  // Filter rows based on active tab
  const getFilteredVendors = () => {
    if (activeTab === 'All') return vendors;
    return vendors.filter(v => v.status === activeTab);
  };

  const filteredVendorsList = getFilteredVendors();

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
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                - Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link active" onClick={(e) => e.preventDefault()}>
                - Vendors
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                - RFQ's
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                - Quotations
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>
                - Approvals
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                - Purchase orders
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                - Invoices
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>
                - Reports
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>
                - Activity
              </a>
            </li>
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

      {/* Main Workspace */}
      <main className="main-content">
        {error && (
          <div className="alert alert-danger" style={{ position: 'sticky', top: '0', zIndex: 10 }}>
            <span>{error}</span>
            <button onClick={clearError} style={{ background: 'transparent', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="header-row">
          <div>
            {/* Screen 4 Title */}
            <h1 className="page-title">Vendors</h1>
            <p className="page-subtitle">Manage supplier profiles and registrations</p>
          </div>

          {(user?.role === 'Admin' || user?.role === 'Procurement Officer') && (
            <button className="btn btn-primary" onClick={() => setIsAddVendorOpen(true)}>
              + Add Vendor
            </button>
          )}
        </div>

        {/* Search Bar matching mockup placeholder */}
        <section className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search bar .... search by name, gst number, category.."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </section>

        {/* Tab options matching counts from mockup Screen 4 */}
        <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem', marginBottom: '2.5rem' }}>
          <button className={`btn ${activeTab === 'All' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }} onClick={() => setActiveTab('All')}>
            All ({countAll})
          </button>
          <button className={`btn ${activeTab === 'Active' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }} onClick={() => setActiveTab('Active')}>
            Active ({countActive})
          </button>
          <button className={`btn ${activeTab === 'Pending Approval' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }} onClick={() => setActiveTab('Pending Approval')}>
            Pending ({countPending})
          </button>
          <button className={`btn ${activeTab === 'Blocked' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }} onClick={() => setActiveTab('Blocked')}>
            Blocked ({countBlocked})
          </button>
        </div>

        {/* Vendors table matching Screen 4 */}
        {isLoading ? (
          <p>Loading suppliers directory...</p>
        ) : filteredVendorsList.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No supplier profile matches search query.</p>
        ) : (
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Category</th>
                  <th>GST no.</th>
                  <th>contact no.</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendorsList.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.975rem' }}>{v.company_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Address: {v.address || 'Address pending'}</div>
                    </td>
                    <td>{v.category}</td>
                    <td style={{ fontFamily: 'monospace' }}>{v.gst_number}</td>
                    <td>{v.phone}</td>
                    <td>
                      <span className={`badge badge-${v.status.toLowerCase().replace(' ', '-')}`}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          onClick={() => alert(`Supplier profile details:\nCompany: ${v.company_name}\nGST: ${v.gst_number}\nRating: ${parseFloat(v.rating).toFixed(1)}/5`)}
                        >
                          View
                        </button>
                        {user?.role === 'Admin' && (
                          <>
                            {v.status === 'Pending Approval' && (
                              <>
                                <button
                                  className="btn btn-success"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--bg-main)' }}
                                  onClick={() => handleUpdateStatus(v.id, 'Active')}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                                  onClick={() => handleUpdateStatus(v.id, 'Blocked')}
                                >
                                  Block
                                </button>
                              </>
                            )}
                            {v.status === 'Active' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                                onClick={() => handleUpdateStatus(v.id, 'Blocked')}
                              >
                                Block
                              </button>
                            )}
                            {v.status === 'Blocked' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--success)' }}
                                onClick={() => handleUpdateStatus(v.id, 'Active')}
                              >
                                Unblock
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Vendor Modal Form */}
      {isAddVendorOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => setIsAddVendorOpen(false)}>✕</button>
            <h2 className="section-title">Add Supplier Profile</h2>

            <form onSubmit={handleCreateVendor}>
              <div className="form-group">
                <label className="form-label">Vendor Company Name</label>
                <input type="text" className="form-input" value={addCompName} onChange={(e) => setAddCompName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Supplier Login Email</label>
                <input type="email" className="form-input" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={addCategory} onChange={(e) => setAddCategory(e.target.value)} style={{ background: 'var(--bg-surface-solid)' }}>
                    <option value="IT">IT & Electronics</option>
                    <option value="Constructions">Constructions</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Furniture">Furniture</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">GSTIN Number</label>
                  <input type="text" className="form-input" placeholder="e.g. 27AAACS1924B1Z0" value={addGST} onChange={(e) => setAddGST(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input type="text" className="form-input" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Company Corporate Address</label>
                <textarea className="form-input" rows={2} value={addAddress} onChange={(e) => setAddAddress(e.target.value)} style={{ resize: 'none' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isProcessing}>
                Create supplier
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
