
import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { ExportButtons } from '../components/ExportButtons';
import { Gender, Condition, Patient, Appointment } from '../types';
import { 
  PlusCircle, Search, CheckCircle, ArrowLeft, 
  Calendar, Pencil, Trash2, User, 
  Phone, X, CalendarCheck, Tag, ChevronLeft,
  Chrome, MessageCircle, Instagram, Facebook, Youtube, Globe,
  MoreVertical, ShieldCheck, Clock, ChevronRight, Briefcase, Users as UsersIcon,
  Share2, History, Filter, FileSpreadsheet, BadgeInfo, UserPlus, FileText,
  CreditCard, Info, Clock3
} from 'lucide-react';

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

  const [historyFilters, setHistoryFilters] = useState({
    startDate: '',
    endDate: '',
    source: '',
    condition: '',
    status: '',
    type: 'ALL'
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [originatingAppointmentId, setOriginatingAppointmentId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Patient>>({
    id: '', name: '', dob: '', gender: undefined, age: undefined,
    mobile: '', occupation: '', hasInsurance: undefined, insuranceName: '',
    source: '', condition: undefined, visitType: undefined
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
    { name: "Other", icon: <PlusCircle className="w-4 h-4 text-slate-400" /> }
  ];

  const resetForm = () => {
    setFormData({ 
      id: '', name: '', dob: '', gender: undefined, age: undefined, 
      mobile: '', occupation: '', hasInsurance: undefined, insuranceName: '', 
      source: '', condition: undefined, visitType: undefined 
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
    setFormData({
      ...p,
      visitType: p.visitType || 'OPD',
      hasInsurance: p.hasInsurance || 'No'
    });
    setEditingId(p.id);
    setStep(1);
    setShowForm(true);
  };

  const handleArrived = (appt: Appointment) => {
    setFormData({ 
      id: '', 
      name: appt.name || '', 
      dob: '', 
      gender: undefined, 
      age: undefined, 
      mobile: appt.mobile || '', 
      occupation: '', 
      hasInsurance: undefined, 
      insuranceName: '', 
      source: appt.source || '', 
      condition: appt.condition,
      visitType: appt.bookingType || 'OPD'
    });
    setEditingId(null);
    setOriginatingAppointmentId(appt.id);
    setStep(1);
    setShowForm(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.name || !bookingData.mobile || !bookingData.date || !bookingData.time) {
      return alert("Please fill in all mandatory booking fields.");
    }
    if (!bookingData.bookingType) return alert("Please select a Visit Type (OPD/Follow Up)");
    if (!bookingData.source) return alert("Please select a Lead Source");
    if (!bookingData.condition) return alert("Please select a Condition");
    
    await addAppointment(bookingData as any);
    setShowBookingForm(false);
    resetBookingForm();
  };

  const handleBookingTypeChange = async (appt: Appointment, newType: 'OPD' | 'Follow Up') => {
    const updated = { ...appt, bookingType: newType };
    await updateAppointment(updated);
  };

  const validateStep1 = () => {
    const { name, age, gender, mobile, occupation, condition, hasInsurance, source } = formData;
    if (!name || !age || !gender || !mobile || !occupation || !condition || !hasInsurance || !source) {
      alert("All fields are mandatory. Please fill in all details.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !editingId) {
      if (validateStep1()) setStep(2);
      return;
    }

    if (!formData.id) {
      alert("Case Number is required.");
      return;
    }

    if (editingId) {
       const originalPatient = patients.find(p => p.id === editingId);
       if (originalPatient) {
         await updatePatient(editingId, { ...originalPatient, ...formData as Patient });
       }
    } else {
      if (patients.some(p => p.id === formData.id)) return alert("File Number already exists in database.");
      
      if (originatingAppointmentId) {
        await updatePatient(originatingAppointmentId, { 
          ...formData as Patient,
          status: 'Arrived',
          entry_date: new Date().toISOString().split('T')[0]
        });
      } else {
        await addPatient(formData as any);
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

  // OPD History: Only display patients with status Arrived (Registered Files)
  const filteredPatients = patients.filter(p => {
    if (p.status !== 'Arrived') return false;
    
    const sTerm = (searchTerm || '').toLowerCase();
    const pName = (p.name || '').toLowerCase();
    const pId = (p.id || '').toLowerCase();
    const pMobile = p.mobile || '';

    const matchesSearch = pName.includes(sTerm) || 
                         pId.includes(sTerm) ||
                         pMobile.includes(searchTerm);
    
    const regDate = p.entry_date || (p.registeredAt ? p.registeredAt.split('T')[0] : '');
    return matchesSearch && (!opdDate || regDate === opdDate);
  });

  // Scheduled Appointments: Only display leads with status 'Scheduled'
  const filteredAppointments = appointments.filter(a => {
    const sTerm = (searchTerm || '').toLowerCase();
    const aName = (a.name || '').toLowerCase();
    const aMobile = a.mobile || '';
    
    // Appointments list in context already filters for 'Scheduled'
    return (!apptDate || a.date === apptDate) &&
    (aName.includes(sTerm) || aMobile.includes(searchTerm));
  }).sort((a, b) => ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || '')));

  const combinedHistoryData = [
    ...patients.map(p => ({
      ...p,
      recordType: 'Registration' as const,
      displayDate: p.registeredAt,
      displayEntryDate: p.entry_date,
      displayStatus: p.status === 'Arrived' ? getPatientStatus(p) : 'Lead'
    })),
    ...appointments.map(a => ({
      id: '---', name: a.name, mobile: a.mobile, condition: a.condition, source: a.source,
      registeredAt: a.createdAt, entry_date: a.date, recordType: 'Appointment' as const,
      displayDate: a.date + 'T' + (a.time || '00:00') + ':00', displayEntryDate: a.date,
      displayStatus: 'Upcoming Appt'
    }))
  ].filter(item => {
    const sTerm = (searchTerm || '').toLowerCase();
    const iName = (item.name || '').toLowerCase();
    const iId = (item.id || '').toLowerCase();
    const iMobile = item.mobile || '';

    const matchesSearch = iName.includes(sTerm) || 
                         iId.includes(sTerm) ||
                         iMobile.includes(searchTerm);
    if (!matchesSearch) return false;
    if (historyFilters.type !== 'ALL' && item.recordType !== historyFilters.type) return false;
    return true;
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
          <History className="w-4 h-4" /> Patients History
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 items-center">
            <div className="relative flex-1 md:max-w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder={`Search ${activeTab.toLowerCase()}...`} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-hospital-500 outline-none font-medium text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {(activeTab === 'REGISTRATION' || activeTab === 'APPOINTMENTS') && (
              <div className="flex items-center gap-2 animate-in fade-in duration-300">
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
                <th className="p-5">{activeTab === 'APPOINTMENTS' ? 'Appt Time' : 'File ID'}</th>
                <th className="p-5">Patient Details</th>
                <th className="p-5">Contact</th>
                <th className="p-5">Findings</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayData.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 font-mono font-black text-slate-500">
                    {activeTab === 'APPOINTMENTS' ? (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-hospital-400" />
                        {item.time}
                      </div>
                    ) : (
                      item.id
                    )}
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase">
                      {item.age ? `${item.age}Y • ${item.gender}` : item.source}
                    </div>
                  </td>
                  <td className="p-5 text-sm font-medium text-slate-600 flex items-center gap-2"><Phone className="w-3 h-3 text-slate-300" /> {item.mobile}</td>
                  <td className="p-5">
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{item.condition}</span>
                  </td>
                  <td className="p-5">
                    {activeTab === 'APPOINTMENTS' ? (
                      <div className="flex items-center gap-2">
                         <select 
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border focus:ring-2 focus:ring-hospital-500 outline-none transition-all ${
                              item.bookingType === 'OPD' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'
                            }`}
                            value={item.bookingType || 'OPD'}
                            onChange={(e) => handleBookingTypeChange(item, e.target.value as any)}
                         >
                            <option value="OPD">OPD</option>
                            <option value="Follow Up">Follow Up</option>
                         </select>
                         <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{item.status}</span>
                      </div>
                    ) : (
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                        getPatientStatus(item) === 'Scheduled' ? 'bg-emerald-50 text-emerald-600' :
                        getPatientStatus(item) === 'Follow-Up' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-50 text-slate-400'
                      }`}>{item.displayStatus || getPatientStatus(item)}</span>
                    )}
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-1">
                      {activeTab === 'APPOINTMENTS' && (
                        <button onClick={() => handleArrived(item)} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-100 transition-colors mr-2">
                          Arrived
                        </button>
                      )}
                      <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deletePatient(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayData.length === 0 && (
            <div className="p-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-xs">
              No records found for this view
            </div>
          )}
        </div>
      </div>

      {/* Appointment Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20">
            <div className="hidden md:flex w-72 bg-slate-900 text-white p-8 flex-col justify-between relative">
               <div className="relative z-10">
                 <h2 className="text-3xl font-black mb-10 leading-tight">Book Appointment</h2>
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                   Schedule patient visits to optimize clinic workflow.
                 </p>
               </div>
               <button onClick={() => setShowBookingForm(false)} className="relative z-10 flex items-center gap-2 text-white/50 font-black uppercase text-[10px] hover:text-white transition-colors">
                 <ArrowLeft className="w-4 h-4" /> Close
               </button>
            </div>

            <div className="flex-1 bg-white flex flex-col overflow-hidden">
               <header className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Appointment Details</h3>
                 <button onClick={() => setShowBookingForm(false)} className="md:hidden p-2 text-slate-400"><X className="w-6 h-6" /></button>
              </header>

              <div className="flex-1 overflow-y-auto p-10">
                <form onSubmit={handleBookingSubmit} className="max-w-2xl mx-auto space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Full Name</label>
                      <input required className="w-full text-2xl font-black border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500 transition-all placeholder-slate-200" value={bookingData.name || ''} onChange={e => setBookingData({...bookingData, name: e.target.value})} placeholder="Patient Name" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Mobile Number</label>
                      <input required type="tel" className="w-full text-xl font-mono border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500" value={bookingData.mobile || ''} onChange={e => setBookingData({...bookingData, mobile: e.target.value})} placeholder="Phone" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Complaint</label>
                      <select required className="w-full border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500 text-sm font-bold bg-white" value={bookingData.condition || ''} onChange={e => setBookingData({...bookingData, condition: e.target.value as Condition})}>
                        <option value="">Select Condition</option>
                        {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Appt Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                        <input required type="date" className="w-full pl-8 py-2 border-b-2 border-slate-100 text-sm font-bold outline-none focus:border-hospital-500" value={bookingData.date || ''} onChange={e => setBookingData({...bookingData, date: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Appt Time</label>
                      <div className="relative">
                        <Clock3 className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                        <input required type="time" className="w-full pl-8 py-2 border-b-2 border-slate-100 text-sm font-bold outline-none focus:border-hospital-500" value={bookingData.time || ''} onChange={e => setBookingData({...bookingData, time: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Source</label>
                      <select required className="w-full border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500 text-sm font-bold bg-white" value={bookingData.source || ''} onChange={e => setBookingData({...bookingData, source: e.target.value})}>
                        <option value="">Select Source</option>
                        {sourceConfig.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Booking Type</label>
                      <div className="flex gap-2">
                        {['OPD', 'Follow Up'].map(type => (
                          <button key={type} type="button" onClick={() => setBookingData({...bookingData, bookingType: type as any})} className={`flex-1 py-2 rounded-lg border-2 text-[9px] font-black uppercase transition-all ${bookingData.bookingType === type ? 'bg-hospital-600 text-white border-hospital-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}>{type}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <footer className="p-8 border-t flex justify-end gap-4 bg-slate-50/30">
                 <button onClick={() => setShowBookingForm(false)} className="px-6 py-3 text-xs font-black uppercase text-slate-400 hover:text-slate-900">Cancel</button>
                 <button onClick={handleBookingSubmit} className="px-12 py-4 bg-hospital-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">Create Appointment</button>
              </footer>
            </div>
          </div>
        </div>
      )}

      {/* Patient Registration Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl h-full md:h-[95vh] md:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20">
            <div className="hidden md:flex w-72 bg-slate-900 text-white p-8 flex-col justify-between relative">
               <div className="relative z-10">
                 <h2 className="text-3xl font-black mb-10 leading-tight">{editingId || originatingAppointmentId ? 'Update' : 'New'} Record</h2>
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                   Enter patient data carefully to ensure smooth clinical transition.
                 </p>
               </div>
               <button onClick={() => { setShowForm(false); resetForm(); }} className="relative z-10 flex items-center gap-2 text-white/50 font-black uppercase text-[10px] hover:text-white transition-colors">
                 <ArrowLeft className="w-4 h-4" /> Discard
               </button>
            </div>

            <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
              <header className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Registration Step {step}</h3>
                 <button onClick={() => setShowForm(false)} className="md:hidden p-2 text-slate-400"><X className="w-6 h-6" /></button>
              </header>

              <div className="flex-1 overflow-y-auto p-10">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-12">
                  {step === 1 ? (
                    <div className="space-y-10">
                       <section className="space-y-6">
                         <div className="flex items-center gap-2 text-[10px] font-black uppercase text-hospital-600 tracking-widest mb-4">
                           <User className="w-4 h-4" /> Personal Information
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                           <div className="md:col-span-2">
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Full Name</label>
                             <input required className="w-full text-3xl font-black border-b-4 border-slate-100 p-2 outline-none focus:border-hospital-500 transition-all placeholder-slate-200" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Patient Name" />
                           </div>
                           <div>
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Age</label>
                             <input type="number" required className="w-full text-xl font-bold border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500" value={formData.age || ''} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} />
                           </div>
                           <div>
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Sex</label>
                             <div className="flex gap-4">
                               {Object.values(Gender).map(g => (
                                 <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as Gender})} className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${formData.gender === g ? 'bg-hospital-600 text-white border-hospital-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}>{g}</button>
                               ))}
                             </div>
                           </div>
                           <div>
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Mobile</label>
                             <input required type="tel" className="w-full text-xl font-mono border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="Phone Number" />
                           </div>
                           <div>
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Occupation</label>
                             <input required className="w-full text-xl font-bold border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500" value={formData.occupation || ''} onChange={e => setFormData({...formData, occupation: e.target.value})} placeholder="Occupation" />
                           </div>
                         </div>
                       </section>

                       <section className="space-y-6">
                         <div className="flex items-center gap-2 text-[10px] font-black uppercase text-hospital-600 tracking-widest mb-4">
                           <BadgeInfo className="w-4 h-4" /> Clinical Context
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                           <div>
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Complaint</label>
                             <select required className="w-full border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500 text-sm font-bold bg-white" value={formData.condition || ''} onChange={e => setFormData({...formData, condition: e.target.value as Condition})}>
                               <option value="">Select Condition</option>
                               {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                           </div>
                         </div>
                       </section>

                       <section className="space-y-6">
                         <div className="flex items-center gap-2 text-[10px] font-black uppercase text-hospital-600 tracking-widest mb-4">
                           <Share2 className="w-4 h-4" /> Marketing Source
                         </div>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {sourceConfig.map(src => (
                              <button
                                key={src.name}
                                type="button"
                                onClick={() => setFormData({...formData, source: src.name})}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                                  formData.source === src.name 
                                    ? 'bg-hospital-50 border-hospital-500 shadow-sm' 
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                }`}
                              >
                                {src.icon}
                                <span className={`text-[8px] font-black uppercase text-center ${formData.source === src.name ? 'text-hospital-700' : 'text-slate-400'}`}>
                                  {src.name}
                                </span>
                              </button>
                            ))}
                         </div>
                       </section>

                       <section className="space-y-6">
                         <div className="flex items-center gap-2 text-[10px] font-black uppercase text-hospital-600 tracking-widest mb-4">
                           <CreditCard className="w-4 h-4" /> Insurance Verification
                         </div>
                         <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                           <div>
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Has Insurance?</label>
                             <div className="flex gap-3">
                               {['Yes', 'No', 'Not Sure'].map(val => (
                                 <button
                                   key={val}
                                   type="button"
                                   onClick={() => setFormData({...formData, hasInsurance: val as any})}
                                   className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${
                                     formData.hasInsurance === val 
                                       ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                                       : 'bg-white text-slate-400 border-slate-200'
                                   }`}
                                 >
                                   {val}
                                 </button>
                               ))}
                             </div>
                           </div>
                           {formData.hasInsurance === 'Yes' && (
                             <div className="animate-in fade-in slide-in-from-top-2">
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Insurance Provider Name</label>
                               <input 
                                 type="text" 
                                 className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold focus:border-hospital-500 outline-none transition-all"
                                 placeholder="e.g. TPA Name, Star Health, etc."
                                 value={formData.insuranceName || ''}
                                 onChange={e => setFormData({...formData, insuranceName: e.target.value})}
                               />
                             </div>
                           )}
                         </div>
                       </section>
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center space-y-10 animate-in zoom-in-95">
                       <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Assign Case Number</h2>
                       <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">This becomes the permanent file identification</p>
                       <input required className="text-5xl font-mono text-center border-4 border-slate-100 p-10 rounded-[2.5rem] w-full focus:border-hospital-500 outline-none uppercase font-black bg-slate-50/30" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="HMS-000" />
                    </div>
                  )}
                </form>
              </div>

              <footer className="p-8 border-t flex justify-between items-center bg-slate-50/30">
                 <button onClick={() => step === 2 ? setStep(1) : setShowForm(false)} className="px-8 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-900 transition-all">{step === 2 ? 'Back' : 'Cancel'}</button>
                 {step === 1 ? (
                   <button onClick={() => { if(validateStep1()) setStep(2); }} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">Next Step</button>
                 ) : (
                   <button onClick={handleSubmit} className="px-14 py-5 bg-hospital-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">Save Patient</button>
                 )}
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
