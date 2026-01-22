
import React, { useState, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { SurgeonCode, PainSeverity, Affordability, ConversionReadiness, Patient, DoctorAssessment } from '../types';
import { Stethoscope, Check, ChevronRight, User, Calendar, Save, Briefcase, CreditCard, Activity, Tag, FileText, Database } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { patients, updateDoctorAssessment } = useHospital();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [assessment, setAssessment] = useState<Partial<DoctorAssessment>>({
    quickCode: undefined,
    painSeverity: undefined,
    affordability: undefined,
    conversionReadiness: undefined,
    tentativeSurgeryDate: '',
    doctorSignature: '',
    doctorNote: ''
  });

  useEffect(() => {
    if (selectedPatient) {
      if (selectedPatient.doctorAssessment) {
        setAssessment(selectedPatient.doctorAssessment);
      } else {
        setAssessment({
          quickCode: undefined,
          painSeverity: undefined,
          affordability: undefined,
          conversionReadiness: undefined,
          tentativeSurgeryDate: '',
          doctorSignature: '',
          doctorNote: ''
        });
      }
    }
  }, [selectedPatient]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const { quickCode, doctorSignature } = assessment;
    if (!quickCode || !doctorSignature) {
      alert("Please select a Quick Code and provide your signature.");
      return;
    }

    if (quickCode === SurgeonCode.S1) {
      const { painSeverity, affordability, conversionReadiness } = assessment;
      if (!painSeverity || !affordability || !conversionReadiness) {
        alert("Please complete all additional surgery fields before saving.");
        return;
      }
    }

    updateDoctorAssessment(selectedPatient.id, {
      ...assessment as DoctorAssessment,
      assessedAt: new Date().toISOString()
    });
    setSelectedPatient(null);
  };

  const allPatients = [...patients].sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
  const isSurgery = assessment.quickCode === SurgeonCode.S1;
  const hasSavedNote = !!selectedPatient?.doctorAssessment?.doctorNote;

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
           <h3 className="font-bold text-gray-700 flex items-center gap-2">
             <User className="w-5 h-5 text-hospital-600" /> Patient Directory
           </h3>
           <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{allPatients.length}</span>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {allPatients.map(p => (
            <div key={p.id} onClick={() => setSelectedPatient(p)} className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${selectedPatient?.id === p.id ? 'border-hospital-500 bg-hospital-50 shadow-sm' : p.doctorAssessment ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200 bg-white'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">{p.age}Y • {p.gender}</div>
                </div>
                {p.doctorAssessment && <Check className="w-3 h-3 text-emerald-500" />}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-white border border-gray-100 text-gray-500 rounded-full">{p.condition}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selectedPatient ? (
          <>
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Medical Evaluation</h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {selectedPatient.name}, {selectedPatient.age} yrs</span>
                  <span className="flex items-center gap-1 text-hospital-700 font-medium bg-hospital-50 px-2 py-0.5 rounded-full"><Activity className="w-3 h-3" /> {selectedPatient.condition}</span>
                </div>
              </div>
              {hasSavedNote && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                  <Database className="w-3 h-3" /> Records Sync Active
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8">
              <section>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-hospital-500" /> Patient Status Decision
                </h3>
                <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Surgeon Quick Code</label>
                     <div className="space-y-2">
                       {Object.values(SurgeonCode).map(code => (
                         <label key={code} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${assessment.quickCode === code ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-100' : 'hover:bg-gray-50 border-gray-200'}`}>
                           <input type="radio" name="quickCode" value={code} checked={assessment.quickCode === code} onChange={() => setAssessment({...assessment, quickCode: code})} className="text-hospital-600 focus:ring-hospital-500" />
                           <span className={`ml-3 text-sm font-medium ${assessment.quickCode === code ? 'text-hospital-700 font-bold' : 'text-gray-900'}`}>{code}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                   {isSurgery && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Pain Severity</label>
                      <div className="flex flex-col gap-2">
                        {Object.values(PainSeverity).map(severity => (
                          <button key={severity} type="button" onClick={() => setAssessment({...assessment, painSeverity: severity})} className={`w-full py-3 rounded-lg border text-sm font-medium transition-all ${assessment.painSeverity === severity ? 'bg-orange-50 border-orange-500 text-orange-700 ring-2 ring-orange-100 font-bold' : 'hover:bg-gray-50 border-gray-200 text-gray-600 bg-white'}`}>
                            {severity}
                          </button>
                        ))}
                      </div>
                    </div>
                   )}
                </div>
              </section>

              <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-hospital-500" /> Clinical Findings & Notes
                </h3>
                <textarea className="w-full border-2 border-slate-100 rounded-xl p-4 min-h-[140px] text-sm font-medium leading-relaxed transition-all focus:border-hospital-500 focus:ring-4 focus:ring-hospital-50 outline-none bg-white" placeholder="Add observations..." value={assessment.doctorNote || ''} onChange={e => setAssessment({...assessment, doctorNote: e.target.value})} />
              </section>

              {isSurgery && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                  <hr className="border-gray-100" />
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Affordability</label>
                      <select className="w-full border-2 border-slate-100 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-hospital-500 bg-white outline-none" value={assessment.affordability || ''} onChange={e => setAssessment({...assessment, affordability: e.target.value as Affordability})}>
                        <option value="" disabled>-- Select Affordability --</option>
                        {Object.values(Affordability).map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Readiness</label>
                      <select className="w-full border-2 border-slate-100 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-hospital-500 bg-white outline-none" value={assessment.conversionReadiness || ''} onChange={e => setAssessment({...assessment, conversionReadiness: e.target.value as ConversionReadiness})}>
                        <option value="" disabled>-- Select Readiness --</option>
                        {Object.values(ConversionReadiness).map(cr => <option key={cr} value={cr}>{cr}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-100 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Digital Signature</label>
                <input type="text" placeholder="Doctor's Name" className="w-full border-b-2 border-slate-400 bg-transparent py-2 text-2xl focus:outline-none focus:border-hospital-600 font-serif italic" value={assessment.doctorSignature} onChange={e => setAssessment({...assessment, doctorSignature: e.target.value})} required />
              </div>

              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setSelectedPatient(null)} className="px-6 py-3 text-slate-400 font-bold">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-hospital-600 text-white rounded-xl hover:bg-hospital-700 shadow-lg font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Evaluation
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 font-bold">
             <Stethoscope className="w-16 h-16 mb-4" />
             Select a patient from the directory
          </div>
        )}
      </div>
    </div>
  );
};
