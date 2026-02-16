import React from 'react';
import { useHospital } from '../context/HospitalContext';
import { LogOut, Activity, User, Briefcase, FileText, Menu, X, Cloud, Check, Loader2, AlertCircle, RefreshCw, BarChart3, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { SurgeonCode } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUserRole, setCurrentUserRole, saveStatus, refreshData, isLoading, patients } = useHospital();
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
      case 'ANALYTICS': return 'Analytics Hub';
      default: return '';
    }
  };

  const getRoleIcon = () => {
    switch (currentUserRole) {
      case 'FRONT_OFFICE': return <User className="w-6 h-6" />;
      case 'DOCTOR': return <Activity className="w-6 h-6" />;
      case 'PACKAGE_TEAM': return <Briefcase className="w-6 h-6" />;
      case 'ANALYTICS': return <BarChart3 className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const CloudStatus = () => {
    if (saveStatus === 'saving') return <span className="flex items-center gap-1 text-blue-400 text-xs animate-pulse"><Loader2 className="w-3 h-3 animate-spin"/> Syncing...</span>;
    if (saveStatus === 'saved') return <span className="flex items-center gap-1 text-green-400 text-xs"><Check className="w-3 h-3"/> Saved</span>;
    if (saveStatus === 'error') return <span onClick={() => refreshData()} className="flex items-center gap-1 text-red-400 text-xs cursor-pointer"><AlertCircle className="w-3 h-3"/> Failed (Retry)</span>;
    return <span className="flex items-center gap-1 text-gray-500 text-xs"><Cloud className="w-3 h-3"/> Offline</span>;
  };

  // Logic for Pending Work Notification Card (Package Team only)
  const pendingWork = React.useMemo(() => {
    if (currentUserRole !== 'PACKAGE_TEAM') return [];
    const today = new Date().toISOString().split('T')[0];
    return patients.filter(p => {
      if (p.doctorAssessment?.quickCode !== SurgeonCode.S1) return false;
      const outcome = p.packageProposal?.outcome;
      
      // Case 1: Pending Lead (No outcome yet)
      if (!outcome) return true;
      
      // Case 2: Scheduled or Follow-up that is Today or Past
      const movedDate = outcome === 'Scheduled' ? (p.surgery_date || p.packageProposal?.surgeryDate) : 
                        outcome === 'Follow-Up' ? (p.followup_date || p.packageProposal?.followUpDate) : null;
      
      if (movedDate && movedDate <= today) return true;
      
      return false;
    }).sort((a, b) => {
        const aOutcome = a.packageProposal?.outcome;
        const bOutcome = b.packageProposal?.outcome;
        if (!aOutcome && bOutcome) return -1;
        if (aOutcome && !bOutcome) return 1;
        return 0;
    });
  }, [patients, currentUserRole]);

  const LOGO_URL_DARK = "https://placehold.co/400x120/0f172a/ffffff?text=HiMAS"; 
  const LOGO_URL_LIGHT = "https://placehold.co/400x120/ffffff/0284c7?text=HiMAS"; 

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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes verticalScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-vertical-scroll {
          animation: verticalScroll 25s linear infinite;
        }
        .animate-vertical-scroll:hover {
          animation-play-state: paused;
        }
      `}} />

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
        md:relative md:translate-x-0 overflow-y-auto scrollbar-hide
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 pb-24">
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
            
            {/* Notification Card for Package Team */}
            {currentUserRole === 'PACKAGE_TEAM' && pendingWork.length > 0 && (
              <div className="mt-8 animate-in slide-in-from-left-4 duration-500">
                <div className="px-2 mb-3 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                     <AlertTriangle className="w-3 h-3 text-amber-500" /> Pending Work
                   </span>
                   <span className="text-[9px] font-black bg-rose-600 px-1.5 py-0.5 rounded text-white">{pendingWork.length}</span>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                  <div className="h-48 overflow-hidden relative group">
                    <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-slate-950/80 to-transparent z-10"></div>
                    <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-slate-950/80 to-transparent z-10"></div>
                    
                    <div className="p-2 space-y-2 animate-vertical-scroll">
                      {/* Duplicate items for seamless loop */}
                      {[...pendingWork, ...pendingWork].map((p, idx) => {
                        const outcome = p.packageProposal?.outcome;
                        const today = new Date().toISOString().split('T')[0];
                        const movedDate = outcome === 'Scheduled' ? (p.surgery_date || p.packageProposal?.surgeryDate) : 
                                          outcome === 'Follow-Up' ? (p.followup_date || p.packageProposal?.followUpDate) : null;
                        const isUrgent = movedDate && movedDate <= today;
                        
                        return (
                          <div key={idx} className={`p-3 rounded-xl border transition-all ${!outcome ? 'bg-indigo-950/30 border-indigo-900/40' : 'bg-rose-950/30 border-rose-900/50'}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-black text-slate-200 truncate pr-2 uppercase">{p.name}</span>
                              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${!outcome ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white animate-pulse'}`}>
                                {!outcome ? 'Leads' : outcome === 'Scheduled' ? 'Scheduled' : 'Follow-up'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[8px] font-bold text-slate-500">
                               {outcome === 'Scheduled' ? <Calendar className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                               <span>{movedDate ? movedDate.split('-').reverse().join('-') : 'No Date Set'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <p className="text-[8px] font-bold text-slate-600 text-center mt-3 uppercase tracking-tighter italic">Auto-refreshing daily tasks...</p>
              </div>
            )}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm">
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