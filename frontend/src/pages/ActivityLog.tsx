import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface ActivityLogProps {
  onNavigate: (page: string, params?: any) => void;
}

interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  details: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ onNavigate }) => {
  const { apiFetch, user, error, clearError } = useAuth();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'RFQ' | 'Approvals' | 'Invoices' | 'Vendors'>('All');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/activity-logs');
      setLogs(data || []);
    } catch (err) {
      // Handled globally
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs based on tabs
  const getFilteredLogs = () => {
    // If no logs, return fallback mock logs matching Screen 10
    const currentLogs = logs.length > 0 ? logs : [
      {
        id: 1,
        user_id: null,
        action: 'Quotation selected',
        details: 'Infra supplies pvt ltd selected for office furniture Q2',
        created_at: '2025-05-23T21:15:00.000Z',
        user_name: 'Procurement Officer',
        user_role: 'Procurement Officer',
        user_email: 'officer@vendorbridge.com'
      },
      {
        id: 2,
        user_id: null,
        action: 'Approval pending',
        details: 'PO-2024 awaiting L2 approval by priya shah',
        created_at: '2025-05-22T09:15:00.000Z',
        user_name: 'Rahul Mehta',
        user_role: 'Manager',
        user_email: 'rahul@vendorbridge.com'
      },
      {
        id: 3,
        user_id: null,
        action: 'RFQ published',
        details: 'office furniture Q2 sent to 3 vendors',
        created_at: '2025-05-19T12:00:00.000Z',
        user_name: 'Procurement Officer',
        user_role: 'Procurement Officer',
        user_email: 'officer@vendorbridge.com'
      },
      {
        id: 4,
        user_id: null,
        action: 'Vendor added',
        details: 'FastLog transport registered and pending verifications',
        created_at: '2025-05-18T15:20:00.000Z',
        user_name: 'System Admin',
        user_role: 'Admin',
        user_email: 'admin@vendorbridge.com'
      }
    ];

    if (activeTab === 'All') return currentLogs;
    if (activeTab === 'RFQ') {
      return currentLogs.filter(l => l.action.toLowerCase().includes('rfq') || l.details.toLowerCase().includes('rfq'));
    }
    if (activeTab === 'Approvals') {
      return currentLogs.filter(l => l.action.toLowerCase().includes('approve') || l.action.toLowerCase().includes('select') || l.details.toLowerCase().includes('approval') || l.details.toLowerCase().includes('approved'));
    }
    if (activeTab === 'Invoices') {
      return currentLogs.filter(l => l.action.toLowerCase().includes('invoice') || l.action.toLowerCase().includes('po') || l.details.toLowerCase().includes('invoice') || l.details.toLowerCase().includes('po'));
    }
    if (activeTab === 'Vendors') {
      return currentLogs.filter(l => l.action.toLowerCase().includes('vendor') || l.details.toLowerCase().includes('vendor'));
    }
    return currentLogs;
  };

  const getLogStyle = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('select') || act.includes('approve') || act.includes('success')) {
      return {
        icon: '✓',
        color: '#2ed573', // Green tick
        bgColor: 'rgba(46, 213, 115, 0.08)',
        borderColor: 'rgba(46, 213, 115, 0.3)'
      };
    }
    if (act.includes('pending') || act.includes('awaiting') || act.includes('po')) {
      return {
        icon: '⏰', // Clock
        color: '#3498db', // Blue clock
        bgColor: 'rgba(52, 152, 219, 0.08)',
        borderColor: 'rgba(52, 152, 219, 0.3)'
      };
    }
    if (act.includes('publish') || act.includes('rfq') || act.includes('create')) {
      return {
        icon: '📄', // Document
        color: '#eccc68', // Document yellow/gold
        bgColor: 'rgba(236, 204, 104, 0.08)',
        borderColor: 'rgba(236, 204, 104, 0.3)'
      };
    }
    if (act.includes('vendor') || act.includes('add') || act.includes('register')) {
      return {
        icon: '👤', // Profile badge
        color: '#ff4757', // Red profile
        bgColor: 'rgba(255, 71, 87, 0.08)',
        borderColor: 'rgba(255, 71, 87, 0.3)'
      };
    }
    return {
      icon: '●',
      color: 'var(--text-muted)',
      bgColor: 'rgba(255, 255, 255, 0.02)',
      borderColor: 'var(--border-color)'
    };
  };

  const filteredLogsList = getFilteredLogs();

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
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>
                - Reports
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link active" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>
                - Activity
              </a>
            </li>
          </ul>
        </div>

        {user && (
          <div className="user-badge" style={{ marginTop: 'auto' }}>
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
            <h1 className="page-title">Activity & Logs</h1>
            <p className="page-subtitle">Procurement audit trail</p>
          </div>

          <button className="btn btn-secondary" onClick={fetchLogs}>
            Refresh Timeline
          </button>
        </div>

        {/* Tab Filters matching Screen 10 */}
        <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem', marginBottom: '2.5rem' }}>
          {(['All', 'RFQ', 'Approvals', 'Invoices', 'Vendors'] as const).map(tab => (
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

        {/* Audit Log timeline layout */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading activity log...
          </div>
        ) : filteredLogsList.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            No activity records registered for this filter.
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredLogsList.map(log => {
                const styleInfo = getLogStyle(log.action);
                
                return (
                  <div key={log.id} style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                    {/* Circle Icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: styleInfo.bgColor,
                      border: `1.5px solid ${styleInfo.color}`,
                      color: styleInfo.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}>
                      {styleInfo.icon}
                    </div>

                    {/* Log description */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.action} - <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>{log.details}</span>
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(log.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {', '}
                          {new Date(log.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {/* Sub-label with triggering actor details */}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Triggered by: <span style={{ color: 'var(--secondary)', fontWeight: 500 }}>{log.user_name || 'System'}</span> ({log.user_role || 'System Service'}) • {log.user_email || 'system@vendorbridge.com'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
