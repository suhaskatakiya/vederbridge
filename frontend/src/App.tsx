import React, { useState } from 'react';
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

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Custom router state
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [pageParams, setPageParams] = useState<any>({});

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
        <p style={{ fontWeight: 500, letterSpacing: '0.5px' }}>Loading VendorBridge...</p>
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
      return <Register onNavigate={handleNavigate} />;
    }
    return <Login onNavigate={handleNavigate} />;
  }

  // Routing for Logged in users
  switch (currentPage) {
    case 'dashboard':
      return <Dashboard onNavigate={handleNavigate} />;
    case 'vendors':
      return <VendorManager onNavigate={handleNavigate} />;
    case 'analytics':
      return <ReportsAnalytics onNavigate={handleNavigate} />;
    case 'audit':
      return <ActivityLog onNavigate={handleNavigate} />;
    case 'compare':
      return (
        <Compare
          rfqId={pageParams.rfqId}
          rfqTitle={pageParams.rfqTitle}
          onNavigate={handleNavigate}
        />
      );
    case 'po':
      return (
        <PurchaseOrder
          poId={pageParams.poId}
          onNavigate={handleNavigate}
        />
      );
    case 'submit-quotation':
      return (
        <SubmitQuotation
          rfqId={pageParams.rfqId}
          rfqTitle={pageParams.rfqTitle}
          onNavigate={handleNavigate}
        />
      );
    case 'approval-workflow':
      return (
        <ApprovalWorkflow
          poId={pageParams.poId}
          onNavigate={handleNavigate}
        />
      );
    default:
      return <Dashboard onNavigate={handleNavigate} />;
  }
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
