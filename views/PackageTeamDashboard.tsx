
import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { ExportButtons } from '../components/ExportButtons';
import { generateCounselingStrategy } from '../services/geminiService';
import { Patient, PackageProposal, Role, StaffUser } from '../types';
import { Briefcase, Calendar, MessageCircle, AlertTriangle, Wand2, CheckCircle2, UserPlus, Users, BadgeCheck, Mail, Phone, User, Lock, Loader2, Sparkles } from 'lucide-react';

export const PackageTeamDashboard: React.FC = () => {
  const { patients, updatePackageProposal, staffUsers, registerStaff } = useHospital();
  
  // Tabs: 'counseling' | 'staff'
  const [activeTab, setActiveTab] = useState<'counseling' | 'staff'>('counseling');

  // --- Counseling State ---
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'CR1' | 'CR2' | 'CR3' | 'CR4'>('ALL');
  const [aiLoading, setAiLoading] = useState(false);
  const [proposal, setProposal] = useState<Partial<PackageProposal>>({
    decisionPattern: 'Standard',
    objectionIdentified: '',
    counselingStrategy: '',
    followUpDate: ''
  });

  // --- Staff Registration State ---
  const [newStaff, setNewStaff] = useState<{name: string, email: string, mobile: string, role: Role, password: string}>({
    name: '',
    email: '',
    mobile: '',
    role: 'FRONT_OFFICE',
    password: ''
  });
  const [staffSuccess, setStaffSuccess] = useState('');

  // --- Logic ---
  
  const filteredPatients = patients.filter(p => {
    if (!p.doctorAssessment) return false; 
    if (filter === 'ALL') return true;
    return p.doctorAssessment.conversionReadiness.startsWith(filter);
  });

  const handlePatientSelect = (p: Patient) => {
    setSelectedPatient(p);
    if (p.packageProposal) {
      setProposal(p.packageProposal);
    } else {
      setProposal({
        decisionPattern: 'Standard',
        objectionIdentified: '',
        counselingStrategy: '',
        followUpDate: ''
      });
    }
  };

  const handleGenerateAIStrategy = async () => {
    if (!selectedPatient) return;
    setAiLoading(true);
    try {
      const strategy = await generateCounselingStrategy(selectedPatient);
      setProposal(prev => ({ ...prev, counselingStrategy: strategy }));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatient) {
      updatePackageProposal(selectedPatient.id, {
        ...proposal as PackageProposal,
        proposalCreatedAt: new Date().toISOString()
      });
      setSelectedPatient(null);
    }
  };

  const handleRegisterStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.mobile || !newStaff.role || !newStaff.email || !newStaff.password) return;
    
    // Check duplicates
    if (staffUsers.some(u => u.mobile === newStaff.mobile || u.email.toLowerCase() === newStaff.email.toLowerCase())) {
      alert("User with this mobile number or email already exists.");
      return;
    }

    registerStaff(newStaff);
    setStaffSuccess(`Successfully registered ${newStaff.name} as ${newStaff.role}`);
    setNewStaff({ name: '', email: '', mobile: '', role: 'FRONT_OFFICE', password: '' });
    setTimeout(() => setStaffSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Package Team Admin</h2>
          <p className="text-gray-500">Patient conversion & Staff Management</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border shadow-sm">
          <button
            onClick={() => setActiveTab('counseling')}
            className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all ${
              activeTab === 'counseling' ? 'bg-hospital-100 text-hospital-700' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Patient Counseling
          </button>
          <div className="w-px bg-gray-200 my-1 mx-1"></div>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all ${
              activeTab === 'staff' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" /> Staff Management
          </button>
        </div>
      </div>

      {activeTab === 'counseling' ? (
        // --- COUNSELING DASHBOARD VIEW ---
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['ALL', 'CR1', 'CR2', 'CR3', 'CR4'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === f ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
                  }`}
                >
                  {f === 'ALL' ? 'All Patients' : `${f} Candidates`}
                </button>
              ))}
            </div>
            <ExportButtons patients={patients} role="package_team" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-1 h-[600px] flex flex-col">
              <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700">
                Candidates for Counseling
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {filteredPatients.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => handlePatientSelect(p)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedPatient?.id === p.id ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-gray-800">{p.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        p.packageProposal ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.packageProposal ? 'Done' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      {p.doctorAssessment?.conversionReadiness} • {p.condition}
                    </div>
                    {p.doctorAssessment?.painSeverity === 'High' && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="w-3 h-3" /> High Pain
                      </div>
                    )}
                  </div>
                ))}
                {filteredPatients.length === 0 && <div className="p-4 text-gray-400 text-center text-sm">No patients found.</div>}
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2 flex flex-col h-[600px]">
              {selectedPatient ? (
                <div className="flex flex-col h-full">
                  <div className="p-6 bg-slate-50 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{selectedPatient.name}</h3>
                        <div className="text-sm text-gray-600 mt-1 grid grid-cols-2 gap-x-8 gap-y-1">
                          <span>Age/Gender: {selectedPatient.age} / {selectedPatient.gender}</span>
                          <span>Insurance: {selectedPatient.hasInsurance}</span>
                          <span>Occupation: {selectedPatient.occupation}</span>
                          <span>Source: {selectedPatient.source}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Doctor Rec</div>
                        <div className="bg-white border px-3 py-1 rounded-md shadow-sm">
                          <div className="font-bold text-slate-800">{selectedPatient.doctorAssessment?.quickCode}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProposal} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Decision Pattern</label>
                      <select 
                        className="w-full border rounded-lg p-2"
                        value={proposal.decisionPattern}
                        onChange={e => setProposal({...proposal, decisionPattern: e.target.value})}
                      >
                        <option value="Standard">Standard</option>
                        <option value="Quick Decider">Quick Decider</option>
                        <option value="Consultative">Needs Family Consultation</option>
                        <option value="Price Sensitive">Price Sensitive</option>
                        <option value="Skeptical">Skeptical / Needs Proof</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Objection Identified</label>
                      <input 
                        type="text" 
                        className="w-full border rounded-lg p-2"
                        placeholder="e.g. Cost too high, recovery time fears..."
                        value={proposal.objectionIdentified}
                        onChange={e => setProposal({...proposal, objectionIdentified: e.target.value})}
                      />
                    </div>

                    <div className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          Counseling Strategy
                        </label>
                        <button 
                          type="button"
                          onClick={handleGenerateAIStrategy}
                          disabled={aiLoading}
                          className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1.5 rounded-full flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                          {aiLoading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Generating Strategy...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3 h-3" />
                              Refine with AI
                            </>
                          )}
                        </button>
                      </div>
                      <textarea 
                        className={`w-full border rounded-lg p-3 min-h-[120px] text-sm transition-all focus:ring-2 focus:ring-purple-200 outline-none ${aiLoading ? 'bg-gray-50 opacity-50' : 'bg-white'}`}
                        placeholder="Plan to address objections..."
                        value={proposal.counselingStrategy}
                        onChange={e => setProposal({...proposal, counselingStrategy: e.target.value})}
                      />
                      {aiLoading && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="bg-white/80 px-4 py-2 rounded-lg shadow-sm border border-purple-100 flex items-center gap-2 text-purple-600 font-bold animate-pulse">
                             <Sparkles className="w-4 h-4" /> AI is Thinking...
                           </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date</label>
                      <div className="relative max-w-xs">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                          type="date" 
                          className="w-full pl-10 pr-4 py-2 border rounded-lg"
                          value={proposal.followUpDate}
                          onChange={e => setProposal({...proposal, followUpDate: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                       <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 shadow-lg hover:shadow-slate-200 transition-all active:scale-95">
                         <CheckCircle2 className="w-4 h-4" />
                         Submit Proposal
                       </button>
                    </div>
                  </form>
                </div>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                   <Briefcase className="w-16 h-16 mb-4 text-gray-200" />
                   <p>Select a candidate to view details and create proposal</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // --- STAFF MANAGEMENT VIEW ---
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4">
          {/* Registration Form */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-purple-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" /> Register New User
            </h3>
            
            <form onSubmit={handleRegisterStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">User Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input 
                    required type="text" placeholder="Full Name"
                    className="w-full pl-9 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input 
                    required type="email" placeholder="user@hospital.com"
                    className="w-full pl-9 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Set Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input 
                    required type="password" placeholder="••••••••"
                    className="w-full pl-9 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mobile (Contact)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <span className="absolute left-9 top-2.5 text-gray-500 font-bold text-sm border-r pr-2 border-gray-300 pointer-events-none select-none">
                     +91
                  </span>
                  <input 
                    required type="tel" placeholder="9876543210"
                    className="w-full pl-24 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none font-mono tracking-wide"
                    value={newStaff.mobile} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setNewStaff({...newStaff, mobile: val});
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Role Permission</label>
                <select 
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  value={newStaff.role || 'FRONT_OFFICE'}
                  onChange={e => setNewStaff({...newStaff, role: e.target.value as Role})}
                >
                  <option value="FRONT_OFFICE">Front Office (Registration)</option>
                  <option value="DOCTOR">Doctor (Assessment)</option>
                  <option value="PACKAGE_TEAM">Package Team (Admin)</option>
                </select>
              </div>

              {staffSuccess && (
                <div className="p-2 bg-green-50 text-green-700 text-xs rounded border border-green-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {staffSuccess}
                </div>
              )}

              <button type="submit" className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 shadow-md transition-all active:scale-95">
                Create Account
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700 flex justify-between items-center">
              <span>Authorized Staff Directory</span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">{staffUsers.length} Users</span>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {staffUsers.map(user => (
                  <div key={user.id} className="p-3 border rounded-lg flex items-start gap-3 hover:shadow-sm transition-shadow">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg
                      ${user.role === 'DOCTOR' ? 'bg-blue-500' : user.role === 'PACKAGE_TEAM' ? 'bg-purple-500' : 'bg-green-500'}
                    `}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.role}</div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">{user.email}</div>
                    </div>
                    {user.role === 'PACKAGE_TEAM' && (
                      <BadgeCheck className="w-4 h-4 text-purple-500 ml-auto" />
                    )}
                  </div>
                ))}
                {staffUsers.length === 0 && (
                  <div className="col-span-full py-8 text-center text-gray-400 text-sm">
                    No staff registered yet. As Package Team, you can add new users here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
