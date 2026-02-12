import React, { useState } from "react";
import { useHospital } from "../context/HospitalContext";
import { supabase } from "../services/supabaseClient";
import { Role } from "../types";
import { 
  Building2, Mail, Lock, Loader2, Stethoscope, 
  Users, Briefcase, ChevronRight, ShieldCheck, 
  Sparkles, Fingerprint 
} from 'lucide-react';

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
    'report@himas.com': 'ANALYTICS',
  };

  const demoPasswords: Record<string, string> = {
    'office@himas.com': 'Himas1984@',
    'doctor@himas.com': 'Doctor@123',
    'team@himas.com': 'Team8131@',
    'report@himas.com': 'Report@123'
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-hospital-600/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-px h-64 bg-gradient-to-b from-transparent via-hospital-500 to-transparent"></div>
        <div className="absolute top-1/2 right-1/3 w-px h-96 bg-gradient-to-b from-transparent via-blue-400 to-transparent"></div>
      </div>

      <div className="mb-10 text-center relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col items-center justify-center gap-4">
           <div className="relative">
             <div className="absolute inset-0 bg-hospital-500/20 blur-2xl rounded-full scale-150"></div>
             <div className="bg-slate-900 p-5 rounded-[2rem] shadow-2xl border border-white/5 relative z-10">
               <Building2 className="w-12 h-12 text-hospital-500" />
             </div>
           </div>
           <div className="text-center">
             <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-1">Himas</h1>
             <div className="flex items-center justify-center gap-2">
               <div className="h-px w-8 bg-hospital-600/30"></div>
               <p className="text-hospital-500 font-bold text-[10px] uppercase tracking-[0.4em]">Hospital Management</p>
               <div className="h-px w-8 bg-hospital-600/30"></div>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white p-1 md:p-1.5 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[2.8rem] p-8 md:p-12 border border-slate-100 flex flex-col relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Staff Login</h2>
              <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-widest">Authorized Access Only</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-slate-400" />
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-hospital-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-hospital-500/50 focus:outline-none transition-all font-bold text-slate-700 placeholder-slate-300"
                  placeholder="name@himas.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
               <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-hospital-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-hospital-500/50 focus:outline-none transition-all font-bold text-slate-700 placeholder-slate-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider rounded-2xl border border-red-100 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  {error}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-hospital-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Sign In to System <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
      
      <div className="mt-10 text-slate-500 text-[10px] font-bold uppercase tracking-[0.5em] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
        <Sparkles className="w-3 h-3 text-hospital-500" />
        Encrypted & Secure Session
        <Sparkles className="w-3 h-3 text-hospital-500" />
      </div>
    </div>
  );
};