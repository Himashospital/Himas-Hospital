
import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { ExportButtons } from '../components/ExportButtons';
import { generateCounselingStrategy } from '../services/geminiService';
import { Patient, PackageProposal, Role, StaffUser, SurgeonCode, ProposalOutcome, ConversionReadiness } from '../types';
import { Briefcase, Calendar, MessageCircle, AlertTriangle, Wand2, CheckCircle2, UserPlus, Users, BadgeCheck, Mail, Phone, User, Lock, Loader2, Sparkles, Activity, ShieldCheck, FileText, Banknote, CreditCard, Bed, ClipboardList, Info, Trash2, Clock, Check, X, Share2, Stethoscope, LayoutList, Columns } from 'lucide-react';

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '';

  const datePart = dateString.split('T')[0];
  const parts = datePart.split('-');

  if (parts.length === 3) {
    // Check for DD-MM-YYYY format and convert
    if (parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // Assume YYYY-MM-DD if not the above, and return the clean date part
    return datePart;
  }
  
  // Fallback for any other format that isn't dash-separated
  return dateString;
};

export const PackageTeamDashboard: React.FC = () => {
  const { patients, updatePackageProposal, staffUsers, registerStaff } = useHospital();
  
  // Tabs: 'counseling' | 'staff'
  const [activeTab, setActiveTab] = useState<'counseling' | 'staff'>('counseling');
  // List Category: 'PENDING' | 'SCHEDULED' | 'FOLLOWUP' | 'LOST'
  const [listCategory, setListCategory] = useState<'PENDING' | 'SCHEDULED' | 'FOLLOWUP' | 'LOST'>('PENDING');
  // View Mode: 'split' (List + Form) | 'table' (Full Table)
  const [viewMode, setViewMode] = useState<'split' | 'table'>('split');

  // --- Counseling State ---
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'CR1' | 'CR2' | 'CR3' | 'CR4'>('ALL');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Outcome Modal State
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

  const [proposal, setProposal] = useState<Partial<PackageProposal>>({
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
    postFollowUp: undefined,
    surgeryDate: '',
    remarks: '',
    outcome: undefined,
    outcomeDate: '',
    lostReason: ''
  });

  const lostReasons = [
    "Cost / Financial Constraints",
    "Family not in agreement",
    "Opted for Conservative Treatment",
    "Sought Second Opinion Elsewhere",
    "Insurance Rejection",
    "Fear of Surgery",
    "Personal / Non-Medical Reasons"
  ];

  // --- Logic ---
  const allPatients = [...patients].filter(p => {
    // 1. Must be surgery recommended
    if (p.doctorAssessment?.quick_code !== SurgeonCode.S1) return false;

    // 2. Filter by Outcome Category
    const outcome = p.packageProposal?.outcome;
    if (listCategory === 'PENDING') {
      if (outcome) return false; // Hide if already has an outcome
    } else if (listCategory === 'SCHEDULED') {
      if (outcome !== 'Scheduled') return false;
    } else if (listCategory === 'FOLLOWUP') {
      if (outcome !== 'Follow-Up') return false;
    } else if (listCategory === 'LOST') {
      if (outcome !== 'Lost') return false;
    }

    // 3. Filter by Conversion Readiness (only for Pending)
    if (listCategory === 'PENDING' && filter !== 'ALL') {
      return p.doctorAssessment?.conversion_readiness?.startsWith(filter);
    }
    
    return true;
  }).sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

  const handlePatientSelect = (p: Patient) => {
    setSelectedPatient(p);
    setViewMode('split'); // Always switch back to split view for editing
    if (p.packageProposal) {
      setProposal({ ...p.packageProposal });
    } else {
      setProposal({
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
        postFollowUp: undefined,
        surgeryDate: '',
        remarks: '',
        outcome: undefined,
        outcomeDate: '',
        lostReason: ''
      });
    }
  };

  const handleOpenOutcomeModal = (type: ProposalOutcome) => {
    setOutcomeModal({
      show: true,
      type,
      date: new Date().toISOString().split('T')[0],
      reason: lostReasons[0]
    });
  };

  const handleConfirmOutcome = () => {
    if (!selectedPatient) return;
    
    const updatedProposal: PackageProposal = {
      ...proposal as PackageProposal,
      outcome: outcomeModal.type!,
      outcomeDate: outcomeModal.type !== 'Lost' ? outcomeModal.date : undefined,
      lostReason: outcomeModal.type === 'Lost' ? outcomeModal.reason : undefined,
      proposalCreatedAt: proposal.proposalCreatedAt || new Date().toISOString()
    };

    updatePackageProposal(selectedPatient.id, updatedProposal);
    setOutcomeModal({ ...outcomeModal, show: false });
    setSelectedPatient(null);
  };

  const handleGenerateAIStrategy = async () => {
    if (!selectedPatient) return;
    setAiLoading(true);
    try {
      const strategy = await generateCounselingStrategy(selectedPatient);
      setProposal(prev => ({ ...prev, counselingStrategy: strategy }));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatient) {
      updatePackageProposal(selectedPatient.id, {
        ...proposal as PackageProposal,
        proposalCreatedAt: new Date().toISOString()
      });
      alert("Basic proposal details saved.");
    }
  };

  const [newStaff, setNewStaff] = useState<{name: string, email: string, mobile: string, role: Role, password: string}>({
    name: '', email: '', mobile: '', role: 'FRONT_OFFICE', password: ''
  });
  const [staffSuccess, setStaffSuccess] = useState('');

  const handleRegisterStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, mobile, role, email, password } = newStaff;
    if (!name || !mobile || !role || !email || !password) return;
    
    // Safety check: ensure email check is null-safe
    const emailToLow = email.toLowerCase().trim();
    if (staffUsers.some(u => u.mobile === mobile || (u.email && u.email.toLowerCase() === emailToLow))) {
      alert("User with this mobile number or email already exists.");
      return;
    }
    registerStaff(newStaff);
    setStaffSuccess(`Successfully registered ${name} as ${role}`);
    setNewStaff({ name: '', email: '', mobile: '', role: 'FRONT_OFFICE', password: '' });
    setTimeout(() => setStaffSuccess(''), 3000);
  };

  const ToggleButton = ({ label, value, current, onClick }: { label: string, value: string, current: string | undefined, onClick: (v: any) => void }) => (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${
        current === value 
          ? 'bg-hospital-600 text-white border-hospital-600 shadow-sm' 
          : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Management Dashboard</h2>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Patient Counseling & Staff Hub</p>
        </div>
        
        <div className="flex bg-white rounded-xl p-1 border shadow-sm">
          <button
            onClick={() => setActiveTab('counseling')}
            className={`px-6 py-2.5 text-xs font-black uppercase rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'counseling' ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Counseling
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-6 py-2.5 text-xs font-black uppercase rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'staff' ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" /> Staff Admins
          </button>
        </div>
      </div>

      {activeTab === 'counseling' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Main List Sections Toggle */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
              <button onClick={() => setListCategory('PENDING')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${listCategory === 'PENDING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Activity className="w-4 h-4" /> Active Leads
              </button>
              <button onClick={() => setListCategory('SCHEDULED')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${listCategory === 'SCHEDULED' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                <Calendar className="w-4 h-4" /> Scheduled
              </button>
              <button onClick={() => setListCategory('FOLLOWUP')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${listCategory === 'FOLLOWUP' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                <Clock className="w-4 h-4" /> Follow-Up
              </button>
              <button onClick={() => setListCategory('LOST')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${listCategory === 'LOST' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                <Trash2 className="w-4 h-4" /> Lost
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white border p-1 rounded-xl flex shadow-sm">
                <button 
                  onClick={() => setViewMode('split')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'split' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                  title="Form View"
                >
                  <Columns className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                  title="Table View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
              <ExportButtons patients={patients} role="package_team" />
            </div>
          </div>

          {/* Sub-Filter for Pending Leads */}
          {listCategory === 'PENDING' && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['ALL', 'CR1', 'CR2', 'CR3', 'CR4'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === f ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-gray-50'
                  }`}
                >
                  {f === 'ALL' ? 'Global Leads' : `${f} Candidates`}
                </button>
              ))}
            </div>
          )}

          {viewMode === 'split' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* List */}
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden lg:col-span-1 h-[750px] flex flex-col">
                <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{listCategory} Directory</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${listCategory === 'LOST' ? 'bg-rose-50 text-rose-600' : 'bg-hospital-50 text-hospital-600'}`}>
                    {allPatients.length} records
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-2 bg-white">
                  {allPatients.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handlePatientSelect(p)}
                      className={`p-4 rounded-2xl border transition-all ${
                        selectedPatient?.id === p.id 
                          ? 'border-hospital-500 bg-hospital-50 shadow-md ring-2 ring-hospital-50' 
                          : 'border-slate-50 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          p.packageProposal?.outcome === 'Scheduled' ? 'bg-emerald-50 text-emerald-600' :
                          p.packageProposal?.outcome === 'Follow-Up' ? 'bg-blue-50 text-blue-600' :
                          p.packageProposal?.outcome === 'Lost' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {p.packageProposal?.outcome || 'Pending'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-2">
                        <Stethoscope className="w-3 h-3 text-hospital-400" />
                        {p.doctorAssessment?.doctor_signature || 'Unassigned Surgeon'}
                      </div>
                      <div className="mt-2 text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                        {p.condition}
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        {p.doctorAssessment?.conversion_readiness || 'LEAD'}
                      </div>
                    </div>
                  ))}
                  {allPatients.length === 0 && (
                    <div className="p-12 text-slate-300 text-center flex flex-col items-center gap-4">
                      <Activity className="w-12 h-12 text-slate-100" />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No patients in this category</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detail Form */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden lg:col-span-2 flex flex-col h-[750px]">
                {selectedPatient ? (
                  <div className="flex flex-col h-full">
                    <div className="p-8 bg-slate-50 border-b relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-hospital-500/10 blur-[50px] rounded-full -mr-16 -mt-16"></div>
                      <div className="relative z-10 flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedPatient.name}</h3>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex flex-wrap gap-x-6 gap-y-2">
                            <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> {selectedPatient.age} / {selectedPatient.gender}</span>
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> {selectedPatient.hasInsurance} {selectedPatient.insuranceName ? `(${selectedPatient.insuranceName})` : ''}</span>
                            <span className="flex items-center gap-1.5"><Briefcase className="w-3 h-3" /> {selectedPatient.occupation}</span>
                            <span className="flex items-center gap-1.5"><Share2 className="w-3 h-3" /> {selectedPatient.source}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Lead Priority</div>
                          <div className="bg-white border-2 border-slate-100 px-4 py-1.5 rounded-xl shadow-sm inline-flex items-center gap-2">
                            <Activity className="w-4 h-4 text-hospital-600" />
                            <span className="font-black text-slate-800 text-xs uppercase">{selectedPatient.doctorAssessment?.conversion_readiness || 'LEAD'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSaveProposal} className="flex-1 overflow-y-auto p-8 space-y-10">
                      
                      {/* Surgeon's Assessment Recommendation Section */}
                      <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[2rem] space-y-5 animate-in fade-in slide-in-from-top-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]">
                             <Stethoscope className="w-4 h-4" /> Surgeon's Recommendation
                           </div>
                           <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
                             Assessed: {selectedPatient.doctorAssessment?.assessed_at ? formatDate(selectedPatient.doctorAssessment.assessed_at) : 'N/A'}
                           </div>
                         </div>

                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white p-3 rounded-2xl border border-blue-50 shadow-sm">
                              <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Evaluating Surgeon</div>
                              <div className="text-[10px] font-black text-blue-700 truncate">{selectedPatient.doctorAssessment?.doctor_signature || 'Not Signed'}</div>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-blue-50 shadow-sm">
                              <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Pain Level</div>
                              <div className="text-[10px] font-black text-slate-700">{selectedPatient.doctorAssessment?.pain_severity || 'N/A'}</div>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-blue-50 shadow-sm">
                              <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Affordability</div>
                              <div className="text-[10px] font-black text-slate-700">{selectedPatient.doctorAssessment?.affordability || 'N/A'}</div>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-blue-50 shadow-sm">
                              <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Readiness</div>
                              <div className="text-[10px] font-black text-slate-700">{selectedPatient.doctorAssessment?.conversion_readiness || 'N/A'}</div>
                            </div>
                         </div>

                         <div className="p-4 bg-white/50 border border-blue-100 rounded-2xl">
                            <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <FileText className="w-3 h-3" /> Clinical Observation
                            </div>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
                              {selectedPatient.doctorAssessment?.notes ? `"${selectedPatient.doctorAssessment.notes}"` : "No specific surgeon notes provided for this evaluation."}
                            </p>
                         </div>
                      </div>

                      {/* Package Configuration */}
                      <div className="space-y-8">
                         <div className="flex items-center gap-2 text-[10px] font-black uppercase text-hospital-600 tracking-[0.2em]">
                           <Banknote className="w-4 h-4" /> Package & Financials
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div>
                              <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Mode of Payment</label>
                              <div className="flex flex-wrap gap-2">
                                 {['Cash', 'Insurance', 'Partly', 'Insurance Approved'].map(mode => (
                                   <button key={mode} type="button" onClick={() => setProposal({...proposal, modeOfPayment: mode as any})} className={`px-3 py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${proposal.modeOfPayment === mode ? 'bg-hospital-600 text-white border-hospital-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>{mode}</button>
                                 ))}
                              </div>
                           </div>
                           <div>
                              <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Package Amount (₹)</label>
                              <div className="relative">
                                 <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                 <input type="text" placeholder="e.g. 45,000" className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-black focus:bg-white focus:border-hospital-500 outline-none transition-all" value={proposal.packageAmount} onChange={e => setProposal({...proposal, packageAmount: e.target.value})} />
                              </div>
                           </div>
                         </div>
                      </div>

                      {/* Room & Inclusions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="space-y-4">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Inclusions</label>
                            <div className="grid grid-cols-2 gap-2">
                              <ToggleButton label="Pre-op" value="Included" current={proposal.preOpInvestigation} onClick={v => setProposal({...proposal, preOpInvestigation: v})} />
                              <ToggleButton label="Meds" value="Included" current={proposal.surgeryMedicines} onClick={v => setProposal({...proposal, surgeryMedicines: v})} />
                              <ToggleButton label="Equip" value="Included" current={proposal.equipment} onClick={v => setProposal({...proposal, equipment: v})} />
                              <ToggleButton label="ICU" value="Included" current={proposal.icuCharges} onClick={v => setProposal({...proposal, icuCharges: v})} />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Room Type</label>
                            <div className="flex gap-2">
                              {['Private', 'Deluxe', 'Semi'].map(room => (
                                <button key={room} type="button" onClick={() => setProposal({...proposal, roomType: room as any})} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${proposal.roomType === room ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}>{room}</button>
                              ))}
                            </div>
                         </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* AI Counselor Advice */}
                      <div className="space-y-6">
                         <div className="flex items-center gap-2 text-[10px] font-black uppercase text-hospital-600 tracking-[0.2em]">
                           <Sparkles className="w-4 h-4" /> AI Counselor Advice
                         </div>
                         <div className="relative group">
                            <button type="button" onClick={handleGenerateAIStrategy} disabled={aiLoading} className="absolute right-4 top-4 z-10 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-5 py-2 rounded-full flex items-center gap-2 hover:bg-hospital-600 disabled:opacity-50 transition-all">
                               {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} AI Strategy
                            </button>
                            <textarea className="w-full border-2 border-slate-100 rounded-[2rem] p-6 pt-16 min-h-[140px] text-sm font-medium leading-relaxed bg-white focus:border-hospital-500 outline-none" value={proposal.counselingStrategy} onChange={e => setProposal({...proposal, counselingStrategy: e.target.value})} placeholder="AI generated strategy or manual notes..." />
                         </div>
                      </div>

                      {/* Final Action Buttons */}
                      <div className="pt-8 border-t border-slate-100 space-y-6">
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Set Counseling Outcome</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button 
                            type="button" 
                            onClick={() => handleOpenOutcomeModal('Scheduled')}
                            className="py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex flex-col items-center gap-2"
                          >
                            <Calendar className="w-5 h-5" /> Schedule Surgery
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleOpenOutcomeModal('Follow-Up')}
                            className="py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex flex-col items-center gap-2"
                          >
                            <Clock className="w-5 h-5" /> Follow-Up Surgery
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleOpenOutcomeModal('Lost')}
                            className="py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex flex-col items-center gap-2"
                          >
                            <Trash2 className="w-5 h-5" /> Surgery Lost
                          </button>
                        </div>
                        
                        <button type="submit" className="w-full py-4 text-[10px] font-black uppercase text-slate-400 hover:text-hospital-600 transition-colors">
                           Update Proposal Details without closing lead
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                    <Briefcase className="w-20 h-20 mb-6 text-slate-100" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Select a candidate from the directory</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Table View Mode */
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b">
                    <tr>
                      <th className="p-5">Patient Name</th>
                      <th className="p-5">Evaluating Surgeon</th>
                      <th className="p-5">Lead Source</th>
                      <th className="p-5">Insurance / TPA</th>
                      <th className="p-5">Amount</th>
                      <th className="p-5">Readiness</th>
                      <th className="p-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allPatients.map(p => (
                      <tr 
                        key={p.id} 
                        onClick={() => handlePatientSelect(p)}
                        className="hover:bg-hospital-50/50 cursor-pointer transition-colors group"
                      >
                        <td className="p-5">
                          <div className="font-bold text-slate-900 group-hover:text-hospital-700">{p.name}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{p.condition}</div>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <Stethoscope className="w-4 h-4 text-blue-400" />
                            {p.doctorAssessment?.doctor_signature || '---'}
                          </div>
                        </td>
                        <td className="p-5">
                          <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{p.source}</span>
                        </td>
                        <td className="p-5 text-sm font-bold text-slate-600">
                          {p.hasInsurance === 'Yes' ? (
                            <span className="flex items-center gap-1.5 text-emerald-600">
                              <ShieldCheck className="w-4 h-4" /> {p.insuranceName || 'Yes'}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium italic">Self Pay</span>
                          )}
                        </td>
                        <td className="p-5">
                          <div className="font-black text-slate-900 text-sm">
                            {p.packageProposal?.packageAmount ? `₹${p.packageProposal.packageAmount}` : '---'}
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                            p.doctorAssessment?.conversion_readiness?.startsWith('CR1') ? 'bg-emerald-50 text-emerald-600' :
                            p.doctorAssessment?.conversion_readiness?.startsWith('CR2') ? 'bg-blue-50 text-blue-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {p.doctorAssessment?.conversion_readiness || 'LEAD'}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-2 w-fit ${
                            p.packageProposal?.outcome === 'Scheduled' ? 'bg-emerald-600 text-white' :
                            p.packageProposal?.outcome === 'Follow-Up' ? 'bg-blue-600 text-white' :
                            p.packageProposal?.outcome === 'Lost' ? 'bg-rose-600 text-white' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {p.packageProposal?.outcome || 'Counseled'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allPatients.length === 0 && (
                  <div className="p-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-xs">
                    No results found for {listCategory} category
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Staff Management View (Unchanged) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4">
          <div className="md:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
              <UserPlus className="w-6 h-6 text-hospital-600" /> Add Administrator
            </h3>
            <form onSubmit={handleRegisterStaff} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Display Name</label>
                <input required type="text" className="w-full p-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-hospital-500 outline-none" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Email Address</label>
                <input required type="email" className="w-full p-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-hospital-500 outline-none" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Access Key</label>
                <input required type="password" placeholder="••••••••" className="w-full p-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-hospital-500 outline-none" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Contact Mobile</label>
                <input required type="tel" className="w-full p-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-hospital-500 outline-none" value={newStaff.mobile} onChange={e => setNewStaff({...newStaff, mobile: e.target.value.replace(/\D/g, '')})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Role Permission</label>
                <select className="w-full p-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-hospital-500 outline-none" value={newStaff.role || 'FRONT_OFFICE'} onChange={e => setNewStaff({...newStaff, role: e.target.value as Role})}>
                  <option value="FRONT_OFFICE">Front Office (Registration)</option>
                  <option value="DOCTOR">Doctor (Assessment)</option>
                  <option value="PACKAGE_TEAM">Package Team (Management)</option>
                </select>
              </div>
              {staffSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {staffSuccess}</div>}
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95">Grant Access</button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Personnel Directory</span>
              <span className="text-[10px] font-black bg-slate-200 px-3 py-1 rounded-full text-slate-600">{staffUsers.length} active</span>
            </div>
            <div className="overflow-y-auto flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {staffUsers.map(user => (
                <div key={user.id} className="p-5 border-2 border-slate-50 rounded-[2rem] flex items-center gap-4 bg-white group hover:border-hospital-100">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl ${user.role === 'DOCTOR' ? 'bg-blue-500' : user.role === 'PACKAGE_TEAM' ? 'bg-violet-500' : 'bg-emerald-500'}`}>{user.name ? user.name.charAt(0) : '?'}</div>
                  <div className="flex-1">
                    <div className="font-black text-slate-800 text-sm">{user.name || 'Unknown Staff'}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{user.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Outcome Selection Modal */}
      {outcomeModal.show && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
            <header className={`p-8 border-b flex justify-between items-center ${
              outcomeModal.type === 'Lost' ? 'bg-rose-50 text-rose-900' : 'bg-emerald-50 text-emerald-900'
            }`}>
              <h3 className="text-xl font-black uppercase tracking-tight">
                Finalizing: {outcomeModal.type}
              </h3>
              <button onClick={() => setOutcomeModal({ ...outcomeModal, show: false })}><X className="w-6 h-6 text-slate-400" /></button>
            </header>
            
            <div className="p-10 space-y-8">
               {outcomeModal.type !== 'Lost' ? (
                 <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Date (Mandatory)</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input 
                        type="date" 
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black focus:bg-white focus:border-hospital-500 outline-none"
                        value={outcomeModal.date}
                        onChange={e => setOutcomeModal({ ...outcomeModal, date: e.target.value })}
                      />
                    </div>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Reason for Lead Loss</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-hospital-500 outline-none"
                      value={outcomeModal.reason}
                      onChange={e => setOutcomeModal({ ...outcomeModal, reason: e.target.value })}
                    >
                      {lostReasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                 </div>
               )}
               
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                 Confirming this will move <strong>{selectedPatient?.name}</strong> to the <strong>{outcomeModal.type}</strong> records category.
               </p>
            </div>

            <footer className="p-8 border-t flex gap-4 bg-slate-50/50">
              <button onClick={() => setOutcomeModal({ ...outcomeModal, show: false })} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900">Cancel</button>
              <button 
                onClick={handleConfirmOutcome} 
                className={`flex-1 py-4 text-[10px] font-black uppercase text-white rounded-xl shadow-xl hover:scale-105 transition-all ${
                  outcomeModal.type === 'Lost' ? 'bg-rose-600' : 'bg-emerald-600'
                }`}
              >
                Confirm & Close Lead
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
