import React, { useState, useMemo } from 'react';
import { useHospital } from '../context/HospitalContext';
import { Patient, SurgeonCode, Condition } from '../types';
import { 
  Users, Banknote, Download, Target, RefreshCw, Layers, Search, 
  Globe, MousePointer2, PieChart, UserPlus, ArrowUpRight, CheckCircle,
  X, Phone, Calendar, Tag, Briefcase, Zap, Landmark, BarChart3, TrendingUp, TrendingDown, CalendarDays
} from 'lucide-react';

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '---';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatMonth = (dateString: string | undefined | null): string => {
  if (!dateString) return '---';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const ONLINE_SOURCES = ['Google', 'Facebook', 'Instagram', 'WhatsApp', 'YouTube', 'Website', 'Friends / Online'];
const OFFLINE_SOURCES = ['Hospital Billboards', 'Doctor Recommended', 'Old Patient / Relatives', 'Other'];

export const AnalyticsDashboard: React.FC = () => {
  const { patients, appointments } = useHospital();
  
  // Single period date states
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [appliedRange, setAppliedRange] = useState<{ from: string, to: string }>({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Comparison specific states
  const [graphGranularity, setGraphGranularity] = useState<'daily' | 'monthly'>('daily');
  const [showComparison, setShowComparison] = useState(false);
  const [compFromDate, setCompFromDate] = useState('');
  const [compToDate, setCompToDate] = useState('');
  const [appliedCompRange, setAppliedCompRange] = useState<{ from: string, to: string } | null>(null);

  // Drill down state
  const [drillDown, setDrillDown] = useState<{ label: string, data: Patient[] } | null>(null);

  const filterByRange = (dateStr: string | undefined, range: { from: string, to: string }) => {
    if (!dateStr) return false;
    const dateOnly = dateStr.split('T')[0];
    return dateOnly >= range.from && dateOnly <= range.to;
  };

  const handleApplyFilter = () => {
    setAppliedRange({ from: fromDate, to: toDate });
  };

  const handleApplyCompRange = () => {
    if (compFromDate && compToDate) {
      setAppliedCompRange({ from: compFromDate, to: compToDate });
    }
  };

  // Calculate stats for the selected range
  const stats = useMemo(() => {
    const processSet = (dataset: Patient[]) => {
        const arrivedPatients = dataset.filter(p => {
          const status = (p.status || '').trim().toLowerCase();
          return status !== 'scheduled';
        });

        const validDataset = arrivedPatients.filter(p => {
          const vt = (p.visit_type || '').trim().toLowerCase();
          return vt === 'new' || vt === 'revisit';
        });

        const completedPatients = validDataset.filter(p => p.packageProposal?.outcome === 'Completed');
        const revenue = completedPatients.reduce((sum, p) => {
          const amt = parseInt(p.packageProposal?.packageAmount?.replace(/,/g, '') || '0', 10);
          return sum + amt;
        }, 0);

        const conversions = completedPatients.length;
        const leads = validDataset.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1).length;
        const newPatients = arrivedPatients.filter(p => (p.visit_type || '').trim().toLowerCase() === 'new').length;
        const revisits = arrivedPatients.filter(p => (p.visit_type || '').trim().toLowerCase() === 'revisit').length;
        const assessed = validDataset.filter(p => !!p.doctorAssessment).length;

        const sourcesMap: Record<string, { total: number, completed: number, revenue: number, new: number, revisit: number }> = {};
        let onlineTotal = 0;
        let offlineTotal = 0;

        validDataset.forEach(p => {
          let s = p.source || 'Other';
          if (s.startsWith('Other: ')) s = 'Other';
          
          const isNew = (p.visit_type || '').trim().toLowerCase() === 'new';
          
          if (ONLINE_SOURCES.includes(s)) {
            if (isNew) onlineTotal++; // Count only new patients for digital flow totals
          } else {
            if (isNew) offlineTotal++; // Count only new patients for traditional flow totals
          }

          if (!sourcesMap[s]) sourcesMap[s] = { total: 0, completed: 0, revenue: 0, new: 0, revisit: 0 };
          
          const vt = (p.visit_type || '').trim().toLowerCase();
          sourcesMap[s].total++;
          if (vt === 'revisit') sourcesMap[s].revisit++;
          else sourcesMap[s].new++;

          if (p.packageProposal?.outcome === 'Completed') {
            sourcesMap[s].completed++;
            sourcesMap[s].revenue += parseInt(p.packageProposal.packageAmount?.replace(/,/g, '') || '0', 10);
          }
        });

        return {
            total: validDataset.length,
            revenue,
            conversions,
            leads,
            newPatients,
            revisits,
            assessed,
            onlineTotal,
            offlineTotal,
            sources: sourcesMap,
            dataset: validDataset,
            conversionRate: leads > 0 ? ((conversions / leads) * 100).toFixed(1) : '0'
        };
    };

    const primaryPatients = patients.filter(p => filterByRange(p.entry_date || p.registeredAt, appliedRange));
    const primaryStats = processSet(primaryPatients);
    
    let compStats = null;
    if (showComparison && appliedCompRange) {
        const compPatients = patients.filter(p => filterByRange(p.entry_date || p.registeredAt, appliedCompRange));
        compStats = processSet(compPatients);
    }

    const scheduledCount = appointments.filter(a => filterByRange(a.date, appliedRange)).length;

    return {
      ...primaryStats,
      scheduledCount,
      comparison: compStats
    };
  }, [patients, appointments, appliedRange, showComparison, appliedCompRange]);

  const sourceStats = useMemo(() => {
    return Object.entries(stats.sources).map(([name, data]) => {
      const sData = data as { total: number, completed: number, revenue: number, new: number, revisit: number };
      return {
        name,
        ...sData,
        conversionRate: sData.total > 0 ? ((sData.completed / sData.total) * 100).toFixed(1) : '0'
      };
    }).sort((a, b) => b.total - a.total);
  }, [stats.sources]);

  const handleExportDaily = () => {
    const dateSet = new Set(stats.dataset.map(p => (p.entry_date || p.registeredAt.split('T')[0]) as string));
    const dates = Array.from(dateSet).sort((a: string, b: string) => b.localeCompare(a));
    const headers = ['Date', 'Arrivals', 'New Patients', 'Revisit Patients', 'Leads', 'Scheduled Surgery', 'Conversions', 'Opportunity'];
    const rows = dates.map((date: string) => {
      const dayPatients = stats.dataset.filter(p => (p.entry_date || p.registeredAt.split('T')[0]) === date);
      const rev = dayPatients.reduce((sum, p) => sum + parseInt(p.packageProposal?.packageAmount?.replace(/,/g, '') || '0', 10), 0);
      return [
        formatDate(date).replace(/,/g, ''),
        dayPatients.length,
        dayPatients.filter(p => (p.visit_type || '').toLowerCase() === 'new').length,
        dayPatients.filter(p => (p.visit_type || '').toLowerCase() === 'revisit').length,
        dayPatients.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1).length,
        dayPatients.filter(p => p.packageProposal?.outcome === 'Scheduled').length,
        dayPatients.filter(p => p.packageProposal?.outcome === 'Completed').length,
        rev
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `daily_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKpiClick = (label: string) => {
    let filteredData: Patient[] = [];
    switch (label) {
      case 'Online Traffic':
        filteredData = stats.dataset.filter(p => 
            ONLINE_SOURCES.includes(p.source.startsWith('Other: ') ? 'Other' : p.source) && 
            (p.visit_type || '').toLowerCase() === 'new'
        );
        break;
      case 'Offline Traffic':
        filteredData = stats.dataset.filter(p => 
            !ONLINE_SOURCES.includes(p.source.startsWith('Other: ') ? 'Other' : p.source) && 
            (p.visit_type || '').toLowerCase() === 'new'
        );
        break;
      case 'Scheduled Appts':
        filteredData = appointments
          .filter(a => filterByRange(a.date, appliedRange))
          .map(a => ({
            id: a.id,
            name: a.name,
            mobile: a.mobile,
            condition: a.condition,
            entry_date: a.date,
            source: a.source,
            visit_type: a.visit_type || 'New',
            gender: 'Other',
            age: 0,
            registeredAt: a.createdAt,
            hasInsurance: 'No',
            occupation: '',
            visitType: 'OPD'
          } as Patient));
        break;
      case 'OPD Flow':
        filteredData = stats.dataset;
        break;
      case 'New Patients':
        filteredData = stats.dataset.filter(p => (p.visit_type || '').trim().toLowerCase() === 'new');
        break;
      case 'Revisit Count':
        filteredData = stats.dataset.filter(p => (p.visit_type || '').trim().toLowerCase() === 'revisit');
        break;
      case 'Surg Recommended':
        filteredData = stats.dataset.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1);
        break;
      case 'Surg Completed':
      case 'Total Revenue':
        filteredData = stats.dataset.filter(p => p.packageProposal?.outcome === 'Completed');
        break;
      default:
        filteredData = stats.dataset;
    }
    setDrillDown({ label, data: filteredData });
  };

  // Fix: Ensure calculateGrowth always returns a string to satisfy parseInt and JSX expectations
  const calculateGrowth = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? '100' : '0';
      return ((current - previous) / previous * 100).toFixed(0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div className="shrink-0">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Analytics Hub</h2>
          <p className="text-slate-500 text-sm font-bold tracking-widest uppercase mt-1 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-hospital-500" /> Real-Time Hospital Intelligence (All Sources)
          </p>
        </div>
        
        {/* Date Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-3xl border shadow-sm w-full xl:w-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">From</span>
              <input 
                type="date" 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)}
                className="pl-12 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-hospital-500 w-full sm:w-36"
              />
            </div>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">To</span>
              <input 
                type="date" 
                value={toDate} 
                onChange={e => setToDate(e.target.value)}
                className="pl-10 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-hospital-500 w-full sm:w-36"
              />
            </div>
          </div>
          <button 
            onClick={handleApplyFilter}
            className="w-full sm:w-auto px-6 py-2.5 bg-hospital-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-hospital-100 hover:bg-hospital-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-3.5 h-3.5" /> Apply Filter
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {[
          { label: 'Scheduled Appts', val: stats.scheduledCount, icon: Calendar, color: 'slate', detail: 'Pending Arrivals' },
          { label: 'OPD Flow', val: stats.total, icon: Users, color: 'indigo', detail: `${stats.newPatients} New • ${stats.revisits} Revisit` },
          { label: 'Surg Recommended', val: stats.leads, icon: Target, color: 'indigo', detail: 'S1 Assessments' },
          { label: 'Surg Completed', val: stats.conversions, icon: CheckCircle, color: 'emerald', detail: `${stats.conversionRate}% Conversion Rate` },
          { label: 'Total Revenue', val: `₹${stats.revenue.toLocaleString()}`, icon: Banknote, color: 'amber', detail: 'From Completed Surgeries' }
        ].map((card, idx) => (
          <div 
            key={idx} 
            onClick={() => handleKpiClick(card.label)}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer active:scale-95"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-${card.color}-50 text-${card.color}-600 group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300" />
            </div>
            <div className="text-3xl font-black text-slate-900 leading-none mb-2">{card.val}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</div>
            <div className={`mt-4 pt-4 border-t border-slate-50 text-[9px] font-bold text-${card.color}-600 uppercase`}>
              {card.detail}
            </div>
          </div>
        ))}
      </div>

      {/* Drill Down Modal */}
      {drillDown && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
            <header className="p-8 border-b flex justify-between items-center bg-slate-50/50 shrink-0">
               <div>
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{drillDown.label}</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed Patient breakdown ({drillDown.data.length} Records)</p>
               </div>
               <button 
                 onClick={() => setDrillDown(null)}
                 className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:shadow-md transition-all active:scale-90"
               >
                 <X className="w-6 h-6" />
               </button>
            </header>
            
            <div className="flex-1 overflow-auto p-4 sm:p-8">
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {drillDown.data.map((p, idx) => (
                   <div key={p.id + idx} className="bg-slate-50/50 border border-slate-100 p-6 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all group">
                     <div className="flex justify-between items-start mb-4">
                       <div>
                         <div className="text-sm font-black text-slate-900">{p.name}</div>
                         <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{p.id.split('_V')[0]}</div>
                       </div>
                       <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${
                         (p.visit_type || '').toLowerCase() === 'new' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'
                       }`}>
                         {p.visit_type || 'OPD'}
                       </span>
                     </div>
                     
                     <div className="space-y-3">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-white rounded-xl text-slate-400"><Tag className="w-3.5 h-3.5" /></div>
                         <span className="text-[10px] font-black uppercase text-slate-600">{p.condition}</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-white rounded-xl text-slate-400"><Phone className="w-3.5 h-3.5" /></div>
                         <span className="text-[10px] font-black text-slate-600 font-mono">{p.mobile}</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-white rounded-xl text-slate-400"><Calendar className="w-3.5 h-3.5" /></div>
                         <span className="text-[10px] font-black uppercase text-slate-600">{formatDate(p.entry_date)}</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-white rounded-xl text-slate-400"><Globe className="w-3.5 h-3.5" /></div>
                         <span className="text-[10px] font-black uppercase text-slate-600 truncate max-w-[150px]">{p.source}</span>
                       </div>
                     </div>

                     <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em]">Affordability</span>
                          <span className="text-[9px] font-black text-slate-500 uppercase">{p.doctorAssessment?.affordability || '---'}</span>
                        </div>
                        {p.packageProposal?.packageAmount && (
                          <div className="text-right">
                             <span className="text-[7px] font-black text-emerald-300 uppercase tracking-[0.2em]">Amount</span>
                             <div className="text-xs font-black text-emerald-600">₹{p.packageProposal.packageAmount}</div>
                          </div>
                        )}
                     </div>
                   </div>
                 ))}
                 {drillDown.data.length === 0 && (
                   <div className="col-span-full py-20 text-center space-y-4">
                     <Briefcase className="w-16 h-16 text-slate-100 mx-auto" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No records found for this metric</p>
                   </div>
                 )}
               </div>
            </div>
            <footer className="p-6 border-t bg-slate-50/30 flex justify-end shrink-0">
               <button 
                 onClick={() => setDrillDown(null)}
                 className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl active:scale-95 transition-all"
               >
                 Close Report
               </button>
            </footer>
          </div>
        </div>
      )}

      {/* Digital vs Traditional Section (Enhanced with Comparison) */}
      <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
           <div>
             <h3 className="text-2xl font-black text-slate-900 uppercase">Digital vs Traditional Flow</h3>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Source Category Comparison (Online vs Offline) - New Patients Only</p>
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                 <button 
                   onClick={() => setGraphGranularity('daily')}
                   className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${graphGranularity === 'daily' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                 >Daily</button>
                 <button 
                   onClick={() => setGraphGranularity('monthly')}
                   className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${graphGranularity === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                 >Monthly</button>
              </div>
              
              <button 
                onClick={() => setShowComparison(!showComparison)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border transition-all ${showComparison ? 'bg-indigo-600 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${showComparison ? 'animate-spin' : ''}`} />
                {showComparison ? 'Disable Comparison' : 'Compare Period'}
              </button>
           </div>
        </div>

        {showComparison && (
          <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 flex flex-col md:flex-row items-center gap-4 animate-in slide-in-from-top-4">
            <div className="flex-1 flex items-center gap-4 w-full">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-indigo-400 uppercase">Comp. From</span>
                  <input type="date" value={compFromDate} onChange={e => setCompFromDate(e.target.value)} className="w-full pl-16 pr-3 py-2.5 bg-white border border-indigo-100 rounded-xl text-xs font-bold outline-none" />
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-indigo-400 uppercase">Comp. To</span>
                  <input type="date" value={compToDate} onChange={e => setCompToDate(e.target.value)} className="w-full pl-14 pr-3 py-2.5 bg-white border border-indigo-100 rounded-xl text-xs font-bold outline-none" />
                </div>
            </div>
            <button onClick={handleApplyCompRange} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100">Set Comparison</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4 space-y-6">
              <div 
                onClick={() => handleKpiClick('Online Traffic')}
                className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Digital Share (New)</span>
                     <div className="text-2xl font-black text-indigo-600">
                       {stats.newPatients > 0 ? ((stats.onlineTotal / stats.newPatients) * 100).toFixed(0) : 0}%
                     </div>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4 mb-1">
                  <div className="text-4xl font-black text-slate-900">{stats.onlineTotal}</div>
                  {showComparison && stats.comparison && (
                    <div className={`flex items-center gap-1 text-xs font-black ${parseInt(calculateGrowth(stats.onlineTotal, stats.comparison.onlineTotal)) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {parseInt(calculateGrowth(stats.onlineTotal, stats.comparison.onlineTotal)) >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                      {calculateGrowth(stats.onlineTotal, stats.comparison.onlineTotal)}%
                    </div>
                  )}
                </div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Online Sources</div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-2">
                  {ONLINE_SOURCES.slice(0, 4).map(s => (
                    <span key={s} className="text-[8px] font-black px-2 py-1 rounded-full bg-slate-50 text-slate-400 uppercase">{s}</span>
                  ))}
                  <span className="text-[8px] font-black px-2 py-1 rounded-full bg-slate-50 text-slate-400 uppercase">+{ONLINE_SOURCES.length - 4} More</span>
                </div>
              </div>

              <div 
                onClick={() => handleKpiClick('Offline Traffic')}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 rounded-2xl bg-slate-50 text-slate-600 group-hover:scale-110 transition-transform">
                    <Landmark className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Traditional Share (New)</span>
                     <div className="text-2xl font-black text-slate-600">
                       {stats.newPatients > 0 ? ((stats.offlineTotal / stats.newPatients) * 100).toFixed(0) : 0}%
                     </div>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4 mb-1">
                  <div className="text-4xl font-black text-slate-900">{stats.offlineTotal}</div>
                  {showComparison && stats.comparison && (
                    <div className={`flex items-center gap-1 text-xs font-black ${parseInt(calculateGrowth(stats.offlineTotal, stats.comparison.offlineTotal)) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {parseInt(calculateGrowth(stats.offlineTotal, stats.comparison.offlineTotal)) >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                      {calculateGrowth(stats.offlineTotal, stats.comparison.offlineTotal)}%
                    </div>
                  )}
                </div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Offline Sources</div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-2">
                  {OFFLINE_SOURCES.map(s => (
                    <span key={s} className="text-[8px] font-black px-2 py-1 rounded-full bg-slate-50 text-slate-400 uppercase">{s}</span>
                  ))}
                </div>
              </div>
           </div>

           <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-8">
                 <div>
                   <h4 className="text-sm font-black text-slate-900 uppercase">{graphGranularity === 'monthly' ? 'Monthly New Flow breakdown' : 'Daily New Flow Comparison'}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attribution for New Patients Only</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                       <span className="text-[9px] font-black uppercase text-slate-500">Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                       <span className="text-[9px] font-black uppercase text-slate-500">Offline</span>
                    </div>
                 </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-end gap-2 min-h-[300px]">
                 {useMemo(() => {
                    const groupKey = graphGranularity === 'monthly' ? (p: Patient) => (p.entry_date || p.registeredAt).substring(0, 7) : (p: Patient) => (p.entry_date || p.registeredAt.split('T')[0]);
                    
                    // Filter dataset to only include new patients for graph calculations
                    const newPatientsOnly = stats.dataset.filter(p => (p.visit_type || '').toLowerCase() === 'new');
                    const uniqueKeys = Array.from(new Set(newPatientsOnly.map(groupKey))).sort((a: any, b: any) => a.localeCompare(b)) as string[];
                    const visibleKeys = uniqueKeys.slice(graphGranularity === 'monthly' ? -12 : -15);
                    
                    return visibleKeys.map((key, i) => {
                      const dayPatients = newPatientsOnly.filter(p => groupKey(p) === key);
                      const onlineVol = dayPatients.filter(p => ONLINE_SOURCES.includes(p.source.startsWith('Other: ') ? 'Other' : p.source)).length;
                      const offlineVol = dayPatients.length - onlineVol;
                      
                      const maxTotal = Math.max(...visibleKeys.map(k => newPatientsOnly.filter(p => groupKey(p) === k).length), 1);
                      
                      return (
                        <div key={i} className="flex items-center gap-4 group">
                          <span className="w-20 text-[8px] font-black text-slate-400 uppercase text-right leading-none">
                            {graphGranularity === 'monthly' ? formatMonth(key) : formatDate(key).split(' ')[0] + ' ' + formatDate(key).split(' ')[1]}
                          </span>
                          <div className="flex-1 h-7 flex items-center bg-slate-50/50 rounded-lg px-2 gap-0.5 overflow-hidden">
                             {onlineVol > 0 && (
                               <div 
                                 className="h-3.5 bg-indigo-600 rounded-full transition-all duration-1000 flex items-center justify-center min-w-[20px] hover:h-4" 
                                 style={{ width: `${(onlineVol / maxTotal) * 100}%` }}
                               >
                                 <span className="text-[7px] text-white font-black">{onlineVol}</span>
                               </div>
                             )}
                             {offlineVol > 0 && (
                               <div 
                                 className="h-3.5 bg-slate-300 rounded-full transition-all duration-1000 flex items-center justify-center min-w-[20px] hover:h-4" 
                                 style={{ width: `${(offlineVol / maxTotal) * 100}%` }}
                               >
                                 <span className="text-[7px] text-slate-600 font-black">{offlineVol}</span>
                               </div>
                             )}
                          </div>
                          <span className="w-10 text-left text-[10px] font-black text-slate-900">{dayPatients.length}</span>
                        </div>
                      );
                    });
                 }, [stats.dataset, graphGranularity])}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-10">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-slate-300" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scale: {graphGranularity === 'monthly' ? 'Annual Overview' : 'Last 15 Records'}</span>
                  </div>
                  {showComparison && appliedCompRange && (
                    <div className="flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-indigo-400" />
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comparing against period start: {formatDate(appliedCompRange.from)}</span>
                    </div>
                  )}
              </div>
           </div>
        </div>
      </div>

      {/* Source Analytics Section */}
      <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase">Source Insights</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Lead Attribution & Performance breakdown</p>
          </div>
          <div className="p-3 bg-hospital-50 rounded-2xl">
            <Globe className="w-6 h-6 text-hospital-600" />
          </div>
        </div>

        {/* Source Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Top Lead Source', val: sourceStats[0]?.name || 'N/A', icon: MousePointer2, color: 'indigo', detail: `${sourceStats[0]?.new || 0} New • ${sourceStats[0]?.revisit || 0} Revisit` },
             { label: 'Total Source Flow', val: stats.total, icon: Users, color: 'blue', detail: `${stats.newPatients} New • ${stats.revisits} Revisit` },
             { label: 'Avg Conv. Rate', val: `${stats.conversionRate}%`, icon: Target, color: 'emerald', detail: 'Source-to-Surgery' },
             { label: 'Top Revenue Source', val: sourceStats.sort((a,b) => b.revenue - a.revenue)[0]?.name || 'N/A', icon: PieChart, color: 'amber', detail: `₹${(sourceStats.sort((a,b) => b.revenue - a.revenue)[0]?.revenue || 0).toLocaleString()}` }
           ].map((card, idx) => (
             <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-xl bg-${card.color}-100 text-${card.color}-700`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xl font-black text-slate-900 mb-1 truncate">{card.val}</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{card.label}</div>
                <div className={`mt-3 pt-3 border-t border-slate-100 text-[8px] font-bold text-${card.color}-600 uppercase`}>
                  {card.detail}
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Source Charts */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-10">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex justify-between">
                <span>Patient Flow (New vs Revisit)</span>
                <span className="flex gap-4">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-hospital-500"></div> New</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-300"></div> Revisit</span>
                </span>
              </h4>
              <div className="space-y-4">
                {sourceStats.slice(0, 10).map((s, idx) => {
                  const max = Math.max(...sourceStats.map(x => x.total), 1);
                  const pNew = (s.new / max * 100).toFixed(0);
                  const pRevisit = (s.revisit / max * 100).toFixed(0);
                  return (
                    <div key={idx} className="group">
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                        <span className="text-slate-600 group-hover:text-hospital-600 transition-colors">{s.name}</span>
                        <span className="text-slate-900">{s.total} <span className="text-slate-300 font-bold">({s.new}N/{s.revisit}R)</span></span>
                      </div>
                      <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex">
                        <div className="h-full bg-hospital-500 transition-all duration-700" style={{ width: `${pNew}%` }}></div>
                        <div className="h-full bg-indigo-300 transition-all duration-700" style={{ width: `${pRevisit}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Surgery Completed & Revenue Contribution</h4>
              <div className="space-y-5">
                {sourceStats.sort((a,b) => b.revenue - a.revenue).slice(0, 5).map((s, idx) => {
                  const maxRev = Math.max(...sourceStats.map(x => x.revenue), 1);
                  const pRev = (s.revenue / maxRev * 100).toFixed(0);
                  return (
                    <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <div className="text-[10px] font-black uppercase text-slate-900">{s.name}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.completed} Surgeries Done</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-600">₹{s.revenue.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pRev}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Data Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm flex flex-col">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/30">
              <h4 className="text-sm font-black text-slate-900 uppercase">Period Activity Report</h4>
              <button onClick={handleExportDaily} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Export CSV">
                <Download className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Arrivals</th>
                    <th className="px-6 py-4 text-teal-600">New</th>
                    <th className="px-6 py-4 text-orange-600">Rev.</th>
                    <th className="px-6 py-4">Leads</th>
                    <th className="px-6 py-4 text-indigo-600">Schd.</th>
                    <th className="px-6 py-4">Conv.</th>
                    <th className="px-6 py-4 text-right">Opp.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Array.from(new Set(stats.dataset.map(p => (p.entry_date || p.registeredAt.split('T')[0]) as string)))
                    .sort((a: string, b: string) => b.localeCompare(a))
                    .slice(0, 10)
                    .map((date: string, i: number) => {
                      const dayPatients = stats.dataset.filter(p => (p.entry_date || p.registeredAt.split('T')[0]) === date);
                      const rev = dayPatients.reduce((sum, p) => sum + parseInt(p.packageProposal?.packageAmount?.replace(/,/g, '') || '0', 10), 0);
                      return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 text-[11px] font-black text-slate-900">{formatDate(date)}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600">{dayPatients.length}</td>
                          <td className="px-6 py-4 text-xs font-bold text-teal-600">{dayPatients.filter(p => (p.visit_type || '').toLowerCase() === 'new').length}</td>
                          <td className="px-6 py-4 text-xs font-bold text-orange-600">{dayPatients.filter(p => (p.visit_type || '').toLowerCase() === 'revisit').length}</td>
                          <td className="px-6 py-4 text-xs font-bold text-indigo-500">{dayPatients.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1).length}</td>
                          <td className="px-6 py-4 text-xs font-bold text-indigo-600">{dayPatients.filter(p => p.packageProposal?.outcome === 'Scheduled').length}</td>
                          <td className="px-6 py-4 text-xs font-bold text-emerald-600">{dayPatients.filter(p => p.packageProposal?.outcome === 'Completed').length}</td>
                          <td className="px-6 py-4 text-right text-xs font-black text-slate-900">₹{rev.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="pb-20">
         <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b bg-slate-50/30">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-lg font-black text-slate-900 uppercase">Condition Distribution</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Patient Volume by complaint</p>
                 </div>
                 <BarChart3 className="w-6 h-6 text-slate-200" />
               </div>
            </div>
            <div className="p-8 space-y-4">
              {Array.from(new Set(stats.dataset.map(p => p.condition))).map((cond, idx) => {
                const count = stats.dataset.filter(p => p.condition === cond).length;
                const pct = ((count / (stats.total || 1)) * 100).toFixed(0);
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="w-24 text-[10px] font-black text-slate-500 uppercase truncate">{cond}</span>
                    <div className="flex-1 h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="w-8 text-right text-xs font-black text-slate-900">{count}</span>
                  </div>
                );
              })}
            </div>
         </div>
      </div>
    </div>
  );
};
