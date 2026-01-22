import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { ExportButtons } from '../components/ExportButtons';
import { Gender, Condition, Patient } from '../types';
import { PlusCircle, Search, CheckCircle, Clock, ArrowLeft, Save, FileText, CreditCard, Calendar, Pencil, Trash2, Activity, ChevronRight, User } from 'lucide-react';

export const FrontOfficeDashboard: React.FC = () => {
  const { patients, addPatient, updatePatient, deletePatient } = useHospital();
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Patient>>({
    id: '', // File Registration Number
    name: '',
    dob: '',
    gender: Gender.Male,
    age: undefined,
    mobile: '',
    occupation: '',
    hasInsurance: 'No',
    insuranceName: '',
    source: '',
    condition: Condition.Piles // Default
  });

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      dob: '',
      gender: Gender.Male,
      age: undefined,
      mobile: '',
      occupation: '',
      hasInsurance: 'No',
      insuranceName: '',
      source: '',
      condition: Condition.Piles
    });
    setEditingId(null);
    setStep(1);
  };

  const handleEdit = (patient: Patient) => {
    setFormData({
      id: patient.id,
      name: patient.name,
      dob: patient.dob || '',
      gender: patient.gender,
      age: patient.age,
      mobile: patient.mobile,
      occupation: patient.occupation,
      hasInsurance: patient.hasInsurance,
      insuranceName: patient.insuranceName || '',
      source: patient.source,
      condition: patient.condition
    });
    setEditingId(patient.id);
    setStep(1);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete patient record for "${name}"? This action cannot be undone.`)) {
      deletePatient(id);
    }
  };

  const validateStep1 = () => {
    if (!formData.name?.trim()) return "Name is required.";
    if (!formData.dob) return "Date of Birth is required.";
    if (!formData.age) return "Age is required.";
    if (!formData.mobile?.trim()) return "Mobile number is required.";
    if (!formData.occupation?.trim()) return "Occupation is required.";
    if (formData.hasInsurance === 'Yes' && !formData.insuranceName?.trim()) return "Insurance Provider Name is required.";
    if (!formData.source) return "Please select 'How Did You Know Himas Hospital Today?'";
    return null;
  };

  const handleNextStep = () => {
    const error = validateStep1();
    if (error) {
      alert(error);
      return;
    }
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
       // In edit mode, we validate step 1 and save directly (ID is read-only)
       const error = validateStep1();
       if (error) {
         alert(error);
         return;
       }
       const originalPatient = patients.find(p => p.id === editingId);
       if (originalPatient) {
         updatePatient({
           ...originalPatient,
           ...formData as Patient,
           id: editingId
         });
       }
       setShowForm(false);
       resetForm();
    } else {
      // In create mode, this is called from Step 2
      if (!formData.id?.trim()) {
        alert("File Registration Number is required.");
        return;
      }
      
      // Check for duplicate ID
      if (patients.some(p => p.id === formData.id)) {
        alert("This File Number already exists. Please assign a unique number.");
        return;
      }

      addPatient(formData as any);
      setShowForm(false);
      resetForm();
    }
  };

  const calculateAge = (dobString: string) => {
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    const age = dob ? calculateAge(dob) : undefined;
    setFormData({ ...formData, dob, age });
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sources = [
    "Google",
    "Facebook",
    "Instagram",
    "WhatsApp",
    "YouTube",
    "Website",
    "Doctor Recommended",
    "Old Patient / Family / Friend",
    "Hospital Board / Signage",
    "Other"
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Front Office Dashboard</h2>
          <p className="text-gray-500">Patient Registration & Queue Management</p>
        </div>
        <ExportButtons patients={patients} role="front_office" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Total Patients</div>
          <div className="text-2xl font-bold text-gray-800">{patients.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Waiting for Doctor</div>
          <div className="text-2xl font-bold text-orange-600">
            {patients.filter(p => !p.doctorAssessment).length}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by Name or File ID..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-hospital-600 text-white px-6 py-3 rounded-lg hover:bg-hospital-700 flex items-center gap-2 font-bold shadow-lg shadow-hospital-200"
        >
          <PlusCircle className="w-5 h-5" />
          New Patient Registration
        </button>
      </div>

      {/* Full Screen Registration Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-y-auto animate-in fade-in duration-200">
          {/* Header */}
          <div className="bg-white border-b shadow-sm sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Patient Details' : 'New Patient Registration'}</h1>
                  <p className="text-sm text-gray-500">{editingId ? 'Update the information below' : 'Follow the steps to register'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
                   Cancel
                 </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-hospital-50 p-6 border-b border-hospital-100 flex items-center justify-between">
                <h3 className="font-bold text-hospital-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-hospital-200 rounded-full flex items-center justify-center text-hospital-700">{step}</span>
                  {step === 1 ? 'Patient Demographics' : 'Assign File Number'}
                </h3>
                {/* Progress Indicator */}
                {!editingId && (
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <span className={step === 1 ? 'text-hospital-600' : ''}>Step 1</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={step === 2 ? 'text-hospital-600' : ''}>Step 2</span>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                     {/* Edit Mode Read-Only ID */}
                     {editingId && (
                        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-600">File Registration Number</span>
                            <span className="font-mono text-xl font-bold text-gray-900">{formData.id}</span>
                        </div>
                     )}

                     {/* Personal Info */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                         <div>
                           <label className="block text-sm font-semibold text-gray-700 mb-2">My Name Is:</label>
                           <input 
                             required 
                             type="text" 
                             placeholder="Enter full name"
                             className="w-full border-b-2 border-gray-200 p-2 focus:border-hospital-500 focus:outline-none bg-transparent transition-colors text-lg"
                             value={formData.name} 
                             onChange={e => setFormData({...formData, name: e.target.value})} 
                           />
                         </div>
                         
                         <div>
                           <label className="block text-sm font-semibold text-gray-700 mb-2">I Am:</label>
                           <div className="flex gap-6">
                             {Object.values(Gender).map(g => (
                               <label key={g} className="flex items-center gap-2 cursor-pointer group">
                                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.gender === g ? 'border-hospital-500' : 'border-gray-300 group-hover:border-hospital-400'}`}>
                                   {formData.gender === g && <div className="w-2.5 h-2.5 bg-hospital-500 rounded-full" />}
                                 </div>
                                 <input type="radio" className="hidden" name="gender" value={g} checked={formData.gender === g} onChange={() => setFormData({...formData, gender: g as Gender})} />
                                 <span className={`font-medium ${formData.gender === g ? 'text-hospital-700' : 'text-gray-600'}`}>{g}</span>
                               </label>
                             ))}
                           </div>
                         </div>

                         <div className="flex gap-6">
                            <div className="flex-1">
                             <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth:</label>
                             <div className="flex items-center gap-2 relative">
                               <Calendar className="absolute left-0 w-5 h-5 text-gray-400" />
                               <input 
                                 required
                                 type="date" 
                                 className="w-full border-b-2 border-gray-200 pl-8 p-2 focus:border-hospital-500 focus:outline-none text-lg"
                                 value={formData.dob || ''} 
                                 onChange={handleDobChange} 
                               />
                             </div>
                           </div>
                           <div className="w-32">
                             <label className="block text-sm font-semibold text-gray-700 mb-2">My Age:</label>
                             <div className="flex items-center gap-2">
                               <input 
                                 required 
                                 type="number" 
                                 className="w-full border-b-2 border-gray-200 p-2 focus:border-hospital-500 focus:outline-none text-lg bg-gray-50"
                                 value={formData.age || ''} 
                                 onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} 
                               />
                               <span className="text-gray-500">yrs</span>
                             </div>
                           </div>
                         </div>
                       </div>

                       <div className="space-y-6">
                         <div>
                           <label className="block text-sm font-semibold text-gray-700 mb-2">My Mobile Number:</label>
                           <div className="relative">
                                <span className="absolute left-0 bottom-2 text-lg text-gray-500 font-bold pointer-events-none select-none">+91</span>
                                <input 
                                    required 
                                    type="tel" 
                                    placeholder="9876543210"
                                    className="w-full border-b-2 border-gray-200 pl-10 p-2 focus:border-hospital-500 focus:outline-none text-lg font-mono tracking-wide"
                                    value={formData.mobile} 
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setFormData({...formData, mobile: val});
                                    }} 
                                />
                           </div>
                         </div>
                         <div>
                           <label className="block text-sm font-semibold text-gray-700 mb-2">My Occupation:</label>
                           <input 
                             required
                             type="text" 
                             placeholder="Current Job / Profession"
                             className="w-full border-b-2 border-gray-200 p-2 focus:border-hospital-500 focus:outline-none text-lg"
                             value={formData.occupation} 
                             onChange={e => setFormData({...formData, occupation: e.target.value})} 
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-semibold text-gray-700 mb-2">Do I Have Health Insurance?</label>
                           <div className="flex gap-4 mt-2 mb-4">
                             {['Yes', 'No', 'Not Sure'].map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setFormData({...formData, hasInsurance: opt as any, insuranceName: opt !== 'Yes' ? '' : formData.insuranceName})}
                                  className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                                    formData.hasInsurance === opt 
                                    ? 'bg-hospital-500 text-white border-hospital-500 shadow-md' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  {opt}
                                </button>
                             ))}
                           </div>
                           
                           {formData.hasInsurance === 'Yes' && (
                             <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-semibold text-hospital-700 mb-1 flex items-center gap-1">
                                  <CreditCard className="w-4 h-4" /> Insurance Provider Name
                                </label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Star Health, LIC, etc."
                                  className="w-full border border-hospital-200 bg-hospital-50 rounded-lg p-2 focus:border-hospital-500 focus:outline-none"
                                  value={formData.insuranceName}
                                  onChange={e => setFormData({...formData, insuranceName: e.target.value})}
                                />
                             </div>
                           )}
                         </div>
                       </div>
                     </div>

                     <hr className="border-gray-100 my-8" />

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Source */}
                        <div>
                           <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                             <Search className="w-5 h-5 text-hospital-500" />
                             How Did You Know Himas Hospital Today?
                           </label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                             {sources.map((src) => (
                               <label key={src} className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-gray-50 rounded-lg -ml-2 transition-colors">
                                 <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${formData.source === src ? 'border-hospital-500 bg-hospital-500' : 'border-gray-300 group-hover:border-hospital-400'}`}>
                                    {formData.source === src && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                 </div>
                                 <input 
                                   type="radio" 
                                   name="source" 
                                   className="hidden"
                                   checked={formData.source === src} 
                                   onChange={() => setFormData({...formData, source: src})}
                                 />
                                 <span className={`${formData.source === src ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{src}</span>
                               </label>
                             ))}
                           </div>
                        </div>

                        {/* Condition */}
                        <div>
                           <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                             <Activity className="w-5 h-5 text-red-500" />
                             Condition / Complaint
                           </label>
                           <div className="space-y-3">
                              {Object.values(Condition).map((c) => (
                                <label key={c} className={`
                                   flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                                   ${formData.condition === c 
                                     ? 'border-hospital-500 bg-hospital-50 ring-1 ring-hospital-500' 
                                     : 'border-gray-200 hover:border-hospital-200 hover:bg-gray-50'}
                                `}>
                                   <input 
                                     type="radio" 
                                     name="condition" 
                                     className="hidden"
                                     checked={formData.condition === c} 
                                     onChange={() => setFormData({...formData, condition: c})}
                                   />
                                   <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${formData.condition === c ? 'border-hospital-500' : 'border-gray-300'}`}>
                                     {formData.condition === c && <div className="w-2 h-2 bg-hospital-500 rounded-full" />}
                                   </div>
                                   <span className={`text-lg ${formData.condition === c ? 'font-bold text-hospital-800' : 'text-gray-600'}`}>
                                     {c}
                                   </span>
                                </label>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {step === 2 && !editingId && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center justify-center py-8">
                     <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
                        <div className="mb-6 flex flex-col items-center">
                          <div className="w-16 h-16 bg-hospital-100 rounded-full flex items-center justify-center mb-4">
                            <User className="w-8 h-8 text-hospital-600" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-800">{formData.name}</h3>
                          <p className="text-gray-500">{formData.age} yrs • {formData.gender} • {formData.mobile}</p>
                        </div>

                        <div className="text-left mb-6">
                           <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                             <FileText className="w-4 h-4 text-hospital-600" /> 
                             Assign File Registration Number
                           </label>
                           <div className="relative">
                             <input 
                               type="text" 
                               placeholder="e.g. HIMAS-2024-001"
                               className="w-full border-2 border-hospital-200 p-4 rounded-xl focus:border-hospital-500 focus:ring-4 focus:ring-hospital-50 focus:outline-none bg-white font-mono text-xl text-center uppercase placeholder-gray-300 tracking-wider"
                               value={formData.id}
                               onChange={e => setFormData({...formData, id: e.target.value})}
                               autoFocus
                             />
                           </div>
                           <p className="text-xs text-gray-400 mt-2 text-center">Enter the unique file number from the physical file.</p>
                        </div>
                     </div>
                  </div>
                )}

                <div className="pt-8 border-t flex justify-end gap-4">
                  {step === 1 ? (
                    <>
                      <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-xl">Cancel</button>
                      <button 
                        type="button" 
                        onClick={editingId ? handleSubmit : handleNextStep}
                        className="px-8 py-3 bg-hospital-600 text-white font-bold rounded-xl hover:bg-hospital-700 shadow-xl shadow-hospital-200 transform hover:-translate-y-1 transition-all flex items-center gap-2"
                      >
                        {editingId ? <Save className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        {editingId ? 'Update Patient' : 'Next Step'}
                      </button>
                    </>
                  ) : (
                    <>
                       <button type="button" onClick={() => setStep(1)} className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-xl">Back</button>
                       <button 
                        type="submit" 
                        className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-xl shadow-green-200 transform hover:-translate-y-1 transition-all flex items-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Complete Registration
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm font-medium uppercase tracking-wider">
            <tr>
              <th className="p-4">File No</th>
              <th className="p-4">Patient</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">Condition</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Registered</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPatients.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No patients found.</td></tr>
            ) : filteredPatients.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-mono text-sm text-gray-600">{p.id}</td>
                <td className="p-4">
                  <div className="font-medium text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.age} yrs • {p.gender}</div>
                </td>
                <td className="p-4 text-gray-600">{p.mobile}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-hospital-100 text-hospital-700">
                    {p.condition}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs">
                       {p.doctorAssessment ? <CheckCircle className="w-3 h-3 text-green-500"/> : <Clock className="w-3 h-3 text-orange-400"/>}
                       <span className={p.doctorAssessment ? "text-green-700" : "text-gray-400"}>Doctor</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                       {p.packageProposal ? <CheckCircle className="w-3 h-3 text-green-500"/> : <Clock className="w-3 h-3 text-orange-400"/>}
                       <span className={p.packageProposal ? "text-green-700" : "text-gray-400"}>Package</span>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right text-gray-500 text-sm">
                  {new Date(p.registeredAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleEdit(p)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Patient"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Patient"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};