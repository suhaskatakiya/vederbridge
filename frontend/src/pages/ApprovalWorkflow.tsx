import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface ApprovalWorkflowProps {
  poId: number;
  onNavigate: (page: string, params?: any) => void;
}

interface PODetails {
  po_id: number;
  po_number: string;
  tax_calculation: string;
  total_calculation: string;
  po_status: string;
  approval_remarks: string | null;
  approval_date: string;
  l1_status: 'Pending' | 'Approved' | 'Rejected';
  l1_approver: string;
  l1_date: string | null;
  l1_remarks: string | null;
  l2_status: 'Pending' | 'Approved' | 'Rejected';
  l2_approver: string;
  l2_date: string | null;
  l2_remarks: string | null;
  po_date: string;
  quotation_id: number;
  subtotal: string;
  delivery_timeline: string;
  vendor_name: string;
  vendor_email: string;
  buyer_name: string | null;
  buyer_email: string | null;
  vendor_notes: string | null;
  rfq_title: string;
  rfq_quantity: number;
  vendor_rating?: string;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({ poId, onNavigate }) => {
  const { apiFetch, user, error, clearError } = useAuth();
  
  const [po, setPo] = useState<PODetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remarksText, setRemarksText] = useState('');

  const fetchPODetails = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch(`/api/po/${poId}`);
      setPo(data);
    } catch (err) {
      // Handled globally
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPODetails();
  }, [poId]);

  const handleApprove = async () => {
    if (!po || isProcessing) return;
    setIsProcessing(true);
    try {
      // Choose which stage to approve based on current PO approval state
      if (po.l1_status === 'Pending') {
        await apiFetch(`/api/po/${po.po_id}/l1-approve`, {
          method: 'PUT',
          body: JSON.stringify({ remarks: remarksText || 'L1 Approved.' })
        });
        alert('Procurement Head L1 approval recorded successfully!');
      } else if (po.l2_status === 'Pending') {
        await apiFetch(`/api/po/${po.po_id}/l2-approve`, {
          method: 'PUT',
          body: JSON.stringify({ remarks: remarksText || 'L2 Approved.' })
        });
        alert('Finance Manager L2 approval Recorded. Purchase Order generated successfully!');
      }
      setRemarksText('');
      fetchPODetails();
    } catch (err: any) {
      alert(err.message || 'Failed to approve.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!po || isProcessing) return;
    setIsProcessing(true);
    try {
      const stage = po.l1_status === 'Pending' ? 'l1' : 'l2';
      await apiFetch(`/api/po/${po.po_id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ remarks: remarksText || 'Rejected.', stage })
      });
      alert(`Purchase Order rejected at ${stage.toUpperCase()} stage.`);
      setRemarksText('');
      fetchPODetails();
    } catch (err: any) {
      alert(err.message || 'Failed to reject.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine current active stepper step matching Screen 8:
  // Step 1: Submitted (when PO is created)
  // Step 2: L1 Review (L1 status is Pending)
  // Step 3: L2 Approval (L1 status is Approved and L2 status is Pending)
  // Step 4: Generate PO (both L1 & L2 are Approved)
  const getActiveStep = () => {
    if (!po) return 1;
    if (po.l1_status === 'Approved' && po.l2_status === 'Approved') return 4;
    if (po.l1_status === 'Approved') return 3; // L2 approval active
    return 2; // L1 review active
  };

  const activeStep = getActiveStep();

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
                - Approvals
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

      {/* Main Workspace viewport */}
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
            <h1 className="page-title">Approval Workflow</h1>
            
            {po && (
              <p className="page-subtitle">
                RFQ: {po.rfq_title} - Vendor: {po.vendor_name} - ${parseFloat(po.total_calculation).toLocaleString('en-US')}
              </p>
            )}
          </div>
        </div>

        {!isLoading && po ? (
          <div>
            {/* Stepper indicators matching Mockup 5 Screen 8 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: activeStep >= 1 ? 'var(--primary)' : 'var(--bg-surface-solid)',
                  color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>1</span>
                <span style={{ fontSize: '0.75rem', color: activeStep >= 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>Submitted</span>
              </div>
              <div style={{ width: '80px', height: '2px', background: activeStep >= 2 ? 'var(--primary)' : 'var(--border-color)', transform: 'translateY(-8px)' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: activeStep >= 2 ? 'var(--primary)' : 'var(--bg-surface-solid)',
                  color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>2</span>
                <span style={{ fontSize: '0.75rem', color: activeStep >= 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}>L1 Review</span>
              </div>
              <div style={{ width: '80px', height: '2px', background: activeStep >= 3 ? 'var(--primary)' : 'var(--border-color)', transform: 'translateY(-8px)' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: activeStep >= 3 ? 'var(--secondary)' : 'var(--bg-surface-solid)',
                  color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>3</span>
                <span style={{ fontSize: '0.75rem', color: activeStep === 3 ? 'var(--secondary)' : activeStep > 3 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: activeStep === 3 ? 'bold' : 'normal' }}>L2 approval</span>
              </div>
              <div style={{ width: '80px', height: '2px', background: activeStep >= 4 ? 'var(--primary)' : 'var(--border-color)', transform: 'translateY(-8px)' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: activeStep >= 4 ? 'var(--success)' : 'var(--bg-surface-solid)',
                  color: activeStep >= 4 ? 'var(--bg-main)' : 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>4</span>
                <span style={{ fontSize: '0.75rem', color: activeStep >= 4 ? 'var(--success)' : 'var(--text-muted)' }}>Generate PO</span>
              </div>
            </div>

            {/* Grid structure matching Mockup 5 Screen 8 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }}>
              
              {/* Left Column: Approval Chain details & remarks */}
              <div>
                <h3 className="section-title">Approval Chain</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                  {/* Step L1: Rahul Mehta */}
                  <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', borderLeft: `4px solid ${po.l1_status === 'Approved' ? 'var(--success)' : po.l1_status === 'Rejected' ? 'var(--danger)' : 'var(--warning)'}` }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: po.l1_status === 'Approved' ? 'var(--success-bg)' : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${po.l1_status === 'Approved' ? 'var(--success)' : 'var(--border-color)'}`,
                      color: po.l1_status === 'Approved' ? 'var(--success)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                    }}>
                      {po.l1_status === 'Approved' ? '✓' : '●'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{po.l1_approver}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {po.l1_status === 'Approved' ? `Approved on ${po.l1_date ? new Date(po.l1_date).toLocaleDateString() : 'may 20'}` : po.l1_status === 'Rejected' ? `Rejected: ${po.l1_remarks}` : 'Awaiting review'}
                      </p>
                    </div>
                  </div>

                  {/* Step L2: Priya Shah */}
                  <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', borderLeft: `4px solid ${po.l2_status === 'Approved' ? 'var(--success)' : po.l2_status === 'Rejected' ? 'var(--danger)' : 'var(--warning)'}` }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: po.l2_status === 'Approved' ? 'var(--success-bg)' : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${po.l2_status === 'Approved' ? 'var(--success)' : 'var(--border-color)'}`,
                      color: po.l2_status === 'Approved' ? 'var(--success)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                    }}>
                      {po.l2_status === 'Approved' ? '✓' : '●'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{po.l2_approver}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {po.l2_status === 'Approved' ? `Approved on ${po.l2_date ? new Date(po.l2_date).toLocaleDateString() : 'may 21'}` : po.l2_status === 'Rejected' ? `Rejected: ${po.l2_remarks}` : po.l1_status === 'Approved' ? 'Awaiting, Assigned may 21' : 'Awaiting L1 completion'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Approval Remarks textarea */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Approval Remarks</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Add your comments or conditions...."
                    value={remarksText}
                    onChange={(e) => setRemarksText(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>

              {/* Right Column: Quotations Summary and Action Buttons */}
              <div>
                <h3 className="section-title">Quotations Summary</h3>
                
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Vendor:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{po.vendor_name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total:</span>
                      <strong style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>
                        ${parseFloat(po.total_calculation).toLocaleString('en-US')}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Delivery:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{po.delivery_timeline}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Rating:</span>
                      <strong style={{ color: '#ffd700' }}>★ {po.vendor_rating || '4.5'}/5</strong>
                    </div>
                  </div>
                </div>

                {/* Approve / Reject Buttons (disabled if PO is fully approved) */}
                {activeStep < 4 ? (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '0.85rem' }} onClick={handleApprove} disabled={isProcessing}>
                      Approve
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '0.85rem', background: 'var(--danger-bg)', borderColor: 'hsla(355, 85%, 55%, 0.3)', color: 'var(--danger)' }} onClick={handleReject} disabled={isProcessing}>
                      Reject
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                      <span>✓ Approval Workflow complete. Purchase Order issued!</span>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onNavigate('po', { poId: po.po_id })}>
                      View Purchase Order Invoice →
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : isLoading ? (
          <p>Loading PO details...</p>
        ) : (
          <p>Purchase Order details not found.</p>
        )}
      </main>
    </div>
  );
};
