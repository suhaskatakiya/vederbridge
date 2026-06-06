import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface ReportsAnalyticsProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ onNavigate }) => {
  const { user, error, clearError } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('May 2025');

  const handleExport = () => {
    // Export mock CSV report
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Spend', '₹12.4L'],
      ['Active Vendors', '28'],
      ['PO Fulfillment', '94%'],
      ['Overdue Invoices', '3'],
      ['Category: IT Hardware', '₹4.8L'],
      ['Category: Furniture', '₹3.2L'],
      ['Category: Stationery', '₹2.1L'],
      ['Category: Logistics', '₹2.3L'],
      ['Top Vendor: TechCore Ltd', '₹4,20,000 (6 POs)'],
      ['Top Vendor: Infra Supplies', '₹3,10,000 (4 POs)'],
      ['Top Vendor: FastLog', '₹1,90,000 (3 POs)']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Procurement_Insights_Report_${selectedMonth.replace(' ', '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation matching Screen 11 */}
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
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('vendors'); }}>
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
              <a href="#" className="nav-link active" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>
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
          <div className="user-badge" style={{ marginTop: 'auto' }}>
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

        <div className="header-row" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Reports & analytics</h1>
            <p className="page-subtitle">Procurement Insights- may 2025</p>
          </div>

          {/* Month picker dropdown and Export button matching Screen 11 */}
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <select 
              className="form-input" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: '130px', padding: '0.4rem', fontSize: '0.85rem', background: 'var(--bg-surface-solid)' }}
            >
              <option value="May 2025">May 2025</option>
              <option value="April 2025">April 2025</option>
              <option value="March 2025">March 2025</option>
            </select>
            <button className="btn btn-secondary" onClick={handleExport} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              Export
            </button>
          </div>
        </div>

        {/* 4 Mockup Statistics Cards matching Screen 11 */}
        <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="glass-panel stat-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>12.4 L</div>
            <span className="stat-label" style={{ fontSize: '0.85rem' }}>total spend</span>
          </div>
          <div className="glass-panel stat-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)' }}>28</div>
            <span className="stat-label" style={{ fontSize: '0.85rem' }}>Active vendors</span>
          </div>
          <div className="glass-panel stat-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--secondary)' }}>94%</div>
            <span className="stat-label" style={{ fontSize: '0.85rem' }}>PO Fulfillment</span>
          </div>
          <div className="glass-panel stat-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--danger)' }}>3</div>
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>overdue invoices</span>
          </div>
        </section>

        {/* Two columns: Category spend on left, top vendors & trend on right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          
          {/* Left: Spend by Category */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 className="section-title" style={{ fontSize: '1.05rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.5rem', letterSpacing: '0.5px' }}>
              SPEND BY CATEGORY
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Category 1: IT Hardware */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.925rem' }}>
                  <span style={{ fontWeight: 600 }}>IT Hardware</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹4.8L</strong>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '75%', height: '100%', background: '#3498db' }} />
                </div>
              </div>

              {/* Category 2: Furniture */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.925rem' }}>
                  <span style={{ fontWeight: 600 }}>Furniture</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹3.2L</strong>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '50%', height: '100%', background: '#2ed573' }} />
                </div>
              </div>

              {/* Category 3: Stationery */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.925rem' }}>
                  <span style={{ fontWeight: 600 }}>Stationery</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹2.1L</strong>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '32%', height: '100%', background: '#ffc107' }} />
                </div>
              </div>

              {/* Category 4: Logistics */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.925rem' }}>
                  <span style={{ fontWeight: 600 }}>Logistics</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹2.3L</strong>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '38%', height: '100%', background: '#ff4757' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Top Vendors and Monthly Trend Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Top Vendors by Spend Table */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 className="section-title" style={{ fontSize: '1.05rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.5px' }}>
                TOP VENDORS BY SPEND
              </h3>

              <table className="modern-table" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th style={{ textAlign: 'right' }}>Spend (₹)</th>
                    <th style={{ textAlign: 'center', width: '80px' }}>POs</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>TechCore Ltd</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>4,20,000</td>
                    <td style={{ textAlign: 'center' }}>6</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Infra Supplies</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>3,10,000</td>
                    <td style={{ textAlign: 'center' }}>4</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>FastLog</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>1,90,000</td>
                    <td style={{ textAlign: 'center' }}>3</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Monthly Trend bar chart matching Screen 11 */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <h3 className="section-title" style={{ fontSize: '1.05rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.25rem', letterSpacing: '0.5px' }}>
                MONTHLY TREND
              </h3>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', height: '110px', paddingBottom: '0.5rem', borderBottom: '1.5px solid var(--border-color)', margin: '0.5rem 0' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: '35%', background: '#3498db', borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Dec</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: '50%', background: '#3498db', borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Jan</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: '65%', background: '#3498db', borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Feb</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: '75%', background: '#3498db', borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Mar</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: '60%', background: '#3498db', borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Apr</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: '95%', background: '#2c3e50', border: '1.5px solid var(--secondary)', borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '0.4rem' }}>May</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};
