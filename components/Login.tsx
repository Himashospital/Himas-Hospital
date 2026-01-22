
import React, { useState } from "react";
import { useHospital } from "../context/HospitalContext";
import { supabase } from "../services/supabaseClient";
import { Role } from "../types";
import { Building2, Mail, Lock, Loader2, Stethoscope, Users, Briefcase } from 'lucide-react';

export const Login: React.FC = () => {
  const { setCurrentUserRole } = useHospital();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mapping specific emails to application Roles
  const roleMap: Record<string, Role> = {
    'office@himas.com': 'FRONT_OFFICE',
    'doctor@himas.com': 'DOCTOR',
    'team@himas.com': 'PACKAGE_TEAM',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const targetRole = roleMap[email.toLowerCase().trim()];

    if (!targetRole) {
      setError("This email is not recognized as a staff account.");
      setIsLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      // Set Role in Context to trigger view change
      setCurrentUserRole(targetRole);
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Invalid password or authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
           <div className="bg-hospital-600 p-3 rounded-xl shadow-lg shadow-hospital-200">
             <Building2 className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Himas Hospital</h1>
        </div>
        <p className="text-slate-500 font-medium">Management Information System</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Staff Login</h2>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-hospital-500 focus:outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                placeholder="office@himas.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
             <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-hospital-500 focus:outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-hospital-700 hover:bg-hospital-800 text-white font-bold py-3.5 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-hospital-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure Login'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
           <p className="text-xs text-center text-slate-400 font-semibold uppercase tracking-wider mb-4">Authorized Access</p>
           <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                 <Users className="w-4 h-4 text-hospital-500" />
                 <div className="text-[10px] flex flex-col">
                    <span className="font-bold text-slate-700 uppercase">Front Office</span>
                    <span className="text-slate-500">office@himas.com / Himas1984@</span>
                 </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                 <Stethoscope className="w-4 h-4 text-hospital-500" />
                 <div className="text-[10px] flex flex-col">
                    <span className="font-bold text-slate-700 uppercase">Doctor</span>
                    <span className="text-slate-500">doctor@himas.com / Doctor8419@</span>
                 </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                 <Briefcase className="w-4 h-4 text-hospital-500" />
                 <div className="text-[10px] flex flex-col">
                    <span className="font-bold text-slate-700 uppercase">Package Team</span>
                    <span className="text-slate-500">team@himas.com / Team8131@</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-slate-400">
        © 2024 Himas Hospital Management System • Secured Access Only
      </p>
    </div>
  );
};
