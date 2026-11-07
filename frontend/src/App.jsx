import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SupervisorPortal from './pages/SupervisorPortal';
import MaintenancePortal from './pages/MaintenancePortal';
import MechanicPortal from './pages/MechanicPortal';
import ManagementReports from './pages/ManagementReports';
import AdminMasterData from './pages/AdminMasterData';
import { RotateCcw } from 'lucide-react';

export default function App() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('supervisor');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.roles) {
      if (user.roles.includes('ADMIN')) {
        // Admin default
        setActiveTab('supervisor');
      } else if (user.roles.includes('SUPERVISOR')) {
        setActiveTab('supervisor');
      } else if (user.roles.includes('MAINTENANCE_INCHARGE')) {
        setActiveTab('incharge');
      } else if (user.roles.includes('MECHANIC')) {
        setActiveTab('mechanic');
      } else {
        setActiveTab('reports');
      }
    }
  }, [user]);

  const handleTabChange = (newTab) => {
    if (user?.roles?.includes('ADMIN')) {
      setActiveTab(newTab);
    } else if (user?.roles?.includes('SUPERVISOR')) {
      if (['supervisor', 'reports'].includes(newTab)) setActiveTab(newTab);
    } else if (user?.roles?.includes('MECHANIC')) {
      if (['mechanic'].includes(newTab)) setActiveTab(newTab);
    } else if (user?.roles?.includes('MAINTENANCE_INCHARGE')) {
      if (['incharge', 'supervisor', 'reports'].includes(newTab)) setActiveTab(newTab);
    }
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07351b] flex items-center justify-center text-emerald-100">
        <RotateCcw className="w-8 h-8 animate-spin text-[#1ea751] mr-3" />
        <span className="font-medium text-sm">Connecting to AMAC MBMS Factory Server...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#f4f7f6] text-slate-900 flex flex-col font-sans">
      {/* Top Header Navbar with Theme Styling */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onToggleMobileSidebar={() => setMobileMenuOpen(prev => !prev)}
      />

      {/* Main Container with Fixed Sidebar + Scrollable Main Content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f4f7f6] min-h-0">
          {activeTab === 'supervisor' && <SupervisorPortal />}
          {activeTab === 'incharge' && <MaintenancePortal />}
          {activeTab === 'mechanic' && <MechanicPortal />}
          {activeTab === 'reports' && <ManagementReports />}
          {activeTab === 'masters' && <AdminMasterData />}
        </main>
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white py-2.5 px-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono">
        <div>
          <span className="font-bold text-emerald-800">AMAC MBMS</span> • Asiaan Metals & Aluminium Casting Pvt Ltd — Unit 5 (U5)
        </div>
        <div className="text-slate-400 mt-1 sm:mt-0">
          Machine Breakdown & Maintenance Management System
        </div>
      </footer>
    </div>
  );
}
