
import React, { useState, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { SurgeonCode, PainSeverity, Affordability, ConversionReadiness, Patient, DoctorAssessment } from '../types';
import { Stethoscope, Check, ChevronRight, User, Calendar, Save, Briefcase, CreditCard, Activity, Tag, FileText, Database, Clock, Share2, ShieldCheck } from 'lucide-react';

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
  "Stapler Haemorrhoidectomy"
];

export const DoctorDashboard: React.FC = () => {
  const { patients, updateDoctorAssessment } = useHospital();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [formState, setFormState] = useState<Partial<DoctorAssessment>>({
    quickCode: undefined,
    painSeverity: undefined,
    affordability: undefined,
    conversionReadiness: undefined,
    tentativeSurgeryDate: '',
    surgeryProcedure: '',
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
        notes: '',
        doctorSignature: ''
      });
    }
  }, [selectedPatient]);
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const { quickCode, doctorSignature, painSeverity, affordability, conversionReadiness } = formState;

    if (!quickCode || !doctorSignature) {
      alert("Please select a Quick Code and provide your signature.");
      return;
    }

    if (quickCode === SurgeonCode.S1) {
      if (!painSeverity || !affordability || !conversionReadiness) {
        alert("Please complete all additional surgery fields before saving.");
        return;
      }
    }

    updateDoctorAssessment(selectedPatient.id, formState);
    setSelectedPatient(null);
  };

  // Doctors directory should only show Arrived patients OR those they've already assessed.
  // Updated sorting: Prioritize Pending (Arrived but no assessment) at the top, then newest first.
  const allPatients = [...patients]
    .filter(p => p.status === 'Arrived' || p.doctorAssessment !== undefined)
    .sort((a, b) => {
      // 1. Prioritize Pending Status (Arrived and no assessment yet)
      const aIsPending = a.status === 'Arrived' && !a.doctorAssessment;
      const bIsPending = b.status === 'Arrived' && !b.doctorAssessment;

      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;

      // 2. Secondary Sort: Recency (Newest first)
      const timeA = new Date(a.registeredAt).getTime();
      const timeB = new Date(b.registeredAt).getTime();
      return timeB - timeA;
    });

  const pendingCount = allPatients.filter(p => p.status === 'Arrived' && !p.doctorAssessment).length;
  const doneCount = allPatients.filter(p => !!p.doctorAssessment).length;
    
  const isSurgery = formState.quickCode === SurgeonCode.S1;

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
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
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {allPatients.map(p => (
            <div key={p.id} onClick={() => setSelectedPatient(p)} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all ${selectedPatient?.id === p.id ? 'border-hospital-500 bg-hospital-50 shadow-sm' : p.doctorAssessment ? 'border-gray-100 bg-gray-50' : 'border-slate-100 bg-white'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{p.name}</div>
                  <div className="text-[10px] text-gray-500 font-medium uppercase mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{p.age}Y • {p.gender} • {p.condition}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    <span className="flex items-center gap-1 text-hospital-600 font-bold">
                      <Clock className="w-3 h-3" /> Arrived: {p.entry_date}
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
          ))}
          {allPatients.length === 0 && (
            <div className="p-10 text-center text-slate-300 text-xs font-black uppercase tracking-widest">No patients arrived</div>
          )}
        </div>
      </div>

      {/* Right side: Assessment Form */}
      <div className="w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selectedPatient ? (
          <form onSubmit={handleSave} className="flex flex-col h-full">
            <div className="p-6 border-b bg-white">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Quick Code */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Quick Code Assessment</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setFormState(s => ({...s, quickCode: SurgeonCode.M1}))} className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${formState.quickCode === SurgeonCode.M1 ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                    <div className="font-bold">{SurgeonCode.M1}</div>
                    <div className="text-xs text-gray-600">Patient requires medication only. No surgery needed.</div>
                  </button>
                  <button type="button" onClick={() => setFormState(s => ({...s, quickCode: SurgeonCode.S1}))} className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${formState.quickCode === SurgeonCode.S1 ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200 hover:border-green-300'}`}>
                    <div className="font-bold">{SurgeonCode.S1}</div>
                    <div className="text-xs text-gray-600">Patient is a candidate for surgery.</div>
                  </button>
                </div>
              </div>

              {/* Additional fields for surgery */}
              {isSurgery && (
                <div className="grid grid-cols-2 gap-6 p-6 bg-green-50/50 rounded-lg border border-green-100 animate-in fade-in">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Procedures</label>
                    <select required={isSurgery} value={formState.surgeryProcedure || ''} onChange={e => setFormState(s => ({...s, surgeryProcedure: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Select Procedure...</option>
                      {PROCEDURES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pain Severity</label>
                    <select required={isSurgery} value={formState.painSeverity || ''} onChange={e => setFormState(s => ({...s, painSeverity: e.target.value as PainSeverity}))} className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Select...</option>
                      {Object.values(PainSeverity).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Affordability</label>
                    <select required={isSurgery} value={formState.affordability || ''} onChange={e => setFormState(s => ({...s, affordability: e.target.value as Affordability}))} className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Select...</option>
                      {Object.values(Affordability).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Conversion Readiness</label>
                    <select required={isSurgery} value={formState.conversionReadiness || ''} onChange={e => setFormState(s => ({...s, conversionReadiness: e.target.value as ConversionReadiness}))} className="w-full p-2 border border-gray-300 rounded-md">
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

              {/* Clinical Findings & Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Clinical Findings & Notes</label>
                <textarea
                  value={formState.notes || ''}
                  onChange={e => setFormState(s => ({...s, notes: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md min-h-[120px]"
                  placeholder="Enter clinical observations..."
                ></textarea>
              </div>

               {/* Digital Signature */}
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
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button type="submit" className="bg-hospital-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-hospital-700">
                <Save className="w-5 h-5" /> Save Assessment
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <Stethoscope className="w-24 h-24 mb-4" />
            <p className="text-lg font-bold">Select a patient to begin assessment</p>
          </div>
        )}
      </div>
    </div>
  );
};
