
import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { ExportButtons } from '../components/ExportButtons';
import { Gender, Condition, Patient, Appointment, SurgeonCode } from '../types';
import { 
  PlusCircle, Search, CheckCircle, ArrowLeft, 
  Calendar, Pencil, Trash2, User, 
  Phone, X, CalendarCheck, Tag, Chrome, MessageCircle, Instagram, 
  Facebook, Youtube, Globe, Clock, Users as UsersIcon,
  Share2, History, BadgeInfo, CreditCard, Clock3, Stethoscope,
  FileText
} from 'lucide-react';

/**
 * Strictly ensures a date string is always in YYYY-MM-DD format.
 */
const formatDateToYYYYMMDD = (dateStr?: string) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [dPart, mPart, yPart] = dateStr.split('-');
        return `${yPart}-${mPart}-${dPart}`;
      }
      return '';
    }
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const getHistoryStatus = (p: Patient): string => {
  if (p.packageProposal?.outcome) {
    switch (p.packageProposal.outcome) {
      case 'Scheduled': return 'Surgery Scheduled';
      case 'Follow-Up': return 'Package Follow-up';
      case 'Lost': return 'Surgery Lost';
      default: return p.packageProposal.outcome;
    }
  }
  if (p.doctorAssessment) {
    if (p.doctorAssessment.quick_code === SurgeonCode.M1) return 'Medication';
    if (p.doctorAssessment.quick_code === SurgeonCode.S1) return 'Surgery';
    return 'Consulted';
  }
  return p.visitType === 'Follow Up' ? 'Follow-up' : 'New OPD';
};

export const FrontOfficeDashboard: React.FC = () => {
  const { 
    patients, addPatient, updatePatient, deletePatient, 
    appointments, addAppointment, updateAppointment
  } = useHospital();
  
  const [activeTab, setActiveTab] = useState<'REGISTRATION' | 'APPOINTMENTS' | 'HISTORY'>('REGISTRATION');
  const [showForm, setShowForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [opdDate, setOpdDate] = useState(new Date().toISOString().split('T')[0]);
  const [apptDate, setApptDate] = useState(new Date().toISOString().split('T')[0]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [originatingAppointmentId, setOriginatingAppointmentId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Patient> & { sourceDoctorNotes?: string; sourceOtherDetails?: string }>({
    id: '', name: '', dob: '', gender: undefined, age: undefined,
    mobile: '', occupation: '', hasInsurance: undefined, insuranceName: '',
    source: '', condition: undefined, visitType: undefined,
    sourceDoctorName: '', sourceDoctorNotes: '', sourceOtherDetails: ''
  });

  const [bookingData, setBookingData] = useState<Partial<Appointment>>({
    name: '', source: '', condition: undefined, mobile: '',
    date: '', time: '', bookingType: undefined
  });

  const sourceConfig = [
    { name: "Google", icon: <Chrome className="w-4 h-4 text-blue-500" /> },
    { name: "Facebook", icon: <Facebook className="w-4 h-4 text-blue-600" /> },
    { name: "Instagram", icon: <Instagram className="w-4 h-4 text-pink-500" /> },
    { name: "WhatsApp", icon: <MessageCircle className="w-4 h-4 text-green-500" /> },
    { name: "YouTube", icon: <Youtube className="w-4 h-4 text-red-600" /> },
    { name: "Website", icon: <Globe className="w-4 h-4 text-slate-600" /> },
    { name: "Old Patient / Relatives", icon: <UsersIcon className="w-4 h-4 text-amber-600" /> },
    { name: "Friends / Online", icon: <Share2 className="w-4 h-4 text-indigo-500" /> },
    { name: "Hospital Billboards", icon: <Tag className="w-4 h-4 text-slate-500" /> },
    { name: "Doctor Recommend", icon: <Stethoscope className="w-4 h-4 text-teal-500" /> },
    { name: "Other", icon: <PlusCircle className="w-4 h-4 text-slate-400" /> }
  ];

  const resetForm = () => {
    setFormData({ 
      id: '', name: '', dob: '', gender: undefined, age: undefined, 
      mobile: '', occupation: '', hasInsurance: undefined, insuranceName: '', 
      source: '', condition: undefined, visitType: undefined,
      sourceDoctorName: '', sourceDoctorNotes: '', sourceOtherDetails: ''
    });
    setEditingId(null);
    setOriginatingAppointmentId(null);
    setStep(1);
  };

  const resetBookingForm = () => {
    setBookingData({
      name: '', source: '', condition: undefined, mobile: '',
      date: '', time: '', bookingType: undefined
    });
  };

  const handleEdit = (p: Patient) => {
    let sourceDoctorName = p.sourceDoctorName || '';
    let sourceDoctorNotes = '';
    const notesMatch = sourceDoctorName.match(/\(Notes: (.*)\)$/);
    if (notesMatch && notesMatch[1]) {
        sourceDoctorName = sourceDoctorName.replace(notesMatch[0], '').trim();
        sourceDoctorNotes = notesMatch[1];
    }
    let source = p.source || '';
    let sourceOtherDetails = '';
    if (source.startsWith('Other: ')) {
      sourceOtherDetails = source.substring(7);
      source = 'Other';
    }
    setFormData({
      ...p,
      source,
      sourceOtherDetails,
      visitType: p.visitType || 'OPD',
      hasInsurance: p.hasInsurance || 'No',
      sourceDoctorName,
      sourceDoctorNotes
    });
    setEditingId(p.id);
    setStep(1);
    setShowForm(true);
  };

  const handleArrived = (item: any) => {
    setFormData({ 
      id: '', 
      name: item.name || '', 
      dob: '', 
      gender: undefined, 
      age: undefined, 
      mobile: item.mobile || '', 
      occupation: '', 
      hasInsurance: undefined, 
      insuranceName: '', 
      source: item.source || '', 
      condition: item.condition,
      visitType: item.bookingType || 'OPD'
    });
    setEditingId(null);
    setOriginatingAppointmentId(item.id);
    setStep(1);
    setShowForm(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.name || !bookingData.mobile || !bookingData.date || !bookingData.time) {
      return alert("Missing mandatory booking fields.");
    }
    await addAppointment(bookingData as any);
    setShowBookingForm(false);
    resetBookingForm();
  };

  const handleBookingTypeChange = async (appt: Appointment, newType: 'OPD' | 'Follow Up') => {
    const updated = { ...appt, bookingType: newType };
    await updateAppointment(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !editingId) {
      if (!formData.name || !formData.age || !formData.gender || !formData.mobile || !formData.source || !formData.condition) {
        return alert("Please fill in all mandatory details.");
      }
      setStep(2);
      return;
    }

    if (!formData.id) return alert("Case Number is required.");

    const dataToSave = { ...formData };
    if (dataToSave.source === 'Doctor Recommend' && dataToSave.sourceDoctorName) {
        dataToSave.sourceDoctorName = dataToSave.sourceDoctorNotes 
            ? `${dataToSave.sourceDoctorName} (Notes: ${dataToSave.sourceDoctorNotes})`
            : dataToSave.sourceDoctorName;
    }
    if (dataToSave.source === 'Other' && dataToSave.sourceOtherDetails) {
      dataToSave.source = `Other: ${dataToSave.sourceOtherDetails}`;
    }

    if (editingId) {
      const originalPatient = patients.find(p => p.id === editingId);
      if (originalPatient) await updatePatient(editingId, { ...originalPatient, ...dataToSave as Patient });
    } else {
      if (patients.some(p => p.id === formData.id)) return alert("File Number already exists.");
      if (originatingAppointmentId) {
        // Transition: Update existing appointment record to become an arrived patient
        // This ensures the record moves from 'appointments' state to 'patients' state in context
        await updatePatient(originatingAppointmentId, { ...dataToSave as Patient, status: 'Arrived' });
      } else {
        await addPatient(dataToSave as any);
      }
    }
    setShowForm(false);
    resetForm();
  };

  const getPatientStatus = (p: Patient) => {
    if (p.packageProposal?.outcome) return p.packageProposal.outcome;
    if (p.doctorAssessment) return 'Consulted';
    return 'New OPD';
  };

  const filteredPatients = patients.filter(p => {
    const sTerm = (searchTerm || '').toLowerCase();
    const matchesSearch = (p.name || '').toLowerCase().includes(sTerm) || (p.id || '').toLowerCase().includes(sTerm) || (p.mobile || '').includes(searchTerm);
    const regDate = formatDateToYYYYMMDD(p.entry_date || (p.registeredAt ? p.registeredAt.split('T')[0] : ''));
    return matchesSearch && (!opdDate || regDate === opdDate);
  });

  const filteredAppointments = appointments.filter(a => {
    const sTerm = (searchTerm || '').toLowerCase();
    const normalizedDate = formatDateToYYYYMMDD(a.date);
    return (!apptDate || normalizedDate === apptDate) && ((a.name || '').toLowerCase().includes(sTerm) || (a.mobile || '').includes(searchTerm));
  });

  const combinedHistoryData = [
    ...patients.map(p => ({
      ...p,
      recordType: 'Registration' as const,
      displayDate: p.registeredAt,
      displayEntryDate: formatDateToYYYYMMDD(p.entry_date || (p.registeredAt ? p.registeredAt.split('T')[0] : '')),
      displayStatus: getHistoryStatus(p)
    })),
    ...appointments.map(a => ({
      id: a.id, name: a.name, mobile: a.mobile, condition: a.condition, source: a.source,
      registeredAt: a.createdAt, entry_date: a.date, recordType: 'Appointment' as const,
      displayDate: a.date + 'T' + (a.time || '00:00') + ':00', 
      displayEntryDate: formatDateToYYYYMMDD(a.date),
      displayStatus: 'Scheduled',
      time: a.time
    }))
  ].filter(item => {
    const sTerm = (searchTerm || '').toLowerCase();
    return (item.name || '').toLowerCase().includes(sTerm) || (item.id || '').toLowerCase().includes(sTerm) || (item.mobile || '').includes(searchTerm);
  }).sort((a, b) => new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime());

  const displayData = activeTab === 'REGISTRATION' ? filteredPatients 
                   : activeTab === 'APPOINTMENTS' ? filteredAppointments 
                   : combinedHistoryData;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Front Office</h2>
          <p className="text-gray-500 text-sm">Patient Registration & Management</p>
        </div>
        <ExportButtons patients={activeTab === 'HISTORY' ? (combinedHistoryData as any) : patients} role="front_office" />
      </div>

      <div className="flex bg-white p-1 rounded-xl border w-fit shadow-sm overflow-x-auto">
        <button onClick={() => setActiveTab('REGISTRATION')} className={`px-6 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'REGISTRATION' ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
          <User className="w-4 h-4" /> OPD History
        </button>
        <button onClick={() => setActiveTab('APPOINTMENTS')} className={`px-6 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'APPOINTMENTS' ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
          <CalendarCheck className="w-4 h-4" /> Scheduled Appointments
        </button>
        <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
          <Search className="w-4 h-4" /> Global Search
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 items-center">
            <div className="relative flex-1 md:max-w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder={`Search...`} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-hospital-500 outline-none font-medium text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {(activeTab === 'REGISTRATION' || activeTab === 'APPOINTMENTS') && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-hospital-500" 
                  value={activeTab === 'REGISTRATION' ? opdDate : apptDate} 
                  onChange={e => activeTab === 'REGISTRATION' ? setOpdDate(e.target.value) : setApptDate(e.target.value)} 
                />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight whitespace-nowrap">Filter Date</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { resetBookingForm(); setShowBookingForm(true); }} className="bg-white border-2 border-hospital-600 text-hospital-600 px-6 py-3 rounded-xl hover:bg-hospital-50 flex items-center gap-2 font-bold shadow-sm transition-all">
              <CalendarCheck className="w-5 h-5" /> Book Appointment
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-hospital-600 text-white px-8 py-3 rounded-xl hover:bg-hospital-700 flex items-center gap-2 font-bold shadow-lg shadow-hospital-100 transition-all">
              <PlusCircle className="w-5 h-5" /> Register Patient
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="p-5">{activeTab === 'APPOINTMENTS' ? 'Appt Time' : 'File ID / Date'}</th>
                <th className="p-5">Patient Details</th>
                <th className="p-5">Contact</th>
                <th className="p-5">Complaint</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayData.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 font-mono font-black text-slate-500">
                    <div className="flex items-center gap-3">
                      {activeTab === 'APPOINTMENTS' ? (
                        item.time ? <Clock className="w-5 h-5 text-hospital-500" /> : <Calendar className="w-5 h-5 text-slate-300" />
                      ) : (
                        <FileText className="w-5 h-5 text-slate-300" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-base text-slate-800">
                          {activeTab === 'APPOINTMENTS' ? (item.time || '---') : item.id}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight uppercase">
                          {formatDateToYYYYMMDD(activeTab === 'APPOINTMENTS' ? item.date : (item.entry_date || (item.registeredAt ? item.registeredAt.split('T')[0] : '')))}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-slate-900 text-base">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">
                      {item.age ? `${item.age}Y • ` : ''} {item.source || item.gender || 'OTHER'}
                    </div>
                  </td>
                  <td className="p-5 text-sm font-medium text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-300" /> {item.mobile}
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
                      {item.condition}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                       {activeTab === 'APPOINTMENTS' || item.status === 'Scheduled' ? (
                         <>
                           <select 
                              className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border focus:ring-2 focus:ring-hospital-500 outline-none transition-all ${
                                (item.bookingType || 'OPD') === 'OPD' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'
                              }`}
                              value={item.bookingType || 'OPD'}
                              onChange={(e) => handleBookingTypeChange(item, e.target.value as any)}
                           >
                              <option value="OPD">OPD</option>
                              <option value="Follow Up">Follow Up</option>
                           </select>
                           <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 whitespace-nowrap">Scheduled</span>
                         </>
                       ) : (
                         <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                           getHistoryStatus(item).includes('Scheduled') ? 'bg-emerald-50 text-emerald-600' :
                           getHistoryStatus(item).includes('Follow-up') ? 'bg-blue-50 text-blue-600' :
                           'bg-slate-50 text-slate-400'
                         }`}>{item.displayStatus || getHistoryStatus(item)}</span>
                       )}
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end items-center gap-3">
                      {(activeTab === 'APPOINTMENTS' || item.status === 'Scheduled') && (
                        <button 
                          onClick={() => handleArrived(item)} 
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Arrived
                        </button>
                      )}
                      <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-hospital-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deletePatient(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayData.length === 0 && (
            <div className="p-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-xs">
              No records found
            </div>
          )}
        </div>
      </div>

      {showBookingForm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20">
            <div className="hidden md:flex w-72 bg-slate-900 text-white p-8 flex-col justify-between">
               <div><h2 className="text-3xl font-black mb-10 leading-tight">Book Appointment</h2></div>
               <button onClick={() => setShowBookingForm(false)} className="flex items-center gap-2 text-white/50 font-black uppercase text-[10px]"><ArrowLeft className="w-4 h-4" /> Close</button>
            </div>
            <div className="flex-1 p-10">
               <form onSubmit={handleBookingSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Full Name</label>
                     <input required className="w-full text-2xl font-black border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500" value={bookingData.name || ''} onChange={e => setBookingData({...bookingData, name: e.target.value})} placeholder="Patient Name" />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Mobile Number</label>
                     <input required type="tel" className="w-full text-xl font-mono border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500" value={bookingData.mobile || ''} onChange={e => setBookingData({...bookingData, mobile: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Condition</label>
                     <select required className="w-full border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500 text-sm font-bold bg-white" value={bookingData.condition || ''} onChange={e => setBookingData({...bookingData, condition: e.target.value as Condition})}>
                       <option value="">Select...</option>
                       {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Appt Date</label>
                     <input required type="date" className="w-full py-2 border-b-2 border-slate-100 text-sm font-bold outline-none focus:border-hospital-500" value={bookingData.date || ''} onChange={e => setBookingData({...bookingData, date: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Appt Time</label>
                     <input required type="time" className="w-full py-2 border-b-2 border-slate-100 text-sm font-bold outline-none focus:border-hospital-500" value={bookingData.time || ''} onChange={e => setBookingData({...bookingData, time: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Source</label>
                     <select required className="w-full border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500 text-sm font-bold bg-white" value={bookingData.source || ''} onChange={e => setBookingData({...bookingData, source: e.target.value})}>
                       <option value="">Select...</option>
                       {sourceConfig.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                     </select>
                   </div>
                 </div>
                 <div className="pt-6">
                    <button type="submit" className="w-full py-4 bg-hospital-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">Create Appointment</button>
                 </div>
               </form>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl md:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20">
            <div className="hidden md:flex w-72 bg-slate-900 text-white p-8 flex-col justify-between">
               <div><h2 className="text-3xl font-black mb-10 leading-tight">Patient Registration</h2></div>
               <button onClick={() => { setShowForm(false); resetForm(); }} className="flex items-center gap-2 text-white/50 font-black uppercase text-[10px]"><ArrowLeft className="w-4 h-4" /> Discard</button>
            </div>
            <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
               <header className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Step {step} of 2</h3>
                 <button onClick={() => setShowForm(false)} className="md:hidden p-2 text-slate-400"><X className="w-6 h-6" /></button>
              </header>
              <div className="flex-1 p-10 overflow-y-auto">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-12">
                  {step === 1 ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                         <div className="md:col-span-2">
                           <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Full Name</label>
                           <input required className="w-full text-3xl font-black border-b-4 border-slate-100 p-2 outline-none focus:border-hospital-500" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Patient Name" />
                         </div>
                         <div>
                           <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Age</label>
                           <input type="number" required className="w-full text-xl font-bold border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500" value={formData.age || ''} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} />
                         </div>
                         <div>
                           <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Gender</label>
                           <div className="flex gap-4">
                             {Object.values(Gender).map(g => (
                               <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as Gender})} className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${formData.gender === g ? 'bg-hospital-600 text-white border-hospital-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}>{g}</button>
                             ))}
                           </div>
                         </div>
                         <div>
                           <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Mobile Contact</label>
                           <input required type="tel" className="w-full text-xl font-mono border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="Phone Number" />
                         </div>
                         <div>
                           <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Condition/Complaint</label>
                           <select required className="w-full border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500 text-sm font-bold bg-white" value={formData.condition || ''} onChange={e => setFormData({...formData, condition: e.target.value as Condition})}>
                             <option value="">Select...</option>
                             {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                         </div>
                       </div>
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center space-y-10 animate-in zoom-in-95">
                       <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter text-center">Assign Case/File ID</h2>
                       <input required className="text-5xl font-mono text-center border-4 border-slate-100 p-10 rounded-[2.5rem] w-full focus:border-hospital-500 outline-none uppercase font-black" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="HMS-000" />
                    </div>
                  )}
                </form>
              </div>
              <footer className="p-8 border-t flex justify-between items-center bg-slate-50/30">
                 <button onClick={() => step === 2 ? setStep(1) : setShowForm(false)} className="px-8 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">{step === 2 ? 'Back' : 'Cancel'}</button>
                 {step === 1 ? (
                   <button onClick={() => { if(formData.name && formData.mobile && formData.condition) setStep(2); else alert("Please fill basic patient info."); }} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">Continue Registration</button>
                 ) : (
                   <button onClick={handleSubmit} className="px-14 py-5 bg-hospital-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">Save Patient Entry</button>
                 )}
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
