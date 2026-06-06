import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface PurchaseOrderProps {
  poId: number;
  onNavigate: (page: string, params?: any) => void;
}

interface PODetails {
  po_id: number;
  po_number: string;
  tax_calculation: string;
  total_calculation: string;
  po_date: string;
  quotation_id: number;
  subtotal: string;
  delivery_timeline: string;
  rfq_id: number;
  rfq_title: string;
  rfq_details: string;
  rfq_quantity: number;
  vendor_name: string;
  vendor_email: string;
  buyer_name: string | null;
  buyer_email: string | null;
}

export const PurchaseOrder: React.FC<PurchaseOrderProps> = ({ poId, onNavigate }) => {
  const { apiFetch, error, clearError } = useAuth();
  
  const [po, setPo] = useState<PODetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPODetails = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch(`/api/po/${poId}`);
      setPo(data);
    } catch (err) {
      // Error handled globally
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPODetails();
  }, [poId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-container" style={{ display: 'block' }}>
      <main className="main-content" style={{ maxWidth: '1000px', margin: '0 auto', height: 'auto', overflowY: 'visible' }}>
        
        {/* Back and Print buttons (hidden during print) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }} className="no-print">
          <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
            ← Back to Dashboard
          </button>
          
          <button className="btn btn-primary" onClick={handlePrint}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Purchase Order
          </button>
        </div>

        {error && (
          <div className="alert alert-danger no-print">
            <span>{error}</span>
            <button onClick={clearError} style={{ background: 'transparent', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading Purchase Order...
          </div>
        ) : !po ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Purchase Order details not found.
          </div>
        ) : (
          <div className="invoice-card">
            
            {/* Invoice Header */}
            <div className="invoice-header">
              <div className="invoice-logo-side">
                <h2>VENDORBRIDGE</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Automated Procurement Network</p>
              </div>
              <div className="invoice-meta-side">
                <h3>PURCHASE ORDER</h3>
                <p style={{ fontWeight: 600 }}>#{po.po_number}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Date: {new Date(po.po_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Parties */}
            <div className="invoice-parties">
              <div className="party-box">
                <h4>Bill To (Buyer)</h4>
                <p style={{ fontWeight: 600 }}>{po.buyer_name || 'VendorBridge LLC'}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{po.buyer_email || 'procurement@vendorbridge.com'}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Corporate Procurement Office</p>
              </div>
              <div className="party-box">
                <h4>Vendor (Supplier)</h4>
                <p style={{ fontWeight: 600 }}>{po.vendor_name}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{po.vendor_email}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Timeline Promise: {po.delivery_timeline}
                </p>
              </div>
            </div>

            {/* Items table */}
            <div className="invoice-items">
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>
                Item Description
              </h4>
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>RFQ Title & Specifications</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Bid Price</th>
                      <th style={{ textAlign: 'right' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div style={{ fontWeight: 600 }}>{po.rfq_title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'pre-line' }}>
                          {po.rfq_details}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>{po.rfq_quantity}</td>
                      <td style={{ textAlign: 'right' }}>
                        ${(parseFloat(po.subtotal) / po.rfq_quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ${parseFloat(po.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */}
            <div className="invoice-totals">
              <div className="totals-row">
                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                <span style={{ fontWeight: 500 }}>
                  ${parseFloat(po.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="totals-row">
                <span style={{ color: 'var(--text-muted)' }}>Tax (10.0%):</span>
                <span style={{ fontWeight: 500 }}>
                  ${parseFloat(po.tax_calculation).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="totals-row final">
                <span>Total Due:</span>
                <span>
                  ${parseFloat(po.total_calculation).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Signatures/Footer */}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '4rem', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>
                <p>Authorized Signature: _________________________</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p>Generated via VendorBridge Automated RFQ Engine</p>
                <p>This is a computer-generated official document.</p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Add CSS style block to hide sidebar and header elements when printing */}
      <style>{`
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .app-container {
            display: block !important;
            min-height: auto !important;
          }
          .main-content {
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-card {
            background: #fff !important;
            color: #000 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          .modern-table th {
            background: #f0f0f0 !important;
            color: #000 !important;
            border-bottom: 2px solid #000 !important;
          }
          .modern-table td {
            color: #000 !important;
            border-bottom: 1px solid #ddd !important;
          }
          .totals-row.final {
            color: #000 !important;
            border-top: 2px solid #000 !important;
          }
        }
      `}</style>
    </div>
  );
};
