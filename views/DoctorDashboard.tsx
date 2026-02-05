import React, { useState, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { SurgeonCode, PainSeverity, Affordability, ConversionReadiness, Patient, DoctorAssessment } from '../types';
import { Stethoscope, Check, ChevronRight, User, Calendar, Save, Briefcase, CreditCard, Activity, Tag, FileText, Database, Clock, Share2, ShieldCheck, Search, Filter, History, ClipboardList } from 'lucide-react';

const PROCEDURES = [
  "Lap Cholecystectomy",
  "Lap Appendectomy",
  "Lap Umbilical Hernioplasty",
  "Lap Inguinal Hernioplasty",
  "Laser Varicose Veins",
  "Laser Piles",
  "Laser Pilonidoplasty",
  "Laser Fistula + Perianal Abscess",
  "Laser Fissure",
  "Stapler Haemorrhoidectomy",
  "Other"
];

export const DoctorDashboard: React.FC = () => {
  const { patients, updateDoctorAssessment } = useHospital();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Updated state for Date Range
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [formState, setFormState] = useState<Partial<DoctorAssessment>>({
    quickCode: undefined,
    painSeverity: undefined,
    affordability: undefined,
    conversionReadiness: undefined,
    tentativeSurgeryDate: '',
    surgeryProcedure: '',
    otherSurgeryName: '',
    notes: '',
    doctorSignature: ''
  });

  useEffect(() => {
    if (selectedPatient) {
      setFormState(selectedPatient.doctorAssessment || {
        quickCode: undefined,
        painSeverity: undefined,
        affordability: undefined,
        conversionReadiness: undefined,
        tentativeSurgeryDate: '',
        surgeryProcedure: '',
        otherSurgeryName: '',
        notes: '',
        doctorSignature: ''
      });
    }
  }, [selectedPatient]);
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const { quickCode, doctorSignature, painSeverity, affordability, conversionReadiness, surgeryProcedure, otherSurgeryName } = formState;

    if (!quickCode || !doctorSignature) {
      alert("Please select a Quick Code and provide your signature.");
      return;
    }

    if (quickCode === SurgeonCode.S1) {
      if (!painSeverity || !affordability || !conversionReadiness || !surgeryProcedure) {
        alert("Please complete all additional surgery fields before saving.");
        return;
      }
      if (surgeryProcedure === 'Other' && !otherSurgeryName) {
        alert("Please specify the surgery procedure name.");
        return;
      }
    }

    updateDoctorAssessment(selectedPatient.id, formState);
    setSelectedPatient(null);
  };

  // Filter patients based on Date Range and visibility criteria
  const allPatients = [...patients]
    .filter(p => {
      // Base visibility: Must be arrived or have an assessment
      const isVisible = p.status === 'Arrived' || p.doctorAssessment !== undefined;
      
      // Date range filter: Check if entry_date is within [startDate, endDate]
      const entryDateStr = p.entry_date || '';
      const inRange = entryDateStr >= startDate && entryDateStr <= endDate;
      
      return isVisible && inRange;
    })
    .sort((a, b) => {
      // Sort: Pending first, then by time DESC
      const aIsPending = a.status === 'Arrived' && !a.doctorAssessment;
      const bIsPending = b.status === 'Arrived' && !b.doctorAssessment;
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      const timeA = new Date(a.registeredAt).getTime();
      const timeB = new Date(b.registeredAt).getTime();
      return timeB - timeA;
    });

  const filteredDirectoryPatients = allPatients.filter(p => {
    const s = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(s) || 
           (p.id && p.id.toLowerCase().includes(s)) || 
           p.mobile.includes(s);
  });

  // Derived lists for Pending and Done sections
  const pendingPatients = filteredDirectoryPatients.filter(p => !p.doctorAssessment);
  const donePatients = filteredDirectoryPatients.filter(p => !!p.doctorAssessment);

  const pendingCount = allPatients.filter(p => p.status === 'Arrived' && !p.doctorAssessment).length;
  const doneCount = allPatients.filter(p => !!p.doctorAssessment).length;
    
  const isSurgery = formState.quickCode === SurgeonCode.S1;

  // Reusable Patient Card component for the directory
  // Fixed: Use React.FC to properly handle key prop and avoid TS mapping errors
  const PatientCard: React.FC<{ p: Patient }> = ({ p }) => (
    <div 
      onClick={() => setSelectedPatient(p)} 
      className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all ${
        selectedPatient?.id === p.id 
          ? 'border-hospital-500 bg-hospital-50 shadow-sm' 
          : p.doctorAssessment 
            ? 'border-gray-100 bg-gray-50' 
            : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-bold text-gray-800">{p.name}</div>
          <div className="text-[10px] text-gray-500 font-medium uppercase mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{p.age}Y • {p.gender} • {p.condition}</span>
            <span className="hidden sm:inline w-1 h-1 bg-slate-200 rounded-full"></span>
            <span className="flex items-center gap-1 text-hospital-600 font-bold">
              <Clock className="w-3 h-3" /> {p.entry_date}
            </span>
          </div>
        </div>
        {p.doctorAssessment ? (
          <Check className="w-5 h-5 text-green-500 bg-green-100 rounded-full p-1" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-300" />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-100px)] gap-6">
      <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-[450px] lg:h-full">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
           <h3 className="font-bold text-gray-700 flex items-center gap-2">
             <User className="w-5 h-5 text-hospital-600" /> Patient Directory
           </h3>
           <div className="flex gap-2">
             <div className="flex flex-col items-end">
               <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">Pending</span>
               <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 leading-none">{pendingCount}</span>
             </div>
             <div className="flex flex-col items-end">
               <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">Done</span>
               <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 leading-none">{doneCount}</span>
             </div>
           </div>
        </div>

        {/* Directory Filters */}
        <div className="p-3 bg-white border-b space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-hospital-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter shrink-0">From</span>
              <input
                type="date"
                className="w-full bg-transparent text-[11px] font-bold outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 relative flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter shrink-0">To</span>
              <input
                type="date"
                className="w-full bg-transparent text-[11px] font-bold outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-3 space-y-6">
          {/* Pending Section */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Assessments
              </span>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 rounded-full">{pendingPatients.length}</span>
            </div>
            <div className="space-y-2">
              {pendingPatients.map(p => <PatientCard key={p.id} p={p} />)}
              {pendingPatients.length === 0 && (
                <div className="p-4 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                  No Pending patients
                </div>
              )}
            </div>
          </div>

          {/* Done Section */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-emerald-500" /> Completed Today
              </span>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 rounded-full">{donePatients.length}</span>
            </div>
            <div className="space-y-2">
              {donePatients.map(p => <PatientCard key={p.id} p={p} />)}
              {donePatients.length === 0 && (
                <div className="p-4 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                  No Completed assessments
                </div>
              )}
            </div>
          </div>

          {filteredDirectoryPatients.length === 0 && (
            <div className="pt-10 text-center text-slate-300 text-xs font-black uppercase tracking-widest">
              No results for this date range
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selectedPatient ? (
          <form onSubmit={handleSave} className="flex flex-col h-full">
            <div className="p-4 sm:p-6 border-b bg-white shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-3 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="w-3 h-3 text-indigo-500" />
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Name</span>
                  </div>
                  <div className="text-sm font-black text-indigo-900 truncate leading-tight">{selectedPatient.name}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-3 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity className="w-3 h-3 text-blue-500" />
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Age / Gender</span>
                  </div>
                  <div className="text-sm font-black text-blue-900 leading-tight">{selectedPatient.age}Y <span className="text-blue-200">|</span> {selectedPatient.gender}</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-3 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Briefcase className="w-3 h-3 text-amber-500" />
                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Occupation</span>
                  </div>
                  <div className="text-sm font-black text-amber-900 truncate leading-tight">{selectedPatient.occupation || '---'}</div>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-100 p-3 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Share2 className="w-3 h-3 text-teal-500" />
                    <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest">Source</span>
                  </div>
                  <div className="text-sm font-black text-teal-900 truncate leading-tight">
                    {selectedPatient.source === 'Doctor Recommended' ? `Dr. ${selectedPatient.sourceDoctorName || 'Recommended'}` : selectedPatient.source}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-3 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3 h-3 text-rose-500" />
                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Insurance Name</span>
                  </div>
                  <div className="text-sm font-black text-rose-900 truncate leading-tight">{selectedPatient.insuranceName || 'No'}</div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
              {/* Primary Condition Read-Only Field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Primary Condition / Disease</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm animate-in fade-in duration-500">
                  <div className="bg-hospital-100 p-2 rounded-lg">
                    <Activity className="w-5 h-5 text-hospital-600" />
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Registered Diagnosis</div>
                    <div className="text-lg font-black text-slate-900 uppercase leading-none">{selectedPatient.condition}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Quick Code Assessment</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button type="button" onClick={() => setFormState(s => ({...s, quickCode: SurgeonCode.M1}))} className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${formState.quickCode === SurgeonCode.M1 ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                    <div className="font-bold">{SurgeonCode.M1}</div>
                    <div className="text-xs text-gray-600">Patient requires medication only.</div>
                  </button>
                  <button type="button" onClick={() => setFormState(s => ({...s, quickCode: SurgeonCode.S1}))} className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${formState.quickCode === SurgeonCode.S1 ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200 hover:border-green-300'}`}>
                    <div className="font-bold">{SurgeonCode.S1}</div>
                    <div className="text-xs text-gray-600">Patient candidate for surgery.</div>
                  </button>
                </div>
              </div>

              {isSurgery && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 sm:p-6 bg-green-50/50 rounded-lg border border-green-100 animate-in fade-in">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Procedures</label>
                    <select required={isSurgery} value={formState.surgeryProcedure || ''} onChange={e => setFormState(s => ({...s, surgeryProcedure: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                      <option value="">Select Procedure...</option>
                      {PROCEDURES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  {formState.surgeryProcedure === 'Other' && (
                    <div className="sm:col-span-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-bold text-hospital-600 uppercase mb-2">Specific Procedure Name</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full p-2 border border-hospital-200 rounded-md bg-white focus:border-hospital-500 outline-none" 
                        value={formState.otherSurgeryName || ''} 
                        onChange={e => setFormState(s => ({...s, otherSurgeryName: e.target.value}))} 
                        placeholder="Enter specific procedure name..." 
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pain Severity</label>
                    <select required={isSurgery} value={formState.painSeverity || ''} onChange={e => setFormState(s => ({...s, painSeverity: e.target.value as PainSeverity}))} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                      <option value="">Select...</option>
                      {Object.values(PainSeverity).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Affordability</label>
                    <select required={isSurgery} value={formState.affordability || ''} onChange={e => setFormState(s => ({...s, affordability: e.target.value as Affordability}))} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                      <option value="">Select...</option>
                      {Object.values(Affordability).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Conversion Readiness</label>
                    <select required={isSurgery} value={formState.conversionReadiness || ''} onChange={e => setFormState(s => ({...s, conversionReadiness: e.target.value as ConversionReadiness}))} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                      <option value="">Select...</option>
                      {Object.values(ConversionReadiness).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tentative Surgery Date</label>
                    <input type="date" value={formState.tentativeSurgeryDate || ''} onChange={e => setFormState(s => ({...s, tentativeSurgeryDate: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Clinical Findings & Notes</label>
                <textarea
                  value={formState.notes || ''}
                  onChange={e => setFormState(s => ({...s, notes: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md min-h-[120px]"
                  placeholder="Enter clinical observations..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Digital Signature</label>
                <input
                  type="text"
                  required
                  value={formState.doctorSignature || ''}
                  onChange={e => setFormState(s => ({...s, doctorSignature: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md font-serif"
                  placeholder="Type your full name to sign"
                />
              </div>

            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end shrink-0">
              <button type="submit" className="w-full sm:w-auto bg-hospital-600 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-hospital-700 transition-all">
                <Save className="w-5 h-5" /> Save Assessment
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-10">
            <Stethoscope className="w-24 h-24 mb-4" />
            <p className="text-lg font-bold text-center">Select a patient to begin assessment</p>
          </div>
        )}
      </div>
    </div>
  );
};