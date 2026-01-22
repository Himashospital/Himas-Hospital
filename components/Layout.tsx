import React from 'react';
import { useHospital } from '../context/HospitalContext';
import { LogOut, Activity, User, Briefcase, FileText, Menu, X, Cloud, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUserRole, setCurrentUserRole, saveStatus, refreshData, isLoading } = useHospital();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setCurrentUserRole(null);
  };

  const getRoleLabel = () => {
    switch (currentUserRole) {
      case 'FRONT_OFFICE': return 'Front Office';
      case 'DOCTOR': return 'Doctor Panel';
      case 'PACKAGE_TEAM': return 'Counseling Packages';
      default: return '';
    }
  };

  const getRoleIcon = () => {
    switch (currentUserRole) {
      case 'FRONT_OFFICE': return <User className="w-6 h-6" />;
      case 'DOCTOR': return <Activity className="w-6 h-6" />;
      case 'PACKAGE_TEAM': return <Briefcase className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const CloudStatus = () => {
    if (saveStatus === 'saving') return <span className="flex items-center gap-1 text-blue-400 text-xs animate-pulse"><Loader2 className="w-3 h-3 animate-spin"/> Syncing...</span>;
    if (saveStatus === 'saved') return <span className="flex items-center gap-1 text-green-400 text-xs"><Check className="w-3 h-3"/> Saved</span>;
    if (saveStatus === 'error') return <span onClick={() => refreshData()} className="flex items-center gap-1 text-red-400 text-xs cursor-pointer"><AlertCircle className="w-3 h-3"/> Failed (Retry)</span>;
    return <span className="flex items-center gap-1 text-gray-500 text-xs"><Cloud className="w-3 h-3"/> Offline</span>;
  };

  const LOGO_URL_DARK = "https://placehold.co/400x120/0f172a/ffffff?text=HiMAS"; 
  const LOGO_URL_LIGHT = "https://placehold.co/400x120/ffffff/0284c7?text=HiMAS"; 

  // Loading Overlay
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <Loader2 className="w-12 h-12 text-hospital-600 animate-spin" />
        <div className="text-hospital-800 font-bold text-lg animate-pulse">Synchronizing Database...</div>
        <div className="text-gray-500 text-sm">Please wait while we fetch the latest patient records.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center shadow-sm z-20">
        <img src={LOGO_URL_LIGHT} alt="Himas Hospital" className="h-8 w-auto"/>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="mb-8 px-2">
            <img src={LOGO_URL_DARK} alt="Himas Hospital" className="h-12 w-auto"/>
            <div className="text-[0.6rem] text-slate-400 mt-1 uppercase tracking-widest font-semibold">21st Century Surgical Hospital</div>
          </div>

          <div className="mb-8">
            <div className="text-xs uppercase text-slate-400 font-semibold tracking-wider mb-2">Current Session</div>
            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
              <div className="text-hospital-400">{getRoleIcon()}</div>
              <div>
                <div className="font-medium text-slate-200">{getRoleLabel()}</div>
                <div className="mt-1"><CloudStatus /></div>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg transition-colors">
              <FileText className="w-5 h-5" /> Dashboard
            </button>
            <button onClick={() => refreshData()} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <RefreshCw className="w-5 h-5" /> Sync Data
            </button>
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-screen relative">
        {saveStatus === 'error' && (
          <div className="bg-red-500 text-white text-xs font-bold text-center py-2 px-4 shadow-md flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            CONNECTION ERROR: Data is not syncing. Check internet and click Sync Data.
          </div>
        )}

        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-0 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
};
