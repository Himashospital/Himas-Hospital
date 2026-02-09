
import React, { useState, useMemo } from 'react';
import { useHospital } from '../context/HospitalContext';
import { Patient, SurgeonCode, Condition } from '../types';
import { 
  Users, Banknote, Download, Target, RefreshCw, Layers, Search, 
  Globe, MousePointer2, PieChart, UserPlus, ArrowUpRight, CheckCircle
} from 'lucide-react';

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '---';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const AnalyticsDashboard: React.FC = () => {
  const { patients } = useHospital();
  
  // Single period date states
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [appliedRange, setAppliedRange] = useState<{ from: string, to: string }>({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const filterByRange = (dateStr: string | undefined, range: { from: string, to: string }) => {
    if (!dateStr) return false;
    const dateOnly = dateStr.split('T')[0];
    return dateOnly >= range.from && dateOnly <= range.to;
  };

  const handleApplyFilter = () => {
    setAppliedRange({ from: fromDate, to: toDate });
  };

  // Calculate stats for the selected range
  const stats = useMemo(() => {
    const filteredBase = patients.filter(p => filterByRange(p.entry_date || p.registeredAt, appliedRange));

    const arrivedPatients = filteredBase.filter(p => {
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

    // Source stats mapping
    const sourcesMap: Record<string, { total: number, completed: number, revenue: number, new: number, revisit: number }> = {};
    validDataset.forEach(p => {
      let s = p.source || 'Other';
      if (s.startsWith('Other: ')) s = 'Other';
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
      sources: sourcesMap,
      dataset: validDataset,
      conversionRate: leads > 0 ? ((conversions / leads) * 100).toFixed(1) : '0'
    };
  }, [patients, appliedRange]);

  // Fix: Explicitly type 'data' as it was inferred as 'unknown' causing spread and property access errors
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
    // Fix: Explicitly type 'dates' array and 'a', 'b' in sort to resolve 'unknown' type issues
    const dateSet = new Set(stats.dataset.map(p => (p.entry_date || p.registeredAt.split('T')[0]) as string));
    const dates = Array.from(dateSet).sort((a: string, b: string) => b.localeCompare(a));
    const headers = ['Date', 'Arrivals', 'Leads', 'Conversions', 'Opportunity'];
    const rows = dates.map((date: string) => {
      const dayPatients = stats.dataset.filter(p => (p.entry_date || p.registeredAt.split('T')[0]) === date);
      const rev = dayPatients.reduce((sum, p) => sum + parseInt(p.packageProposal?.packageAmount?.replace(/,/g, '') || '0', 10), 0);
      return [
        formatDate(date).replace(/,/g, ''),
        dayPatients.length,
        dayPatients.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1).length,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          { label: 'OPD Flow', val: stats.total, icon: Users, color: 'indigo', detail: `${stats.newPatients} New • ${stats.revisits} Revisit` },
          { label: 'New Patients', val: stats.newPatients, icon: UserPlus, color: 'sky', detail: 'Primary Period' },
          { label: 'Revisit Count', val: stats.revisits, icon: RefreshCw, color: 'blue', detail: 'Primary Period' },
          { label: 'Surg Recommended', val: stats.leads, icon: Target, color: 'indigo', detail: 'S1 Assessments' },
          { label: 'Surg Completed', val: stats.conversions, icon: CheckCircle, color: 'emerald', detail: `${stats.conversionRate}% Conversion Rate` },
          { label: 'Total Revenue', val: `₹${stats.revenue.toLocaleString()}`, icon: Banknote, color: 'amber', detail: 'From Completed Surgeries' }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
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

      {/* Funnel Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Conversion Funnel</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Efficiency Tracking (Selected Period)</p>
              </div>
              <Layers className="w-6 h-6 text-slate-200" />
           </div>
           
           <div className="flex-1 space-y-6 flex flex-col justify-center max-w-5xl mx-auto w-full">
             {[
               { label: 'Total Arrived (OPD Flow)', val: stats.total, color: 'bg-slate-900', p: '100%' },
               { label: 'Doctor Assessed', val: stats.assessed, color: 'bg-hospital-600', p: `${(stats.assessed / (stats.total || 1) * 100).toFixed(0)}%` },
               { label: 'Surgery Leads', val: stats.leads, color: 'bg-indigo-600', p: `${(stats.leads / (stats.total || 1) * 100).toFixed(0)}%` },
               { label: 'Surgery Completed', val: stats.conversions, color: 'bg-emerald-600', p: `${stats.conversionRate}%` }
             ].map((step, idx) => (
               <div key={idx} className="relative">
                 <div className="flex justify-between items-end mb-2">
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{step.label}</span>
                   <span className="text-sm font-black text-slate-900">{step.val} <span className="text-[10px] text-slate-300 ml-1">({step.p})</span></span>
                 </div>
                 <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                   <div 
                     className={`h-full ${step.color} rounded-full transition-all duration-1000`} 
                     style={{ width: step.p }}
                   ></div>
                 </div>
               </div>
             ))}
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
                    <th className="px-6 py-4">Leads</th>
                    <th className="px-6 py-4">Conv.</th>
                    <th className="px-6 py-4 text-right">Opp.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* Fix: Explicitly type 'date' in map and 'a', 'b' in sort to resolve 'unknown' type issues */}
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
                          <td className="px-6 py-4 text-xs font-bold text-indigo-500">{dayPatients.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1).length}</td>
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
               <h3 className="text-lg font-black text-slate-900 uppercase">Condition Distribution</h3>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Patient Volume by complaint</p>
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
