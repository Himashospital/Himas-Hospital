import React, { useState, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { SurgeonCode, PainSeverity, Affordability, ConversionReadiness, Patient, DoctorAssessment } from '../types';
import { Stethoscope, Check, ChevronRight, User, Calendar, Save, Briefcase, CreditCard, Activity } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { patients, updateDoctorAssessment } = useHospital();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form State
  const [assessment, setAssessment] = useState<Partial<DoctorAssessment>>({
    quickCode: SurgeonCode.S1,
    painSeverity: PainSeverity.Moderate,
    affordability: Affordability.A2,
    conversionReadiness: ConversionReadiness.CR2,
    tentativeSurgeryDate: '',
    doctorSignature: ''
  });

  // Reset form when patient changes
  useEffect(() => {
    if (selectedPatient) {
      if (selectedPatient.doctorAssessment) {
        setAssessment(selectedPatient.doctorAssessment);
      } else {
        // Reset to defaults for new assessment
        setAssessment({
          quickCode: SurgeonCode.S1,
          painSeverity: PainSeverity.Moderate,
          affordability: Affordability.A2,
          conversionReadiness: ConversionReadiness.CR2,
          tentativeSurgeryDate: '',
          doctorSignature: ''
        });
      }
    }
  }, [selectedPatient]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatient && assessment.doctorSignature) {
      updateDoctorAssessment(selectedPatient.id, {
        ...assessment as DoctorAssessment,
        assessedAt: new Date().toISOString()
      });
      setSelectedPatient(null);
    }
  };

  const queue = patients.filter(p => !p.doctorAssessment);
  const completed = patients.filter(p => p.doctorAssessment);

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Left Panel: Queue */}
      <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
           <h3 className="font-bold text-gray-700 flex items-center gap-2">
             <User className="w-5 h-5 text-hospital-600" /> Patient Queue
           </h3>
           <div className="flex gap-4 mt-2 text-xs">
             <span className="text-orange-600 font-semibold">{queue.length} Pending</span>
             <span className="text-green-600 font-semibold">{completed.length} Completed</span>
           </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {queue.length === 0 && <div className="p-4 text-center text-gray-400">Queue is empty</div>}
          {queue.map(p => (
            <div 
              key={p.id} 
              onClick={() => setSelectedPatient(p)}
              className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${selectedPatient?.id === p.id ? 'border-hospital-500 bg-hospital-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.age} / {p.gender}</div>
                </div>
                <div className="text-xs font-mono text-gray-400">{p.id}</div>
              </div>
              <div className="mt-2 flex gap-2">
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded flex items-center gap-1">
                  <Activity className="w-3 h-3" /> {p.condition}
                </span>
              </div>
            </div>
          ))}

          {completed.length > 0 && <div className="mt-6 mb-2 text-xs font-bold text-gray-400 uppercase px-2">Recently Completed</div>}
          {completed.slice(0, 5).map(p => (
            <div 
              key={p.id}
              onClick={() => setSelectedPatient(p)} 
              className={`p-3 rounded-lg border border-gray-100 bg-gray-50 opacity-70 hover:opacity-100 cursor-pointer ${selectedPatient?.id === p.id ? 'ring-2 ring-hospital-200' : ''}`}
            >
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">{p.name}</span>
                <Check className="w-4 h-4 text-green-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Assessment Form */}
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
              <div className="text-right">
                <div className="text-xs text-gray-400">Registered At</div>
                <div className="font-mono text-sm">{new Date(selectedPatient.registeredAt).toLocaleTimeString()}</div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-500 text-xs uppercase">Occupation:</span>
                <span>{selectedPatient.occupation || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-500 text-xs uppercase">Insurance:</span>
                <span>{selectedPatient.hasInsurance} {selectedPatient.insuranceName ? `(${selectedPatient.insuranceName})` : ''}</span>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Clinical Assessment */}
              <section>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-hospital-500" /> Clinical Assessment
                </h3>
                <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Surgeon Quick Code</label>
                     <div className="space-y-2">
                       {Object.values(SurgeonCode).map(code => (
                         <label key={code} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${assessment.quickCode === code ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
                           <input 
                             type="radio" 
                             name="quickCode" 
                             value={code}
                             checked={assessment.quickCode === code}
                             onChange={() => setAssessment({...assessment, quickCode: code})}
                             className="text-hospital-600 focus:ring-hospital-500"
                           />
                           <span className="ml-3 text-sm font-medium text-gray-900">{code}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Pain Severity</label>
                     <div className="flex gap-2">
                       {Object.values(PainSeverity).map(severity => (
                         <button
                           key={severity}
                           type="button"
                           onClick={() => setAssessment({...assessment, painSeverity: severity})}
                           className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                             assessment.painSeverity === severity
                               ? severity === 'High' ? 'bg-red-50 border-red-500 text-red-700'
                               : severity === 'Moderate' ? 'bg-orange-50 border-orange-500 text-orange-700'
                               : 'bg-green-50 border-green-500 text-green-700'
                               : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                           }`}
                         >
                           {severity}
                         </button>
                       ))}
                     </div>
                   </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* Conversion Indicators */}
              <section>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-hospital-500" /> Conversion Indicators
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Affordability Indicator</label>
                    <select 
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-hospital-500 focus:border-hospital-500"
                      value={assessment.affordability}
                      onChange={e => setAssessment({...assessment, affordability: e.target.value as Affordability})}
                    >
                      {Object.values(Affordability).map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Conversion Readiness</label>
                    <select 
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-hospital-500 focus:border-hospital-500"
                      value={assessment.conversionReadiness}
                      onChange={e => setAssessment({...assessment, conversionReadiness: e.target.value as ConversionReadiness})}
                    >
                      {Object.values(ConversionReadiness).map(cr => <option key={cr} value={cr}>{cr}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tentative Surgery Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                        type="date" 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        value={assessment.tentativeSurgeryDate}
                        onChange={e => setAssessment({...assessment, tentativeSurgeryDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Signature */}
              <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">Digital Signature</label>
                <input 
                  type="text" 
                  placeholder="Type Doctor Name to Sign"
                  className="w-full border-b-2 border-gray-400 bg-transparent py-2 text-xl font-handwriting focus:outline-none focus:border-hospital-600 font-serif italic"
                  value={assessment.doctorSignature}
                  onChange={e => setAssessment({...assessment, doctorSignature: e.target.value})}
                  required
                />
                <p className="text-xs text-gray-400 mt-2">By signing, I confirm the medical evaluation above is accurate.</p>
              </div>

              <div className="flex justify-end gap-4 pb-4">
                <button type="button" onClick={() => setSelectedPatient(null)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button 
                  type="submit" 
                  disabled={!assessment.doctorSignature}
                  className="px-6 py-2 bg-hospital-600 text-white rounded-lg hover:bg-hospital-700 shadow-lg shadow-hospital-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Assessment
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
             <Stethoscope className="w-16 h-16 mb-4 text-gray-200" />
             <p>Select a patient from the queue to start evaluation</p>
          </div>
        )}
      </div>
    </div>
  );
};