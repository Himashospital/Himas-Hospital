import React, { useState, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { ExportButtons } from '../components/ExportButtons';
import { Patient, PackageProposal, Role, SurgeonCode, ProposalOutcome } from '../types';
import { Briefcase, Calendar, Users, BadgeCheck, User, Activity, ShieldCheck, Banknote, Trash2, Clock, X, Share2, Stethoscope, LayoutList, Columns, Search, Phone } from 'lucide-react';

// Helper to format any ISO/YYYY-MM-DD date to DD-MM-YYYY
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

export const PackageTeamDashboard: React.FC = () => {
  const { patients, updatePackageProposal, staffUsers, registerStaff } = useHospital();
  
  const [activeTab, setActiveTab] = useState<'counseling' | 'staff'>('counseling');
  const [listCategory, setListCategory] = useState<'PENDING' | 'SCHEDULED' | 'FOLLOWUP' | 'COMPLETED' | 'LOST'>('PENDING');
  const [viewMode, setViewMode] = useState<'split' | 'table'>('split');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'CR1' | 'CR2' | 'CR3' | 'CR4'>('ALL');
  
  const [outcomeModal, setOutcomeModal] = useState<{
    show: boolean;
    type: ProposalOutcome | null;
    date: string;
    reason: string;
  }>({
    show: false,
    type: null,
    date: new Date().toISOString().split('T')[0],
    reason: ''
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
    lostReason: ''
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

  const lostReasons = [
    "Cost / Financial Constraints",
    "Family not in agreement",
    "Opted for Conservative Treatment",
    "Sought Second Opinion Elsewhere",
    "Insurance Rejection",
    "Fear of Surgery",
    "Personal / Non-Medical Reasons"
  ];

  const allPatients = [...patients].filter(p => {
    if (p.doctorAssessment?.quickCode !== SurgeonCode.S1) return false;
    
    const outcome = p.packageProposal?.outcome;
    if (listCategory === 'PENDING') {
      if (outcome) return false;
    } else if (listCategory === 'SCHEDULED') {
      if (outcome !== 'Scheduled') return false;
    } else if (listCategory === 'FOLLOWUP') {
      if (outcome !== 'Follow-Up') return false;
    } else if (listCategory === 'COMPLETED') {
      if (outcome !== 'Completed') return false;
    } else if (listCategory === 'LOST') {
      if (outcome !== 'Lost') return false;
    }

    if (listCategory === 'PENDING' && filter !== 'ALL') {
      if (!p.doctorAssessment?.conversionReadiness?.startsWith(filter)) return false;
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
      const dateA = a.packageProposal?.followUpDate ? new Date(a.packageProposal.followUpDate).getTime() : Infinity;
      const dateB = b.packageProposal?.followUpDate ? new Date(b.packageProposal.followUpDate).getTime() : Infinity;
      return dateA - dateB; 
    }
    const dateA = a.entry_date ? new Date(a.entry_date).getTime() : new Date(a.registeredAt).getTime();
    const dateB = b.entry_date ? new Date(b.entry_date).getTime() : new Date(a.registeredAt).getTime();
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
    setListCategory('COMPLETED');
  };

  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatient) {
      await updatePackageProposal(selectedPatient.id, {
        ...proposal as PackageProposal,
        proposalCreatedAt: proposal.proposalCreatedAt || new Date().toISOString()
      });
      alert("Basic proposal details saved.");
    }
  };

  const ToggleButton: React.FC<{ label: string, value: any, current: any, onClick: (v: any) => void }> = ({ label, value, current, onClick }) => (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 py-2 px-3 text-[10px] font-black uppercase rounded-lg border transition-all ${
        current === value 
          ? 'bg-hospital-600 text-white border-hospital-600 shadow-sm' 
          : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  );

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button type="button" onClick={() => handleOpenOutcomeModal('Scheduled')} className="py-4 sm:py-6 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex flex-col items-center gap-2">
            <Calendar className="w-5 h-5" /> Scheduled
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
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-full xl:w-auto overflow-x-auto whitespace-nowrap scrollbar-hide">
              {['PENDING', 'SCHEDULED', 'FOLLOWUP', 'COMPLETED', 'LOST'].map((cat) => (
                <button key={cat} onClick={() => setListCategory(cat as any)} className={`px-4 lg:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${listCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                  {cat === 'PENDING' && <Activity className="w-4 h-4" />}
                  {cat === 'SCHEDULED' && <Calendar className="w-4 h-4" />}
                  {cat === 'FOLLOWUP' && <Clock className="w-4 h-4" />}
                  {cat === 'COMPLETED' && <BadgeCheck className="w-4 h-4" />}
                  {cat === 'LOST' && <Trash2 className="w-4 h-4" />}
                  {cat.replace('PENDING', 'Leads').replace('FOLLOWUP', 'Follow-Up')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Quick Search..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-hospital-500 outline-none transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="bg-white border p-1 rounded-xl flex shadow-sm">
                <button onClick={() => setViewMode('split')} className={`p-2 rounded-lg transition-all ${viewMode === 'split' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}><Columns className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}><LayoutList className="w-4 h-4" /></button>
              </div>
              <ExportButtons patients={patients} role="package_team" selectedPatient={selectedPatient} />
            </div>
          </div>

          {viewMode === 'split' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden h-[400px] lg:h-[750px] flex flex-col">
                <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{listCategory} Directory</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${listCategory === 'LOST' ? 'bg-rose-50 text-rose-600' : 'bg-hospital-50 text-hospital-600'}`}>{allPatients.length}</span>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-2">
                  {allPatients.map(p => (
                    <div key={p.id} onClick={() => handlePatientSelect(p)} className={`p-4 rounded-2xl border transition-all ${selectedPatient?.id === p.id ? 'border-hospital-500 bg-hospital-50 shadow-md' : 'border-slate-50 hover:border-slate-200 bg-white'}`}>
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${p.packageProposal?.outcome === 'Scheduled' ? 'bg-emerald-50 text-emerald-600' : p.packageProposal?.outcome === 'Completed' ? 'bg-teal-50 text-teal-600' : p.packageProposal?.outcome === 'Follow-Up' ? 'bg-blue-50 text-blue-600' : p.packageProposal?.outcome === 'Lost' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{p.packageProposal?.outcome || 'Pending'}</span>
                      </div>
                      <div className="mt-2 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{p.condition}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-black uppercase">Arrived</span>
                            <span className="text-hospital-600 font-bold">{formatToDDMMYYYY(p.entry_date)}</span>
                          </div>
                        </div>
                        {listCategory === 'FOLLOWUP' && (
                          <div className="text-slate-400 font-black mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-500" />
                            <span>Follow-Up:</span>
                            <span className="text-blue-600 font-black">
                              {formatToDDMMYYYY(p.packageProposal?.followUpDate) || 
                               formatToDDMMYYYY(p.doctorAssessment?.tentativeSurgeryDate) || 
                               'PENDING'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {allPatients.length === 0 && <div className="p-10 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">No patients found</div>}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden lg:col-span-2 flex flex-col min-h-[500px] lg:h-[750px]">
                {selectedPatient ? (
                  <div className="flex flex-col h-full">
                    <div className="p-4 sm:p-6 bg-slate-50 border-b">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
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
                          <div className="text-sm font-black text-teal-900 truncate leading-tight">{selectedPatient.source}</div>
                        </div>
                        <div className="bg-white border border-rose-100 p-3 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1"><ShieldCheck className="w-3 h-3 text-rose-500" /><span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Insurance Name</span></div>
                          <div className="text-sm font-black text-rose-900 truncate leading-tight">{selectedPatient.insuranceName || 'No'}</div>
                        </div>
                      </div>
                    </div>
                    <form onSubmit={handleSaveProposal} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-10">
                      {/* Doctor Recommendation Summary */}
                      <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[2rem] space-y-5">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]"><Stethoscope className="w-4 h-4" /> Recommendation</div>
                         </div>
                         <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                           <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Recommended Procedure</div>
                           <div className="text-sm font-black text-blue-700 uppercase">{selectedPatient.doctorAssessment?.surgeryProcedure || 'NOT SPECIFIED'}</div>
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
                            {/* Mode of Payment */}
                            <div className="sm:col-span-2 xl:col-span-1">
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Mode of Payment</label>
                               <div className="flex flex-wrap gap-2">
                                  {['Cash', 'Insurance', 'Partly', 'Insurance Approved'].map(mode => (
                                    <ToggleButton key={mode} label={mode} value={mode} current={proposal.modeOfPayment} onClick={v => setProposal({...proposal, modeOfPayment: v})} />
                                  ))}
                               </div>
                            </div>

                            {/* Package Amount */}
                            <div>
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Package Amount (₹)</label>
                               <input type="text" className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-black focus:bg-white focus:border-hospital-500 outline-none" value={proposal.packageAmount || ''} onChange={e => setProposal({...proposal, packageAmount: e.target.value})} placeholder="e.g. 50,000" />
                            </div>

                            {/* Stay Days */}
                            <div>
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Stay (Days)</label>
                               <input type="number" className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-black focus:bg-white focus:border-hospital-500 outline-none" value={proposal.stayDays || ''} onChange={e => setProposal({...proposal, stayDays: e.target.value ? parseInt(e.target.value, 10) : undefined})} placeholder="0" />
                            </div>

                            {/* Room Type */}
                            <div className="sm:col-span-2 xl:col-span-3">
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Room Type</label>
                               <div className="flex flex-wrap gap-2">
                                  {['Private', 'Deluxe', 'Semi', 'Economy'].map(room => (
                                    <ToggleButton key={room} label={room} value={room} current={proposal.roomType} onClick={v => setProposal({...proposal, roomType: v})} />
                                  ))}
                               </div>
                            </div>

                            {/* Detailed Inclusions */}
                            <div className="sm:col-span-2 xl:col-span-3 pt-6 border-t border-slate-50">
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                  {/* Medicines */}
                                  <div className="space-y-3">
                                     <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Medicines</label>
                                     <div className="flex gap-1">
                                        {['Included', 'Excluded'].map(opt => (
                                          <ToggleButton key={opt} label={opt} value={opt} current={proposal.surgeryMedicines} onClick={v => setProposal({...proposal, surgeryMedicines: v})} />
                                        ))}
                                     </div>
                                  </div>

                                  {/* ICU Charges */}
                                  <div className="space-y-3">
                                     <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">ICU Charges</label>
                                     <div className="flex gap-1">
                                        {['Included', 'Excluded'].map(opt => (
                                          <ToggleButton key={opt} label={opt} value={opt} current={proposal.icuCharges} onClick={v => setProposal({...proposal, icuCharges: v})} />
                                        ))}
                                     </div>
                                  </div>

                                  {/* Pre-Op Investigation */}
                                  <div className="space-y-3">
                                     <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Pre-Op Invest.</label>
                                     <div className="flex gap-1">
                                        {['Included', 'Excluded'].map(opt => (
                                          <ToggleButton key={opt} label={opt} value={opt} current={proposal.preOpInvestigation} onClick={v => setProposal({...proposal, preOpInvestigation: v})} />
                                        ))}
                                     </div>
                                  </div>

                                  {/* Equipment */}
                                  <div className="space-y-3">
                                     <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Equipment</label>
                                     <div className="flex gap-1">
                                        {['Included', 'Excluded'].map(opt => (
                                          <ToggleButton key={opt} label={opt} value={opt} current={proposal.equipment} onClick={v => setProposal({...proposal, equipment: v})} />
                                        ))}
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {/* Post-Op Follow-Up */}
                            <div className="sm:col-span-2 xl:col-span-3 pt-6 border-t border-slate-50 space-y-4">
                               <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Post-Op Follow-Up</label>
                                  <div className="flex flex-wrap gap-2">
                                     {['Included', 'Excluded'].map(opt => (
                                       <ToggleButton key={opt} label={opt} value={opt} current={proposal.postFollowUp} onClick={v => setProposal({...proposal, postFollowUp: v})} />
                                     ))}
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

                      {/* Outcome Actions */}
                      <div className="pt-8 border-t border-slate-100">
                        {selectedPatient.packageProposal?.outcome === 'Completed' ? (
                          <div className="bg-teal-50 border border-teal-100 p-6 rounded-[2rem] flex items-center gap-4 text-teal-800 animate-in fade-in">
                            <BadgeCheck className="w-10 h-10 opacity-40" />
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest mb-1">Final Outcome</div>
                              <div className="text-lg font-black uppercase">Surgery Successfully Completed</div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6 animate-in slide-in-from-bottom-2">
                             {renderActionButtons(selectedPatient.packageProposal?.outcome)}
                          </div>
                        )}
                        <button type="submit" className="w-full mt-6 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-hospital-600 transition-colors">Update Details Only</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10">
                    <Briefcase className="w-20 h-20 mb-6" />
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

      {/* Outcome Modal */}
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
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Date</label>
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
