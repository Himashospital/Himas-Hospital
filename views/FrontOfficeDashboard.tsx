
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
  Filter
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
  
  const [opdStartDate, setOpdStartDate] = useState('');
  const [opdEndDate, setOpdEndDate] = useState('');
  const [apptDate, setApptDate] = useState(new Date().toISOString().split('T')[0]);

  const [historyFilters, setHistoryFilters] = useState<{
    startDate: string;
    endDate: string;
    source: string;
    condition: string;
    status: string;
    visitType: string;
    type: 'ALL' | 'Registration' | 'Appointment';
  }>({
    startDate: '', endDate: '', source: '', condition: '', status: '', visitType: 'ALL', type: 'ALL'
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [originatingAppointmentId, setOriginatingAppointmentId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Patient> & { sourceDoctorNotes?: string; sourceOtherDetails?: string }>({
    id: '', name: '', dob: '', gender: undefined, age: undefined,
    mobile: '', occupation: '', hasInsurance: 'No', insuranceName: '',
    source: '', condition: undefined, visitType: undefined,
    sourceDoctorName: '', sourceDoctorNotes: '', sourceOtherDetails: ''
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

  const statusOptions = [
    'Arrived', 'Doctor Done', 'Medication Done', 'Package Proposal', 
    'Surgery Scheduled', 'Follow-Up Surgery', 'Surgery Lost', 'Scheduled', 'Follow Up'
  ];

  const getStatusClass = (status?: string): string => {
    if (!status) return 'bg-slate-50 text-slate-400';
    if (status === 'Surgery Scheduled') return 'bg-emerald-50 text-emerald-600';
    if (status === 'Follow-Up Surgery') return 'bg-blue-50 text-blue-600';
    if (status === 'Surgery Lost') return 'bg-rose-50 text-rose-600';
    if (status === 'Medication Done') return 'bg-purple-50 text-purple-600';
    if (status === 'Package Proposal') return 'bg-amber-50 text-amber-600';
    if (status === 'Doctor Done') return 'bg-indigo-50 text-indigo-600';
    if (status === 'Arrived') return 'bg-cyan-50 text-cyan-600';
    if (status === 'Follow Up') return 'bg-blue-50 text-blue-500';
    if (status === 'Scheduled') return 'bg-slate-100 text-slate-500';
    return 'bg-slate-50 text-slate-400';
  };

  const calculateVisitType = (item: any, allPatients: Patient[]): 'New' | 'Revisit' => {
    if (item.recordType === 'Appointment') return 'New';
    const patientMobile = item.mobile;
    if (!patientMobile) return 'New';
    const visits = allPatients
      .filter(p => p.mobile === patientMobile)
      .sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
    if (visits.length > 0 && visits[0].id === item.id) return 'New';
    return 'Revisit';
  };

  const resetForm = () => {
    setFormData({ 
      id: '', name: '', dob: '', gender: undefined, age: undefined, 
      mobile: '', occupation: '', hasInsurance: 'No', insuranceName: '', 
      source: '', condition: undefined, visitType: undefined,
      sourceDoctorName: '', sourceDoctorNotes: '', sourceOtherDetails: ''
    });
    setEditingId(null);
    setOriginatingAppointmentId(null);
    setStep(1);
  };

  const resetBookingForm = () => {
    setBookingData({ name: '', source: '', sourceDoctorName: '', sourceOtherDetails: '', condition: undefined, mobile: '', date: '', time: '', bookingType: 'Scheduled' });
    setEditingId(null);
  };

  const handleEdit = (item: any) => {
    if (activeTab === 'APPOINTMENTS') {
      let source = item.source || '';
      let sourceOtherDetails = '';
      if (source.startsWith('Other: ')) {
        sourceOtherDetails = source.substring(7);
        source = 'Other';
      }
      setBookingData({ 
        ...item, 
        source, 
        sourceOtherDetails,
        bookingType: item.bookingType || 'Scheduled'
      });
      setEditingId(item.id);
      setShowBookingForm(true);
    } else {
      let sourceDoctorName = item.sourceDoctorName || '';
      let sourceDoctorNotes = '';
      const notesMatch = sourceDoctorName.match(/\(Notes: (.*)\)$/);
      if (notesMatch && notesMatch[1]) {
          sourceDoctorName = sourceDoctorName.replace(notesMatch[0], '').trim();
          sourceDoctorNotes = notesMatch[1];
      }
      let source = item.source || '';
      let sourceOtherDetails = '';
      if (source.startsWith('Other: ')) {
        sourceOtherDetails = source.substring(7);
        source = 'Other';
      }
      setFormData({ ...item, source, sourceOtherDetails, visitType: item.visitType || 'OPD', hasInsurance: item.hasInsurance || 'No', sourceDoctorName, sourceDoctorNotes });
      setEditingId(item.id);
      setStep(1);
      setShowForm(true);
    }
  };

  const handleArrived = (appt: Appointment) => {
    setFormData({ 
      id: '', name: appt.name || '', dob: '', gender: undefined, age: undefined, mobile: appt.mobile || '', 
      occupation: '', hasInsurance: 'No', insuranceName: '', source: appt.source || '', 
      sourceDoctorName: appt.sourceDoctorName || '', condition: appt.condition, visitType: appt.bookingType === 'Follow Up' ? 'Follow Up' : 'OPD'
    });
    setEditingId(null);
    setOriginatingAppointmentId(appt.id);
    setStep(1);
    setShowForm(true);
  };

  const handleRevisit = async (item: any) => {
    const baseId = item.id.split('_V')[0];
    const newVisitId = `${baseId}_V${Date.now()}`;
    const revisitData: Omit<Patient, 'registeredAt' | 'hospital_id'> = {
      id: newVisitId,
      name: item.name,
      dob: item.dob || null,
      gender: item.gender || Gender.Other,
      age: item.age || 0,
      mobile: item.mobile,
      occupation: item.occupation || '',
      condition: item.condition,
      source: item.source || 'Other',
      hasInsurance: item.hasInsurance || 'No',
      insuranceName: item.insuranceName || '',
      sourceDoctorName: item.sourceDoctorName || '',
      visitType: 'Follow Up',
    };

    try {
      await addPatient(revisitData);
      setSearchTerm(item.mobile);
      setOpdStartDate('');
      setOpdEndDate('');
      setActiveTab('REGISTRATION');
    } catch (error) {
      console.error("Automated revisit record creation failed:", error);
      alert("Failed to create a new record for this visit.");
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isBasicValid = bookingData.name && bookingData.mobile && bookingData.date && bookingData.time && bookingData.bookingType && bookingData.source && bookingData.condition;
    let isExtraValid = true;
    if (bookingData.source === 'Doctor Recommended') {
        isExtraValid = !!bookingData.sourceDoctorName;
    } else if (bookingData.source === 'Other') {
        isExtraValid = !!bookingData.sourceOtherDetails;
    }
    if (!isBasicValid || !isExtraValid) {
      return alert("All fields are mandatory. Please provide all details before booking.");
    }
    const payload = { ...bookingData };
    if (payload.source === 'Other' && payload.sourceOtherDetails) {
        payload.source = `Other: ${payload.sourceOtherDetails}`;
    }
    if (editingId && activeTab === 'APPOINTMENTS') {
      await updateAppointment({ ...payload, id: editingId } as Appointment);
    } else {
      await addAppointment(payload as any);
    }
    setShowBookingForm(false);
    resetBookingForm();
  };

  const handleBookingTypeChange = async (appt: Appointment, newType: 'Scheduled' | 'Follow Up') => {
    const updated = { ...appt, bookingType: newType };
    await updateAppointment(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !editingId) {
      // Removed formData.hasInsurance check from validation
      if (!formData.name || formData.age == null || !formData.gender || !formData.mobile || !formData.occupation || !formData.condition || !formData.source) {
        alert("Please complete all mandatory fields.");
        return;
      }
      if (formData.source === 'Doctor Recommended' && !formData.sourceDoctorName) {
        alert("Please enter the recommending doctor's name.");
        return;
      }
      if (formData.source === 'Other' && !formData.sourceOtherDetails) {
        alert("Please specify the lead source details.");
        return;
      }
      setStep(2);
      return;
    }
    if (!formData.id) return alert("Case Number is required.");
    const dataToSave: Partial<Patient> & { sourceDoctorNotes?: string; sourceOtherDetails?: string } = { ...formData };
    if (dataToSave.source === 'Doctor Recommended' && dataToSave.sourceDoctorName) {
        dataToSave.sourceDoctorName = dataToSave.sourceDoctorNotes ? `${dataToSave.sourceDoctorName} (Notes: ${dataToSave.sourceDoctorNotes})` : dataToSave.sourceDoctorName;
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
        await convertAppointment(originatingAppointmentId, dataToSave as any);
      } else {
        await addPatient(dataToSave as any);
      }
    }
    setShowForm(false);
    resetForm();
  };

  const filteredPatients = patients.filter(p => {
    if (p.status !== 'Arrived') return false;
    if (opdStartDate || opdEndDate) {
      const pDate = formatDate(p.entry_date);
      if (opdStartDate && pDate < opdStartDate) return false;
      if (opdEndDate && pDate > opdEndDate) return false;
    }
    const sTerm = searchTerm.toLowerCase();
    return !sTerm || p.name.toLowerCase().includes(sTerm) || p.id.toLowerCase().includes(sTerm) || p.mobile.includes(sTerm);
  }).sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || ''));

  const filteredAppointments = appointments.filter(a => {
    const sTerm = searchTerm.toLowerCase();
    return (!apptDate || a.date === apptDate) && (a.name.toLowerCase().includes(sTerm) || a.mobile.includes(sTerm));
  }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const combinedHistoryData = [
    ...patients.map(p => ({ 
        ...p, 
        recordType: 'Registration' as const, 
        displayDate: p.registeredAt, 
        displayEntryDate: p.entry_date, 
        displayStatus: getHistoryStatus(p) 
    })),
    ...appointments.map(a => ({ 
        id: '---', 
        name: a.name, 
        mobile: a.mobile, 
        condition: a.condition, 
        source: a.source, 
        registeredAt: a.createdAt, 
        entry_date: a.date, 
        recordType: 'Appointment' as const, 
        displayDate: a.date + 'T' + (a.time || '00:00') + ':00', 
        displayEntryDate: a.date, 
        displayStatus: a.bookingType || 'Scheduled'
    }))
  ].filter(item => {
    const sTerm = searchTerm.toLowerCase();
    const matches = item.name.toLowerCase().includes(sTerm) || (item.id && item.id.toLowerCase().includes(sTerm)) || item.mobile.includes(sTerm);
    if (!matches) return false;

    if (activeTab === 'GLOBAL_SEARCH') {
      if (historyFilters.type !== 'ALL' && item.recordType !== historyFilters.type) return false;
      
      if (historyFilters.startDate || historyFilters.endDate) {
        const itemDate = item.displayEntryDate || '';
        if (historyFilters.startDate && itemDate < historyFilters.startDate) return false;
        if (historyFilters.endDate && itemDate > historyFilters.endDate) return false;
      }

      if (historyFilters.source && item.source !== historyFilters.source) return false;

      if (historyFilters.visitType !== 'ALL') {
        const vType = calculateVisitType(item, patients);
        if (vType !== historyFilters.visitType) return false;
      }

      if (historyFilters.status && item.displayStatus !== historyFilters.status) return false;

      if (historyFilters.condition && item.condition !== historyFilters.condition) return false;
    }

    return true;
  }).sort((a, b) => new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime());

  const displayData = activeTab === 'REGISTRATION' ? filteredPatients : activeTab === 'APPOINTMENTS' ? filteredAppointments : combinedHistoryData;

  const filterInputClasses = "h-10 w-full bg-slate-50 border border-slate-100 rounded-xl px-3 text-[10px] font-bold focus:ring-2 focus:ring-hospital-500 focus:bg-white outline-none transition-all appearance-none";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Front Office</h2>
          <p className="text-gray-500 text-sm">Patient Registration & Management</p>
        </div>
        <ExportButtons patients={activeTab === 'GLOBAL_SEARCH' ? (combinedHistoryData as any) : patients} role="front_office" selectedPatient={null} />
      </div>

      <div className="flex bg-white p-1 rounded-xl border w-fit shadow-sm overflow-x-auto">
        <button onClick={() => setActiveTab('REGISTRATION')} className={`px-6 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'REGISTRATION' ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
          <User className="w-4 h-4" /> OPD History
        </button>
        <button onClick={() => setActiveTab('APPOINTMENTS')} className={`px-6 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'APPOINTMENTS' ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
          <CalendarCheck className="w-4 h-4" /> Scheduled Appointments
        </button>
        <button onClick={() => setActiveTab('GLOBAL_SEARCH')} className={`px-6 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'GLOBAL_SEARCH' ? 'bg-hospital-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
          <Search className="w-4 h-4" /> Global Search
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 items-center w-full">
            <div className="relative flex-1 md:max-w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Search..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-hospital-500 outline-none font-medium text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {activeTab === 'REGISTRATION' && (
                <div className="flex items-center gap-2 animate-in fade-in duration-300">
                    <input type="date" className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold" value={opdStartDate} onChange={e => setOpdStartDate(e.target.value)} />
                    <span className="text-[10px] font-black uppercase text-slate-400">TO</span>
                    <input type="date" className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold" value={opdEndDate} onChange={e => setOpdEndDate(e.target.value)} />
                </div>
            )}
            {activeTab === 'APPOINTMENTS' && (
                <div className="flex items-center gap-2 animate-in fade-in duration-300">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input type="date" className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold" value={apptDate} onChange={e => setApptDate(e.target.value)} />
                </div>
            )}
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => { resetBookingForm(); setShowBookingForm(true); }} className="flex-1 md:flex-initial bg-white border-2 border-hospital-600 text-hospital-600 px-6 py-3 rounded-xl hover:bg-hospital-50 flex items-center justify-center gap-2 font-bold shadow-sm transition-all">
              <CalendarCheck className="w-5 h-5" /> Book Appointment
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="flex-1 md:flex-initial bg-hospital-600 text-white px-8 py-3 rounded-xl hover:bg-hospital-700 flex items-center justify-center gap-2 font-bold shadow-lg shadow-hospital-100 transition-all">
              <PlusCircle className="w-5 h-5" /> Register Patient
            </button>
          </div>
        </div>

        {activeTab === 'GLOBAL_SEARCH' && (
          <div className="pt-4 border-t border-slate-50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-300 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Date Range</label>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  className={filterInputClasses} 
                  value={historyFilters.startDate} 
                  onChange={e => setHistoryFilters({...historyFilters, startDate: e.target.value})} 
                  placeholder="dd-mm-yyyy"
                />
                <input 
                  type="date" 
                  className={filterInputClasses} 
                  value={historyFilters.endDate} 
                  onChange={e => setHistoryFilters({...historyFilters, endDate: e.target.value})} 
                  placeholder="dd-mm-yyyy"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Source</label>
              <div className="relative">
                <select className={filterInputClasses} value={historyFilters.source} onChange={e => setHistoryFilters({...historyFilters, source: e.target.value})}>
                  <option value="">All Sources</option>
                  {sourceConfig.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                   <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Visit Type</label>
              <div className="relative">
                <select className={filterInputClasses} value={historyFilters.visitType} onChange={e => setHistoryFilters({...historyFilters, visitType: e.target.value})}>
                  <option value="ALL">All Visits</option>
                  <option value="New">New</option>
                  <option value="Revisit">Revisit</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                   <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Status</label>
              <div className="relative">
                <select className={filterInputClasses} value={historyFilters.status} onChange={e => setHistoryFilters({...historyFilters, status: e.target.value})}>
                  <option value="">All Statuses</option>
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                   <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Condition</label>
              <div className="relative">
                <select className={filterInputClasses} value={historyFilters.condition} onChange={e => setHistoryFilters({...historyFilters, condition: e.target.value})}>
                  <option value="">All Conditions</option>
                  {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                   <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="p-5">{activeTab === 'APPOINTMENTS' ? 'Appt Time' : 'File ID / Date'}</th>
                <th className="p-5">Patient Details</th>
                <th className="p-5">Contact</th>
                {(activeTab === 'REGISTRATION' || activeTab === 'GLOBAL_SEARCH') && <th className="p-5">Visit Type</th>}
                <th className="p-5">Complaint</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayData.map((item: any) => (
                <tr key={item.id + (item.registeredAt || item.displayDate)} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5">
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
                  <td className="p-5 text-sm font-medium text-slate-600 flex items-center gap-2"><Phone className="w-3 h-3 text-slate-300" /> {item.mobile}</td>
                  {(activeTab === 'REGISTRATION' || activeTab === 'GLOBAL_SEARCH') && (
                    <td className="p-5">
                      {(() => {
                        const visitType = calculateVisitType(item, patients);
                        return (
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${
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
                  <td className="p-5">
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{item.condition}</span>
                  </td>
                  <td className="p-5">
                    {activeTab === 'APPOINTMENTS' ? (
                      <div className="flex items-center gap-2">
                        <select 
                          className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border transition-all ${item.bookingType === 'Follow Up' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`} 
                          value={item.bookingType || 'Scheduled'} 
                          onChange={(e) => handleBookingTypeChange(item, e.target.value as any)}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Follow Up">Follow Up</option>
                        </select>
                      </div>
                    ) : (
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${getStatusClass(item.displayStatus || getHistoryStatus(item))}`}>
                        {item.displayStatus || getHistoryStatus(item)}
                      </span>
                    )}
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-1">
                      {activeTab === 'GLOBAL_SEARCH' && item.recordType === 'Registration' && (
                        <button 
                          onClick={() => handleRevisit(item)} 
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors flex items-center gap-1 shadow-sm border border-indigo-100"
                        >
                          <History className="w-3.5 h-3.5" /> Revisit
                        </button>
                      )}
                      {activeTab === 'APPOINTMENTS' && (
                        <button onClick={() => handleArrived(item)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 shadow-sm flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Arrived
                        </button>
                      )}
                      <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                      {item.id !== '---' && (
                        <button onClick={() => deletePatient(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayData.length === 0 && (
            <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No matching records found</div>
          )}
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
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Mobile Number</label>
                      <input required type="tel" className="w-full text-xl font-mono border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500" value={bookingData.mobile || ''} onChange={e => setBookingData({...bookingData, mobile: e.target.value})} placeholder="9988776655" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Primary Complaint</label>
                      <select required className="w-full border-b-2 border-slate-100 p-2 outline-none focus:border-hospital-500 text-sm font-bold bg-white" value={bookingData.condition || ''} onChange={e => setBookingData({...bookingData, condition: e.target.value as Condition})}>
                        <option value="">Select Condition</option>
                        {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Appt Date</label>
                      <input required type="date" className="w-full border-b-2 border-slate-100 p-2 text-sm font-bold" value={bookingData.date || ''} onChange={e => setBookingData({...bookingData, date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Appt Time</label>
                      <input required type="time" className="w-full border-b-2 border-slate-100 p-2 text-sm font-bold" value={bookingData.time || ''} onChange={e => setBookingData({...bookingData, time: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Lead Source</label>
                      <select required className="w-full border-b-2 border-slate-100 p-2 text-sm font-bold bg-white" value={bookingData.source || ''} onChange={e => setBookingData({...bookingData, source: e.target.value})}>
                        <option value="">Select Source</option>
                        {sourceConfig.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Visit Category</label>
                      <div className="flex gap-2">
                        {['Scheduled', 'Follow Up'].map(type => (
                          <button key={type} type="button" onClick={() => setBookingData({...bookingData, bookingType: type as any})} className={`flex-1 py-2 rounded-lg border-2 text-[10px] font-black uppercase transition-all ${bookingData.bookingType === type ? 'bg-hospital-600 text-white border-hospital-600 shadow-sm' : 'bg-white text-slate-400 border-slate-100'}`}>{type}</button>
                        ))}
                      </div>
                    </div>
                    {bookingData.source === 'Doctor Recommended' && (
                      <div className="md:col-span-2 animate-in slide-in-from-top-2 duration-300">
                        <label className="block text-[10px] font-black uppercase text-hospital-600 mb-2 tracking-widest">Doctor Name</label>
                        <input required className="w-full text-xl font-bold border-b-2 border-hospital-100 p-2 outline-none focus:border-hospital-500 placeholder-slate-200" value={bookingData.sourceDoctorName || ''} onChange={e => setBookingData({...bookingData, sourceDoctorName: e.target.value})} placeholder="Dr. Enter Name" />
                      </div>
                    )}
                    {bookingData.source === 'Other' && (
                      <div className="md:col-span-2 animate-in slide-in-from-top-2 duration-300">
                        <label className="block text-[10px] font-black uppercase text-hospital-600 mb-2 tracking-widest">Other Details</label>
                        <input required className="w-full text-xl font-bold border-b-2 border-hospital-100 p-2 outline-none focus:border-hospital-500 placeholder-slate-200" value={bookingData.sourceOtherDetails || ''} onChange={e => setBookingData({...bookingData, sourceOtherDetails: e.target.value})} placeholder="Enter Details..." />
                      </div>
                    )}
                 </div>
                 <button type="submit" className="w-full py-4 bg-hospital-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all mt-6">{editingId ? 'Update Appointment' : 'Create Appointment'}</button>
               </form>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row">
            <div className="hidden md:flex w-72 bg-slate-900 text-white p-8 flex-col justify-between">
               <h2 className="text-3xl font-black mb-10 leading-tight">Patient Registration</h2>
               <button onClick={() => { setShowForm(false); resetForm(); }} className="flex items-center gap-2 text-white/50 font-black uppercase text-[10px]"><ArrowLeft className="w-4 h-4" /> Discard</button>
            </div>
            <div className="flex-1 bg-white flex flex-col overflow-hidden h-[90vh]">
              <header className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Step {step} of 2</h3>
                 <button onClick={() => setShowForm(false)} className="md:hidden p-2 text-slate-400"><X className="w-6 h-6" /></button>
              </header>
              <div className="flex-1 overflow-y-auto p-10">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-12">
                  {step === 1 ? (
                    <div className="space-y-10">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                         <div className="md:col-span-2 group">
                           <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em] transition-colors group-focus-within:text-hospital-600">Full Name</label>
                           <input required className="w-full text-3xl font-black border-b-4 border-slate-100 bg-slate-50/30 p-2 outline-none focus:border-hospital-500 focus:bg-white transition-all duration-300 placeholder-slate-200" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Patient Name" />
                         </div>
                         <div className="group">
                           <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em] transition-colors group-focus-within:text-hospital-600">Current Age</label>
                           <input type="number" required className="w-full text-xl font-bold border-b-2 border-slate-100 bg-slate-50/30 p-2 outline-none focus:border-hospital-500 focus:bg-white transition-all duration-300" value={formData.age ?? ''} onChange={e => setFormData({...formData, age: parseInt(e.target.value, 10) || undefined})} />
                         </div>
                         <div className="group">
                           <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-[0.2em]">Sex / Gender</label>
                           <div className="flex gap-4 p-1 bg-slate-100/50 rounded-2xl border border-slate-200">
                             {Object.values(Gender).map(g => (
                               <button 
                                 key={g} 
                                 type="button" 
                                 onClick={() => setFormData({...formData, gender: g as Gender})} 
                                 className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
                                   formData.gender === g 
                                     ? 'bg-hospital-600 text-white shadow-lg shadow-hospital-100 scale-[1.02]' 
                                     : 'text-slate-500 hover:bg-white/60'
                                 }`}
                               >
                                 {g}
                               </button>
                             ))}
                           </div>
                         </div>
                         <div className="group">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em] transition-colors group-focus-within:text-hospital-600">Mobile Number</label>
                            <input required type="tel" className="w-full text-xl font-mono border-b-2 border-slate-100 bg-slate-50/30 p-2 outline-none focus:border-hospital-500 focus:bg-white transition-all duration-300" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="Phone Contact" />
                         </div>
                         <div className="group">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em] transition-colors group-focus-within:text-hospital-600">Occupation</label>
                            <input required className="w-full text-xl font-bold border-b-2 border-slate-100 bg-slate-50/30 p-2 outline-none focus:border-hospital-500 focus:bg-white transition-all duration-300" value={formData.occupation || ''} onChange={e => setFormData({...formData, occupation: e.target.value})} placeholder="Patient Work/Role" />
                         </div>
                         <div className="group">
                           <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em] transition-colors group-focus-within:text-hospital-600">Clinical Condition</label>
                           <select required className="w-full border-b-2 border-slate-100 bg-slate-50/30 p-2 outline-none focus:border-hospital-500 focus:bg-white transition-all duration-300 text-sm font-bold appearance-none" value={formData.condition || ''} onChange={e => setFormData({...formData, condition: e.target.value as Condition})}>
                             <option value="">Select Category</option>
                             {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                         </div>
                         <div className="group">
                           <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em] transition-colors group-focus-within:text-hospital-600">Lead Source</label>
                           <select required className="w-full border-b-2 border-slate-100 bg-slate-50/30 p-2 text-sm font-bold bg-white outline-none focus:border-hospital-500 focus:bg-white transition-all duration-300 appearance-none" value={formData.source || ''} onChange={e => setFormData({...formData, source: e.target.value})}>
                             <option value="">Select Reference</option>
                             {sourceConfig.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                           </select>
                         </div>
                         {/* Insurance Status selection removed from Registration only */}
                         {formData.source === 'Doctor Recommended' && (
                           <div className="md:col-span-2 group animate-in slide-in-from-top-2 duration-300">
                             <label className="block text-[10px] font-black uppercase text-hospital-600 mb-2 tracking-[0.2em]">Doctor Name</label>
                             <input required className="w-full text-xl font-bold border-b-2 border-hospital-100 bg-hospital-50/30 p-2 outline-none focus:border-hospital-500 focus:bg-white transition-all duration-300 placeholder-slate-200" value={formData.sourceDoctorName || ''} onChange={e => setFormData({...formData, sourceDoctorName: e.target.value})} placeholder="Dr. Name" />
                           </div>
                         )}
                         {formData.source === 'Other' && (
                           <div className="md:col-span-2 group animate-in slide-in-from-top-2 duration-300">
                             <label className="block text-[10px] font-black uppercase text-hospital-600 mb-2 tracking-[0.2em]">Other Details</label>
                             <input required className="w-full text-xl font-bold border-b-2 border-hospital-100 bg-hospital-50/30 p-2 outline-none focus:border-hospital-500 focus:bg-white transition-all duration-300 placeholder-slate-200" value={formData.sourceOtherDetails || ''} onChange={e => setFormData({...formData, sourceOtherDetails: e.target.value})} placeholder="Specify Source Details..." />
                           </div>
                         )}
                       </div>
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center space-y-10">
                       <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Assign Case Number</h2>
                       <input required className="text-5xl font-mono text-center border-4 border-slate-100 p-10 rounded-[2.5rem] w-full focus:border-hospital-500 outline-none uppercase font-black" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase().trim()})} placeholder="HMS-000" />
                    </div>
                  )}
                </form>
              </div>
              <footer className="p-8 border-t flex justify-between items-center bg-slate-50/30">
                 <button onClick={() => step === 2 ? setStep(1) : setShowForm(false)} className="px-8 py-4 text-xs font-black uppercase text-slate-400">{step === 2 ? 'Back' : 'Cancel'}</button>
                 <button onClick={handleSubmit} className="px-14 py-5 bg-hospital-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">
                    {step === 1 ? 'Next Step' : 'Save Patient'}
                 </button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
