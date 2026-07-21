'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Mail, Lock, User, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!email || !password) {
      setErrorMsg('Email dan password wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || 'User',
            },
          },
        });

        if (error) throw error;

        // If email confirmation is required in Supabase, notify the user.
        // Otherwise, they are logged in.
        if (data.session) {
          router.push('/dashboard');
        } else {
          setSuccessMsg('Pendaftaran berhasil! Silakan periksa email Anda untuk konfirmasi.');
        }
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan otentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#07090e] text-[#f8fafc] px-4 relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#6366f1] opacity-[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#4f46e5] opacity-[0.03] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-2xl border border-indigo-950/40 p-8 z-10 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700" />
        
        {/* Header Branding */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 items-center justify-center text-indigo-400 mb-2">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">CSA Auth Portal</h1>
          <p className="text-xs text-slate-400">
            {isSignUp ? 'Daftar akun untuk asisten arsitek Anda' : 'Masuk untuk mengelola penjaminan kualitas kode'}
          </p>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-5 bg-rose-950/40 border border-rose-900/30 text-rose-300 rounded-lg p-3 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 bg-emerald-950/40 border border-emerald-900/30 text-emerald-300 rounded-lg p-3 text-xs flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 pl-1">
                <User size={12} /> Nama Lengkap
              </label>
              <input
                type="text"
                placeholder="Masukkan nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/60 border border-indigo-950/80 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 pl-1">
              <Mail size={12} /> Alamat Email
            </label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/60 border border-indigo-950/80 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 pl-1">
              <Lock size={12} /> Kata Sandi
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/60 border border-indigo-950/80 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/50"
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Daftar Sekarang' : 'Masuk Dashboard'}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Signup/Signin */}
        <div className="mt-6 text-center text-xs text-slate-500">
          {isSignUp ? (
            <p>
              Sudah punya akun?{' '}
              <button
                onClick={() => setIsSignUp(false)}
                className="text-indigo-400 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                Masuk di sini
              </button>
            </p>
          ) : (
            <p>
              Belum memiliki akun?{' '}
              <button
                onClick={() => setIsSignUp(true)}
                className="text-indigo-400 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                Daftar baru
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
