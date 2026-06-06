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
  company_name?: string;
  vendor_rating?: string;
  vendor_category?: string;
  vendor_gst?: string;
  notes?: string;
  tax_gst_percent?: string;
  created_at: string;
}

export const Compare: React.FC<CompareProps> = ({ rfqId, rfqTitle, onNavigate }) => {
  const { apiFetch, user, error, clearError } = useAuth();
  
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Remarks modal for initiating approval workflow
  const [selectedQuoteForWorkflow, setSelectedQuoteForWorkflow] = useState<Quotation | null>(null);
  const [remarksText, setRemarksText] = useState('');

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch(`/api/quotations/${rfqId}`);
      setQuotes(data || []);
    } catch (err) {
      // Handled globally
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [rfqId]);

  // Find lowest price quote
  const getLowestQuoteId = () => {
    if (quotes.length === 0) return null;
    let lowestPrice = Infinity;
    let lowestId = null;

    quotes.forEach(q => {
      const price = parseFloat(q.pricing_details);
      if (price < lowestPrice) {
        lowestPrice = price;
        lowestId = q.id;
      }
    });

    return lowestId;
  };

  const lowestQuoteId = getLowestQuoteId();

  // Find fastest delivery quote
  const getFastestQuoteId = () => {
    if (quotes.length === 0) return null;
    let fastestDelivery = Infinity;
    let fastestId = null;

    quotes.forEach(q => {
      const delivery = parseInt(q.delivery_timeline.replace(/[^0-9]/g, '')) || 999;
      if (delivery < fastestDelivery) {
        fastestDelivery = delivery;
        fastestId = q.id;
      }
    });

    return fastestId;
  };

  const fastestQuoteId = getFastestQuoteId();

  // Initiate approval workflow transition
  const handleSelectQuote = (quote: Quotation) => {
    setSelectedQuoteForWorkflow(quote);
    setRemarksText('');
  };

  const handleConfirmApprovalWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !selectedQuoteForWorkflow) return;

    setIsProcessing(true);
    try {
      // Step 1: Approve quotation status to Closed/Approved
      await apiFetch(`/api/quotations/approve/${selectedQuoteForWorkflow.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          approval_remarks: remarksText
        })
      });

      // Step 2: Auto-generate Purchase Order (inserts L1/L2 pending entries)
      const poData = await apiFetch('/api/po', {
        method: 'POST',
        body: JSON.stringify({
          quotation_id: selectedQuoteForWorkflow.id,
          approval_remarks: remarksText
        })
      });

      alert('Workflow initiated successfully! Taking you to the approval dashboard.');
      setSelectedQuoteForWorkflow(null);
      
      // Navigate to Screen 8 Approval page
      onNavigate('approval-workflow', { poId: poData.po.id });
    } catch (err: any) {
      alert(err.message || 'Failed to initiate approval workflow.');
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
                - Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link active" onClick={(e) => e.preventDefault()}>
                - Quotations
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
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginBottom: '0.75rem' }} onClick={() => onNavigate('dashboard')}>
              ← Back to Dashboard
            </button>
            
            {/* Screen 7 Title */}
            <h1 className="page-title">Quotation Comparison</h1>
            <p className="page-subtitle">
              RFQ: {rfqTitle} - {quotes.length} quotations received
            </p>
          </div>
        </div>

        <section>
          {isLoading ? (
            <p>Loading quotation matrix...</p>
          ) : quotes.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              No quotations received for this RFQ yet.
            </div>
          ) : (
            <div>
              {/* Matrix Layout Side-by-Side comparison table matching Screen 7 */}
              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table className="modern-table" style={{ borderCollapse: 'separate', borderSpacing: '4px 0' }}>
                  <thead>
                    <tr>
                      <th style={{ background: 'hsla(224, 25%, 10%, 0.8)', border: 'none', padding: '1.25rem' }}>Criteria</th>
                      
                      {quotes.map(q => {
                        const isLowest = q.id === lowestQuoteId;
                        const isFastest = q.id === fastestQuoteId;
                        return (
                          <th key={q.id} style={{
                            textAlign: 'center',
                            background: isLowest ? 'var(--success-bg)' : isFastest ? 'rgba(58, 123, 213, 0.08)' : 'hsla(224, 25%, 12%, 0.8)',
                            color: isLowest ? 'var(--success)' : isFastest ? 'var(--secondary)' : 'var(--text-primary)',
                            border: isLowest ? '2px solid var(--success)' : isFastest ? '1.5px solid var(--secondary)' : '1px solid var(--border-color)',
                            borderBottom: 'none',
                            padding: '1rem',
                            minWidth: '220px'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{q.company_name || q.vendor_name}</div>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                              {isLowest && <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>Lowest Price</span>}
                              {isFastest && <span className="badge badge-open" style={{ fontSize: '0.65rem' }}>Fastest Delivery</span>}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row 1: Grand Total */}
                    <tr>
                      <td style={{ fontWeight: 'bold', border: 'none', background: 'rgba(255,255,255,0.01)' }}>Grand Total</td>
                      {quotes.map(q => {
                        const isLowest = q.id === lowestQuoteId;
                        return (
                          <td key={q.id} style={{
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            background: isLowest ? 'var(--success-bg)' : 'transparent',
                            border: isLowest ? '2px solid var(--success)' : '1px solid var(--border-color)',
                            borderTop: 'none', borderBottom: 'none'
                          }}>
                            ${parseFloat(q.pricing_details).toLocaleString('en-US')}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 2: GST % */}
                    <tr>
                      <td style={{ fontWeight: 'bold', border: 'none', background: 'rgba(255,255,255,0.01)' }}>GST %</td>
                      {quotes.map(q => {
                        const isLowest = q.id === lowestQuoteId;
                        return (
                          <td key={q.id} style={{
                            textAlign: 'center',
                            background: isLowest ? 'var(--success-bg)' : 'transparent',
                            border: isLowest ? '2px solid var(--success)' : '1px solid var(--border-color)',
                            borderTop: 'none', borderBottom: 'none'
                          }}>
                            {q.tax_gst_percent || '18'}%
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 3: Delivery (days) */}
                    <tr>
                      <td style={{ fontWeight: 'bold', border: 'none', background: 'rgba(255,255,255,0.01)' }}>Delivery (days)</td>
                      {quotes.map(q => {
                        const isLowest = q.id === lowestQuoteId;
                        return (
                          <td key={q.id} style={{
                            textAlign: 'center',
                            background: isLowest ? 'var(--success-bg)' : 'transparent',
                            border: isLowest ? '2px solid var(--success)' : '1px solid var(--border-color)',
                            borderTop: 'none', borderBottom: 'none'
                          }}>
                            {q.delivery_timeline.replace(/[^0-9]/g, '') || '10'}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 4: Vendor rating */}
                    <tr>
                      <td style={{ fontWeight: 'bold', border: 'none', background: 'rgba(255,255,255,0.01)' }}>Vendor rating</td>
                      {quotes.map(q => {
                        const isLowest = q.id === lowestQuoteId;
                        return (
                          <td key={q.id} style={{
                            textAlign: 'center',
                            fontWeight: 600,
                            color: '#ffd700',
                            background: isLowest ? 'var(--success-bg)' : 'transparent',
                            border: isLowest ? '2px solid var(--success)' : '1px solid var(--border-color)',
                            borderTop: 'none', borderBottom: 'none'
                          }}>
                            {q.vendor_rating ? parseFloat(q.vendor_rating).toFixed(1) : '4.5'}/5
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 5: Payment terms */}
                    <tr>
                      <td style={{ fontWeight: 'bold', border: 'none', background: 'rgba(255,255,255,0.01)' }}>Payment terms</td>
                      {quotes.map(q => {
                        const isLowest = q.id === lowestQuoteId;
                        return (
                          <td key={q.id} style={{
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            background: isLowest ? 'var(--success-bg)' : 'transparent',
                            border: isLowest ? '2px solid var(--success)' : '1px solid var(--border-color)',
                            borderTop: 'none', borderBottom: 'none'
                          }}>
                            {q.notes?.replace('Payment terms: ', '') || '30 days'}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 6: Actions (Select button) */}
                    <tr>
                      <td style={{ border: 'none', background: 'rgba(255,255,255,0.01)' }} />
                      {quotes.map(q => {
                        const isLowest = q.id === lowestQuoteId;
                        return (
                          <td key={q.id} style={{
                            textAlign: 'center',
                            padding: '1.25rem 1rem',
                            background: isLowest ? 'var(--success-bg)' : 'transparent',
                            border: isLowest ? '2px solid var(--success)' : '1px solid var(--border-color)',
                            borderTop: 'none'
                          }}>
                            {q.status === 'Approved' ? (
                              <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.85rem' }}>✓ Selected & Approved</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  className={`btn ${isLowest ? 'btn-success' : 'btn-primary'}`}
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: '100%' }}
                                  onClick={() => handleSelectQuote(q)}
                                  disabled={isProcessing}
                                >
                                  Select Vendor
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: '100%' }}
                                  onClick={() => (window as any).showToast?.('success', `${q.company_name || q.vendor_name} successfully shortlisted!`)}
                                  disabled={isProcessing}
                                >
                                  Shortlist
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--success-bg)', border: '1px solid var(--success)', display: 'inline-block' }}></span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Green = lowest price, selecting vendor initiates the approval workflow.
                </span>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Workflow Remarks Modal popup */}
      {selectedQuoteForWorkflow && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => setSelectedQuoteForWorkflow(null)}>✕</button>
            <h2 className="section-title">Initiate Approval Workflow</h2>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Selected Supplier</span>
              <p style={{ fontWeight: 600 }}>{selectedQuoteForWorkflow.company_name || selectedQuoteForWorkflow.vendor_name}</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)', marginTop: '0.25rem' }}>
                Bid value: ${parseFloat(selectedQuoteForWorkflow.pricing_details).toLocaleString('en-US')}
              </p>
            </div>

            <form onSubmit={handleConfirmApprovalWorkflow}>
              <div className="form-group">
                <label className="form-label">Approval Comments / Conditions</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Enter comments or remarks for the approval chain..."
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  style={{ resize: 'none' }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isProcessing}>
                Confirm Selection & Send to L1 Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
