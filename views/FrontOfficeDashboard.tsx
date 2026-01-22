
import React, { useState, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { ExportButtons } from '../components/ExportButtons';
import { Gender, Condition, Patient, Appointment } from '../types';
import { 
  PlusCircle, Search, CheckCircle, Clock, ArrowLeft, 
  Calendar, Pencil, Trash2, Activity, ChevronRight, User, 
  Phone, X, CalendarCheck, MapPin, Users, LogIn,
  Tag, ChevronDown, Filter, ChevronLeft, Download,
  FilterX, Briefcase, Hash, Info, Sparkles, 
  Chrome, MessageCircle, Instagram, Facebook, Youtube, Globe, HeartPulse, ShieldCheck
} from 'lucide-react';

export const FrontOfficeDashboard: React.FC = () => {
  const { 
    patients, addPatient, updatePatient, deletePatient, 
    appointments, addAppointment, updateAppointment, deleteAppointment, 
    fetchFilteredPatients 
  } = useHospital();
  
  const [activeTab, setActiveTab] = useState<'REGISTRATION' | 'APPOINTMENTS' | 'PATIENTS_LIST'>('REGISTRATION');
  const [showForm, setShowForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originatingAppointmentId, setOriginatingAppointmentId] = useState<string | null>(null);
  
  // Patients List States
  const [listPatients, setListPatients] = useState<Patient[]>([]);
  const [listCount, setListCount] = useState(0);
  const [listPage, setListPage] = useState(0);
  const [listPageSize] = useState(10);
  const [isListLoading, setIsListLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Multi-Filter State
  const [listFilters, setListFilters] = useState({
    startDate: '',
    endDate: '',
    condition: '',
    source: '',
    hasInsurance: '',
    surgeryNeeded: false,
    medicationOnly: false,
    status: '' as any,
  });

  const sourceConfig = [
    { name: "Google", icon: <Chrome className="w-4 h-4 text-blue-500" /> },
    { name: "Facebook", icon: <Facebook className="w-4 h-4 text-blue-600" /> },
    { name: "Instagram", icon: <Instagram className="w-4 h-4 text-pink-500" /> },
    { name: "WhatsApp", icon: <MessageCircle className="w-4 h-4 text-green-500" /> },
    { name: "YouTube", icon: <Youtube className="w-4 h-4 text-red-600" /> },
    { name: "Website", icon: <Globe className="w-4 h-4 text-slate-600" /> },
    { name: "Doctor Recommended", icon: <Activity className="w-4 h-4 text-hospital-600" /> },
    { name: "Old Patient / Family / Friend", icon: <Users className="w-4 h-4 text-amber-600" /> },
    { name: "Hospital Board / Signage", icon: <Tag className="w-4 h-4 text-slate-500" /> },
    { name: "Other", icon: <PlusCircle className="w-4 h-4 text-slate-400" /> }
  ];

  // Load Patients List Data
  const loadListData = async () => {
    if (activeTab !== 'PATIENTS_LIST') return;
    setIsListLoading(true);
    try {
      const { data, count } = await fetchFilteredPatients(
        { ...listFilters, searchTerm },
        listPage,
        listPageSize
      );
      setListPatients(data);
      setListCount(count);
    } catch (e) {
      console.error("Error loading filtered list", e);
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadListData();
    }, 400); 
    return () => clearTimeout(timer);
  }, [listFilters, listPage, searchTerm, activeTab]);

  const handleResetFilters = () => {
    setListFilters({
      startDate: '', endDate: '', condition: '', source: '',
      hasInsurance: '', surgeryNeeded: false, medicationOnly: false, status: '',
    });
    setListPage(0);
    setSearchTerm('');
  };

  // Registration Form State - Starts strictly blank (Requirement 1)
  const [formData, setFormData] = useState<Partial<Patient>>({
    id: '', name: '', dob: '', gender: undefined, age: undefined,
    mobile: '', occupation: '', hasInsurance: undefined, insuranceName: '',
    source: '', condition: undefined 
  });

  // Booking Form State - Initial values for the schedule form only
  const [bookingData, setBookingData] = useState<Partial<Appointment>>({
    name: '', source: '', condition: undefined, mobile: '',
    date: new Date().toISOString().split('T')[0], time: '10:00', bookingType: 'OPD'
  });

  const resetForm = () => {
    setFormData({
      id: '', name: '', dob: '', gender: undefined, age: undefined, mobile: '',
      occupation: '', hasInsurance: undefined, insuranceName: '', source: '', condition: undefined
    });
    setEditingId(null);
    setOriginatingAppointmentId(null);
    setStep(1);
  };

  const handleEdit = (p: Patient) => {
    setFormData(p);
    setEditingId(p.id);
    setStep(1);
    setShowForm(true);
  };

  const toggleBookingType = async (appt: Appointment) => {
    const nextType = appt.bookingType === 'OPD' ? 'Follow Up' : 'OPD';
    await updateAppointment({ ...appt, bookingType: nextType });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.name || !bookingData.mobile || !bookingData.condition) return alert("Missing details.");
    await addAppointment(bookingData as any);
    setShowBookingForm(false);
    // Reset booking form after scheduling (Requirement 2)
    setBookingData({
      name: '', source: '', condition: undefined, mobile: '',
      date: new Date().toISOString().split('T')[0], time: '10:00', bookingType: 'OPD'
    });
  };

  const handleArrived = (appt: Appointment) => {
    // Requirement 3: Pre-fill only on 'Arrived' click using stored appointment data
    setFormData({
      id: '', 
      name: appt.name, 
      dob: '', 
      gender: undefined, 
      age: undefined, 
      mobile: appt.mobile, 
      occupation: '', 
      hasInsurance: undefined, 
      insuranceName: '', 
      source: appt.source, 
      condition: appt.condition 
    });
    setEditingId(null);
    setOriginatingAppointmentId(appt.id);
    setStep(1);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
       const originalPatient = patients.find(p => p.id === editingId);
       if (originalPatient) await updatePatient({ ...originalPatient, ...formData as Patient, id: editingId });
    } else {
      if (!formData.id?.trim()) return alert("File ID required.");
      if (patients.some(p => p.id === formData.id)) return alert("File Number exists.");
      await addPatient(formData as any);
      if (originatingAppointmentId) {
        const appt = appointments.find(a => a.id === originatingAppointmentId);
        if (appt) await updateAppointment({ ...appt, status: 'Arrived' });
      }
    }
    setShowForm(false);
    resetForm();
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAppointments = appointments.filter(a =>
    (a.status === 'Scheduled') && (
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.mobile.includes(searchTerm)
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Front Office</h2>
          <p className="text-gray-500">Registration Desk</p>
        </div>
        <ExportButtons patients={patients} role="front_office" />
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl border w-fit shadow-sm overflow-x-auto no-scrollbar">
        {[
          { id: 'REGISTRATION', label: 'Patient Queue', icon: User },
          { id: 'APPOINTMENTS', label: 'Appointments', icon: CalendarCheck },
          { id: 'PATIENTS_LIST', label: 'Database', icon: Users }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" placeholder="Search..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-hospital-500 outline-none"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {activeTab === 'REGISTRATION' ? (
              <button 
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-hospital-700 text-white px-8 py-3 rounded-xl hover:bg-hospital-800 flex items-center gap-2 font-bold shadow-lg transition-all"
              >
                <PlusCircle className="w-5 h-5" /> Register Patient
              </button>
            ) : activeTab === 'APPOINTMENTS' ? (
              <button 
                onClick={() => setShowBookingForm(true)}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg"
              >
                <Calendar className="w-5 h-5" /> Schedule Booking
              </button>
            ) : (
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold border transition-all ${showFilters ? 'bg-slate-800 text-white' : 'bg-white'}`}
              >
                <Filter className="w-4 h-4" /> Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'REGISTRATION' ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-widest border-b">
              <tr>
                <th className="p-4">File ID</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Progress</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-mono font-bold text-slate-400">{p.id}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase">{p.age} Y • {p.gender}</div>
                  </td>
                  <td className="p-4 font-mono text-sm text-slate-600">{p.mobile}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`text-[10px] font-bold ${p.doctorAssessment ? "text-green-600" : "text-slate-300"}`}>Doctor</div>
                      <div className={`text-[10px] font-bold ${p.packageProposal ? "text-green-600" : "text-slate-300"}`}>Counseling</div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deletePatient(p.id)} className="p-2 text-slate-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === 'APPOINTMENTS' ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-widest border-b">
              <tr>
                <th className="p-4">Scheduled</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Mobile</th>
                <th className="p-4 text-center">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAppointments.map(appt => (
                <tr key={appt.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{appt.time}</div>
                    <div className="text-[10px] text-slate-400">{appt.date}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-900">{appt.name}</td>
                  <td className="p-4 font-mono text-slate-600">{appt.mobile}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleArrived(appt)}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 mx-auto"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Arrived
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center text-slate-400">Loading Database Module...</div>
        )}
      </div>

      {/* SCHEDULE BOOKING MODAL */}
      {showBookingForm && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
            <div className="p-6 border-b flex justify-between items-center bg-indigo-600 text-white">
              <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight"><Calendar className="w-6 h-6" /> Schedule Appointment</h3>
              <button onClick={() => setShowBookingForm(false)} className="hover:bg-white/20 p-2 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleBookingSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Patient Name</label>
                  <input required className="w-full border-b-2 p-2 outline-none focus:border-indigo-500" value={bookingData.name || ''} onChange={e => setBookingData({...bookingData, name: e.target.value})}/>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Mobile</label>
                  <input required className="w-full border-b-2 p-2 outline-none focus:border-indigo-500" value={bookingData.mobile || ''} onChange={e => setBookingData({...bookingData, mobile: e.target.value})}/>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Primary Condition</label>
                  <select className="w-full border-b-2 p-2 outline-none focus:border-indigo-500 bg-white" value={bookingData.condition || ''} onChange={e => setBookingData({...bookingData, condition: e.target.value as Condition})}>
                    <option value="">Select Condition</option>
                    {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Date</label>
                  <input type="date" required className="w-full border-b-2 p-2 outline-none focus:border-indigo-500" value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})}/>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Time</label>
                  <input type="time" required className="w-full border-b-2 p-2 outline-none focus:border-indigo-500" value={bookingData.time} onChange={e => setBookingData({...bookingData, time: e.target.value})}/>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black uppercase text-xs rounded-2xl mt-4">Confirm Schedule</button>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRATION FORM */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-6xl h-full md:h-[90vh] md:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20">
            
            {/* Sidebar Preview (Live ID) */}
            <div className="hidden md:flex w-80 bg-slate-900 text-white p-8 flex-col justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-hospital-600/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-8">
                   <div className="w-8 h-8 bg-hospital-500 rounded-lg flex items-center justify-center"><PlusCircle className="w-5 h-5 text-white" /></div>
                   <span className="text-xs font-black uppercase tracking-widest text-hospital-400">Himas Hospital</span>
                 </div>
                 <h2 className="text-3xl font-black mb-10 leading-tight">
                    {editingId ? 'Update Profile' : originatingAppointmentId ? 'Check-in Registration' : 'New Registration'}
                 </h2>
                 
                 <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md space-y-5">
                   <div className="flex justify-between items-center">
                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Medical ID Preview</label>
                     <div className="w-8 h-8 rounded-full border-2 border-hospital-500/30 flex items-center justify-center text-[10px] font-black text-hospital-400">
                       {formData.name ? '80%' : '0%'}
                     </div>
                   </div>
                   
                   <div className="space-y-4">
                     <div><div className="text-[9px] font-bold text-hospital-400 uppercase tracking-tighter">Full Name</div><div className="text-lg font-black truncate leading-none">{formData.name || '---'}</div></div>
                     <div className="flex justify-between">
                       <div><div className="text-[9px] font-bold text-hospital-400 uppercase tracking-tighter">Age / Sex</div><div className="text-sm font-black">{formData.age || '--'} / {formData.gender || '--'}</div></div>
                       <div className="text-right"><div className="text-[9px] font-bold text-hospital-400 uppercase tracking-tighter">Condition</div><div className="text-sm font-black uppercase text-slate-300">{formData.condition || '--'}</div></div>
                     </div>
                     <div className="pt-3 border-t border-white/10">
                       <div className="text-[9px] font-bold text-hospital-400 uppercase tracking-tighter">Insurance Status</div>
                       <div className={`text-xs font-black uppercase mt-1 flex items-center gap-2 ${formData.hasInsurance === 'Yes' ? 'text-green-400' : 'text-slate-500'}`}>
                         {formData.hasInsurance === 'Yes' ? <ShieldCheck className="w-3 h-3"/> : <X className="w-3 h-3"/>}
                         {formData.hasInsurance === 'Yes' ? (formData.insuranceName || 'Standard Policy') : 'Not Selected'}
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="relative z-10 pt-8 border-t border-white/10">
                 <button onClick={() => { setShowForm(false); resetForm(); }} className="flex items-center gap-2 text-white/50 font-black uppercase text-[10px] hover:text-white transition-colors">
                   <ArrowLeft className="w-4 h-4" /> Discard Draft
                 </button>
               </div>
            </div>

            {/* Main Form Area */}
            <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
              <header className="p-6 md:p-10 border-b flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Registration</h3>
                     <div className="flex items-center gap-2 mt-1">
                       <div className={`h-1.5 w-8 rounded-full ${step === 1 ? 'bg-hospital-600' : 'bg-green-500'}`}></div>
                       <div className={`h-1.5 w-8 rounded-full ${step === 2 ? 'bg-hospital-600' : editingId ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                     </div>
                   </div>
                 </div>
                 <button onClick={() => setShowForm(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 md:p-12">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-12 pb-10">
                  {step === 1 ? (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                       {/* Personal & Identity */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                         <div className="md:col-span-2">
                           <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Legal Name of Patient</label>
                           <input 
                             required autoFocus
                             className="w-full text-3xl font-black border-b-4 border-slate-100 p-2 outline-none focus:border-hospital-500 transition-all placeholder-slate-200" 
                             value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}
                             placeholder="Full Name"
                           />
                         </div>
                         <div>
                           <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Age (Years)</label>
                           <input 
                             type="number" required 
                             className="w-full text-xl font-bold border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500" 
                             value={formData.age || ''} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})}
                           />
                         </div>
                         <div>
                           <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Biological Sex</label>
                           <div className="flex gap-4">
                             {Object.values(Gender).map(g => (
                               <button 
                                 key={g} type="button" 
                                 onClick={() => setFormData({...formData, gender: g as Gender})} 
                                 className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${formData.gender === g ? 'bg-hospital-600 text-white border-hospital-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
                               >
                                 {g}
                               </button>
                             ))}
                           </div>
                         </div>
                         <div>
                           <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Mobile Contact</label>
                           <div className="flex items-center border-b-2 border-slate-100 focus-within:border-hospital-500 transition-all">
                             <span className="text-slate-300 font-black mr-2">+91</span>
                             <input 
                               required type="tel" 
                               className="w-full text-xl font-mono p-2 outline-none" 
                               value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                               placeholder="99999 99999"
                             />
                           </div>
                         </div>
                         <div>
                           <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Primary Complaint</label>
                           <select 
                             className="w-full border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500 text-sm font-bold bg-white" 
                             value={formData.condition || ''} onChange={e => setFormData({...formData, condition: e.target.value as Condition})}
                           >
                             <option value="">Select Condition</option>
                             {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                         </div>
                       </div>

                       {/* Visual Lead Source Selection */}
                       <div className="space-y-4">
                         <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                           <Sparkles className="w-3 h-3 text-hospital-500"/> How did they find us?
                         </label>
                         <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {sourceConfig.map(src => (
                              <button
                                key={src.name}
                                type="button"
                                onClick={() => setFormData({...formData, source: src.name})}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all group ${formData.source === src.name ? 'bg-hospital-50 border-hospital-500' : 'bg-slate-50/50 border-transparent hover:border-slate-200'}`}
                              >
                                <div className={`p-2 rounded-xl bg-white shadow-sm transition-transform ${formData.source === src.name ? 'scale-110' : 'group-hover:scale-105'}`}>
                                  {src.icon}
                                </div>
                                <span className={`text-[9px] font-black uppercase text-center leading-tight ${formData.source === src.name ? 'text-hospital-700' : 'text-slate-400'}`}>
                                  {src.name}
                                </span>
                              </button>
                            ))}
                         </div>
                       </div>

                       {/* Insurance Selection */}
                       <div className={`p-8 rounded-[2rem] transition-all duration-500 ${formData.hasInsurance === 'Yes' ? 'bg-green-50/50 border-2 border-green-200 shadow-xl shadow-green-50' : 'bg-slate-50/50 border-2 border-slate-100'}`}>
                         <div className="flex items-center justify-between mb-6">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                              <ShieldCheck className={`w-4 h-4 ${formData.hasInsurance === 'Yes' ? 'text-green-600' : 'text-slate-400'}`}/> Insurance Eligibility
                            </label>
                            {formData.hasInsurance === 'Yes' && <span className="bg-green-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Insured Profile</span>}
                         </div>
                         
                         <div className="grid grid-cols-3 gap-4">
                           {['No', 'Yes', 'Not Sure'].map(opt => (
                             <button
                               key={opt} type="button"
                               onClick={() => setFormData({...formData, hasInsurance: opt as any})}
                               className={`py-5 rounded-2xl border-2 text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 ${formData.hasInsurance === opt ? 'bg-white border-slate-900 text-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                             >
                               {opt === 'Yes' && <CheckCircle className="w-4 h-4 text-green-500" />}
                               {opt}
                             </button>
                           ))}
                         </div>

                         {formData.hasInsurance === 'Yes' && (
                           <div className="mt-8 animate-in slide-in-from-top-4 duration-300">
                             <label className="block text-[10px] font-black uppercase text-green-700 mb-2 ml-1">Insurance Provider Name</label>
                             <div className="relative">
                               <input 
                                 required
                                 className="w-full bg-white border-2 border-green-200 rounded-2xl p-4 pl-12 focus:border-green-500 outline-none text-xl font-black text-slate-800 placeholder-green-200"
                                 value={formData.insuranceName || ''}
                                 onChange={e => setFormData({...formData, insuranceName: e.target.value.toUpperCase()})}
                                 placeholder="STAR HEALTH, HDFC ERGO..."
                               />
                               <HeartPulse className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                             </div>
                             <p className="text-[10px] text-green-600 font-bold mt-2 ml-1 uppercase">Recommended: Check network hospital status for cashless</p>
                           </div>
                         )}
                       </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-20 space-y-12 animate-in fade-in zoom-in-95">
                       <div className="relative">
                         <div className="absolute inset-0 bg-hospital-500/10 blur-[60px] rounded-full scale-150"></div>
                         <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10">
                           <Hash className="w-12 h-12 text-hospital-600" />
                         </div>
                       </div>
                       
                       <div className="text-center space-y-2">
                         <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Physical Indexing</h2>
                         <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Assign a unique File ID to link the paper records</p>
                       </div>

                       <div className="w-full max-w-md group">
                         <input 
                           required autoFocus
                           className="text-5xl font-mono text-center border-4 border-slate-100 p-10 rounded-[3rem] w-full focus:border-hospital-500 focus:ring-8 focus:ring-hospital-50 outline-none uppercase font-black tracking-widest transition-all bg-slate-50/30" 
                           value={formData.id || ''} 
                           onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} 
                           placeholder="HMS-000"
                         />
                         <div className="flex justify-center mt-6">
                            <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase">
                              <Info className="w-3 h-3 text-hospital-400" />
                              Verify label matches sticker
                            </div>
                         </div>
                       </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Form Footer */}
              <footer className="p-8 border-t bg-white flex justify-between items-center shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
                 <button 
                   type="button" onClick={() => step === 2 ? setStep(1) : setShowForm(false)} 
                   className="px-8 py-4 rounded-2xl text-xs font-black uppercase text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2"
                 >
                   {step === 2 ? <><ChevronLeft className="w-5 h-5" /> Previous</> : 'Cancel'}
                 </button>

                 <div className="flex gap-4">
                   {step === 1 && !editingId ? (
                     <button 
                       type="button" 
                       onClick={() => {
                         if(!formData.name || !formData.mobile || !formData.source || !formData.condition) return alert("Fill Name, Mobile, Source & Condition");
                         setStep(2);
                       }} 
                       className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                     >
                       Next: Assign File ID <ChevronRight className="w-5 h-5 text-hospital-400" />
                     </button>
                   ) : (
                     <button 
                       type="button" onClick={handleSubmit}
                       className="px-14 py-5 bg-green-600 text-white rounded-[1.5rem] font-black text-xs uppercase shadow-2xl shadow-green-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                     >
                       <CheckCircle className="w-5 h-5" /> {editingId ? 'Update Record' : 'Submit Enrollment'}
                     </button>
                   )}
                 </div>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
