import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface CompareProps {
  rfqId: number;
  rfqTitle: string;
  onNavigate: (page: string, params?: any) => void;
}

interface Quotation {
  id: number;
  rfq_id: number;
  vendor_id: number;
  pricing_details: string;
  delivery_timeline: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  vendor_name?: string;
  vendor_email?: string;
  created_at: string;
}

export const Compare: React.FC<CompareProps> = ({ rfqId, rfqTitle, onNavigate }) => {
  const { apiFetch, user, error, clearError } = useAuth();
  
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch(`/api/quotations/${rfqId}`);
      setQuotes(data || []);
    } catch (err) {
      // Error handled globally
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [rfqId]);

  // Find the lowest bid price (only among active quotes)
  const getLowestPrice = () => {
    if (quotes.length === 0) return null;
    const prices = quotes.map(q => parseFloat(q.pricing_details));
    return Math.min(...prices);
  };

  const lowestPrice = getLowestPrice();

  const handleApprove = async (quote: Quotation) => {
    if (isProcessing) return;
    
    const confirmApprove = window.confirm(
      `Are you sure you want to approve the bid from ${quote.vendor_name || 'this vendor'} for $${parseFloat(quote.pricing_details).toFixed(2)}? This will close the RFQ and automatically generate a Purchase Order.`
    );
    if (!confirmApprove) return;

    setIsProcessing(true);
    try {
      // Step 1: Approve quotation
      await apiFetch(`/api/quotations/approve/${quote.id}`, {
        method: 'PUT'
      });

      // Step 2: Auto-generate Purchase Order
      const poData = await apiFetch('/api/po', {
        method: 'POST',
        body: JSON.stringify({
          quotation_id: quote.id
        })
      });

      alert('Bid approved and Purchase Order generated successfully!');
      
      // Navigate to PO View
      onNavigate('po', { poId: poData.po.id });
    } catch (err: any) {
      alert(err.message || 'Failed to approve quotation and generate PO.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewPO = async (quoteId: number) => {
    setIsProcessing(true);
    try {
      // Query PO details by quotation ID
      const poData = await apiFetch(`/api/po/${quoteId}`);
      onNavigate('po', { poId: poData.po_id });
    } catch (err: any) {
      alert('Could not find Purchase Order for this quotation.');
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
            <li className="nav-item">
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                RFQs Board
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link active" onClick={(e) => e.preventDefault()}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare Bids
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
        {error && (
          <div className="alert alert-danger" style={{ position: 'sticky', top: '0', zIndex: 10 }}>
            <span>{error}</span>
            <button onClick={clearError} style={{ background: 'transparent', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="header-row">
          <div>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginBottom: '0.75rem' }} onClick={() => onNavigate('dashboard')}>
              ← Back to Dashboard
            </button>
            <h1 className="page-title">Bid Comparison</h1>
            <p className="page-subtitle">Comparing offers for: <strong style={{ color: 'var(--secondary)' }}>{rfqTitle}</strong></p>
          </div>
        </div>

        <section>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading quotations...
            </div>
          ) : quotes.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              No quotes have been submitted for this RFQ yet.
            </div>
          ) : (
            <div>
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Vendor Details</th>
                      <th>Bid Price ($)</th>
                      <th>Delivery Timeline</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map(quote => {
                      const priceVal = parseFloat(quote.pricing_details);
                      const isLowest = lowestPrice !== null && priceVal === lowestPrice;
                      
                      return (
                        <tr key={quote.id} className={isLowest ? 'lowest-quote' : ''}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{quote.vendor_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{quote.vendor_email}</div>
                          </td>
                          <td style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                            ${priceVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            {isLowest && (
                              <span style={{ 
                                fontSize: '0.7rem', 
                                background: 'var(--success)', 
                                color: 'var(--bg-main)', 
                                padding: '0.15rem 0.4rem', 
                                borderRadius: '4px',
                                marginLeft: '0.5rem',
                                fontWeight: 'bold'
                              }}>
                                BEST VALUE
                              </span>
                            )}
                          </td>
                          <td>{quote.delivery_timeline}</td>
                          <td>
                            <span className={`badge badge-${quote.status.toLowerCase()}`}>{quote.status}</span>
                          </td>
                          <td>
                            {quote.status === 'Approved' ? (
                              <button 
                                className="btn btn-success" 
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                onClick={() => handleViewPO(quote.id)}
                                disabled={isProcessing}
                              >
                                View Invoice PO
                              </button>
                            ) : quote.status === 'Pending' ? (
                              (user?.role === 'Procurement Officer' || user?.role === 'Admin') ? (
                                <button 
                                  className="btn btn-primary" 
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                  onClick={() => handleApprove(quote)}
                                  disabled={isProcessing}
                                >
                                  Approve Bid
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Awaiting Review</span>
                              )
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Rejected</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--success-bg)', borderLeft: '3px solid var(--success)', display: 'inline-block' }}></span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Row highlighted in green indicates the lowest priced vendor quotation.</span>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
