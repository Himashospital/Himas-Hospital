import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { ExportButtons } from '../components/ExportButtons';
import { Gender, Condition, Patient, Appointment, SurgeonCode } from '../types';
import { 
  PlusCircle, Search, CheckCircle, ArrowLeft, 
  Calendar, Pencil, Trash2, User, 
  Phone, X, CalendarCheck, Tag, Chrome, MessageCircle, Instagram, 
  Facebook, Youtube, Globe, Clock, Users as UsersIcon,
  Share2, History, BadgeInfo, FileText, CreditCard, Clock3, Stethoscope,
  Filter, FileSpreadsheet, Briefcase, AlertTriangle
} from 'lucide-react';

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  const datePart = dateString.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return datePart;
  }
  return dateString;
};

const getHistoryStatus = (p: Patient): string => {
  if (p.packageProposal?.outcome) {
    switch (p.packageProposal.outcome) {
      case 'Scheduled': return 'Surgery Scheduled';
      case 'Follow-Up': return 'Follow-Up Surgery';
      case 'Lost': return 'Surgery Lost';
      case 'Completed': return 'Surgery Completed';
    }
  }
  if (p.doctorAssessment) {
    if (p.doctorAssessment.quickCode === SurgeonCode.S1) return 'Package Proposal';
    if (p.doctorAssessment.quickCode === SurgeonCode.M1) return 'Medication Done';
    return 'Doctor Done';
  }
  if (p.status === 'Arrived') return 'Arrived';
  return p.visitType === 'Follow Up' ? 'Follow Up' : 'Scheduled';
};

export const FrontOfficeDashboard: React.FC = () => {
  const { 
    patients, addPatient, updatePatient, deletePatient, convertAppointment,
    appointments, addAppointment, updateAppointment
  } = useHospital();
  
  const [activeTab, setActiveTab] = useState<'REGISTRATION' | 'APPOINTMENTS' | 'GLOBAL_SEARCH'>('REGISTRATION');
  const [showForm, setShowForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date Range Filters for OPD
  const [opdStartDate, setOpdStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [opdEndDate, setOpdEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Date Range Filters for Appointments
  const [apptStartDate, setApptStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [apptEndDate, setApptEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [historyFilters, setHistoryFilters] = useState({
    startDate: '', endDate: '', source: '', condition: '', status: '', visitType: 'ALL', type: 'ALL' as 'ALL' | 'Registration' | 'Appointment'
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [originatingAppointmentId, setOriginatingAppointmentId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Patient> & { sourceDoctorNotes?: string; sourceOtherDetails?: string }>({
    id: '', name: '', dob: '', gender: undefined, age: undefined,
    mobile: '', occupation: '', hasInsurance: 'No', insuranceName: '',
    source: '', condition: undefined, visitType: 'OPD',
    sourceDoctorName: '', sourceDoctorNotes: '', sourceOtherDetails: '',
    entry_date: new Date().toISOString().split('T')[0],
    arrivalTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
  });

  const [bookingData, setBookingData] = useState<Partial<Appointment> & { sourceOtherDetails?: string }>({
    name: '', source: '', sourceDoctorName: '', sourceOtherDetails: '', condition: undefined, mobile: '',
    date: '', time: '', bookingType: 'Scheduled'
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
    { name: "Doctor Recommended", icon: <Stethoscope className="w-4 h-4 text-teal-500" /> },
    { name: "Other", icon: <PlusCircle className="w-4 h-4 text-slate-400" /> }
  ];

  const statusOptions = ['Arrived', 'Doctor Done', 'Medication Done', 'Package Proposal', 'Surgery Scheduled', 'Follow-Up Surgery', 'Surgery Lost', 'Surgery Completed', 'Scheduled', 'Follow Up'];

  const getStatusClass = (status?: string): string => {
    if (!status) return 'bg-slate-50 text-slate-400';
    const s = status.toLowerCase();
    if (s.includes('completed')) return 'bg-teal-50 text-teal-600';
    if (s.includes('scheduled')) return 'bg-emerald-50 text-emerald-600';
    if (s.includes('follow-up')) return 'bg-blue-50 text-blue-600';
    if (s.includes('lost')) return 'bg-rose-50 text-rose-600';
    if (s.includes('medication done')) return 'bg-purple-50 text-purple-600';
    if (s.includes('package proposal')) return 'bg-orange-50 text-orange-600';
    if (s.includes('doctor done')) return 'bg-indigo-50 text-indigo-600';
    if (s.includes('arrived')) return 'bg-cyan-50 text-cyan-600';
    if (s === 'scheduled') return 'bg-slate-100 text-slate-500';
    return 'bg-slate-50 text-slate-400';
  };

  const calculateVisitType = (item: any, allPatients: Patient[]): 'New' | 'Revisit' => {
    if (item.recordType === 'Appointment') return 'New';
    const patientMobile = item.mobile;
    if (!patientMobile) return 'New';
    const visits = allPatients.filter(p => p.mobile === patientMobile).sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
    if (visits.length > 0 && visits[0].id === item.id) return 'New';
    return 'Revisit';
  };

  const resetForm = () => { 
    setFormData({ 
      id: '', name: '', dob: '', gender: undefined, age: undefined, mobile: '', occupation: '', hasInsurance: 'No', insuranceName: '', source: '', condition: undefined, visitType: 'OPD', sourceDoctorName: '', sourceDoctorNotes: '', sourceOtherDetails: '',
      entry_date: new Date().toISOString().split('T')[0],
      arrivalTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
    }); 
    setEditingId(null); 
    setOriginatingAppointmentId(null); 
    setStep(1); 
  };
  const resetBookingForm = () => { setBookingData({ name: '', source: '', sourceDoctorName: '', sourceOtherDetails: '', condition: undefined, mobile: '', date: '', time: '', bookingType: 'Scheduled' }); setEditingId(null); };

  const handleEdit = (item: any) => {
    if (activeTab === 'APPOINTMENTS') {
      let source = item.source || '';
      let sourceOtherDetails = '';
      if (source.startsWith('Other: ')) { sourceOtherDetails = source.substring(7); source = 'Other'; }
      setBookingData({ ...item, source, sourceOtherDetails, bookingType: item.bookingType || 'Scheduled' });
      setEditingId(item.id);
      setShowBookingForm(true);
    } else {
      let sourceDoctorName = item.sourceDoctorName || '';
      let sourceDoctorNotes = '';
      const notesMatch = sourceDoctorName.match(/\(Notes: (.*)\)$/);
      if (notesMatch && notesMatch[1]) { sourceDoctorName = sourceDoctorName.replace(notesMatch[0], '').trim(); sourceDoctorNotes = notesMatch[1]; }
      let source = item.source || '';
      let sourceOtherDetails = '';
      if (source.startsWith('Other: ')) { sourceOtherDetails = source.substring(7); source = 'Other'; }
      setFormData({ 
        ...item, source, sourceOtherDetails, visitType: item.visitType || 'OPD', hasInsurance: item.hasInsurance || 'No', insuranceName: item.insuranceName || '', sourceDoctorName, sourceDoctorNotes,
        entry_date: item.entry_date || new Date().toISOString().split('T')[0],
        arrivalTime: item.arrivalTime || new Date().toTimeString().split(' ')[0].substring(0, 5)
      });
      setEditingId(item.id);
      setStep(1);
      setShowForm(true);
    }
  };

  const handleArrived = (appt: Appointment) => { 
    setFormData({ 
      id: '', name: appt.name || '', dob: '', gender: undefined, age: undefined, mobile: appt.mobile || '', occupation: '', hasInsurance: 'No', insuranceName: '', source: appt.source || '', sourceDoctorName: appt.sourceDoctorName || '', condition: appt.condition, visitType: appt.bookingType === 'Follow Up' ? 'Follow Up' : 'OPD',
      entry_date: new Date().toISOString().split('T')[0],
      arrivalTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
    }); 
    setEditingId(null); 
    setOriginatingAppointmentId(appt.id); 
    setStep(1); 
    setShowForm(true); 
  };

  const handleRevisit = async (item: any) => {
    const baseId = item.id.split('_V')[0];
    const newVisitId = `${baseId}_V${Date.now()}`;
    const revisitData: Omit<Patient, 'registeredAt' | 'hospital_id'> = { id: newVisitId, name: item.name, dob: item.dob || null, gender: item.gender || Gender.Other, age: item.age || 0, mobile: item.mobile, occupation: item.occupation || '', condition: item.condition, source: item.source || 'Other', hasInsurance: item.hasInsurance || 'No', insuranceName: item.insuranceName || '', sourceDoctorName: item.sourceDoctorName || '', visitType: 'Follow Up' };
    try { await addPatient(revisitData); setSearchTerm(item.mobile); setOpdStartDate(new Date().toISOString().split('T')[0]); setOpdEndDate(new Date().toISOString().split('T')[0]); setActiveTab('REGISTRATION'); } catch (error) { alert("Failed to create revisit record."); }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isBasicValid = bookingData.name && bookingData.mobile && bookingData.date && bookingData.time && bookingData.bookingType && bookingData.source && bookingData.condition;
    if (!isBasicValid) return alert("Please provide all details.");
    const payload = { ...bookingData };
    if (payload.source === 'Other' && payload.sourceOtherDetails) payload.source = `Other: ${payload.sourceOtherDetails}`;
    if (editingId && activeTab === 'APPOINTMENTS') await updateAppointment({ ...payload, id: editingId } as Appointment);
    else await addAppointment(payload as any);
    setShowBookingForm(false);
    resetBookingForm();
  };

  const handleBookingTypeChange = async (appt: Appointment, newType: 'Scheduled' | 'Follow Up') => { await updateAppointment({ ...appt, bookingType: newType }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !editingId) {
      if (!formData.name || formData.age == null || !formData.gender || !formData.mobile || !formData.condition) return alert("Please complete all mandatory fields.");
      if (formData.source === 'Doctor Recommended' && !formData.sourceDoctorName) return alert("Please provide the Doctor Name.");
      if (formData.source === 'Other' && !formData.sourceOtherDetails) return alert("Please provide details for 'Other' source.");
      if (formData.hasInsurance === 'Yes' && !formData.insuranceName) return alert("Please provide the Insurance Name.");
      setStep(2); return;
    }
    if (!formData.id) return alert("Case Number is required.");
    const dataToSave = { ...formData };
    if (dataToSave.source === 'Doctor Recommended' && dataToSave.sourceDoctorName) dataToSave.sourceDoctorName = dataToSave.sourceDoctorNotes ? `${dataToSave.sourceDoctorName} (Notes: ${dataToSave.sourceDoctorNotes})` : dataToSave.sourceDoctorName;
    if (dataToSave.source === 'Other' && dataToSave.sourceOtherDetails) dataToSave.source = `Other: ${dataToSave.sourceOtherDetails}`;
    if (editingId) { const originalPatient = patients.find(p => p.id === editingId); if (originalPatient) await updatePatient(editingId, { ...originalPatient, ...dataToSave as Patient }); }
    else { if (patients.some(p => p.id === formData.id)) return alert("File Number already exists."); if (originatingAppointmentId) await convertAppointment(originatingAppointmentId, dataToSave as any); else await addPatient(dataToSave as any); }
    setShowForm(false); resetForm();
  };

  const filteredPatients = patients.filter(p => {
    if (p.status !== 'Arrived') return false;
    const pDate = p.entry_date || '';
    if (opdStartDate && pDate < opdStartDate) return false;
    if (opdEndDate && pDate > opdEndDate) return false;
    const sTerm = searchTerm.toLowerCase(); return !sTerm || p.name.toLowerCase().includes(sTerm) || p.id.toLowerCase().includes(sTerm) || p.mobile.includes(sTerm);
  }).sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || ''));

  const filteredAppointments = appointments.filter(a => { 
    const sTerm = searchTerm.toLowerCase(); 
    const aDate = a.date || '';
    if (apptStartDate && aDate < apptStartDate) return false;
    if (apptEndDate && aDate > apptEndDate) return false;
    return (a.name.toLowerCase().includes(sTerm) || a.mobile.includes(sTerm)); 
  }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const combinedHistoryData = [
    ...patients.map(p => ({ ...p, recordType: 'Registration' as const, displayDate: p.registeredAt, displayEntryDate: p.entry_date, displayStatus: getHistoryStatus(p) })),
    ...appointments.map(a => ({ 
      id: '---', 
      name: a.name, 
      mobile: a.mobile, 
      condition: a.condition, 
      source: a.source, 
      sourceDoctorName: a.sourceDoctorName || '',
      registeredAt: a.createdAt, 
      entry_date: a.date, 
      recordType: 'Appointment' as const, 
      displayDate: a.date + 'T' + (a.time || '00:00') + ':00', 
      displayEntryDate: a.date, 
      displayStatus: a.bookingType || 'Scheduled',
      age: undefined as any,
      gender: undefined as any
    }))
  ].filter(item => {
    const sTerm = searchTerm.toLowerCase();
    const matches = item.name.toLowerCase().includes(sTerm) || (item.id && item.id.toLowerCase().includes(sTerm)) || item.mobile.includes(sTerm);
    if (!matches) return false;
    if (activeTab === 'GLOBAL_SEARCH') {
      if (historyFilters.type !== 'ALL' && item.recordType !== historyFilters.type) return false;
      if (historyFilters.startDate || historyFilters.endDate) { const itemDate = item.displayEntryDate || ''; if (historyFilters.startDate && itemDate < historyFilters.startDate) return false; if (historyFilters.endDate && itemDate > historyFilters.endDate) return false; }
      if (historyFilters.source && item.source !== historyFilters.source) return false;
      if (historyFilters.visitType !== 'ALL' && calculateVisitType(item, patients) !== historyFilters.visitType) return false;
      if (historyFilters.status && item.displayStatus !== historyFilters.status) return false;
      if (historyFilters.condition && item.condition !== historyFilters.condition) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime());

  const handleExportFilteredCSV = () => {
    const headers = ['Type', 'File ID', 'Date', 'Name', 'Age', 'Gender', 'Mobile', 'Source', 'Condition', 'Visit Type', 'Status'];
    const rows = combinedHistoryData.map(item => [item.recordType, item.id === '---' ? 'N/A' : item.id.split('_V')[0], formatDate(item.displayEntryDate), item.name, item.age || '', item.gender || '', item.mobile, item.source, item.condition, calculateVisitType(item, patients), item.displayStatus || getHistoryStatus(item as Patient)].map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `global_search_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayData = activeTab === 'REGISTRATION' ? filteredPatients : activeTab === 'APPOINTMENTS' ? filteredAppointments : combinedHistoryData;
  const filterInputClasses = "h-10 w-full bg-slate-50 border border-slate-100 rounded-xl px-3 text-[10px] font-bold focus:ring-2 focus:ring-hospital-500 outline-none transition-all appearance-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Front Office</h2>
          <p className="text-gray-500 text-sm">Patient Registration & Management</p>
        </div>
        <ExportButtons patients={activeTab === 'GLOBAL_SEARCH' ? (combinedHistoryData as any) : patients} role="front_office" selectedPatient={null} />
      </div>

      <div className="flex bg-white p-1 rounded-xl border w-full sm:w-fit shadow-sm overflow-x-auto scrollbar-hide">
        {['REGISTRATION', 'APPOINTMENTS', 'GLOBAL_SEARCH'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 sm:flex-initial px-4 lg:px-6 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            {tab === 'REGISTRATION' && <User className="w-4 h-4" />}
            {tab === 'APPOINTMENTS' && <CalendarCheck className="w-4 h-4" />}
            {tab === 'GLOBAL_SEARCH' && <Search className="w-4 h-4" />}
            {tab === 'REGISTRATION' ? 'OPD History' : tab === 'APPOINTMENTS' ? 'Scheduled Appointments' : 'Global Search'}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 flex-col sm:flex-row gap-4 items-center w-full">
            <div className="relative w-full lg:max-w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Search..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-hospital-500 outline-none font-medium text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {activeTab === 'REGISTRATION' && (
                <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in duration-300">
                    <span className="text-[9px] font-black uppercase text-slate-400">From</span>
                    <input type="date" className="w-32 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold" value={opdStartDate} onChange={e => setOpdStartDate(e.target.value)} />
                    <span className="text-[9px] font-black uppercase text-slate-400">To</span>
                    <input type="date" className="w-32 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold" value={opdEndDate} onChange={e => setOpdEndDate(e.target.value)} />
                </div>
            )}
            {activeTab === 'APPOINTMENTS' && (
                <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in duration-300">
                    <span className="text-[9px] font-black uppercase text-slate-400">From</span>
                    <input type="date" className="w-32 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold" value={apptStartDate} onChange={e => setApptStartDate(e.target.value)} />
                    <span className="text-[9px] font-black uppercase text-slate-400">To</span>
                    <input type="date" className="w-32 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold" value={apptEndDate} onChange={e => setApptEndDate(e.target.value)} />
                </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button onClick={() => { resetBookingForm(); setShowBookingForm(true); }} className="w-full bg-white border-2 border-hospital-600 text-hospital-600 px-6 py-3 rounded-xl hover:bg-hospital-50 flex items-center justify-center gap-2 font-bold transition-all"><CalendarCheck className="w-5 h-5" /> Book Appointment</button>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="w-full bg-hospital-600 text-white px-6 py-3 rounded-xl hover:bg-hospital-700 flex items-center justify-center gap-2 font-bold shadow-lg shadow-hospital-100 transition-all"><PlusCircle className="w-5 h-5" /> Register Patient</button>
          </div>
        </div>

        {activeTab === 'GLOBAL_SEARCH' && (
          <div className="pt-4 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-6 items-end animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-1.5 w-full xl:col-span-3">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Date Range</label>
              <div className="flex items-center gap-2">
                <input type="date" className={filterInputClasses} value={historyFilters.startDate} onChange={e => setHistoryFilters({...historyFilters, startDate: e.target.value})} />
                <input type="date" className={filterInputClasses} value={historyFilters.endDate} onChange={e => setHistoryFilters({...historyFilters, endDate: e.target.value})} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 w-full xl:col-span-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Source</label>
              <select className={filterInputClasses} value={historyFilters.source} onChange={e => setHistoryFilters({...historyFilters, source: e.target.value})}>
                <option value="">All Sources</option>
                {sourceConfig.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 w-full xl:col-span-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Visit</label>
              <select className={filterInputClasses} value={historyFilters.visitType} onChange={e => setHistoryFilters({...historyFilters, visitType: e.target.value})}>
                <option value="ALL">All Visits</option>
                <option value="New">New</option>
                <option value="Revisit">Revisit</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 w-full xl:col-span-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Status</label>
              <select className={filterInputClasses} value={historyFilters.status} onChange={e => setHistoryFilters({...historyFilters, status: e.target.value})}>
                <option value="">All Statuses</option>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 w-full xl:col-span-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Condition</label>
              <select className={filterInputClasses} value={historyFilters.condition} onChange={e => setHistoryFilters({...historyFilters, condition: e.target.value})}>
                <option value="">All Conditions</option>
                {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 w-full xl:col-span-1">
              <button onClick={handleExportFilteredCSV} className="h-10 w-full bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"><FileSpreadsheet className="w-4 h-4" /> CSV</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="p-5 whitespace-nowrap">{activeTab === 'APPOINTMENTS' ? 'APPT TIME' : 'FILE ID / DATE'}</th>
                <th className="p-5 whitespace-nowrap">PATIENT DETAILS</th>
                <th className="p-5 whitespace-nowrap">CONTACT</th>
                {(activeTab === 'REGISTRATION' || activeTab === 'GLOBAL_SEARCH') && <th className="p-5 whitespace-nowrap">VISIT TYPE</th>}
                <th className="p-5 whitespace-nowrap">COMPLAINT</th>
                <th className="p-5 whitespace-nowrap">STATUS</th>
                <th className="p-5 text-right whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayData.map((item: any) => (
                <tr key={item.id + (item.registeredAt || item.displayDate)} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 whitespace-nowrap">
                    {activeTab === 'APPOINTMENTS' ? (
                      <div className="font-mono font-black text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4 text-hospital-400" /> {item.time}</div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-slate-500">{item.id.split('_V')[0]}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">{formatDate(item.entry_date || item.displayEntryDate)}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase">
                      {item.age ? `${item.age}Y • ${item.gender}` : ''}
                      {(item.age || item.gender) && item.source ? ' • ' : ''}
                      {item.source === 'Doctor Recommended' ? `Dr. ${item.sourceDoctorName || 'Recommended'}` : item.source}
                    </div>
                  </td>
                  <td className="p-5 text-sm font-medium text-slate-400 whitespace-nowrap flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {item.mobile}</td>
                  {(activeTab === 'REGISTRATION' || activeTab === 'GLOBAL_SEARCH') && (
                    <td className="p-5 whitespace-nowrap">
                      {(() => {
                        const visitType = calculateVisitType(item, patients);
                        return (
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border shadow-sm ${
                            visitType === 'New' 
                              ? 'bg-teal-50 text-teal-700 border-teal-100' 
                              : 'bg-orange-50 text-orange-700 border-orange-100'
                          }`}>
                            {visitType}
                          </span>
                        );
                      })()}
                    </td>
                  )}
                  <td className="p-5 whitespace-nowrap">
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">{item.condition}</span>
                  </td>
                  <td className="p-5 whitespace-nowrap">
                    {activeTab === 'APPOINTMENTS' ? (
                      <select className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border transition-all ${item.bookingType === 'Follow Up' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`} value={item.bookingType || 'Scheduled'} onChange={(e) => handleBookingTypeChange(item, e.target.value as any)}>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Follow Up">Follow Up</option>
                      </select>
                    ) : (
                      <span className={`text-[8px] font-black uppercase px-2.5 py-1.5 rounded-md shadow-sm border border-transparent whitespace-nowrap ${getStatusClass(item.displayStatus || getHistoryStatus(item))}`}>
                        {item.displayStatus || getHistoryStatus(item)}
                      </span>
                    )}
                  </td>
                  <td className="p-5 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2 items-center">
                      {(activeTab === 'REGISTRATION' || activeTab === 'GLOBAL_SEARCH') && item.recordType === 'Registration' && (
                        <button onClick={() => handleRevisit(item)} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-100 transition-all flex items-center gap-1.5 shadow-sm border border-indigo-100"><History className="w-3.5 h-3.5" /> Revisit</button>
                      )}
                      {activeTab === 'APPOINTMENTS' && (
                        <button onClick={() => handleArrived(item)} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 shadow-md transition-all flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Arrived</button>
                      )}
                      <button onClick={() => handleEdit(item)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                      {item.id !== '---' && (
                        <button onClick={() => setDeleteConfirmId(item.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayData.length === 0 && <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No matching records found</div>}
        </div>
      </div>

      {showBookingForm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row">
            <div className="hidden md:flex w-72 bg-slate-900 text-white p-8 flex-col justify-between">
               <h2 className="text-3xl font-black mb-10 leading-tight">{editingId ? 'Edit Appointment' : 'Book Appointment'}</h2>
               <button onClick={() => { setShowBookingForm(false); setEditingId(null); }} className="flex items-center gap-2 text-white/50 font-black uppercase text-[10px]"><ArrowLeft className="w-4 h-4" /> Close</button>
            </div>
            <div className="flex-1 p-10 bg-white">
               <form onSubmit={handleBookingSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Full Name</label>
                       <input required className="w-full text-2xl font-black border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500 placeholder-slate-200" value={bookingData.name || ''} onChange={e => setBookingData({...bookingData, name: e.target.value})} placeholder="Patient Name" />
                    </div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Mobile Number</label><input required type="tel" className="w-full text-xl font-mono border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500" value={bookingData.mobile || ''} onChange={e => setBookingData({...bookingData, mobile: e.target.value})} placeholder="9988776655" /></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Primary Complaint</label><select required className="w-full border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500 text-sm font-bold bg-white" value={bookingData.condition || ''} onChange={e => setBookingData({...bookingData, condition: e.target.value as Condition})}><option value="">Select Condition</option>{Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Appt Date</label><input required type="date" className="w-full border-b-2 border-slate-100 p-2 text-sm font-bold" value={bookingData.date || ''} onChange={e => setBookingData({...bookingData, date: e.target.value})} /></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Appt Time</label><input required type="time" className="w-full border-b-2 border-slate-100 p-2 text-sm font-bold" value={bookingData.time || ''} onChange={e => setBookingData({...bookingData, time: e.target.value})} /></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Lead Source</label><select required className="w-full border-b-2 border-slate-100 p-2 text-sm font-bold bg-white" value={bookingData.source || ''} onChange={e => setBookingData({...bookingData, source: e.target.value})}><option value="">Select Source</option>{sourceConfig.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}</select></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Visit Category</label><div className="flex gap-2">{['Scheduled', 'Follow Up'].map(type => (<button key={type} type="button" onClick={() => setBookingData({...bookingData, bookingType: type as any})} className={`flex-1 py-2 rounded-lg border-2 text-[10px] font-black uppercase transition-all ${bookingData.bookingType === type ? 'bg-hospital-600 text-white border-hospital-600 shadow-sm' : 'bg-white text-slate-400 border-slate-100'}`}>{type}</button>))}</div></div>
                    {bookingData.source === 'Doctor Recommended' && (<div className="md:col-span-2 animate-in slide-in-from-top-2 duration-300"><label className="block text-[10px] font-black uppercase text-hospital-600 mb-2 tracking-widest">Doctor Name</label><input required className="w-full text-xl font-bold border-b-2 border-hospital-100 p-2 outline-none focus:border-hospital-500 placeholder-slate-200" value={bookingData.sourceDoctorName || ''} onChange={e => setBookingData({...bookingData, sourceDoctorName: e.target.value})} placeholder="Dr. Enter Name" /></div>)}
                    {bookingData.source === 'Other' && (<div className="md:col-span-2 animate-in slide-in-from-top-2 duration-300"><label className="block text-[10px] font-black uppercase text-hospital-600 mb-2 tracking-widest">Other Details</label><input required className="w-full text-xl font-bold border-b-2 border-hospital-100 p-2 outline-none focus:border-hospital-500 placeholder-slate-200" value={bookingData.sourceOtherDetails || ''} onChange={e => setBookingData({...bookingData, sourceOtherDetails: e.target.value})} placeholder="Enter Details..." /></div>)}
                 </div>
                 <button type="submit" className="w-full py-4 bg-hospital-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all mt-6">{editingId ? 'Update Appointment' : 'Create Appointment'}</button>
               </form>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[90vh]">
            <div className="hidden lg:flex w-72 bg-slate-900 text-white p-8 flex-col justify-between">
               <h2 className="text-3xl font-black mb-10 leading-tight">Patient Registration</h2>
               <button onClick={() => { setShowForm(false); resetForm(); }} className="flex items-center gap-2 text-white/50 font-black uppercase text-[10px]"><ArrowLeft className="w-4 h-4" /> Discard</button>
            </div>
            <div className="flex-1 bg-white flex flex-col overflow-hidden">
              <header className="p-6 sm:p-8 border-b flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Step {step}</h3>
                 <button onClick={() => setShowForm(false)} className="lg:hidden p-2 text-slate-400"><X className="w-6 h-6" /></button>
              </header>
              <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-12">
                  {step === 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                       <div className="sm:col-span-2"><label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Full Name</label><input required className="w-full text-2xl sm:text-3xl font-black border-b-4 border-slate-100 bg-slate-50/30 p-2 outline-none focus:border-hospital-500" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Patient Name" /></div>
                       <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Age</label><input type="number" required className="w-full text-xl font-bold border-b-2 border-slate-100 bg-slate-50/30 p-2 outline-none" value={formData.age ?? ''} onChange={e => setFormData({...formData, age: parseInt(e.target.value, 10) || undefined})} /></div>
                       <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Gender</label><div className="flex gap-2 p-1 bg-slate-100 rounded-xl">{Object.values(Gender).map(g => (<button key={g} type="button" onClick={() => setFormData({...formData, gender: g as Gender})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase ${formData.gender === g ? 'bg-hospital-600 text-white shadow' : 'text-slate-500'}`}>{g}</button>))}</div></div>
                       <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Mobile</label><input required type="tel" className="w-full text-xl border-b-2 border-slate-100 p-2 outline-none" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} /></div>
                       <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Condition</label><select required className="w-full border-b-2 border-slate-100 p-2 bg-white" value={formData.condition || ''} onChange={e => setFormData({...formData, condition: e.target.value as Condition})}><option value="">Select...</option>{Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                       <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Occupation</label><input className="w-full border-b-2 border-slate-100 p-2 outline-none" value={formData.occupation || ''} onChange={e => setFormData({...formData, occupation: e.target.value})} /></div>
                       <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-2">How did you hear about us?</label><select className="w-full border-b-2 border-slate-100 p-2 bg-white" value={formData.source || ''} onChange={e => setFormData({...formData, source: e.target.value})}><option value="">Select...</option>{sourceConfig.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}</select></div>
                       <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Insurance</label><div className="flex gap-2 p-1 bg-slate-100 rounded-xl">{['Yes', 'No'].map(v => (<button key={v} type="button" onClick={() => setFormData({...formData, hasInsurance: v as any})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${formData.hasInsurance === v ? 'bg-hospital-600 text-white shadow' : 'text-slate-500'}`}>{v}</button>))}</div></div>
                       {formData.hasInsurance === 'Yes' && (<div className="animate-in slide-in-from-top-2 duration-300"><label className="block text-[10px] font-black uppercase text-hospital-600 mb-2 tracking-widest">Insurance Name</label><input required className="w-full text-lg font-bold border-b-2 border-hospital-100 p-2 outline-none focus:border-hospital-500 placeholder-slate-200" value={formData.insuranceName || ''} onChange={e => setFormData({...formData, insuranceName: e.target.value})} placeholder="Enter Insurance Provider" /></div>)}
                       {formData.source === 'Doctor Recommended' && (<div className="animate-in slide-in-from-top-2 duration-300"><label className="block text-[10px] font-black uppercase text-hospital-600 mb-2 tracking-widest">Doctor Name</label><input required className="w-full text-lg font-bold border-b-2 border-hospital-100 p-2 outline-none focus:border-hospital-500 placeholder-slate-200" value={formData.sourceDoctorName || ''} onChange={e => setFormData({...formData, sourceDoctorName: e.target.value})} placeholder="Enter Doctor Name" /></div>)}
                       {formData.source === 'Other' && (<div className="animate-in slide-in-from-top-2 duration-300"><label className="block text-[10px] font-black uppercase text-hospital-600 mb-2 tracking-widest">Other Details</label><input required className="w-full text-lg font-bold border-b-2 border-hospital-100 p-2 outline-none focus:border-hospital-500 placeholder-slate-200" value={formData.sourceOtherDetails || ''} onChange={e => setFormData({...formData, sourceOtherDetails: e.target.value})} placeholder="Enter Details" /></div>)}
                    </div>
                  ) : (
                    <div className="py-10 sm:py-20 flex flex-col items-center space-y-10"><h2 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase">Assign Case Number</h2><input required className="text-3xl sm:text-5xl font-mono text-center border-4 border-slate-100 p-6 sm:p-10 rounded-[2.5rem] w-full focus:border-hospital-500 outline-none uppercase font-black" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase().trim()})} placeholder="HMS-000" /></div>
                  )}
                </form>
              </div>
              <footer className="p-6 sm:p-8 border-t flex justify-between items-center bg-slate-50/30"><button onClick={() => step === 2 ? setStep(1) : setShowForm(false)} className="px-6 py-4 text-xs font-black uppercase text-slate-400">{step === 2 ? 'Back' : 'Cancel'}</button><button onClick={handleSubmit} className="px-8 sm:px-14 py-5 bg-hospital-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl transition-all">{step === 1 ? 'Next' : 'Save'}</button></footer>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-8 h-8 text-rose-600" /></div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight text-center">Confirm Deletion</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 text-center leading-relaxed">Are you sure? This patient data will be <span className="text-rose-600 font-bold">permanently deleted</span>.</p>
            <div className="flex gap-3"><button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-500 bg-slate-50 rounded-xl border">No / Cancel</button><button onClick={async () => { if (deleteConfirmId) { await deletePatient(deleteConfirmId); setDeleteConfirmId(null); } }} className="flex-1 py-3 text-[10px] font-black uppercase text-white bg-rose-600 rounded-xl shadow-lg hover:bg-rose-700">Confirm / Yes</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
