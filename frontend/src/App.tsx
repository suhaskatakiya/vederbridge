import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Compare } from './pages/Compare';
import { PurchaseOrder } from './pages/PurchaseOrder';
import { VendorManager } from './pages/VendorManager';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { ActivityLog } from './pages/ActivityLog';
import { SubmitQuotation } from './pages/SubmitQuotation';
import { ApprovalWorkflow } from './pages/ApprovalWorkflow';
import { UserManager } from './pages/UserManager';
import { UserProfile } from './pages/UserProfile';
import { UserSettings } from './pages/UserSettings';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Custom router state
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [pageParams, setPageParams] = useState<any>({});
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'dark');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Global Toast Dispatcher & Theme Setter
  useEffect(() => {
    (window as any).showToast = (type: 'success' | 'error', message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3500);
    };
    (window as any).setAppTheme = (newTheme: string) => {
      setTheme(newTheme);
    };
  }, []);

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid var(--border-color)',
          borderTop: '4px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <p style={{ fontWeight: 500, letterSpacing: '0.5px' }}>Loading VendorBridge ERP...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not logged in, force to login/register
  if (!user) {
    if (currentPage === 'register') {
      return (
        <>
          <Register onNavigate={handleNavigate} />
          <ToastContainer toasts={toasts} />
        </>
      );
    }
    return (
      <>
        <Login onNavigate={handleNavigate} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  // Helper for layout with navbar wrapping
  const renderPageWithLayout = (component: React.ReactNode) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
        <Navbar onNavigate={handleNavigate} toggleTheme={toggleTheme} theme={theme} />
        <div style={{ flex: 1, display: 'block', width: '100%' }}>
          {component}
        </div>
      </div>
    );
  };

  // Route Protection Guard based on User Role
  const role = user?.role || '';
  let isAllowed = true;

  if (currentPage === 'users' && role !== 'Admin') isAllowed = false;
  if (currentPage === 'vendors' && role !== 'Admin') isAllowed = false;
  if (currentPage === 'analytics' && role === 'Vendor') isAllowed = false;
  if (currentPage === 'audit' && role === 'Vendor') isAllowed = false;
  if (currentPage === 'compare' && role !== 'Procurement Officer' && role !== 'Admin') isAllowed = false;
  if (currentPage === 'submit-quotation' && role !== 'Vendor') isAllowed = false;
  if (currentPage === 'approval-workflow' && role !== 'Manager' && role !== 'Admin' && role !== 'Procurement Officer') isAllowed = false;

  if (!isAllowed) {
    // Redirect unauthorized navigation attempts to the default dashboard
    setTimeout(() => {
      setCurrentPage('dashboard');
    }, 0);
    return null;
  }

  // Routing Switchboard
  let pageContent: React.ReactNode;
  switch (currentPage) {
    case 'dashboard':
      pageContent = <Dashboard onNavigate={handleNavigate} />;
      break;
    case 'vendors':
      pageContent = <VendorManager onNavigate={handleNavigate} />;
      break;
    case 'analytics':
      pageContent = <ReportsAnalytics onNavigate={handleNavigate} />;
      break;
    case 'audit':
      pageContent = <ActivityLog onNavigate={handleNavigate} />;
      break;
    case 'users':
      pageContent = <UserManager onNavigate={handleNavigate} />;
      break;
    case 'profile':
      pageContent = <UserProfile onNavigate={handleNavigate} />;
      break;
    case 'settings':
      pageContent = <UserSettings onNavigate={handleNavigate} />;
      break;
    case 'compare':
      pageContent = (
        <Compare
          rfqId={pageParams.rfqId}
          rfqTitle={pageParams.rfqTitle}
          onNavigate={handleNavigate}
        />
      );
      break;
    case 'po':
      pageContent = (
        <PurchaseOrder
          poId={pageParams.poId}
          onNavigate={handleNavigate}
        />
      );
      break;
    case 'submit-quotation':
      pageContent = (
        <SubmitQuotation
          rfqId={pageParams.rfqId}
          rfqTitle={pageParams.rfqTitle}
          onNavigate={handleNavigate}
        />
      );
      break;
    case 'approval-workflow':
      pageContent = (
        <ApprovalWorkflow
          poId={pageParams.poId}
          onNavigate={handleNavigate}
        />
      );
      break;
    default:
      pageContent = <Dashboard onNavigate={handleNavigate} />;
  }

  return (
    <>
      {renderPageWithLayout(pageContent)}
      <ToastContainer toasts={toasts} />
    </>
  );
};

// Reusable Top Navbar
const Navbar: React.FC<{
  onNavigate: (page: string, params?: any) => void;
  toggleTheme: () => void;
  theme: string;
}> = ({ onNavigate, toggleTheme, theme }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New RFQ Invitation received' },
    { id: 2, text: 'Quotation submitted for office furniture Q2' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="navbar no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: 'white',
          fontSize: '0.95rem'
        }}>VB</div>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>VendorBridge ERP</span>
      </div>
      
      <div className="navbar-actions">
        <button 
          className="bell-btn" 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        
        <div style={{ position: 'relative' }}>
          <button 
            className="bell-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notification Center"
          >
            🔔
            {notifications.length > 0 && <span className="bell-badge" />}
          </button>
          {showNotifications && (
            <div className="glass-panel" style={{
              position: 'absolute',
              right: 0,
              top: '40px',
              width: '260px',
              zIndex: 1000,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              <h4 style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem',
                margin: 0
              }}>Notifications</h4>
              {notifications.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>No new notifications.</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{
                    fontSize: '0.75rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.35rem',
                    color: 'var(--text-primary)'
                  }}>
                    {n.text}
                  </div>
                ))
              )}
              {notifications.length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.3rem', fontSize: '0.75rem' }} 
                  onClick={() => setNotifications([])}
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>
        
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} 
          onClick={() => onNavigate('profile')}
          title="User Profile"
        >
          <div className="user-avatar" style={{ width: '30px', height: '30px', border: '1px solid var(--primary)', fontSize: '0.85rem' }}>
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }} className="no-print">{user?.name}</span>
        </div>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} 
          onClick={() => { logout(); onNavigate('login'); }}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

// Reusable Toast Notification Container
const ToastContainer: React.FC<{ toasts: Toast[] }> = ({ toasts }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
