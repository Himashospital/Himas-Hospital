
import React, { useState } from "react";
import { useHospital } from "../context/HospitalContext";
import { supabase } from "../services/supabaseClient";
import { Role } from "../types";
import { Building2, Mail, Lock, Loader2, Stethoscope, Users, Briefcase, ChevronRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { setCurrentUserRole } = useHospital();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const roleMap: Record<string, Role> = {
    'office@himas.com': 'FRONT_OFFICE',
    'doctor@himas.com': 'DOCTOR',
    'team@himas.com': 'PACKAGE_TEAM',
  };

  const demoPasswords: Record<string, string> = {
    'office@himas.com': 'Himas1984@',
    'doctor@himas.com': 'Doctor8419@',
    'team@himas.com': 'Team8131@'
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const emailTrimmed = email.toLowerCase().trim();
    const targetRole = roleMap[emailTrimmed];

    if (!targetRole) {
      setError("This email is not recognized as a staff account.");
      setIsLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (authError) {
        if (password === demoPasswords[emailTrimmed]) {
          setCurrentUserRole(targetRole);
          return;
        }
        throw authError;
      }

      setCurrentUserRole(targetRole);
    } catch (err: any) {
      setError("Login failed. Check internet or use the demo password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
           <div className="bg-hospital-600 p-3.5 rounded-2xl shadow-xl shadow-hospital-200">
             <Building2 className="w-10 h-10 text-white" />
           </div>
           <div className="text-left">
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Himas</h1>
             <p className="text-hospital-600 font-bold text-xs uppercase tracking-[0.3em]">Hospital MIS</p>
           </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-hospital-600"></div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 text-center uppercase">Staff Portal</h2>
        
        <form onSubmit={handleLogin} className="space-y-6 mt-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-hospital-500 w-5 h-5" />
              <input
                type="email"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-hospital-500 focus:outline-none transition-all font-bold text-slate-700"
                placeholder="office@himas.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
             <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-hospital-500 w-5 h-5" />
              <input
                type="password"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-hospital-500 focus:outline-none transition-all font-bold text-slate-700"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl animate-pulse">{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access System <ChevronRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
           <p className="text-[10px] text-center text-slate-300 font-black uppercase tracking-[0.2em] mb-4">Quick Demo Access</p>
           <div className="space-y-3">
              {[
                { label: 'Front Office', email: 'office@himas.com', pass: 'Himas1984@', icon: Users, color: 'text-blue-500' },
                { label: 'Doctor', email: 'doctor@himas.com', pass: 'Doctor8419@', icon: Stethoscope, color: 'text-red-500' },
                { label: 'Package Team', email: 'team@himas.com', pass: 'Team8131@', icon: Briefcase, color: 'text-purple-500' }
              ].map((item) => (
                <button key={item.email} type="button" className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-slate-50 text-left" onClick={() => { setEmail(item.email); setPassword(item.pass); }}>
                   <div className="p-2 rounded-xl bg-slate-100"><item.icon className={`w-4 h-4 ${item.color}`} /></div>
                   <div className="text-[10px] flex flex-col">
                      <span className="font-black text-slate-800 uppercase">{item.label}</span>
                      <span className="text-slate-400 font-mono">Use default password</span>
                   </div>
                </button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
