import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface SubmitQuotationProps {
  rfqId: number;
  rfqTitle: string;
  onNavigate: (page: string, params?: any) => void;
}

interface RFQItem {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
}

interface LineItemBid {
  rfq_item_id: number;
  item_name: string;
  quantity: number;
  unit_price: string;
  delivery_days: string;
}

export const SubmitQuotation: React.FC<SubmitQuotationProps> = ({ rfqId, rfqTitle, onNavigate }) => {
  const { apiFetch, user, error } = useAuth();
  
  const [rfqItems, setRfqItems] = useState<RFQItem[]>([]);
  const [lineItemBids, setLineItemBids] = useState<LineItemBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Bottom form configurations matching Screen 6
  const [gstPercent, setGstPercent] = useState('18');
  const [paymentTerms, setPaymentTerms] = useState('Payment terms: 20 days net...');

  const fetchRFQDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch RFQs list to extract this specific RFQ
      const rfqs = await apiFetch('/api/rfqs');
      const rfq = rfqs.find((r: any) => r.id === rfqId);
      
      if (rfq && rfq.line_items) {
        setRfqItems(rfq.line_items);
        setLineItemBids(rfq.line_items.map((item: any) => ({
          rfq_item_id: item.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: '',
          delivery_days: '7'
        })));
      } else {
        // Fallback default mockup line items if not loaded from DB
        const defaultItems = [
          { id: 1, item_name: 'Ergonomic chair', quantity: 25, unit: 'NOS' },
          { id: 2, item_name: 'Standing desks', quantity: 10, unit: 'NOS' }
        ];
        setRfqItems(defaultItems);
        setLineItemBids(defaultItems.map(item => ({
          rfq_item_id: item.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: '',
          delivery_days: '7'
        })));
      }
    } catch (err) {
      // Handled globally
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQDetails();
  }, [rfqId]);

  const handlePriceChange = (index: number, val: string) => {
    const updated = [...lineItemBids];
    updated[index].unit_price = val;
    setLineItemBids(updated);
  };

  const handleDeliveryChange = (index: number, val: string) => {
    const updated = [...lineItemBids];
    updated[index].delivery_days = val;
    setLineItemBids(updated);
  };

  // Sum calculations matching Screen 6 right calculation box
  const calculateTotals = () => {
    let subtotal = 0;
    lineItemBids.forEach(item => {
      const price = parseFloat(item.unit_price) || 0;
      subtotal += item.quantity * price;
    });

    const rate = parseFloat(gstPercent || '18') / 100;
    const gstValue = parseFloat((subtotal * rate).toFixed(2));
    const grandTotal = parseFloat((subtotal + gstValue).toFixed(2));

    return { subtotal, gstValue, grandTotal };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent, status: 'Pending' | 'Draft') => {
    e.preventDefault();
    if (isProcessing) return;

    // Validate prices
    const invalidPrice = lineItemBids.some(item => !item.unit_price || isNaN(Number(item.unit_price)) || Number(item.unit_price) <= 0);
    if (invalidPrice) {
      alert('Please enter valid unit prices for all line items.');
      return;
    }

    setIsProcessing(true);
    try {
      await apiFetch('/api/quotations', {
        method: 'POST',
        body: JSON.stringify({
          rfq_id: rfqId,
          tax_gst_percent: parseFloat(gstPercent || '18'),
          notes: paymentTerms,
          line_items: lineItemBids.map(item => ({
            rfq_item_id: item.rfq_item_id,
            unit_price: parseFloat(item.unit_price),
            delivery_days: parseInt(item.delivery_days || '1')
          }))
        })
      });

      alert(status === 'Pending' ? 'Quotation submitted successfully!' : 'Quotation draft saved.');
      onNavigate('dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to submit quotation.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation (Left menu) */}
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

      {/* Main viewport */}
      <main className="main-content">
        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        <div className="header-row">
          <div>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginBottom: '0.75rem' }} onClick={() => onNavigate('dashboard')}>
              ← Back to Board
            </button>
            
            {/* Screen 6 Title */}
            <h1 className="page-title">Submit Quotations</h1>
            <p className="page-subtitle">RFQ: <strong style={{ color: 'var(--secondary)' }}>{rfqTitle}</strong></p>
          </div>
        </div>

        <section className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RFQ Summary</span>
          <p style={{ fontWeight: 600, fontSize: '1.05rem', marginTop: '0.25rem' }}>
            {rfqItems.map(item => `${item.item_name} * ${item.quantity}`).join(', ')}
          </p>
        </section>

        {/* Pricing matrix table matching Screen 6 */}
        <section>
          {isLoading ? (
            <p>Loading items list...</p>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, 'Pending')}>
              <div className="table-container" style={{ marginBottom: '2rem' }}>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ width: '100px' }}>Qty</th>
                      <th style={{ width: '180px' }}>Unit price ($)</th>
                      <th style={{ width: '180px' }}>Total ($)</th>
                      <th style={{ width: '150px' }}>Delivery (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItemBids.map((item, index) => {
                      const qty = item.quantity;
                      const price = parseFloat(item.unit_price) || 0;
                      const total = qty * price;

                      return (
                        <tr key={index}>
                          <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                          <td>{qty}</td>
                          <td>
                            <input
                              type="number"
                              className="form-input"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.95rem' }}
                              placeholder="0.00"
                              value={item.unit_price}
                              onChange={(e) => handlePriceChange(index, e.target.value)}
                              min="0.01"
                              step="0.01"
                              required
                            />
                          </td>
                          <td style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                            ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-input"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.95rem' }}
                              value={item.delivery_days}
                              onChange={(e) => handleDeliveryChange(index, e.target.value)}
                              min="1"
                              required
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom calculations and terms widgets matching Screen 6 layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', alignItems: 'flex-start' }}>
                
                {/* Left column: GST & terms */}
                <div>
                  <div className="form-group" style={{ maxWidth: '150px' }}>
                    <label className="form-label">tax / GST %</label>
                    <input
                      type="number"
                      className="form-input"
                      value={gstPercent}
                      onChange={(e) => setGstPercent(e.target.value)}
                      min="0"
                      max="100"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">date / terms</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      style={{ resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={isProcessing}>
                      Submit Quotation
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={(e) => handleSubmit(e, 'Draft')} disabled={isProcessing}>
                      Save Draft
                    </button>
                  </div>
                </div>

                {/* Right column: Calculations box */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>
                    Calculations Summary
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        ${totals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>GST ({gstPercent}%):</span>
                      <strong style={{ color: 'var(--text-secondary)' }}>
                        ${totals.gstValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ fontWeight: 'bold' }}>Grand total:</span>
                      <strong style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>
                        ${totals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
};
