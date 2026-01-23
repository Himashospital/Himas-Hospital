
import React, { useState, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { SurgeonCode, PainSeverity, Affordability, ConversionReadiness, Patient, DoctorAssessment, FullAssessmentPayload } from '../types';
import { Stethoscope, Check, ChevronRight, User, Calendar, Save, Briefcase, CreditCard, Activity, Tag, FileText, Database } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { patients, updateDoctorAssessment } = useHospital();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [formState, setFormState] = useState<{
    assessment: Partial<DoctorAssessment>;
    notes: string;
    signature: string;
  }>({
    assessment: {
      quickCode: undefined,
      painSeverity: undefined,
      affordability: undefined,
      conversionReadiness: undefined,
      tentativeSurgeryDate: '',
    },
    notes: '',
    signature: ''
  });

  useEffect(() => {
    if (selectedPatient) {
      setFormState({
        assessment: selectedPatient.doctorAssessment || {
          quickCode: undefined,
          painSeverity: undefined,
          affordability: undefined,
          conversionReadiness: undefined,
          tentativeSurgeryDate: '',
        },
        notes: selectedPatient.clinicalFindingsNotes || '',
        signature: selectedPatient.digitalSignature || '',
      });
    }
  }, [selectedPatient]);
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const { quickCode } = formState.assessment;
    if (!quickCode || !formState.signature) {
      alert("Please select a Quick Code and provide your signature.");
      return;
    }

    if (quickCode === SurgeonCode.S1) {
      const { painSeverity, affordability, conversionReadiness } = formState.assessment;
      if (!painSeverity || !affordability || !conversionReadiness) {
        alert("Please complete all additional surgery fields before saving.");
        return;
      }
    }

    const payload: FullAssessmentPayload = {
      assessment: {
        ...(formState.assessment as Omit<DoctorAssessment, 'assessedAt'>),
        assessedAt: new Date().toISOString()
      },
      notes: formState.notes,
      signature: formState.signature
    };

    updateDoctorAssessment(selectedPatient.id, payload);
    setSelectedPatient(null);
  };

  const allPatients = [...patients].sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
  const isSurgery = formState.assessment.quickCode === SurgeonCode.S1;

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
            <div key={p.id} onClick={() => setSelectedPatient(p)} className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${selectedPatient?.id === p.id ? 'border-hospital-500 bg-hospital-50 shadow-sm' : p.doctorAssessment ? 'border-gray-100 bg-gray-50' : 'border-slate-100 bg-white'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-800">{p.name}</div>
                  <div className="text-[10px] text-gray-500 font-medium uppercase">{p.age}Y • {p.gender} • {p.condition}</div>
                </div>
                {p.doctorAssessment ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side: Assessment Form */}
      <div className="w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selectedPatient ? (
          <form onSubmit={handleSave} className="flex flex-col h-full">
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800 tracking-tight">{selectedPatient.name}</h3>
              <div className="text-xs text-gray-500 font-medium uppercase mt-1 flex gap-4">
                <span><User className="w-3 h-3 inline mr-1" />{selectedPatient.age}Y / {selectedPatient.gender}</span>
                <span><Activity className="w-3 h-3 inline mr-1" />{selectedPatient.condition}</span>
                <span><Tag className="w-3 h-3 inline mr-1" />{selectedPatient.source}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Quick Code */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Quick Code Assessment</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setFormState(s => ({...s, assessment: {...s.assessment, quickCode: SurgeonCode.M1}}))} className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${formState.assessment.quickCode === SurgeonCode.M1 ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                    <div className="font-bold">{SurgeonCode.M1}</div>
                    <div className="text-xs text-gray-600">Patient requires medication only. No surgery needed.</div>
                  </button>
                  <button type="button" onClick={() => setFormState(s => ({...s, assessment: {...s.assessment, quickCode: SurgeonCode.S1}}))} className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${formState.assessment.quickCode === SurgeonCode.S1 ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200 hover:border-green-300'}`}>
                    <div className="font-bold">{SurgeonCode.S1}</div>
                    <div className="text-xs text-gray-600">Patient is a candidate for surgery.</div>
                  </button>
                </div>
              </div>

              {/* Additional fields for surgery */}
              {isSurgery && (
                <div className="grid grid-cols-2 gap-6 p-6 bg-green-50/50 rounded-lg border border-green-100 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pain Severity</label>
                    <select required={isSurgery} value={formState.assessment.painSeverity || ''} onChange={e => setFormState(s => ({...s, assessment: {...s.assessment, painSeverity: e.target.value as PainSeverity}}))} className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Select...</option>
                      {Object.values(PainSeverity).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Affordability</label>
                    <select required={isSurgery} value={formState.assessment.affordability || ''} onChange={e => setFormState(s => ({...s, assessment: {...s.assessment, affordability: e.target.value as Affordability}}))} className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Select...</option>
                      {Object.values(Affordability).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Conversion Readiness</label>
                    <select required={isSurgery} value={formState.assessment.conversionReadiness || ''} onChange={e => setFormState(s => ({...s, assessment: {...s.assessment, conversionReadiness: e.target.value as ConversionReadiness}}))} className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Select...</option>
                      {Object.values(ConversionReadiness).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tentative Surgery Date</label>
                    <input type="date" value={formState.assessment.tentativeSurgeryDate || ''} onChange={e => setFormState(s => ({...s, assessment: {...s.assessment, tentativeSurgeryDate: e.target.value}}))} className="w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
              )}

              {/* Clinical Findings & Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Clinical Findings & Notes</label>
                <textarea
                  value={formState.notes}
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
                  value={formState.signature}
                  onChange={e => setFormState(s => ({...s, signature: e.target.value}))}
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
