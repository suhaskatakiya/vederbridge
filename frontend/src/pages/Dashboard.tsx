import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

interface RFQItem {
  item_name: string;
  quantity: number;
  unit: string;
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
  attachment_url?: string;
  assigned_category?: string;
  line_items?: RFQItem[];
}

interface RecentPO {
  id: number;
  po_id?: number;
  po_number: string;
  vendor_name: string;
  total_calculation: string;
  status: string;
  l1_status: string;
  l2_status: string;
}

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface ActivityLogItem {
  id: number;
  action: string;
  details: string;
  created_at: string;
  user_name: string | null;
  user_role: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, apiFetch, error, clearError } = useAuth();
  
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [recentPOs, setRecentPOs] = useState<RecentPO[]>([]);
  const [usersList, setUsersList] = useState<UserInfo[]>([]);
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper functions for safe PO status lookups to prevent null/undefined TypeError crashes
  const getPOStatus = (p: any) => p?.status || p?.po_status || 'Draft';
  const getPOL1Status = (p: any) => p?.l1_status || 'Pending';
  const getPOL2Status = (p: any) => p?.l2_status || 'Pending';

  // RFQ Creation Stepper Wizard State (Step 1, 2, 3)
  const [rfqWizardStep, setRfqWizardStep] = useState<1 | 2 | 3>(1);
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);

  // New RFQ form fields
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqCategory, setRfqCategory] = useState('Furniture');
  const [rfqDeadline, setRfqDeadline] = useState('');
  const [rfqDescription, setRfqDescription] = useState('');
  
  // Line items state
  const [rfqLineItems, setRfqLineItems] = useState<RFQItem[]>([
    { item_name: 'Ergonomic chair', quantity: 25, unit: 'NOS' },
    { item_name: 'Standing desks', quantity: 10, unit: 'NOS' }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('NOS');

  // Assigned vendors state
  const [assignedVendors, setAssignedVendors] = useState<string[]>(['Infra Supplies', 'Techcore LTD']);
  const [availableVendorsList, setAvailableVendorsList] = useState<string[]>([]);
  const [selectedVendorToAssign, setSelectedVendorToAssign] = useState('');

  // Simulated drag and drop attachments state
  const [uploadedSpecFileName, setUploadedSpecFileName] = useState('');
  const [rfqFormError, setRfqFormError] = useState('');

  // Fetch all details
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch open RFQs
      const rfqData = await apiFetch('/api/rfqs');
      setRfqs(rfqData || []);

      // Fetch POs
      const poData = await apiFetch('/api/po').catch(() => []);
      setRecentPOs(poData || []);

      // Fetch vendors to populate assignment dropdown & metrics (Admin, Manager, Officer only)
      if (user?.role !== 'Vendor') {
        const vendorData = await apiFetch('/api/vendors').catch(() => []);
        setVendorsList(vendorData || []);
        if (vendorData) {
          setAvailableVendorsList(vendorData.map((v: any) => v.company_name));
        }
      }

      // Fetch activity logs (Admin, Manager, Officer only)
      if (user?.role !== 'Vendor') {
        const logsData = await apiFetch('/api/activity-logs').catch(() => []);
        setActivityLogs(logsData || []);
      }

      // Fetch users (Admin only)
      if (user?.role === 'Admin') {
        const usersData = await apiFetch('/api/users').catch(() => []);
        setUsersList(usersData || []);
      }
    } catch (err) {
      // Handled globally
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddLineItem = () => {
    if (!newItemName || !newItemQty) {
      alert('Line item details required.');
      return;
    }
    setRfqLineItems([
      ...rfqLineItems,
      { item_name: newItemName, quantity: parseInt(newItemQty), unit: newItemUnit }
    ]);
    setNewItemName('');
    setNewItemQty('');
  };

  const handleRemoveLineItem = (index: number) => {
    setRfqLineItems(rfqLineItems.filter((_, i) => i !== index));
  };

  const handleAddVendor = () => {
    if (!selectedVendorToAssign) return;
    if (assignedVendors.includes(selectedVendorToAssign)) {
      alert('Vendor already assigned.');
      return;
    }
    setAssignedVendors([...assignedVendors, selectedVendorToAssign]);
    setSelectedVendorToAssign('');
  };

  const handleRemoveVendor = (vendor: string) => {
    setAssignedVendors(assignedVendors.filter(v => v !== vendor));
  };

  const handlePostRFQ = async (status: 'Open' | 'Closed') => {
    setRfqFormError('');
    if (!rfqTitle || !rfqDeadline) {
      setRfqFormError('RFQ Title and Deadline are required.');
      return;
    }

    try {
      await apiFetch('/api/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          title: rfqTitle,
          product_details: rfqDescription || `Category: ${rfqCategory}`,
          deadline: rfqDeadline,
          assigned_category: rfqCategory,
          attachment_url: uploadedSpecFileName ? `http://localhost:5000/attachments/${uploadedSpecFileName}` : null,
          line_items: rfqLineItems,
          assigned_vendors: assignedVendors,
          status: status
        })
      });

      // Clear & Close
      setRfqTitle('');
      setRfqDeadline('');
      setRfqDescription('');
      setRfqLineItems([
        { item_name: 'Ergonomic chair', quantity: 25, unit: 'NOS' },
        { item_name: 'Standing desks', quantity: 10, unit: 'NOS' }
      ]);
      setUploadedSpecFileName('');
      setIsRfqModalOpen(false);
      setRfqWizardStep(1);
      fetchDashboardData();
      (window as any).showToast?.('success', 'RFQ successfully created & published!');
    } catch (err: any) {
      setRfqFormError(err.message || 'Failed to save RFQ.');
    }
  };

  // --------------------------------------------------------
  // SIDEBAR BUILDERS BASED ON ROLE (SAP / Odoo inspired)
  // --------------------------------------------------------
  const renderSidebarLinks = () => {
    const role = user?.role || 'Guest';

    switch (role) {
      case 'Admin':
        return (
          <ul className="nav-links">
            <li className="nav-item"><a href="#" className="nav-link active" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Dashboard</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('users'); }}>- Users</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('vendors'); }}>- Vendors</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- RFQ's</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Purchase orders</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Invoices</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>- Reports</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>- Activity Logs</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>- Settings</a></li>
          </ul>
        );
      case 'Procurement Officer':
        return (
          <ul className="nav-links">
            <li className="nav-item"><a href="#" className="nav-link active" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Dashboard</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('vendors'); }}>- Vendors</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- RFQ's</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Quotations</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>- Approvals</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Purchase orders</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Invoices</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>- Reports</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>- Activity</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>- Settings</a></li>
          </ul>
        );
      case 'Manager':
        return (
          <ul className="nav-links">
            <li className="nav-item"><a href="#" className="nav-link active" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Dashboard</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>- Approvals</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }}>- Reports</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}>- Activity</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>- Settings</a></li>
          </ul>
        );
      case 'Vendor':
        return (
          <ul className="nav-links">
            <li className="nav-item"><a href="#" className="nav-link active" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Dashboard</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- RFQ's</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>- Purchase Orders</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('profile'); }}>- Profile</a></li>
            <li className="nav-item"><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>- Settings</a></li>
          </ul>
        );
      default:
        return null;
    }
  };

  // --------------------------------------------------------
  // DASHBOARD VIEWPORTS BY ROLE (SaaS inspired layouts)
  // --------------------------------------------------------
  
  // 1. ADMIN DASHBOARD
  const renderAdminDashboard = () => {
    return (
      <div>
        <div className="header-row">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.name} - ERP Administration Control</p>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <section className="stats-grid">
          <div className="glass-panel stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('users')}>
            <span className="stat-label">Total Users</span>
            <div className="stat-value">{isLoading ? '...' : usersList.length}</div>
          </div>
          <div className="glass-panel stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('vendors')}>
            <span className="stat-label">Total Vendors</span>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{isLoading ? '...' : vendorsList.length}</div>
          </div>
          <div className="glass-panel stat-card">
            <span className="stat-label">Active RFQs</span>
            <div className="stat-value">{isLoading ? '...' : rfqs.filter(r => r.status === 'Open').length}</div>
          </div>
          <div className="glass-panel stat-card">
            <span className="stat-label">Total Spend</span>
            <div className="stat-value" style={{ color: 'var(--secondary)' }}>$12.4 L</div>
          </div>
        </section>

        {/* Dynamic Spend categories and Logs feed */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          <div>
            <h3 className="section-title">System Activity Logs</h3>
            <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.slice(0, 5).map((log, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{log.action}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{log.details}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.5px' }}>
              Procurement Category Weights
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span>IT Hardware</span>
                  <strong>₹4.8L</strong>
                </div>
                <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '40%', height: '100%', background: 'var(--primary)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span>Furniture</span>
                  <strong>₹3.2L</strong>
                </div>
                <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '30%', height: '100%', background: 'var(--success)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span>Logistics</span>
                  <strong>₹2.3L</strong>
                </div>
                <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '20%', height: '100%', background: 'var(--secondary)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. PROCUREMENT OFFICER DASHBOARD
  const renderProcurementOfficerDashboard = () => {
    const activeRFQsCount = rfqs.filter(r => r.status === 'Open').length;
    const pendingApprovalsCount = recentPOs.filter(p => {
      const s = getPOStatus(p).toLowerCase();
      return s === 'pending' || s === 'draft';
    }).length;

    return (
      <div>
        <div className="header-row">
          <div>
            <h1 className="page-title">Procurement Officer Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.name} - Sourcing Pipeline</p>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <section className="stats-grid">
          <div className="glass-panel stat-card">
            <span className="stat-label">Active RFQ's</span>
            <div className="stat-value">{isLoading ? '...' : activeRFQsCount}</div>
          </div>
          <div className="glass-panel stat-card">
            <span className="stat-label">Pending Approvals</span>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{isLoading ? '...' : pendingApprovalsCount}</div>
          </div>
          <div className="glass-panel stat-card">
            <span className="stat-label">Open Purchase Orders</span>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {isLoading ? '...' : recentPOs.filter(p => {
                const s = getPOStatus(p);
                return s === 'Sent' || s === 'Received';
              }).length}
            </div>
          </div>
          <div className="glass-panel stat-card">
            <span className="stat-label">Monthly Spend</span>
            <div className="stat-value" style={{ color: 'var(--secondary)' }}>$ 2.3L</div>
          </div>
        </section>

        {/* Quick Actions Row */}
        <section style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
          <button className="btn btn-primary" onClick={() => { setRfqWizardStep(1); setIsRfqModalOpen(true); }}>
            + new RFQ
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('vendors')}>
            Add Vendor
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('analytics')}>
            View Reports
          </button>
        </section>

        {/* Open RFQs List */}
        <section>
          <h2 className="section-title">Open RFQs Matrix</h2>
          {isLoading ? (
            <p>Fetching RFQs...</p>
          ) : rfqs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No open requests.</p>
          ) : (
            <div className="rfq-grid">
              {rfqs.map(rfq => (
                <div key={rfq.id} className="glass-panel rfq-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className={`badge badge-${rfq.status.toLowerCase()}`}>{rfq.status}</span>
                      <span style={{ color: 'var(--secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{rfq.assigned_category}</span>
                    </div>
                    <h3 className="rfq-title">{rfq.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>{rfq.product_details}</p>
                  </div>
                  <div>
                    <div className="rfq-meta" style={{ marginBottom: '1rem' }}>
                      <span>Due: {new Date(rfq.deadline).toLocaleDateString()}</span>
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      style={{ width: '100%' }} 
                      onClick={() => onNavigate('compare', { rfqId: rfq.id, rfqTitle: rfq.title })}
                    >
                      Compare Quotations
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  // 3. MANAGER / APPROVER DASHBOARD
  const renderManagerDashboard = () => {
    const pendingPOs = recentPOs.filter(p => getPOL1Status(p) === 'Pending' || getPOL2Status(p) === 'Pending');
    const approvedCount = recentPOs.filter(p => getPOL1Status(p) === 'Approved' && getPOL2Status(p) === 'Approved').length;
    const rejectedCount = recentPOs.filter(p => getPOL1Status(p) === 'Rejected' || getPOL2Status(p) === 'Rejected').length;

    return (
      <div>
        <div className="header-row">
          <div>
            <h1 className="page-title">Manager Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.name} - Spend approvals pipeline</p>
          </div>
        </div>

        {/* Stats Cards */}
        <section className="stats-grid">
          <div className="glass-panel stat-card">
            <span className="stat-label">Pending Approvals</span>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{isLoading ? '...' : pendingPOs.length}</div>
          </div>
          <div className="glass-panel stat-card">
            <span className="stat-label">Approved POs</span>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{isLoading ? '...' : approvedCount}</div>
          </div>
          <div className="glass-panel stat-card">
            <span className="stat-label">Rejected POs</span>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{isLoading ? '...' : rejectedCount}</div>
          </div>
        </section>

        {/* Timeline / Actionable pending lists */}
        <section style={{ marginTop: '2rem' }}>
          <h2 className="section-title">Awaiting Approval Workflow</h2>
          {isLoading ? (
            <p>Loading approvals...</p>
          ) : pendingPOs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No pending purchase order approvals.</p>
          ) : (
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Vendor</th>
                    <th>Value</th>
                    <th>L1 Stage</th>
                    <th>L2 Stage</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPOs.map(po => (
                    <tr key={po.id || po.po_id}>
                      <td style={{ fontWeight: 600 }}>{po.po_number}</td>
                      <td>{po.vendor_name}</td>
                      <td style={{ fontWeight: 600 }}>${parseFloat(po.total_calculation).toLocaleString()}</td>
                      <td>
                        <span className={`badge badge-${getPOL1Status(po).toLowerCase()}`}>{getPOL1Status(po)}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${getPOL2Status(po).toLowerCase()}`}>{getPOL2Status(po)}</span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => onNavigate('approval-workflow', { poId: po.id || po.po_id })}
                        >
                          Review & Action
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  };

  // 4. VENDOR DASHBOARD
  const renderVendorDashboard = () => {
    // Filter RFQs assigned to this vendor category or matching open criteria
    const openInvitations = rfqs.filter(r => r.status === 'Open');
    
    // Find POs matching this vendor
    const vendorPOs = recentPOs.filter(p => p.vendor_name.toLowerCase().includes(user?.name.toLowerCase() || 'infra'));

    return (
      <div>
        <div className="header-row">
          <div>
            <h1 className="page-title">Supplier Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.name} - Sales & Quotation Hub</p>
          </div>
        </div>

        {/* Vendor Stats */}
        <section className="stats-grid">
          <div className="glass-panel stat-card">
            <span className="stat-label">Open RFQ Invitations</span>
            <div className="stat-value">{isLoading ? '...' : openInvitations.length}</div>
          </div>
          <div className="glass-panel stat-card">
            <span className="stat-label">Purchase Orders Received</span>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{isLoading ? '...' : vendorPOs.length}</div>
          </div>
        </section>

        {/* Actionable Invitations Matrix */}
        <section style={{ marginTop: '2.5rem' }}>
          <h2 className="section-title">Assigned RFQs Matrix</h2>
          {isLoading ? (
            <p>Loading RFQs...</p>
          ) : openInvitations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No open RFQ invitations matching your supplier scope.</p>
          ) : (
            <div className="rfq-grid">
              {openInvitations.map(rfq => (
                <div key={rfq.id} className="glass-panel rfq-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-open">Open Invitation</span>
                      <span style={{ color: 'var(--secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{rfq.assigned_category}</span>
                    </div>
                    <h3 className="rfq-title">{rfq.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>{rfq.product_details}</p>
                  </div>
                  <div>
                    <div className="rfq-meta" style={{ marginBottom: '1rem' }}>
                      <span>Due: {new Date(rfq.deadline).toLocaleDateString()}</span>
                    </div>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }} 
                      onClick={() => onNavigate('submit-quotation', { rfqId: rfq.id, rfqTitle: rfq.title })}
                    >
                      Submit Bid Proposal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderActiveDashboardBody = () => {
    const role = user?.role || 'Guest';
    switch (role) {
      case 'Admin':
        return renderAdminDashboard();
      case 'Procurement Officer':
        return renderProcurementOfficerDashboard();
      case 'Manager':
        return renderManagerDashboard();
      case 'Vendor':
        return renderVendorDashboard();
      default:
        return renderProcurementOfficerDashboard();
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

          {renderSidebarLinks()}
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

        {renderActiveDashboardBody()}
      </main>

      {/* RFQ Stepper Wizard Modal matching Screen 5 */}
      {isRfqModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '850px', width: '100%' }}>
            <button className="modal-close" onClick={() => setIsRfqModalOpen(false)}>✕</button>
            
            <h2 className="page-title" style={{ fontSize: '1.75rem' }}>Create RFQ's</h2>
            <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>new request for quotation</p>

            {/* Stepper Steps Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: rfqWizardStep >= 1 ? 'var(--primary)' : 'var(--bg-surface-solid)',
                  color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>1</span>
                <span style={{ fontSize: '0.85rem', fontWeight: rfqWizardStep === 1 ? 'bold' : 'normal' }}>RFQ Specs</span>
              </div>
              <div style={{ width: '60px', height: '2px', background: rfqWizardStep >= 2 ? 'var(--primary)' : 'var(--border-color)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: rfqWizardStep >= 2 ? 'var(--primary)' : 'var(--bg-surface-solid)',
                  color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>2</span>
                <span style={{ fontSize: '0.85rem', fontWeight: rfqWizardStep === 2 ? 'bold' : 'normal' }}>Line Items & Vendors</span>
              </div>
              <div style={{ width: '60px', height: '2px', background: rfqWizardStep >= 3 ? 'var(--primary)' : 'var(--border-color)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: rfqWizardStep >= 3 ? 'var(--primary)' : 'var(--bg-surface-solid)',
                  color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>3</span>
                <span style={{ fontSize: '0.85rem', fontWeight: rfqWizardStep === 3 ? 'bold' : 'normal' }}>Attachments & Send</span>
              </div>
            </div>

            {rfqFormError && <div className="alert alert-danger" style={{ padding: '0.75rem' }}>{rfqFormError}</div>}

            {/* Stepper view conditional blocks */}
            {rfqWizardStep === 1 && (
              /* Step 1: Specs fields */
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">RFQ's title*</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Office Furniture procurement Q2"
                      value={rfqTitle}
                      onChange={(e) => setRfqTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Furniture"
                      value={rfqCategory}
                      onChange={(e) => setRfqCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Deadline*</label>
                  <input
                    type="date"
                    className="form-input"
                    value={rfqDeadline}
                    onChange={(e) => setRfqDeadline(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="e.g., Ergonomic chairs and standing desks for 3rd floor"
                    value={rfqDescription}
                    onChange={(e) => setRfqDescription(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button className="btn btn-primary" onClick={() => setRfqWizardStep(2)}>
                    Next: Line Items & Vendors →
                  </button>
                </div>
              </div>
            )}

            {rfqWizardStep === 2 && (
              /* Step 2: Line items list & Vendors selection */
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                  
                  {/* Left: Line Items grid */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Line items
                    </h4>
                    
                    <div className="table-container" style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '1rem' }}>
                      <table className="modern-table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>item</th>
                            <th>qty</th>
                            <th>Unit</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rfqLineItems.map((item, index) => (
                            <tr key={index}>
                              <td>{item.item_name}</td>
                              <td>{item.quantity}</td>
                              <td>{item.unit}</td>
                              <td>
                                <button
                                  type="button"
                                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                  onClick={() => handleRemoveLineItem(index)}
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add line item row inline */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Item name"
                        className="form-input"
                        style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        className="form-input"
                        style={{ padding: '0.4rem', fontSize: '0.85rem', width: '80px' }}
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        className="form-input"
                        style={{ padding: '0.4rem', fontSize: '0.85rem', width: '80px' }}
                        value={newItemUnit}
                        onChange={(e) => setNewItemUnit(e.target.value)}
                      />
                      <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleAddLineItem}>
                        + add line item
                      </button>
                    </div>
                  </div>

                  {/* Right: Assign Vendors box */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      ASSIGN VENDORS
                    </h4>

                    <div className="glass-panel" style={{ padding: '1rem', minHeight: '130px', marginBottom: '1rem' }}>
                      {assignedVendors.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No vendors assigned.</p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {assignedVendors.map(v => (
                            <span key={v} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              background: 'var(--bg-surface-solid)', padding: '0.25rem 0.5rem',
                              borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem'
                            }}>
                              {v}
                              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => handleRemoveVendor(v)}>✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        className="form-input"
                        style={{ padding: '0.4rem', fontSize: '0.85rem', background: 'var(--bg-surface-solid)' }}
                        value={selectedVendorToAssign}
                        onChange={(e) => setSelectedVendorToAssign(e.target.value)}
                      >
                        <option value="">Select Vendor...</option>
                        {availableVendorsList.map(vendor => (
                          <option key={vendor} value={vendor}>{vendor}</option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleAddVendor}>
                        + add vendor
                      </button>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => setRfqWizardStep(1)}>
                    ← Back: Specs
                  </button>
                  <button className="btn btn-primary" onClick={() => setRfqWizardStep(3)}>
                    Next: Attachments & Finish →
                  </button>
                </div>
              </div>
            )}

            {rfqWizardStep === 3 && (
              /* Step 3: Attachments box matching mockup drag/drop and Actions */
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                  
                  {/* Left: Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={() => handlePostRFQ('Open')} style={{ padding: '1rem 1.5rem' }}>
                      Save & Send to Vendors
                    </button>
                    <button className="btn btn-secondary" onClick={() => handlePostRFQ('Closed')} style={{ padding: '1rem 1.5rem' }}>
                      Save as Draft
                    </button>
                  </div>

                  {/* Right: Drag & Drop upload specs */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Attachments
                    </h4>

                    {/* Simulated Upload widget */}
                    <div 
                      style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.01)',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files.length > 0) {
                          setUploadedSpecFileName(e.dataTransfer.files[0].name);
                        }
                      }}
                      onClick={() => {
                        const fakeName = prompt('Enter fake spec sheet name to attach:', 'Specs_Sheet_Q2.pdf');
                        if (fakeName) setUploadedSpecFileName(fakeName);
                      }}
                    >
                      <svg width="24" height="24" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" strokeWidth="2" style={{ margin: '0 auto 0.75rem auto' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      
                      {uploadedSpecFileName ? (
                        <p style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                          Attached: {uploadedSpecFileName}
                        </p>
                      ) : (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          Drag & drop files or click to upload
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => setRfqWizardStep(2)}>
                    ← Back: Line Items
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
