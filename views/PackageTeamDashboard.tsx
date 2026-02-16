import React, { useState, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { ExportButtons } from '../components/ExportButtons';
import { Patient, PackageProposal, Role, SurgeonCode, ProposalOutcome } from '../types';
import { Briefcase, Calendar, Users, BadgeCheck, User, Activity, ShieldCheck, Banknote, Trash2, Clock, X, Share2, Stethoscope, LayoutList, Columns, Search, Phone, Filter, Tag, CalendarClock, Ban, ChevronLeft, ChevronRight, LayoutPanelLeft, MessageSquareQuote, FileText, ChevronDown, AlertCircle, RefreshCcw, Database, Gauge, AlertTriangle } from 'lucide-react';

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
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date).replace(/\//g, '-');
};

const formatToDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  return `${getPart('day')}-${getPart('month')}-${getPart('year')} ${getPart('hour')}:${getPart('minute')}`;
};

export const PackageTeamDashboard: React.FC = () => {
  const { patients, updatePackageProposal, staffUsers, registerStaff } = useHospital();
  
  const [activeTab, setActiveTab] = useState<'counseling' | 'staff'>('counseling');
  const [listCategory, setListCategory] = useState<'PENDING' | 'SCHEDULED' | 'FOLLOWUP' | 'COMPLETED' | 'LOST'>('PENDING');
  const [viewMode, setViewMode] = useState<'split' | 'table'>('split');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  // Set default filter dates to empty strings
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

    if (listCategory === 'PENDING') {
      // Pending directory logic
    } else if (listCategory === 'SCHEDULED') {
      if (outcome !== 'Scheduled') return false;
    } else if (listCategory === 'FOLLOWUP') {
      if (outcome !== 'Follow-Up') return false;
    } else if (listCategory === 'COMPLETED') {
      if (outcome !== 'Completed') return false;
    } else if (listCategory === 'LOST') {
      if (outcome !== 'Lost') return false;
    }

    // Category-specific filtering as requested
    if (startDate || endDate) {
      let filterDate = '';
      if (listCategory === 'PENDING') {
        filterDate = p.entry_date || ''; // Leads: Arrived Date
      } else if (listCategory === 'SCHEDULED') {
        filterDate = p.surgery_date || p.packageProposal?.surgeryDate || ''; // Scheduled: Surgery Date
      } else if (listCategory === 'FOLLOWUP') {
        filterDate = p.followup_date || p.packageProposal?.followUpDate || ''; // Follow-up: Follow-up Date
      } else if (listCategory === 'COMPLETED') {
        filterDate = p.completed_surgery || p.packageProposal?.outcomeDate || ''; // Completed: Completed Date
      } else if (listCategory === 'LOST') {
        filterDate = p.surgery_lost_date || p.packageProposal?.outcomeDate || ''; // Lost: Lost Date
      }

      if (startDate && filterDate < startDate) return false;
      if (endDate && filterDate > endDate) return false;
    }

    if (probabilityFilter !== 'ALL') {
      const stage = p.packageProposal?.proposalStage;
      if (!stage) return false;
      const prob = PROPOSAL_STAGES[stage];
      if (prob?.toString() !== probabilityFilter) return false;
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
    // Prioritize Overdue records (Date crossed) for Scheduled and Follow-up sections
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = (p: Patient) => {
      if (listCategory === 'SCHEDULED') {
        const d = p.surgery_date || p.packageProposal?.surgeryDate;
        return d && d < todayStr;
      }
      if (listCategory === 'FOLLOWUP') {
        const d = p.followup_date || p.packageProposal?.followUpDate;
        return d && d < todayStr;
      }
      return false;
    };

    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Default sort by update time
    const timeA = new Date(a.updated_at || a.registeredAt || 0).getTime();
    const timeB = new Date(b.updated_at || b.registeredAt || 0).getTime();
    return timeB - timeA;
  });

  const handlePatientSelect = (p: Patient) => {
    setSelectedPatient(p);
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
      ...(proposal as PackageProposal),
      outcome: outcomeModal.type!,
      outcomeDate: newOutcomeDate,
      surgeryDate: outcomeModal.type === 'Scheduled' ? newOutcomeDate : (proposal.surgeryDate || ''),
      lostReason: outcomeModal.type === 'Lost' ? outcomeModal.reason : undefined,
      proposalCreatedAt: proposal.proposalCreatedAt || new Date().toISOString(),
      followUpDate: (outcomeModal.type === 'Follow-Up' ? outcomeModal.date : proposal.followUpDate) || ''
    };
    await updatePackageProposal(selectedPatient.id, updatedProposal);
    setOutcomeModal({ ...outcomeModal, show: false });
  };

  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatient) {
      await updatePackageProposal(selectedPatient.id, {
        ...(proposal as PackageProposal),
        proposalCreatedAt: proposal.proposalCreatedAt || new Date().toISOString()
      });
      alert("Proposal details saved.");
    }
  };

  const selectClasses = "w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white focus:border-hospital-500 transition-all appearance-none cursor-pointer pr-10";
  const filterInputClasses = "h-10 w-full bg-slate-50 border border-slate-100 rounded-xl px-3 text-[10px] font-bold outline-none";

  const renderActionButtons = (currentOutcome: ProposalOutcome | undefined) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button type="button" onClick={() => handleOpenOutcomeModal('Scheduled')} className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg flex flex-col items-center gap-2 hover:bg-emerald-700 transition-all">
          <Calendar className="w-5 h-5" /> Schedule
        </button>
        <button type="button" onClick={() => handleOpenOutcomeModal('Follow-Up')} className="py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg flex flex-col items-center gap-2 hover:bg-blue-700 transition-all">
          <Clock className="w-5 h-5" /> Follow-Up
        </button>
        <button type="button" onClick={() => handleOpenOutcomeModal('Lost')} className="py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg flex flex-col items-center gap-2 hover:bg-rose-700 transition-all">
          <Trash2 className="w-5 h-5" /> Lost
        </button>
      </div>
    );
  };

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
                    className={filterInputClasses} 
                    value={probabilityFilter} 
                    onChange={e => setProbabilityFilter(e.target.value)}
                  >
                    <option value="ALL">ALL PROB.</option>
                    {Array.from(new Set(Object.values(PROPOSAL_STAGES))).sort((a, b) => a - b).map(prob => (
                      <option key={prob} value={prob.toString()}>{prob}%</option>
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

          <div className={`grid grid-cols-1 ${isSidebarMinimized ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6 transition-all duration-300`}>
            {!isSidebarMinimized && (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden h-[400px] lg:h-[750px] flex flex-col animate-in slide-in-from-left-4">
                <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsSidebarMinimized(true)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{listCategory} Directory</span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-hospital-50 text-hospital-600 border border-hospital-100">{allPatients.length}</span>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-2">
                  {allPatients.map((p) => {
                    const outcome = p.packageProposal?.outcome;
                    const movedDate = outcome === 'Scheduled' ? p.surgery_date : outcome === 'Follow-Up' ? p.followup_date : outcome === 'Completed' ? p.completed_surgery : outcome === 'Lost' ? p.surgery_lost_date : null;
                    
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isOverdue = (listCategory === 'SCHEDULED' || listCategory === 'FOLLOWUP') && movedDate && movedDate < todayStr;

                    return (
                      <div 
                        key={p.id}
                        onClick={() => handlePatientSelect(p)} 
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                          selectedPatient?.id === p.id 
                            ? 'border-hospital-500 bg-hospital-50 shadow-md' 
                            : isOverdue
                              ? 'border-rose-300 bg-rose-50 shadow-sm'
                              : 'border-slate-50 hover:border-slate-200 bg-white'
                        }`}
                      >
                        {isOverdue && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 text-[7px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse shadow-sm z-10">
                            <AlertTriangle className="w-2 h-2" /> OVERDUE
                          </div>
                        )}
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-slate-800 text-sm truncate pr-2">{p.name}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md shadow-sm border border-transparent whitespace-nowrap ${p.packageProposal?.outcome === 'Scheduled' ? 'bg-emerald-100 text-emerald-700' : p.packageProposal?.outcome === 'Completed' ? 'bg-teal-100 text-teal-700' : p.packageProposal?.outcome === 'Follow-Up' ? 'bg-blue-100 text-blue-700' : p.packageProposal?.outcome === 'Lost' ? 'bg-rose-100 text-rose-700' : 'bg-amber-50 text-amber-600'}`}>{p.packageProposal?.outcome || 'Pending Lead'}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest space-y-1">
                          <div className="flex items-center gap-1">Arrived: {formatToDDMMYYYY(p.entry_date)}</div>
                          {movedDate && (
                            <div className={`text-[9px] font-black flex items-center gap-1 ${isOverdue ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {outcome === 'Follow-Up' ? 'Follow-up' : outcome}: {formatToDDMMYYYY(movedDate)}
                            </div>
                          )}
                          {p.updated_at && (
                            <div className="text-[10px] font-black uppercase tracking-tight flex items-center gap-1 mt-2 text-slate-500 pt-2 border-t border-slate-50">
                              <RefreshCcw className="w-3 h-3 text-hospital-500" />
                              <span className="opacity-60 text-[9px]">UPDATED:</span>
                              <span className="text-slate-800 font-mono">{formatToDateTime(p.updated_at)}</span>
                            </div>
                          )}
                        </div>
                        {p.packageProposal?.proposalStage && (
                          <div className="mt-2 flex items-center gap-1.5">
                             <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
                                <Gauge className="w-2.5 h-2.5" /> {PROPOSAL_STAGES[p.packageProposal.proposalStage]}%
                             </span>
                          </div>
                        )}
                      </div>
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
                    <button onClick={() => setIsSidebarMinimized(false)} className="absolute left-6 top-6 z-10 p-3 bg-white border border-slate-100 rounded-2xl shadow-xl text-hospital-600 hover:text-hospital-700 hover:scale-105 transition-all animate-in zoom-in-50"><LayoutPanelLeft className="w-5 h-5" /></button>
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
                        <div className="text-sm font-black text-teal-900 truncate leading-tight uppercase">{selectedPatient.source}</div>
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
                      <div className="bg-white border border-emerald-100 p-3 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3 h-3 text-emerald-500" /><span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Status Date</span></div>
                        <div className="text-sm font-black text-emerald-900 truncate leading-tight">
                          {(() => {
                            const outcome = selectedPatient.packageProposal?.outcome;
                            const movedDate = outcome === 'Scheduled' ? selectedPatient.surgery_date : outcome === 'Follow-Up' ? selectedPatient.followup_date : outcome === 'Completed' ? selectedPatient.completed_surgery : outcome === 'Lost' ? selectedPatient.surgery_lost_date : null;
                            return movedDate ? formatToDDMMYYYY(movedDate) : '---';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProposal} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-10">
                    {/* Doctor Recommendation Summary */}
                    <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[2rem] space-y-5">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]"><Stethoscope className="w-4 h-4" /> Recommendation</div>
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

                    {/* Financial Options Section */}
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
                          
                          {/* Option Dropdowns Grid */}
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

                    {/* Counseling Insights Section */}
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
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2">
                               <FileText className="w-3 h-3" /> Counseling Notes / Remarks
                             </label>
                             <textarea 
                               className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-hospital-500 outline-none min-h-[120px] transition-all" 
                               value={proposal.remarks || ''} 
                               onChange={e => setProposal({...proposal, remarks: e.target.value})} 
                               placeholder="Enter specific notes, observations, or remarks here..."
                             />
                          </div>
                       </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                       {renderActionButtons(selectedPatient.packageProposal?.outcome)}
                       <button type="submit" className="w-full mt-6 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-hospital-600 transition-colors">Update Details Only</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 relative">
                  {isSidebarMinimized && (
                    <button onClick={() => setIsSidebarMinimized(false)} className="absolute left-6 top-6 z-10 p-3 bg-white border border-slate-100 rounded-2xl shadow-xl text-hospital-600 hover:text-hospital-700 transition-all animate-in zoom-in-50"><LayoutPanelLeft className="w-5 h-5" /></button>
                  )}
                  <Briefcase className="w-24 h-24 mb-6 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Select a candidate from the directory</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">Staff Management View</div>
      )}

      {outcomeModal.show && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
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