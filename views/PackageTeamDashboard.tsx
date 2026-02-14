
import React, { useState, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { ExportButtons } from '../components/ExportButtons';
import { Patient, PackageProposal, Role, SurgeonCode, ProposalOutcome } from '../types';
import { Briefcase, Calendar, Users, BadgeCheck, User, Activity, ShieldCheck, Banknote, Trash2, Clock, X, Share2, Stethoscope, LayoutList, Columns, Search, Phone, Filter, Tag, CalendarClock, Ban, ChevronLeft, ChevronRight, LayoutPanelLeft, MessageSquareQuote, FileText, ChevronDown, AlertCircle, RefreshCcw, Database, Gauge } from 'lucide-react';

const lostReasons = [
  "Not Accepting for Surgery",
  "Got Treatment at Another Place",
  "Cost / Financial Constraints",
  "Cashless Insurance Required",
  "Decision Makers Not Agreeing",
  "Seeing Another Doctor",
  "Hospital Facilities Reasons",
  "No Communication / Response"
];

const PROPOSAL_STAGES: Record<string, number> = {
  "Surgery Recommended": 10,
  "Surgery Acceptance": 30,
  "Doctor Acceptance": 50,
  "Hospital Acceptance": 70,
  "Package Acceptance": 90,
  "Pre-Ops Fixed": 100
};

const formatToDDMMYYYY = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  const datePart = dateString.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) { // YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return datePart; 
  }
  return dateString;
};

const formatToDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  
  return `${d}-${m}-${y} ${h}:${min}`;
};

export const PackageTeamDashboard: React.FC = () => {
  const { patients, updatePackageProposal, staffUsers, registerStaff } = useHospital();
  
  const [activeTab, setActiveTab] = useState<'counseling' | 'staff'>('counseling');
  const [listCategory, setListCategory] = useState<'PENDING' | 'SCHEDULED' | 'FOLLOWUP' | 'COMPLETED' | 'LOST'>('PENDING');
  const [viewMode, setViewMode] = useState<'split' | 'table'>('split');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'CR1' | 'CR2' | 'CR3' | 'CR4'>('ALL');
  const [probabilityFilter, setProbabilityFilter] = useState<string>('ALL');
  
  const [outcomeModal, setOutcomeModal] = useState<{
    show: boolean;
    type: ProposalOutcome | null;
    date: string;
    reason: string;
  }>({
    show: false,
    type: null,
    date: new Date().toISOString().split('T')[0],
    reason: lostReasons[0]
  });

  const initialProposalState: Partial<PackageProposal> = {
    decisionPattern: 'Standard',
    objectionIdentified: '',
    counselingStrategy: '',
    followUpDate: '',
    modeOfPayment: undefined,
    packageAmount: '',
    preOpInvestigation: undefined,
    surgeryMedicines: undefined,
    equipment: undefined,
    icuCharges: undefined,
    roomType: undefined,
    stayDays: undefined,
    postFollowUp: undefined,
    postFollowUpCount: undefined,
    surgeryDate: '',
    remarks: '',
    outcome: undefined,
    outcomeDate: '',
    lostReason: '',
    proposalStage: ''
  };

  const [proposal, setProposal] = useState<Partial<PackageProposal>>(initialProposalState);

  useEffect(() => {
    if (selectedPatient?.id) {
      const freshPatient = patients.find(p => p.id === selectedPatient.id);
      if (freshPatient) {
        if (JSON.stringify(freshPatient) !== JSON.stringify(selectedPatient)) {
          setSelectedPatient(freshPatient);
        }
      } else {
        setSelectedPatient(null);
      }
    }
  }, [patients, selectedPatient?.id]);

  useEffect(() => {
    if (selectedPatient) {
      setProposal(selectedPatient.packageProposal || initialProposalState);
    }
  }, [selectedPatient]);

  const allPatients = [...patients].filter(p => {
    if (p.doctorAssessment?.quickCode !== SurgeonCode.S1) return false;
    
    const outcome = p.packageProposal?.outcome;
    const today = new Date().toISOString().split('T')[0];

    // Filter by Directory Category
    if (listCategory === 'PENDING') {
      // Logic handled during partition later, but baseline filter applies here
    } else if (listCategory === 'SCHEDULED') {
      if (outcome !== 'Scheduled') return false;
    } else if (listCategory === 'FOLLOWUP') {
      if (outcome !== 'Follow-Up') return false;
    } else if (listCategory === 'COMPLETED') {
      if (outcome !== 'Completed') return false;
    } else if (listCategory === 'LOST') {
      if (outcome !== 'Lost') return false;
    }

    // Filter by Readiness (CR1-CR4) only for true Pending leads
    if (listCategory === 'PENDING' && filter !== 'ALL' && !outcome) {
      if (!p.doctorAssessment?.conversionReadiness?.startsWith(filter)) return false;
    }

    // Filter by Probability
    // The request specifies refining the 'Done Data (Moved)' list specifically
    if (probabilityFilter !== 'ALL') {
      const stage = p.packageProposal?.proposalStage;
      // If we are in PENDING, the filter only applies to those with an outcome (Done Data)
      // or if they have a stage defined.
      if (!stage || PROPOSAL_STAGES[stage]?.toString() !== probabilityFilter) return false;
    }

    // Advanced Filtering Logic based on Section using Common Date Filter
    if (listCategory === 'PENDING') {
      if (!outcome) {
        if (startDate || endDate) {
          const filterDate = p.entry_date || '';
          if (startDate && filterDate < startDate) return false;
          if (endDate && filterDate > endDate) return false;
        }
      } else {
        if (startDate || endDate) {
          const filterDate = p.status_updated_at ? p.status_updated_at.split('T')[0] : '';
          if (startDate && filterDate < startDate) return false;
          if (endDate && filterDate > endDate) return false;
        }
      }
    } else {
      if (startDate || endDate) {
        let filterDate = p.entry_date || '';
        if (listCategory === 'SCHEDULED') filterDate = p.surgery_date || p.packageProposal?.surgeryDate || '';
        else if (listCategory === 'FOLLOWUP') filterDate = p.followup_date || p.packageProposal?.followUpDate || '';
        else if (listCategory === 'COMPLETED') filterDate = p.completed_surgery || p.packageProposal?.outcomeDate || '';
        else if (listCategory === 'LOST') filterDate = p.surgery_lost_date || p.packageProposal?.outcomeDate || '';

        if (startDate && filterDate < startDate) return false;
        if (endDate && filterDate > endDate) return false;
      }
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const match = p.name.toLowerCase().includes(s) || 
                    p.id.toLowerCase().includes(s) || 
                    p.mobile.includes(s);
      if (!match) return false;
    }

    return true;
  }).sort((a, b) => {
    if (listCategory === 'FOLLOWUP') {
      const valA = a.followup_date || a.packageProposal?.followUpDate;
      const valB = b.followup_date || b.packageProposal?.followUpDate;
      const dateA = valA ? new Date(valA).getTime() : Infinity;
      const dateB = valB ? new Date(valB).getTime() : Infinity;
      return dateA - dateB; 
    }

    if (listCategory === 'COMPLETED') {
      const valA = a.completed_surgery || a.packageProposal?.outcomeDate;
      const valB = b.completed_surgery || b.packageProposal?.outcomeDate;
      const dateA = valA ? new Date(valA).getTime() : 0;
      const dateB = valB ? new Date(valB).getTime() : 0;
      return dateB - dateA; 
    }
    
    if (listCategory === 'PENDING') {
      const aHasOutcome = !!a.packageProposal?.outcome;
      const bHasOutcome = !!b.packageProposal?.outcome;
      
      if (!aHasOutcome && bHasOutcome) return -1;
      if (aHasOutcome && !bHasOutcome) return 1;
      
      if (!aHasOutcome && !bHasOutcome) {
        const timeA = new Date(a.registeredAt).getTime();
        const timeB = new Date(b.registeredAt).getTime();
        return timeB - timeA;
      }
      
      if (aHasOutcome && bHasOutcome) {
        const timeA = new Date(a.status_updated_at || a.updated_at || 0).getTime();
        const timeB = new Date(b.status_updated_at || b.updated_at || 0).getTime();
        return timeB - timeA;
      }
    }

    const dateA = a.entry_date ? new Date(a.entry_date).getTime() : new Date(a.registeredAt).getTime();
    const dateB = b.entry_date ? new Date(b.entry_date).getTime() : new Date(b.registeredAt).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
  });

  const handlePatientSelect = (p: Patient) => {
    setSelectedPatient(p);
    setViewMode('split');
    setProposal(p.packageProposal || initialProposalState);
  };

  const handleOpenOutcomeModal = (type: ProposalOutcome) => {
    setOutcomeModal({
      show: true,
      type,
      date: new Date().toISOString().split('T')[0],
      reason: lostReasons[0]
    });
  };

  const handleConfirmOutcome = async () => {
    if (!selectedPatient) return;
    const newOutcomeDate = outcomeModal.type !== 'Lost' ? outcomeModal.date : new Date().toISOString().split('T')[0];
    const updatedProposal: PackageProposal = {
      ...proposal as PackageProposal,
      outcome: outcomeModal.type!,
      outcomeDate: newOutcomeDate,
      surgeryDate: outcomeModal.type === 'Scheduled' ? newOutcomeDate : (proposal.surgeryDate || ''),
      lostReason: outcomeModal.type === 'Lost' ? outcomeModal.reason : undefined,
      proposalCreatedAt: proposal.proposalCreatedAt || new Date().toISOString(),
      followUpDate: (outcomeModal.type === 'Follow-Up' ? outcomeModal.date : proposal.followUpDate) || ''
    };
    await updatePackageProposal(selectedPatient.id, updatedProposal);
    setOutcomeModal({ ...outcomeModal, show: false });
    if (outcomeModal.type === 'Scheduled') setListCategory('SCHEDULED');
    else if (outcomeModal.type === 'Follow-Up') setListCategory('FOLLOWUP');
    else if (outcomeModal.type === 'Lost') setListCategory('LOST');
    else if (outcomeModal.type === 'Completed') setListCategory('COMPLETED');
  };

  const handleSurgeryComplete = async () => {
    if (!selectedPatient) return;
    const updatedProposal: PackageProposal = {
      ...proposal as PackageProposal,
      outcome: 'Completed',
      outcomeDate: new Date().toISOString().split('T')[0],
      proposalCreatedAt: proposal.proposalCreatedAt || new Date().toISOString()
    };
    await updatePackageProposal(selectedPatient.id, updatedProposal);
    setListCategory('PENDING'); 
  };

  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatient) {
      await updatePackageProposal(selectedPatient.id, {
        ...proposal as PackageProposal,
        proposalCreatedAt: proposal.proposalCreatedAt || new Date().toISOString()
      });
      alert("Proposal details saved.");
    }
  };

  const selectClasses = "w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-hospital-500 transition-all appearance-none cursor-pointer pr-10";

  const renderActionButtons = (currentOutcome: ProposalOutcome | undefined) => {
    if (currentOutcome === 'Scheduled') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button type="button" onClick={handleSurgeryComplete} className="py-4 sm:py-6 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex flex-col items-center gap-2">
            <BadgeCheck className="w-5 h-5" /> Surgery Complete
          </button>
          <button type="button" onClick={() => handleOpenOutcomeModal('Follow-Up')} className="py-4 sm:py-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex flex-col items-center gap-2">
            <Clock className="w-5 h-5" /> Follow-Up
          </button>
          <button type="button" onClick={() => handleOpenOutcomeModal('Lost')} className="py-4 sm:py-6 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all flex flex-col items-center gap-2">
            <Trash2 className="w-5 h-5" /> Surgery Lost
          </button>
        </div>
      );
    }
    if (currentOutcome === 'Follow-Up') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button type="button" onClick={() => handleOpenOutcomeModal('Scheduled')} className="py-4 sm:py-6 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex flex-col items-center gap-2">
            <Calendar className="w-5 h-5" /> Scheduled
          </button>
          <button type="button" onClick={() => handleOpenOutcomeModal('Follow-Up')} className="py-4 sm:py-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex flex-col items-center gap-2">
            <Clock className="w-5 h-5" /> Follow-Up
          </button>
          <button type="button" onClick={() => handleOpenOutcomeModal('Lost')} className="py-4 sm:py-6 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all flex flex-col items-center gap-2">
            <Trash2 className="w-5 h-5" /> Surgery Lost
          </button>
        </div>
      );
    }
    if (currentOutcome === 'Lost') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button type="button" onClick={() => handleOpenOutcomeModal('Scheduled')} className="py-4 sm:py-6 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex flex-col items-center gap-2">
            <Calendar className="w-5 h-5" /> Scheduled
          </button>
          <button type="button" onClick={() => handleOpenOutcomeModal('Follow-Up')} className="py-4 sm:py-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex flex-col items-center gap-2">
            <Clock className="w-5 h-5" /> Follow-Up
          </button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button type="button" onClick={() => handleOpenOutcomeModal('Scheduled')} className="py-4 sm:py-6 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex flex-col items-center gap-2">
          <Calendar className="w-5 h-5" /> Schedule
        </button>
        <button type="button" onClick={() => handleOpenOutcomeModal('Follow-Up')} className="py-4 sm:py-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex flex-col items-center gap-2">
          <Clock className="w-5 h-5" /> Follow-Up
        </button>
        <button type="button" onClick={() => handleOpenOutcomeModal('Lost')} className="py-4 sm:py-6 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all flex flex-col items-center gap-2">
          <Trash2 className="w-5 h-5" /> Lost
        </button>
      </div>
    );
  };

  const filterInputClasses = "h-10 w-full bg-slate-50 border border-slate-100 rounded-xl px-3 text-[10px] font-bold focus:ring-2 focus:ring-hospital-500 outline-none transition-all appearance-none";

  const pendingOnlyCount = patients.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1 && !p.packageProposal?.outcome).length;
  const movedTotalCount = patients.filter(p => p.doctorAssessment?.quickCode === SurgeonCode.S1 && !!p.packageProposal?.outcome).length;
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Management Dashboard</h2>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Patient Counseling & Staff Hub</p>
        </div>
        <div className="flex bg-white rounded-xl p-1 border shadow-sm w-full md:w-auto">
          <button onClick={() => setActiveTab('counseling')} className={`flex-1 md:flex-initial px-4 lg:px-6 py-2.5 text-xs font-black uppercase rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'counseling' ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Briefcase className="w-4 h-4" /> Counseling
          </button>
          <button onClick={() => setActiveTab('staff')} className={`flex-1 md:flex-initial px-4 lg:px-6 py-2.5 text-xs font-black uppercase rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'staff' ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Users className="w-4 h-4" /> Staff
          </button>
        </div>
      </div>

      {activeTab === 'counseling' ? (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 space-y-5">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
              {['PENDING', 'SCHEDULED', 'FOLLOWUP', 'COMPLETED', 'LOST'].map((cat) => (
                <button key={cat} onClick={() => setListCategory(cat as any)} className={`flex-1 px-4 lg:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${listCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                  {cat === 'PENDING' && <Activity className="w-4 h-4" />}
                  {cat === 'SCHEDULED' && <Calendar className="w-4 h-4" />}
                  {cat === 'FOLLOWUP' && <Clock className="w-4 h-4" />}
                  {cat === 'COMPLETED' && <BadgeCheck className="w-4 h-4" />}
                  {cat === 'LOST' && <Trash2 className="w-4 h-4" />}
                  {cat.replace('PENDING', 'Leads').replace('FOLLOWUP', 'Follow-Up')}
                </button>
              ))}
            </div>

            <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 shrink-0">Filter From</span>
                  <input type="date" className={filterInputClasses} value={startDate} onChange={e => setStartDate(e.target.value)} />
                  <span className="text-[9px] font-black uppercase text-slate-400 shrink-0">To</span>
                  <input type="date" className={filterInputClasses} value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 shrink-0">Prob. %</span>
                  <select 
                    className="h-10 w-28 bg-slate-50 border border-slate-100 rounded-xl px-2 text-[10px] font-bold focus:ring-2 focus:ring-hospital-500 outline-none transition-all appearance-none" 
                    value={probabilityFilter} 
                    onChange={e => setProbabilityFilter(e.target.value)}
                  >
                    <option value="ALL">All %</option>
                    {Object.values(PROPOSAL_STAGES).map(pct => (
                      <option key={pct} value={pct.toString()}>{pct}%</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="text" placeholder="Quick Search..." className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-hospital-500 outline-none transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="bg-white border p-1 rounded-xl flex shadow-sm">
                  <button onClick={() => { setViewMode('split'); setIsSidebarMinimized(false); }} className={`p-2 rounded-lg transition-all ${viewMode === 'split' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}><Columns className="w-4 h-4" /></button>
                  <button onClick={() => { setViewMode('table'); setIsSidebarMinimized(false); }} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}><LayoutList className="w-4 h-4" /></button>
                </div>
                <ExportButtons patients={patients} role="package_team" selectedPatient={selectedPatient} />
              </div>
            </div>
          </div>

          {viewMode === 'split' ? (
            <div className={`grid grid-cols-1 ${isSidebarMinimized ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6 transition-all duration-300`}>
              {!isSidebarMinimized && (
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden h-[400px] lg:h-[750px] flex flex-col animate-in slide-in-from-left-4">
                  <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setIsSidebarMinimized(true)} 
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Minimize Directory"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{listCategory} Directory</span>
                    </div>
                    <div className="flex gap-2">
                       {listCategory === 'PENDING' ? (
                         <>
                           <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-hospital-50 text-hospital-600 border border-hospital-100">Leads: {pendingOnlyCount}</span>
                           <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Done: {movedTotalCount}</span>
                         </>
                       ) : (
                         <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${listCategory === 'LOST' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-hospital-50 text-hospital-600 border border-hospital-100'}`}>{allPatients.length}</span>
                       )}
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 p-3 space-y-2">
                    {allPatients.map((p, index) => {
                      const followUpDateVal = p.followup_date || p.packageProposal?.followUpDate;
                      const hasOutcome = !!p.packageProposal?.outcome;
                      const isOverdue = followUpDateVal && 
                                      followUpDateVal < todayStr && 
                                      (listCategory === 'FOLLOWUP' || (!hasOutcome && p.packageProposal?.outcome !== 'Lost'));

                      const prevP = allPatients[index - 1];
                      const isFirstMoved = listCategory === 'PENDING' && hasOutcome && (!prevP || !prevP.packageProposal?.outcome);
                      
                      let currentGroupDate = '';
                      let prevGroupDate = '';

                      if (listCategory === 'PENDING' && hasOutcome) {
                          currentGroupDate = (p.status_updated_at || p.updated_at || '').split('T')[0];
                          prevGroupDate = (prevP?.status_updated_at || prevP?.updated_at || '').split('T')[0];
                      } else if (listCategory === 'COMPLETED') {
                          currentGroupDate = (p.completed_surgery || p.packageProposal?.outcomeDate || '').split('T')[0];
                          prevGroupDate = (prevP?.completed_surgery || prevP?.packageProposal?.outcomeDate || '').split('T')[0];
                      }

                      const isNewGroupDay = currentGroupDate && currentGroupDate !== prevGroupDate;
                      const isFirstInGroup = isFirstMoved || (listCategory === 'COMPLETED' && index === 0);

                      return (
                        <React.Fragment key={p.id}>
                          {isFirstMoved && (
                            <div className="py-6 px-2 animate-in fade-in duration-500">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-px bg-emerald-100 flex-1"></div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2"><RefreshCcw className="w-3 h-3" /> Done Data (Moved)</span>
                                <div className="h-px bg-emerald-100 flex-1"></div>
                              </div>
                            </div>
                          )}
                          {(isFirstInGroup || isNewGroupDay) && currentGroupDate && (
                             <div className="px-3 mb-2 mt-2">
                               <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm flex items-center gap-2 w-fit ${listCategory === 'COMPLETED' ? 'text-teal-600 bg-teal-50 border-teal-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                                 <Calendar className="w-3 h-3" /> {formatToDDMMYYYY(currentGroupDate)}
                               </span>
                             </div>
                          )}

                          <div 
                            onClick={() => handlePatientSelect(p)} 
                            className={`p-4 rounded-2xl border transition-all relative ${
                              selectedPatient?.id === p.id 
                                ? 'border-hospital-500 bg-hospital-50 shadow-md' 
                                : isOverdue
                                  ? 'border-rose-300 bg-rose-50/50 hover:border-rose-400 shadow-sm'
                                  : hasOutcome && listCategory === 'PENDING'
                                    ? 'border-emerald-50 bg-emerald-50/30 hover:border-emerald-200'
                                    : 'border-slate-50 hover:border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex justify-between mb-2">
                              <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex gap-2 items-center">
                                  {isOverdue && (
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                                      <AlertCircle className="w-2 h-2" /> OVERDUE
                                    </span>
                                  )}
                                  <span className={`text-[8px] font-black uppercase px-2.5 py-1.5 rounded-md shadow-sm border border-transparent whitespace-nowrap ${p.packageProposal?.outcome === 'Scheduled' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : p.packageProposal?.outcome === 'Completed' ? 'bg-teal-100 text-teal-700 border-teal-200' : p.packageProposal?.outcome === 'Follow-Up' ? 'bg-blue-100 text-blue-700 border-blue-200' : p.packageProposal?.outcome === 'Lost' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-600'}`}>{p.packageProposal?.outcome || 'Pending Lead'}</span>
                                </div>
                                {p.packageProposal?.proposalStage && (
                                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
                                    <Gauge className="w-2.5 h-2.5" /> {PROPOSAL_STAGES[p.packageProposal.proposalStage]}%
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-2 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{p.condition}</span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                
                                {listCategory === 'PENDING' && hasOutcome ? (
                                  <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                                    <span className="opacity-70">Moved On:</span>
                                    <span className="font-bold">{formatToDDMMYYYY(p.status_updated_at || p.updated_at)}</span>
                                  </div>
                                ) : listCategory === 'COMPLETED' ? (
                                  <div className="flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md border border-teal-100">
                                    <span className="opacity-70">Completed:</span>
                                    <span className="font-bold">{formatToDDMMYYYY(p.completed_surgery || p.packageProposal?.outcomeDate)}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span className="opacity-70 text-slate-400 uppercase">Arrived:</span>
                                    <span className="text-hospital-600 font-bold">{formatToDDMMYYYY(p.entry_date)}</span>
                                  </div>
                                )}
                              </div>
                              
                              {listCategory === 'SCHEDULED' && (
                                <div className="text-slate-400 font-black mt-1 flex items-center gap-1">
                                  <CalendarClock className="w-3 h-3 text-emerald-500" />
                                  <span>Surgery:</span>
                                  <span className="text-emerald-600 font-black">{formatToDDMMYYYY(p.surgery_date || p.packageProposal?.surgeryDate) || 'NOT SET'}</span>
                                </div>
                              )}
                              
                              {listCategory === 'FOLLOWUP' && (
                                <div className="text-slate-400 font-black mt-1 flex items-center gap-1">
                                  <Clock className={`w-3 h-3 ${isOverdue ? 'text-rose-500' : 'text-blue-500'}`} />
                                  <span>Follow-Up:</span>
                                  <span className={`font-black ${isOverdue ? 'text-rose-600' : 'text-blue-600'}`}>
                                    {formatToDDMMYYYY(followUpDateVal) || formatToDDMMYYYY(p.doctorAssessment?.tentativeSurgeryDate) || 'PENDING'}
                                  </span>
                                </div>
                              )}

                              {(p.status_updated_at || p.updated_at) && (
                                  <div className="text-[8px] font-black text-slate-300 uppercase tracking-tighter mt-1.5 flex items-center gap-1">
                                      <RefreshCcw className="w-2.5 h-2.5" /> Updated: {formatToDateTime(p.status_updated_at || p.updated_at).split(' ')[1]}
                                  </div>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    {allPatients.length === 0 && (
                      <div className="p-10 text-center space-y-3">
                        <Database className="w-12 h-12 text-slate-100 mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No matching records</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={`bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden ${isSidebarMinimized ? 'lg:col-span-1' : 'lg:col-span-2'} flex flex-col min-h-[500px] lg:h-[750px] transition-all duration-300`}>
                {selectedPatient ? (
                  <div className="flex flex-col h-full relative">
                    {isSidebarMinimized && (
                      <button 
                        onClick={() => setIsSidebarMinimized(false)}
                        className="absolute left-6 top-6 z-10 p-3 bg-white border border-slate-100 rounded-2xl shadow-xl text-hospital-600 hover:text-hospital-700 hover:scale-105 transition-all animate-in zoom-in-50"
                        title="Show Directory"
                      >
                        <LayoutPanelLeft className="w-5 h-5" />
                      </button>
                    )}

                    <div className={`p-4 sm:p-6 bg-slate-50 border-b ${isSidebarMinimized ? 'pl-20' : ''}`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
                        <div className="bg-white border border-indigo-100 p-3 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1"><User className="w-3 h-3 text-indigo-500" /><span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Name</span></div>
                          <div className="text-sm font-black text-indigo-900 truncate leading-tight">{selectedPatient.name}</div>
                        </div>
                        <div className="bg-white border border-blue-100 p-3 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1"><Activity className="w-3 h-3 text-blue-500" /><span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Age / Gender</span></div>
                          <div className="text-sm font-black text-blue-900 leading-tight">{selectedPatient.age}Y | {selectedPatient.gender}</div>
                        </div>
                        <div className="bg-white border border-teal-100 p-3 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1"><Share2 className="w-3 h-3 text-teal-500" /><span className="text-[8px] font-black text-teal-400 uppercase tracking-widest">Source</span></div>
                          <div className="text-sm font-black text-teal-900 truncate leading-tight uppercase">
                            {selectedPatient.source === 'Doctor Recommended' 
                              ? `Dr. ${selectedPatient.sourceDoctorName || 'Recommended'}` 
                              : (selectedPatient.source.startsWith('Other: ') ? selectedPatient.source.substring(7) : selectedPatient.source)
                            }
                          </div>
                        </div>
                        <div className="bg-white border border-rose-100 p-3 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1"><ShieldCheck className="w-3 h-3 text-rose-500" /><span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Insurance Name</span></div>
                          <div className="text-sm font-black text-rose-900 truncate leading-tight">{selectedPatient.insuranceName || 'No'}</div>
                        </div>
                        <div className="bg-white border border-amber-100 p-3 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1"><Briefcase className="w-3 h-3 text-amber-500" /><span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Occupation</span></div>
                          <div className="text-sm font-black text-amber-900 truncate leading-tight">{selectedPatient.occupation || '---'}</div>
                        </div>
                        <div className="bg-white border border-purple-100 p-3 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1"><Tag className="w-3 h-3 text-purple-500" /><span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Condition</span></div>
                          <div className="text-sm font-black text-purple-900 truncate leading-tight">{selectedPatient.condition}</div>
                        </div>
                        <div className={`${selectedPatient.packageProposal?.outcome === 'Completed' ? 'bg-teal-50 border-teal-100' : 'bg-emerald-50 border-emerald-100'} border p-3 rounded-2xl shadow-sm`}>
                          <div className="flex items-center gap-1.5 mb-1">
                             <Clock className={`w-3 h-3 ${selectedPatient.packageProposal?.outcome === 'Completed' ? 'text-teal-500' : 'text-emerald-500'}`} />
                             <span className={`text-[8px] font-black ${selectedPatient.packageProposal?.outcome === 'Completed' ? 'text-teal-400' : 'text-emerald-400'} uppercase tracking-widest`}>
                               {selectedPatient.packageProposal?.outcome === 'Completed' ? 'Completion Date' : 'Status Date'}
                             </span>
                          </div>
                          <div className={`text-sm font-black ${selectedPatient.packageProposal?.outcome === 'Completed' ? 'text-teal-900' : 'text-emerald-900'} truncate leading-tight`}>
                            {selectedPatient.packageProposal?.outcome === 'Completed' 
                              ? formatToDDMMYYYY(selectedPatient.completed_surgery || selectedPatient.packageProposal?.outcomeDate)
                              : selectedPatient.status_updated_at ? formatToDDMMYYYY(selectedPatient.status_updated_at) : '---'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    <form onSubmit={handleSaveProposal} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-10">
                      <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[2rem] space-y-5">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]"><Stethoscope className="w-4 h-4" /> Recommendation</div>
                         </div>
                         <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                           <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Recommended Procedure</div>
                           <div className="text-sm font-black text-blue-700 uppercase">
                             {selectedPatient.doctorAssessment?.surgeryProcedure === 'Other' 
                               ? (selectedPatient.doctorAssessment?.otherSurgeryName || 'OTHER PROCEDURE') 
                               : (selectedPatient.doctorAssessment?.surgeryProcedure || 'NOT SPECIFIED')}
                           </div>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['Evaluator', 'Pain', 'Affordability', 'Readiness'].map((label, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-2xl border border-blue-50 shadow-sm">
                                <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
                                <div className="text-[10px] font-black text-blue-700 truncate">
                                  {idx === 0 ? selectedPatient.doctorAssessment?.doctorSignature || '---' : 
                                   idx === 1 ? selectedPatient.doctorAssessment?.painSeverity || '---' :
                                   idx === 2 ? selectedPatient.doctorAssessment?.affordability || '---' :
                                   selectedPatient.doctorAssessment?.conversionReadiness || '---'}
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="flex items-center gap-2 text-[10px] font-black uppercase text-hospital-600 tracking-[0.2em]"><Banknote className="w-4 h-4" /> Package & Financials</div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-6">
                            <div className="sm:col-span-2 xl:col-span-1">
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Mode of Payment</label>
                               <div className="relative">
                                  <select 
                                    className={selectClasses} 
                                    value={proposal.modeOfPayment || ''} 
                                    onChange={e => setProposal({...proposal, modeOfPayment: e.target.value as any})}
                                  >
                                    <option value="" disabled>Select Payment Mode</option>
                                    {['Cash', 'Insurance', 'Partly', 'Insurance Approved'].map(mode => (
                                      <option key={mode} value={mode}>{mode}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                               </div>
                            </div>
                            <div>
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Package Amount (₹)</label>
                               <input type="text" className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-black focus:bg-white focus:border-hospital-500 outline-none" value={proposal.packageAmount || ''} onChange={e => setProposal({...proposal, packageAmount: e.target.value})} placeholder="e.g. 50,000" />
                            </div>
                            <div>
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Stay (Days)</label>
                               <input type="number" className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-black focus:bg-white focus:border-hospital-500 outline-none" value={proposal.stayDays || ''} onChange={e => setProposal({...proposal, stayDays: e.target.value ? parseInt(e.target.value, 10) : undefined})} placeholder="0" />
                            </div>
                            <div className="sm:col-span-2 xl:col-span-3">
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Room Type</label>
                               <div className="relative">
                                  <select 
                                    className={selectClasses} 
                                    value={proposal.roomType || ''} 
                                    onChange={v => setProposal({...proposal, roomType: v.target.value as any})}
                                  >
                                    <option value="" disabled>Select Room Category</option>
                                    {['Private', 'Deluxe', 'Semi', 'Economy'].map(room => (
                                      <option key={room} value={room}>{room}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                               </div>
                            </div>
                            <div className="sm:col-span-2 xl:col-span-3 pt-6 border-t border-slate-50">
                               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                  <div className="space-y-3">
                                     <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Medicines</label>
                                     <div className="relative">
                                        <select 
                                          className={selectClasses} 
                                          value={proposal.surgeryMedicines || ''} 
                                          onChange={v => setProposal({...proposal, surgeryMedicines: v.target.value as any})}
                                        >
                                          <option value="" disabled>Select</option>
                                          {['Included', 'Excluded'].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                     </div>
                                  </div>
                                  <div className="space-y-3">
                                     <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">ICU Charges</label>
                                     <div className="relative">
                                        <select 
                                          className={selectClasses} 
                                          value={proposal.icuCharges || ''} 
                                          onChange={v => setProposal({...proposal, icuCharges: v.target.value as any})}
                                        >
                                          <option value="" disabled>Select</option>
                                          {['Included', 'Excluded'].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                     </div>
                                  </div>
                                  <div className="space-y-3">
                                     <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Pre-Op Invest.</label>
                                     <div className="relative">
                                        <select 
                                          className={selectClasses} 
                                          value={proposal.preOpInvestigation || ''} 
                                          onChange={v => setProposal({...proposal, preOpInvestigation: v.target.value as any})}
                                        >
                                          <option value="" disabled>Select</option>
                                          {['Included', 'Excluded'].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                     </div>
                                  </div>
                               </div>
                            </div>
                            <div className="sm:col-span-2 xl:col-span-3 pt-6 border-t border-slate-50 space-y-4">
                               <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Post-Op Follow-Up</label>
                                  <div className="relative">
                                     <select 
                                       className={selectClasses} 
                                       value={proposal.postFollowUp || ''} 
                                       onChange={v => setProposal({...proposal, postFollowUp: v.target.value as any})}
                                     >
                                       <option value="" disabled>Select Option</option>
                                       {['Included', 'Excluded'].map(opt => (
                                         <option key={opt} value={opt}>{opt}</option>
                                       ))}
                                     </select>
                                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                  </div>
                               </div>
                               {proposal.postFollowUp === 'Included' && (
                                  <div className="animate-in slide-in-from-top-2 duration-300">
                                     <label className="block text-[10px] font-black uppercase text-hospital-600 mb-3 tracking-widest">Number of Follow-Up Days</label>
                                     <input 
                                       type="number" 
                                       className="w-full sm:w-48 p-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-black focus:bg-white focus:border-hospital-500 outline-none" 
                                       value={proposal.postFollowUpCount || ''} 
                                       onChange={e => setProposal({...proposal, postFollowUpCount: e.target.value ? parseInt(e.target.value, 10) : undefined})} 
                                       placeholder="e.g. 5"
                                     />
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>

                      <div className="pt-8 border-t border-slate-100 space-y-8">
                         <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em]"><MessageSquareQuote className="w-4 h-4" /> Counseling Insights</div>
                         <div className="grid grid-cols-1 gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div>
                                   <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Proposal Stage</label>
                                   <div className="relative">
                                      <select 
                                        className={selectClasses} 
                                        value={proposal.proposalStage || ''} 
                                        onChange={v => setProposal({...proposal, proposalStage: v.target.value})}
                                      >
                                        <option value="" disabled>Select Stage</option>
                                        {Object.keys(PROPOSAL_STAGES).map(stage => (
                                          <option key={stage} value={stage}>{stage} – {PROPOSAL_STAGES[stage]}%</option>
                                        ))}
                                      </select>
                                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                   </div>
                                </div>
                                {proposal.proposalStage && (
                                  <div className="bg-hospital-50 border border-hospital-100 px-6 py-3 rounded-2xl flex items-center justify-between animate-in zoom-in-95">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-hospital-100 rounded-lg text-hospital-600">
                                        <Gauge className="w-4 h-4" />
                                      </div>
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Probability</span>
                                    </div>
                                    <span className="text-2xl font-black text-hospital-700">{PROPOSAL_STAGES[proposal.proposalStage]}%</span>
                                  </div>
                                )}
                            </div>
                            <div>
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Decision Pattern</label>
                               <div className="relative">
                                  <select 
                                    className={selectClasses} 
                                    value={proposal.decisionPattern || ''} 
                                    onChange={v => setProposal({...proposal, decisionPattern: v.target.value})}
                                  >
                                    <option value="" disabled>Select Decision Pattern</option>
                                    {['Trust', 'PDC', 'Package Not Proposed', 'Standard', 'General Procedure', 'Management Discount'].map(pattern => (
                                      <option key={pattern} value={pattern}>{pattern}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                               </div>
                            </div>
                            <div>
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-2">
                                 <FileText className="w-3 h-3" /> Counseling Notes / Remarks
                               </label>
                               <textarea 
                                 className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-hospital-500 outline-none min-h-[120px] transition-all" 
                                 value={proposal.remarks || ''} 
                                 onChange={e => setProposal({...proposal, remarks: e.target.value})} 
                                 placeholder="Enter strict reference notes, observations, or specific remarks here..."
                               />
                            </div>
                         </div>
                      </div>

                      <div className="pt-8 border-t border-slate-100">
                        {selectedPatient.packageProposal?.outcome === 'Completed' ? (
                          <div className="bg-teal-50 border border-teal-100 p-6 rounded-[2rem] flex items-center gap-4 text-teal-800 animate-in fade-in">
                            <BadgeCheck className="w-10 h-10 opacity-40" />
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest mb-1">Final Outcome</div>
                              <div className="text-lg font-black uppercase">Surgery Successfully Completed</div>
                              <div className="text-[10px] font-bold mt-1 text-teal-600">COMPLETED DATE: {formatToDDMMYYYY(selectedPatient.completed_surgery || selectedPatient.packageProposal?.outcomeDate)}</div>
                            </div>
                          </div>
                        ) : selectedPatient.packageProposal?.outcome === 'Lost' ? (
                          <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 text-rose-800 animate-in fade-in">
                            <Ban className="w-10 h-10 opacity-40" />
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest mb-1">Final Outcome</div>
                              <div className="text-lg font-black uppercase">Surgery Lead Lost</div>
                              <div className="text-[10px] font-bold mt-1 text-rose-600">LOST DATE: {formatToDDMMYYYY(selectedPatient.surgery_lost_date || selectedPatient.packageProposal?.outcomeDate)}</div>
                              <div className="text-[10px] font-bold text-rose-400 mt-1 uppercase tracking-tight">Reason: {selectedPatient.packageProposal?.lostReason || 'Not Specified'}</div>
                            </div>
                          </div>
                        ) : selectedPatient.packageProposal?.outcome === 'Scheduled' ? (
                           <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center gap-4 text-emerald-800 mb-6 animate-in fade-in">
                            <CalendarClock className="w-10 h-10 opacity-40" />
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest mb-1">Status</div>
                              <div className="text-lg font-black uppercase">Surgery Scheduled</div>
                              <div className="text-[10px] font-bold mt-1 text-emerald-600">SURGERY DATE: {formatToDDMMYYYY(selectedPatient.surgery_date || selectedPatient.packageProposal?.surgeryDate)}</div>
                            </div>
                          </div>
                        ) : null}
                        
                        {(selectedPatient.packageProposal?.outcome !== 'Completed') && (
                          <div className="space-y-6 animate-in slide-in-from-bottom-2">
                             {renderActionButtons(selectedPatient.packageProposal?.outcome)}
                          </div>
                        )}
                        <button type="submit" className="w-full mt-6 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-hospital-600 transition-colors">Update Details Only</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 relative">
                     {isSidebarMinimized && (
                      <button 
                        onClick={() => setIsSidebarMinimized(false)}
                        className="absolute left-6 top-6 z-10 p-3 bg-white border border-slate-100 rounded-2xl shadow-xl text-hospital-600 hover:text-hospital-700 hover:scale-105 transition-all animate-in zoom-in-50"
                        title="Show Directory"
                      >
                        <LayoutPanelLeft className="w-5 h-5" />
                      </button>
                    )}
                    <Briefcase className="w-24 h-24 mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Select a candidate from the directory</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-10 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">Table View Not Implemented</div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">Staff Management View</div>
      )}

      {outcomeModal.show && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
            <header className={`p-6 border-b flex justify-between items-center ${outcomeModal.type === 'Lost' ? 'bg-rose-50 text-rose-900' : 'bg-emerald-50 text-emerald-900'}`}>
              <h3 className="text-xl font-black uppercase tracking-tight">Finalizing: {outcomeModal.type}</h3>
              <button onClick={() => setOutcomeModal({ ...outcomeModal, show: false })}><X className="w-6 h-6 text-slate-400" /></button>
            </header>
            <div className="p-10 space-y-8">
               {outcomeModal.type !== 'Lost' ? (
                 <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Select {outcomeModal.type === 'Follow-Up' ? 'Follow-Up' : 'Surgery'} Date</label>
                    <input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-hospital-500 transition-all" value={outcomeModal.date} onChange={e => setOutcomeModal({ ...outcomeModal, date: e.target.value })} />
                 </div>
               ) : (
                 <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Reason</label>
                    <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-hospital-500 transition-all" value={outcomeModal.reason} onChange={e => setOutcomeModal({ ...outcomeModal, reason: e.target.value })}>{lostReasons.map(r => <option key={r} value={r}>{r}</option>)}</select>
                 </div>
               )}
            </div>
            <footer className="p-8 border-t flex flex-col sm:flex-row gap-4 bg-slate-50/50">
              <button onClick={() => setOutcomeModal({ ...outcomeModal, show: false })} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
              <button onClick={handleConfirmOutcome} className={`flex-1 py-4 text-[10px] font-black uppercase text-white rounded-xl shadow-xl transition-transform active:scale-95 ${outcomeModal.type === 'Lost' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>Confirm</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
