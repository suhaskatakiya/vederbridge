import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

interface RFQ {
  id: number;
  title: string;
  product_details: string;
  quantity: number;
  deadline: string;
  status: 'Open' | 'Closed';
  creator_name?: string;
  created_at: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, logout, apiFetch, error, clearError } = useAuth();
  
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);

  // New RFQ form state
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqDetails, setRfqDetails] = useState('');
  const [rfqQty, setRfqQty] = useState('');
  const [rfqDeadline, setRfqDeadline] = useState('');
  const [rfqFormError, setRfqFormError] = useState('');

  // New Bid Form state
  const [bidPrice, setBidPrice] = useState('');
  const [bidTimeline, setBidTimeline] = useState('');
  const [bidFormError, setBidFormError] = useState('');

  // Fetch RFQs
  const fetchRFQs = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/rfqs');
      setRfqs(data || []);
    } catch (err) {
      // Error handled by AuthContext global boundary
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    setRfqFormError('');

    if (!rfqTitle || !rfqDetails || !rfqQty || !rfqDeadline) {
      setRfqFormError('All fields are required.');
      return;
    }

    if (isNaN(Number(rfqQty)) || Number(rfqQty) <= 0) {
      setRfqFormError('Quantity must be a positive number.');
      return;
    }

    try {
      await apiFetch('/api/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          title: rfqTitle,
          product_details: rfqDetails,
          quantity: parseInt(rfqQty),
          deadline: rfqDeadline
        })
      });

      // Clear and close
      setRfqTitle('');
      setRfqDetails('');
      setRfqQty('');
      setRfqDeadline('');
      setIsRfqModalOpen(false);
      
      // Refresh list
      fetchRFQs();
    } catch (err: any) {
      setRfqFormError(err.message || 'Failed to create RFQ.');
    }
  };

  const handleOpenBidModal = (rfq: RFQ) => {
    setSelectedRfq(rfq);
    setBidPrice('');
    setBidTimeline('');
    setBidFormError('');
    setIsBidModalOpen(true);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidFormError('');

    if (!selectedRfq) return;
    if (!bidPrice || !bidTimeline) {
      setBidFormError('All fields are required.');
      return;
    }

    if (isNaN(Number(bidPrice)) || Number(bidPrice) <= 0) {
      setBidFormError('Price must be a positive number.');
      return;
    }

    try {
      await apiFetch('/api/quotations', {
        method: 'POST',
        body: JSON.stringify({
          rfq_id: selectedRfq.id,
          pricing_details: parseFloat(bidPrice),
          delivery_timeline: bidTimeline
        })
      });

      // Clear and close
      setBidPrice('');
      setBidTimeline('');
      setIsBidModalOpen(false);
      setSelectedRfq(null);

      // Refresh
      fetchRFQs();
      alert('Bid submitted successfully!');
    } catch (err: any) {
      setBidFormError(err.message || 'Failed to submit bid.');
    }
  };

  // Stat calculations
  const totalCount = rfqs.length;
  const activeCount = rfqs.filter(r => r.status === 'Open').length;
  const closedCount = totalCount - activeCount;

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
              <a href="#" className="nav-link active" onClick={(e) => e.preventDefault()}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                RFQs Board
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); logout(); }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </a>
            </li>
          </ul>
        </div>

        {user && (
          <div className="user-badge">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name" title={user.name}>{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        {/* Global Connection status bar (Graceful Error alert) */}
        {error && (
          <div className="alert alert-danger" style={{ position: 'sticky', top: '0', zIndex: 10 }}>
            <span>{error}</span>
            <button 
              onClick={clearError}
              style={{ background: 'transparent', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="header-row">
          <div>
            <h1 className="page-title">Request for Quotations</h1>
            <p className="page-subtitle">Post and manage procurement bids</p>
          </div>

          {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && (
            <button className="btn btn-primary" onClick={() => setIsRfqModalOpen(true)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create RFQ
            </button>
          )}
        </div>

        {/* Statistics Cards */}
        <section className="stats-grid">
          <div className="glass-panel stat-card">
            <span className="stat-label">Total RFQs</span>
            <div className="stat-value">{isLoading ? '...' : totalCount}</div>
          </div>
          <div className="glass-panel stat-card">
            <span className="stat-label">Active Bidding</span>
            <div className="stat-value" style={{ color: 'var(--secondary)' }}>{isLoading ? '...' : activeCount}</div>
          </div>
          <div className="glass-panel stat-card">
            <span className="stat-label">Completed Orders</span>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{isLoading ? '...' : closedCount}</div>
          </div>
        </section>

        {/* RFQ List Section */}
        <section>
          <h2 className="section-title">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Available Requests
          </h2>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading RFQs from server...
            </div>
          ) : rfqs.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              No RFQs found in the database. 
              {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && ' Click "Create RFQ" to get started.'}
            </div>
          ) : (
            <div className="rfq-grid">
              {rfqs.map(rfq => (
                <div key={rfq.id} className="glass-panel rfq-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span className={`badge badge-${rfq.status.toLowerCase()}`}>{rfq.status}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600 }}>Qty: {rfq.quantity}</span>
                    </div>
                    <h3 className="rfq-title">{rfq.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0 1rem 0', lineBreak: 'anywhere' }}>
                      {rfq.product_details}
                    </p>
                  </div>

                  <div>
                    <div className="rfq-meta" style={{ marginBottom: '1rem' }}>
                      <span>By: {rfq.creator_name || 'Procurement'}</span>
                      <span>Due: {new Date(rfq.deadline).toLocaleDateString()}</span>
                    </div>

                    {rfq.status === 'Open' ? (
                      user?.role === 'Vendor' ? (
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleOpenBidModal(rfq)}>
                          Submit Quote
                        </button>
                      ) : (user?.role === 'Procurement Officer' || user?.role === 'Manager' || user?.role === 'Admin') ? (
                        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => onNavigate('compare', { rfqId: rfq.id, rfqTitle: rfq.title })}>
                          Compare Bids
                        </button>
                      ) : null
                    ) : (
                      <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => onNavigate('compare', { rfqId: rfq.id, rfqTitle: rfq.title })}>
                        View Bids (Closed)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* RFQ Creation Modal */}
      {isRfqModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => setIsRfqModalOpen(false)}>✕</button>
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Create Request for Quotation</h2>
            
            {rfqFormError && <div className="alert alert-danger" style={{ padding: '0.75rem' }}>{rfqFormError}</div>}
            
            <form onSubmit={handleCreateRfq}>
              <div className="form-group">
                <label className="form-label">Product/Service Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Office Laptops Upgrade"
                  value={rfqTitle}
                  onChange={(e) => setRfqTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Requirements</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Describe technical specs, brand preferences, etc."
                  value={rfqDetails}
                  onChange={(e) => setRfqDetails(e.target.value)}
                  style={{ resize: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Quantity Needed</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 50"
                    value={rfqQty}
                    onChange={(e) => setRfqQty(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Submission Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={rfqDeadline}
                    onChange={(e) => setRfqDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Post RFQ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Quote Submission Modal */}
      {isBidModalOpen && selectedRfq && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => { setIsBidModalOpen(false); setSelectedRfq(null); }}>✕</button>
            <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>Submit Bid Quotation</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              RFQ: <strong style={{ color: 'var(--secondary)' }}>{selectedRfq.title}</strong>
            </p>

            {bidFormError && <div className="alert alert-danger" style={{ padding: '0.75rem' }}>{bidFormError}</div>}

            <form onSubmit={handleSubmitBid}>
              <div className="form-group">
                <label className="form-label">Unit / Total Price ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 24500.00"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Delivery Timeline</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 3 Weeks, 10 Business Days"
                  value={bidTimeline}
                  onChange={(e) => setBidTimeline(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Submit Quotation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
