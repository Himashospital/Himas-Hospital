import React, { useState, useMemo } from 'react';
import { useHospital } from '../context/HospitalContext';
import { Patient, SurgeonCode, Condition } from '../types';
import { 
  Users, Banknote, Download, Target, RefreshCw, Layers, Search, 
  Globe, PieChart, ArrowUpRight, CheckCircle,
  X, Phone, Calendar, Tag, Briefcase, Zap, Landmark, BarChart3, TrendingUp, TrendingDown, CalendarDays,
  PieChart as PieChartIcon, LayoutDashboard, Target as TargetIcon, Activity, Ban, FileSpreadsheet
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

const ONLINE_SOURCES = [
  'Google', 'Facebook', 'Instagram', 'WhatsApp', 'YouTube', 'Website', 'Friends / Online',
  'Google / YouTube / Website', 'FB / Insta / WhatsApp', 'Friend + Online'
];

const SOURCE_DISPLAY_MAP: Record<string, string> = {
  'Google': 'Google / YouTube / Website',
  'YouTube': 'Google / YouTube / Website',
  'Website': 'Google / YouTube / Website',
  'Facebook': 'FB / Insta / WhatsApp',
  'Instagram': 'FB / Insta / WhatsApp',
  'WhatsApp': 'FB / Insta / WhatsApp',
  'Old Patient / Relatives': 'Self / Old Patient / Relative',
  'Friends / Online': 'Friend + Online',
  'Hospital Billboards': 'Hospital Billboards',
  'Doctor Recommended': 'Doctor Recommended',
  'Other': 'Others',
  'Others': 'Others'
};

const CHART_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate
];

const getSourceDisplay = (source: string | undefined): string => {
  if (!source) return 'Others';
  if (source.startsWith('Other: ')) return 'Others';
  return SOURCE_DISPLAY_MAP[source] || source;
};

// Robust helper to parse package amounts for accurate summation
const parseAmount = (amt: any): number => {
  if (amt == null) return 0;
  if (typeof amt === 'number') return amt;
  const cleaned = String(amt).replace(/[^0-9.-]+/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// Fixed calculateGrowth to return a number for better compatibility with arithmetic operations and type safety in TSX
const calculateGrowth = (current: any, previous: any): number => {
  const curr = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
};

interface AnalyticsStats {
  total: number;
  revenue: number;
  conversions: number;
  leads: number;
  leadsRevenue: number;
  newPatients: number;
  revisits: number;
  onlineTotal: number;
  offlineTotal: number;
  sources: Record<string, { total: number, completed: number, revenue: number, new: number, revisit: number }>;
  arrivedDataset: Patient[];
  completedDataset: Patient[];
  decisionPatternMix: Record<string, number>;
  proposalStageMix: Record<string, number>;
  conversionRate: string;
  scheduledCount: number;
  comparison: AnalyticsStats | null;
}

// SVG-based Pie/Donut Chart component for clinical and counseling breakdown
const AnalyticsPieChart: React.FC<{ 
  data: Record<string, number>, 
  title: string, 
  icon: React.ReactNode,
  onSegmentClick?: (label: string) => void
}> = ({ data, title, icon, onSegmentClick }) => {
  const entries = (Object.entries(data) as [string, number][]).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [_, val]) => sum + val, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm h-full flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-slate-50 rounded-2xl text-slate-300">{icon}</div>
        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest text-center">No Data for {title}<br/>in selected range</p>
      </div>
    );
  }

  let cumulativePercent = 0;
  const slices = entries.map(([name, val], i) => {
    const percent = (val / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    
    const x1 = Math.cos(2 * Math.PI * (startPercent / 100));
    const y1 = Math.sin(2 * Math.PI * (startPercent / 100));
    const x2 = Math.cos(2 * Math.PI * (cumulativePercent / 100));
    const y2 = Math.sin(2 * Math.PI * (cumulativePercent / 100));
    const largeArcFlag = percent > 50 ? 1 : 0;
    
    return {
      name,
      val,
      percent: percent.toFixed(1),
      path: `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      color: CHART_COLORS[i % CHART_COLORS.length]
    };
  });

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col h-full animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500">{icon}</div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
            <div className="text-xl font-black text-slate-900">{total} <span className="text-[10px] text-slate-400">Cases</span></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row items-center gap-8 flex-1">
        <div className="relative w-36 h-36 lg:w-44 lg:h-44 shrink-0">
          <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90">
            {slices.map((slice, i) => (
              <path 
                key={i} 
                d={slice.path} 
                fill={slice.color} 
                onClick={() => onSegmentClick?.(slice.name)}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <title>{slice.name}: {slice.val} ({slice.percent}%)</title>
              </path>
            ))}
            <circle cx="0" cy="0" r="0.65" fill="white" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-slate-900 leading-none">{total}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Total</span>
          </div>
        </div>

        <div className="flex-1 space-y-3 w-full">
          {slices.map((slice, i) => (
            <div 
              key={i} 
              onClick={() => onSegmentClick?.(slice.name)}
              className={`flex items-center justify-between group ${onSegmentClick ? 'cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded-lg transition-colors' : ''}`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></div>
                <span className="text-[9px] font-black text-slate-600 uppercase truncate group-hover:text-slate-900 transition-colors">
                  {slice.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black text-slate-900">{slice.val}</span>
                <span className="text-[8px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md group-hover:bg-white transition-colors">{slice.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
  const [drillDown, setDrillDown] = useState<{ label: string, data: Patient[], viewMode?: 'cards' | 'table' } | null>(null);

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
  const stats: AnalyticsStats = useMemo(() => {
    const processSet = (dataset: Patient[], range: { from: string, to: string }) => {
        // FLOW METRICS: Patients who arrived in the period (OPD Flow based on entry_date)
        const arrivedPatients = dataset.filter(p => 
          filterByRange(p.entry_date || p.registeredAt, range) && 
          (p.status || '').trim().toLowerCase() !== 'scheduled'
        );

        // REVENUE & COMPLETED METRICS: Patients who COMPLETED surgery in the period (using completed_surgery date)
        const completedInPeriod = dataset.filter(p => 
          p.packageProposal?.outcome === 'Completed' && 
          filterByRange(p.completed_surgery || p.packageProposal?.outcomeDate, range)
        );

        // SUM REVENUE: Only from the completedInPeriod set
        const revenue = completedInPeriod.reduce((sum, p) => {
          return sum + parseAmount(p.packageProposal?.packageAmount);
        }, 0);

        const conversions = completedInPeriod.length;

        // TOTAL OPD ACTIVITY UNION: Arrived in period OR Completed in period
        const flowMap = new Map();
        arrivedPatients.forEach(p => flowMap.set(p.id, p));
        completedInPeriod.forEach(p => flowMap.set(p.id, p));
        const flowDataset = Array.from(flowMap.values());

        // STRICT visit_type BASED CALCULATION AS PER REQUEST
        const newPatientsCount = flowDataset.filter(p => (p.visit_type || '').trim().toLowerCase() === 'new').length;
        const revisitsCount = flowDataset.filter(p => (p.visit_type || '').trim().toLowerCase() === 'revisit').length;

        // OPD Flow count calculated strictly based on visit_type column
        const total = newPatientsCount + revisitsCount;
        const newPatients = newPatientsCount;
        const revisits = revisitsCount;

        const leadsDataset = flowDataset.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1);
        const leads = leadsDataset.length;
        const leadsRevenue = leadsDataset.reduce((sum, p) => sum + parseAmount(p.packageProposal?.packageAmount), 0);

        // Grouping sources for the entire flow dataset (filtered by visit_type existence)
        const sourcesMap: Record<string, { total: number, completed: number, revenue: number, new: number, revisit: number }> = {};
        
        flowDataset.forEach(p => {
          const vt = (p.visit_type || '').trim().toLowerCase();
          if (vt !== 'new' && vt !== 'revisit') return;

          const ds = getSourceDisplay(p.source);
          if (!sourcesMap[ds]) sourcesMap[ds] = { total: 0, completed: 0, revenue: 0, new: 0, revisit: 0 };
          sourcesMap[ds].total++;
          
          if (vt === 'revisit') sourcesMap[ds].revisit++;
          else sourcesMap[ds].new++;
        });

        // Add revenue data to sources strictly from the completed set
        completedInPeriod.forEach(p => {
          const ds = getSourceDisplay(p.source);
          if (sourcesMap[ds]) {
            sourcesMap[ds].completed++;
            sourcesMap[ds].revenue += parseAmount(p.packageProposal?.packageAmount);
          }
        });

        // Digital split for total flow (New + Revisit) strictly based on visit_type column
        let onlineTotal = flowDataset.filter(p => {
          const vt = (p.visit_type || '').trim().toLowerCase();
          if (vt !== 'new' && vt !== 'revisit') return false;
          const ds = getSourceDisplay(p.source);
          return (ONLINE_SOURCES.includes(p.source) || ONLINE_SOURCES.includes(ds));
        }).length;

        let offlineTotal = total - onlineTotal;

        // Counseling status mix aggregation
        const decisionPatternMix: Record<string, number> = {};
        const proposalStageMix: Record<string, number> = {};
        
        const activeCounselingPatients = Array.from(new Map([
          ...arrivedPatients.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1),
          ...completedInPeriod
        ].map(p => [p.id, p])).values());

        activeCounselingPatients.forEach(p => {
          if (p.packageProposal) {
            const dp = p.packageProposal.decisionPattern || 'Not Specified';
            decisionPatternMix[dp] = (decisionPatternMix[dp] || 0) + 1;
            
            const ps = p.packageProposal.proposalStage || 'Not Specified';
            proposalStageMix[ps] = (proposalStageMix[ps] || 0) + 1;
          }
        });

        return {
            total: total as number,
            revenue: revenue as number,
            conversions: conversions as number,
            leads: leads as number,
            leadsRevenue: leadsRevenue as number,
            newPatients: newPatients as number,
            revisits: revisits as number,
            onlineTotal: onlineTotal as number,
            offlineTotal: offlineTotal as number,
            sources: sourcesMap,
            arrivedDataset: flowDataset,
            completedDataset: completedInPeriod,
            decisionPatternMix,
            proposalStageMix,
            conversionRate: leads > 0 ? ((conversions / leads) * 100).toFixed(1) : '0'
        };
    };

    const primaryStats = processSet(patients, appliedRange);
    
    let compStats: any = null;
    if (showComparison && appliedCompRange) {
        compStats = processSet(patients, appliedCompRange);
    }

    const scheduledCount = appointments.filter(a => filterByRange(a.date, appliedRange)).length;

    return {
      ...primaryStats,
      scheduledCount: scheduledCount as number,
      comparison: compStats as AnalyticsStats | null
    } as AnalyticsStats;
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
    const allDates = new Set([
      ...stats.arrivedDataset.map(p => (p.entry_date || p.registeredAt.split('T')[0]) as string),
      ...stats.completedDataset.map(p => (p.completed_surgery || p.packageProposal?.outcomeDate?.split('T')[0]) as string)
    ]);
    const dates = Array.from(allDates).filter(Boolean).sort((a: string, b: string) => b.localeCompare(a));
    
    const headers = ['Date', 'Total OPD Flow', 'New Patients', 'Revisit Patients', 'Leads', 'Conversions', 'Opp. Revenue', 'Actual Revenue'];
    const rows = dates.map((date: string) => {
      const flowDay = stats.arrivedDataset.filter(p => (p.entry_date || p.registeredAt.split('T')[0]) === date || (p.completed_surgery || p.packageProposal?.outcomeDate?.split('T')[0]) === date);
      const completedDay = stats.completedDataset.filter(p => (p.completed_surgery || p.packageProposal?.outcomeDate?.split('T')[0]) === date);
      const actualRev = completedDay.reduce((sum, p) => sum + parseAmount(p.packageProposal?.packageAmount), 0);
      const combinedOppRev = flowDay.reduce((sum, p) => sum + parseAmount(p.packageProposal?.packageAmount), 0);
      
      const dayNew = flowDay.filter(p => (p.visit_type || '').trim().toLowerCase() === 'new').length;
      const dayRevisits = flowDay.filter(p => (p.visit_type || '').trim().toLowerCase() === 'revisit').length;
      const dayArrivals = dayNew + dayRevisits;

      return [
        formatDate(date).replace(/,/g, ''),
        dayArrivals,
        dayNew,
        dayRevisits,
        flowDay.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1).length,
        completedDay.length,
        combinedOppRev,
        actualRev
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `himas_financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDrillDown = () => {
    if (!drillDown) return;
    const isTable = drillDown.viewMode === 'table';
    
    let headers: string[] = [];
    let rows: string[][] = [];

    if (isTable) {
      headers = [
        'Patient ID', 'Name', 'Source', 'Status', 'Decision Pattern', 
        'Proposal Stage', 'Surgery Completed Date', 'Arrived Date', 
        'Surgery Lost', 'Surgery Follow-Up', 'Surgery Scheduled'
      ];
      rows = drillDown.data.map(p => [
        p.id,
        p.name,
        p.source,
        p.packageProposal?.outcome || 'Pending',
        p.packageProposal?.decisionPattern || '',
        p.packageProposal?.proposalStage || '',
        formatDate(p.completed_surgery || (p.packageProposal?.outcome === 'Completed' ? p.packageProposal.outcomeDate : null)),
        formatDate(p.entry_date || p.registeredAt),
        formatDate(p.surgery_lost_date || (p.packageProposal?.outcome === 'Lost' ? p.packageProposal.outcomeDate : null)),
        formatDate(p.followup_date || p.packageProposal?.followUpDate),
        formatDate(p.surgery_date || p.packageProposal?.surgeryDate)
      ]);
    } else {
      headers = ['ID', 'Name', 'Condition', 'Mobile', 'Type', 'Source', 'Arrived', 'Affordability', 'Amount'];
      rows = drillDown.data.map(p => [
        p.id,
        p.name,
        p.condition,
        p.mobile,
        p.visit_type || 'OPD',
        p.source,
        formatDate(p.entry_date),
        p.doctorAssessment?.affordability || '---',
        p.packageProposal?.packageAmount || '0'
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${drillDown.label.replace(/[: /]/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKpiClick = (label: string) => {
    let filteredData: Patient[] = [];
    switch (label) {
      case 'Online Traffic':
        filteredData = stats.arrivedDataset.filter(p => {
            const vt = (p.visit_type || '').trim().toLowerCase();
            if (vt !== 'new' && vt !== 'revisit') return false;
            const ds = getSourceDisplay(p.source);
            return (ONLINE_SOURCES.includes(p.source) || ONLINE_SOURCES.includes(ds));
        });
        break;
      case 'Offline Traffic':
        filteredData = stats.arrivedDataset.filter(p => {
            const vt = (p.visit_type || '').trim().toLowerCase();
            if (vt !== 'new' && vt !== 'revisit') return false;
            const ds = getSourceDisplay(p.source);
            return !(ONLINE_SOURCES.includes(p.source) || ONLINE_SOURCES.includes(ds));
        });
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
            gender: 'Other' as any,
            age: 0,
            registeredAt: a.createdAt,
            hasInsurance: 'No' as any,
            occupation: '',
            visitType: 'OPD'
          } as Patient));
        break;
      case 'OPD Flow':
        filteredData = stats.arrivedDataset;
        break;
      case 'Surg Recommended':
        filteredData = stats.arrivedDataset.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1);
        break;
      case 'Surg Completed':
      case 'Total Revenue':
        filteredData = stats.completedDataset;
        break;
      default:
        filteredData = stats.arrivedDataset;
    }
    setDrillDown({ label, data: filteredData, viewMode: 'cards' });
  };

  const handleCounselingClick = (category: 'DP' | 'PS', label: string) => {
    const counselingPool = Array.from(new Map([
      ...stats.arrivedDataset.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1),
      ...stats.completedDataset
    ].map(p => [p.id, p])).values());

    const filtered = counselingPool.filter(p => {
      const val = category === 'DP' 
        ? (p.packageProposal?.decisionPattern || 'Not Specified')
        : (p.packageProposal?.proposalStage || 'Not Specified');
      return val === label;
    });

    setDrillDown({ 
      label: `${category === 'DP' ? 'Decision Pattern' : 'Proposal Stage'}: ${label}`, 
      data: filtered,
      viewMode: 'table'
    });
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
          { label: 'Surg Recommended', val: stats.leads, icon: Target, color: 'indigo', detail: 'S1 Assessments', subVal: `₹${stats.leadsRevenue.toLocaleString()}` },
          { label: 'Surg Completed', val: stats.conversions, icon: CheckCircle, color: 'emerald', detail: `${stats.conversionRate}% Conversion Rate` },
          { label: 'Total Revenue', val: `₹${stats.revenue.toLocaleString()}`, icon: Banknote, color: 'amber', detail: 'Actual Realized Completed Sales' }
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
            {card.subVal && <div className="text-sm font-black text-indigo-600 mb-2">{card.subVal}</div>}
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
          <div className="bg-white w-full max-w-7xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
            <header className="p-8 border-b flex justify-between items-center bg-slate-50/50 shrink-0">
               <div>
                 <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{drillDown.label}</h3>
                    <button 
                      onClick={handleExportDrillDown}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100 text-[10px] font-black uppercase tracking-widest"
                      title="Download Table as CSV"
                    >
                      <Download className="w-4 h-4" /> Export CSV
                    </button>
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed breakdown ({drillDown.data.length} Records)</p>
               </div>
               <button 
                 onClick={() => setDrillDown(null)}
                 className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:shadow-md transition-all active:scale-90"
               >
                 <X className="w-6 h-6" />
               </button>
            </header>
            
            <div className="flex-1 overflow-auto p-4 sm:p-8">
               {drillDown.viewMode === 'table' ? (
                 <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-[1200px]">
                       <thead className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b">
                         <tr>
                           <th className="p-4">Patient ID</th>
                           <th className="p-4">Name</th>
                           <th className="p-4">Source</th>
                           <th className="p-4">Status</th>
                           <th className="p-4">Decision Pattern</th>
                           <th className="p-4">Proposal Stage</th>
                           <th className="p-4">Surgery Completed Date</th>
                           <th className="p-4">Arrived Date</th>
                           <th className="p-4">Surgery Lost</th>
                           <th className="p-4">Surgery Follow-Up</th>
                           <th className="p-4">Surgery Scheduled</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {drillDown.data.map((p, idx) => (
                           <tr key={p.id + idx} className="hover:bg-slate-50 transition-colors">
                             <td className="p-4 text-[10px] font-mono font-bold text-slate-400">{p.id.split('_V')[0]}</td>
                             <td className="p-4 text-[11px] font-black text-slate-900 whitespace-nowrap">{p.name}</td>
                             <td className="p-4 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">{p.source}</td>
                             <td className="p-4">
                               <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                 p.packageProposal?.outcome === 'Completed' ? 'bg-teal-50 text-teal-700' :
                                 p.packageProposal?.outcome === 'Scheduled' ? 'bg-emerald-50 text-emerald-700' :
                                 p.packageProposal?.outcome === 'Lost' ? 'bg-rose-50 text-rose-700' :
                                 p.packageProposal?.outcome === 'Follow-Up' ? 'bg-blue-50 text-blue-700' :
                                 'bg-amber-50 text-amber-700'
                               }`}>
                                 {p.packageProposal?.outcome || 'Pending'}
                               </span>
                             </td>
                             <td className="p-4 text-[10px] font-bold text-slate-600">{p.packageProposal?.decisionPattern || '---'}</td>
                             <td className="p-4 text-[10px] font-bold text-slate-600">{p.packageProposal?.proposalStage || '---'}</td>
                             <td className="p-4 text-[10px] font-bold text-teal-600">{formatDate(p.completed_surgery || (p.packageProposal?.outcome === 'Completed' ? p.packageProposal.outcomeDate : null))}</td>
                             <td className="p-4 text-[10px] font-bold text-slate-500">{formatDate(p.entry_date || p.registeredAt)}</td>
                             <td className="p-4 text-[10px] font-bold text-rose-600">{formatDate(p.surgery_lost_date || (p.packageProposal?.outcome === 'Lost' ? p.packageProposal.outcomeDate : null))}</td>
                             <td className="p-4 text-[10px] font-bold text-blue-600">{formatDate(p.followup_date || p.packageProposal?.followUpDate)}</td>
                             <td className="p-4 text-[10px] font-bold text-emerald-600">{formatDate(p.surgery_date || p.packageProposal?.surgeryDate)}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               ) : (
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
                           <span className="text-[10px] font-black uppercase text-slate-600">
                             {p.packageProposal?.outcome === 'Completed' ? formatDate(p.completed_surgery || p.packageProposal?.outcomeDate) : formatDate(p.entry_date)}
                         </span>
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
                 </div>
               )}
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

      {/* Performance Data Table Section */}
      <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
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
                    <th className="px-6 py-4 text-emerald-600">Conv.</th>
                    <th className="px-6 py-4 text-right">Opp. (Revenue)</th>
                    <th className="px-6 py-4 text-right">Actual Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(() => {
                    const allDates = new Set([
                      ...stats.arrivedDataset.map(p => (p.entry_date || p.registeredAt.split('T')[0]) as string),
                      ...stats.completedDataset.map(p => (p.completed_surgery || p.packageProposal?.outcomeDate?.split('T')[0]) as string)
                    ]);
                    return Array.from(allDates)
                      .filter(Boolean)
                      .sort((a: string, b: string) => b.localeCompare(a))
                      .slice(0, 10)
                      .map((date: string, i: number) => {
                        const flowDay = stats.arrivedDataset.filter(p => (p.entry_date || p.registeredAt.split('T')[0]) === date || (p.completed_surgery || p.packageProposal?.outcomeDate?.split('T')[0]) === date);
                        const completedDay = stats.completedDataset.filter(p => (p.completed_surgery || p.packageProposal?.outcomeDate?.split('T')[0]) === date);
                        const actualRev = completedDay.reduce((sum, p) => sum + parseAmount(p.packageProposal?.packageAmount), 0);
                        const combinedOppRev = flowDay.reduce((sum, p) => sum + parseAmount(p.packageProposal?.packageAmount), 0);
                        
                        // Strict visit_type counts for the table row
                        const dayNew = flowDay.filter(p => (p.visit_type || '').trim().toLowerCase() === 'new').length;
                        const dayRevisits = flowDay.filter(p => (p.visit_type || '').trim().toLowerCase() === 'revisit').length;
                        const dayArrivals = dayNew + dayRevisits;

                        return (
                          <tr key={i} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 text-[11px] font-black text-slate-900">{formatDate(date)}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600">{dayArrivals}</td>
                            <td className="px-6 py-4 text-xs font-bold text-teal-600">{dayNew}</td>
                            <td className="px-6 py-4 text-xs font-bold text-orange-600">{dayRevisits}</td>
                            <td className="px-6 py-4 text-xs font-bold text-indigo-500">{flowDay.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1).length}</td>
                            <td className="px-6 py-4 text-xs font-bold text-emerald-600">{completedDay.length}</td>
                            <td className="px-6 py-4 text-right text-xs font-black text-slate-900">
                               ₹{combinedOppRev.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right text-xs font-black text-slate-900">₹{actualRev.toLocaleString()}</td>
                          </tr>
                        );
                      });
                  })()}
                </tbody>
              </table>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Source Charts */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-10">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex justify-between">
                <span>Total Patient Flow Attribution</span>
                <span className="flex gap-4">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-hospital-500"></div> All OPD Traffic</span>
                </span>
              </h4>
              <div className="space-y-4">
                {sourceStats.slice(0, 10).map((s, idx) => {
                  const max = Math.max(...sourceStats.map(x => x.total), 1);
                  const pTotal = (s.total / max * 100).toFixed(0);
                  return (
                    <div key={idx} className="group">
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                        <span className="text-slate-600 group-hover:text-hospital-600 transition-colors">{s.name}</span>
                        <span className="text-slate-900">{s.total} <span className="text-slate-300 font-bold">Total</span></span>
                      </div>
                      <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex">
                        <div className="h-full bg-hospital-500 transition-all duration-700" style={{ width: `${pTotal}%` }}></div>
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
                        <div className="max-w-[150px]">
                          <div className="text-[10px] font-black uppercase text-slate-900 truncate">{s.name}</div>
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

          {/* Procedure Distribution Section */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-8 border-b bg-slate-50/30">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-lg font-black text-slate-900 uppercase">Procedure Distribution</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Breakdown by Recommended Doctor Procedure</p>
                 </div>
                 <Activity className="w-6 h-6 text-slate-200" />
               </div>
            </div>
            <div className="p-8 space-y-4 flex-1">
              {(() => {
                const assessedDataset = stats.arrivedDataset.filter(p => p.doctorAssessment?.surgeryProcedure);
                const totalAssessed = assessedDataset.length;
                const procedureCounts = assessedDataset.reduce((acc, p) => {
                  let proc = p.doctorAssessment?.surgeryProcedure || 'Not Specified';
                  if (proc === 'Other' && p.doctorAssessment?.otherSurgeryName) {
                    proc = p.doctorAssessment.otherSurgeryName;
                  }
                  acc[proc] = (acc[proc] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                return Object.entries(procedureCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([proc, count], idx) => {
                    const pct = ((count / (totalAssessed || 1)) * 100).toFixed(0);
                    return (
                      <div key={idx} className="flex items-center gap-4">
                        <span className="w-32 text-[9px] font-black text-slate-500 uppercase truncate" title={proc}>{proc}</span>
                        <div className="flex-1 h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="w-8 text-right text-xs font-black text-slate-900">{count}</span>
                      </div>
                    );
                  });
              })()}
              {stats.arrivedDataset.filter(p => p.doctorAssessment?.surgeryProcedure).length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
                  <BarChart3 className="w-12 h-12 mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">No Procedures Found</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Counseling Analysis Section */}
      <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <PieChartIcon className="w-7 h-7 text-hospital-600" />
              Counseling Analysis
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Decision Patterns & Proposal Stages</p>
          </div>
          <div className="p-3 bg-hospital-50 rounded-2xl">
            <TargetIcon className="w-6 h-6 text-hospital-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <AnalyticsPieChart 
             data={stats.decisionPatternMix} 
             title="Decision Pattern" 
             icon={<Activity className="w-5 h-5" />} 
             onSegmentClick={(label) => handleCounselingClick('DP', label)}
           />
           <AnalyticsPieChart 
             data={stats.proposalStageMix} 
             title="Proposal Stage" 
             icon={<LayoutDashboard className="w-5 h-5" />} 
             onSegmentClick={(label) => handleCounselingClick('PS', label)}
           />
        </div>
      </div>

      {/* Digital vs Traditional Flow Section */}
      <div className="pb-20 space-y-8 animate-in slide-in-from-bottom-6 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
           <div>
             <h3 className="text-2xl font-black text-slate-900 uppercase">Digital vs Traditional Flow</h3>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Source Category Comparison (Online vs Offline) - Total OPD Activity</p>
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                 <button 
                   onClick={() => setGraphGranularity('daily')}
                   className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${graphGranularity === 'daily' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-50'}`}
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
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Digital Share (Net)</span>
                     <div className="text-2xl font-black text-indigo-600">
                       {/* Fixed: Explicitly convert operands to Number to satisfy arithmetic type requirements */}
                       {Number(stats.total) > 0 ? (Math.round((Number(stats.onlineTotal) / Number(stats.total)) * 100)) : 0}%
                     </div>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4 mb-1">
                  <div className="text-4xl font-black text-slate-900">{stats.onlineTotal}</div>
                  {showComparison && stats.comparison && (
                    <div className={`flex items-center gap-1 text-xs font-black ${calculateGrowth(stats.onlineTotal, stats.comparison.onlineTotal) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {calculateGrowth(stats.onlineTotal, stats.comparison?.onlineTotal) >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                      {calculateGrowth(stats.onlineTotal, stats.comparison?.onlineTotal).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Online Sources</div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-2">
                  {['Google / YouTube / Website', 'FB / Insta / WhatsApp', 'Friend + Online'].map(s => (
                    <span key={s} className="text-[8px] font-black px-2 py-1 rounded-full bg-slate-50 text-slate-400 uppercase">{s}</span>
                  ))}
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
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Traditional Share (Net)</span>
                     <div className="text-2xl font-black text-indigo-600">
                       {/* Fixed: Explicitly convert operands to Number to satisfy arithmetic type requirements */}
                       {Number(stats.total) > 0 ? (Math.round((Number(stats.offlineTotal) / Number(stats.total)) * 100)) : 0}%
                     </div>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4 mb-1">
                  <div className="text-4xl font-black text-slate-900">{stats.offlineTotal}</div>
                  {showComparison && stats.comparison && (
                    <div className={`flex items-center gap-1 text-xs font-black ${calculateGrowth(stats.offlineTotal, stats.comparison.offlineTotal) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {calculateGrowth(stats.offlineTotal, stats.comparison?.offlineTotal) >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                      {calculateGrowth(stats.offlineTotal, stats.comparison?.offlineTotal).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Offline Sources</div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-2">
                  {['Hospital Billboards', 'Doctor Recommended', 'Self / Old Patient / Relative', 'Others'].map(s => (
                    <span key={s} className="text-[8px] font-black px-2 py-1 rounded-full bg-slate-50 text-slate-400 uppercase">{s}</span>
                  ))}
                </div>
              </div>
           </div>

           <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-8">
                 <div>
                   <h4 className="text-sm font-black text-slate-900 uppercase">{graphGranularity === 'monthly' ? 'Monthly Flow activity' : 'Daily Flow Comparison'}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attribution for all OPD Activity</p>
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
                    
                    const uniqueKeys = Array.from(new Set(stats.arrivedDataset.map(groupKey))).sort((a: any, b: any) => a.localeCompare(b)) as string[];
                    const visibleKeys = uniqueKeys.slice(graphGranularity === 'monthly' ? -12 : -15);
                    
                    return visibleKeys.map((key, i) => {
                      const dayPatients = stats.arrivedDataset.filter(p => groupKey(p) === key);
                      const onlineVol = dayPatients.filter(p => {
                          const ds = getSourceDisplay(p.source);
                          return ONLINE_SOURCES.includes(p.source) || ONLINE_SOURCES.includes(ds);
                      }).length;
                      const offlineVol = dayPatients.length - onlineVol;
                      
                      const maxTotal = Math.max(...visibleKeys.map(k => stats.arrivedDataset.filter(p => groupKey(p) === k).length), 1);
                      
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
                 }, [stats.arrivedDataset, graphGranularity])}
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
    </div>
  );
};
