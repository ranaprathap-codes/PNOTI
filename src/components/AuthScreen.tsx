/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from '../lib/firebase';
import { Mail, Lock, User, Key, CheckCircle, AlertCircle, ArrowRight, Shield, Globe, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { audioEngine } from '../utils/audio';

interface AuthScreenProps {
  onAuthSuccess: (user: { uid: string; email: string; displayName: string }) => void;
  themeMode: 'light' | 'dark';
}

export default function AuthScreen({ onAuthSuccess, themeMode }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (mode === 'login') {
      if (!password) {
        setErrorMsg('Please enter your password.');
        return;
      }
      setLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        audioEngine.vibrate(50);
        onAuthSuccess({
          uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          displayName: userCredential.user.displayName || email.split('@')[0]
        });
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to sign in. Please verify your credentials.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'register') {
      if (!displayName) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        audioEngine.vibrate([40, 30, 40]);
        onAuthSuccess({
          uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          displayName: displayName
        });
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Registration failed. Try another email address.');
      } finally {
        setLoading(false);
      }
    } else {
      // Forgot Password mode
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        audioEngine.vibrate(40);
        setSuccessMsg('Reset password link sent! Please check your inbox.');
        setTimeout(() => setMode('login'), 4000);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to send password reset email.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuickGuestLogin = () => {
    audioEngine.vibrate([30, 30]);
    // Standard secure Sandbox Guest Login credentialing
    onAuthSuccess({
      uid: "pnotified_guest_2026",
      email: "rana.demo@pnotified.com",
      displayName: "Rana Prathap"
    });
  };

  return (
    <div id="auth-screen-container" className="flex-1 flex flex-col justify-between p-6 overflow-y-auto bg-slate-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 transition-colors duration-200">
      
      {/* Branding and Greeting Card */}
      <div className="flex flex-col items-center text-center mt-6">
        <div className="w-16 h-16 rounded-[22px] bg-indigo-600 dark:bg-indigo-500 shadow-md shadow-indigo-200 dark:shadow-indigo-950 flex items-center justify-center mb-4 active:scale-95 transition-transform cursor-pointer" onClick={() => audioEngine.playStockSound('Retro Synth', 0.5)}>
          <Star className="w-8 h-8 text-white fill-current animate-pulse" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
          PNotified
          <span className="text-[10px] bg-brand-secondary/20 text-brand-secondary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">M3</span>
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs font-medium">
          Personal reminder synchronization with custom audios and secure cloud-synced notes.
        </p>
      </div>

      {/* Primary Forms */}
      <div className="my-auto py-4">
        <form onSubmit={handleAction} className="space-y-4">
          
          {/* Status Messages */}
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Full Name field */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Email Address field */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                placeholder="rana@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          {/* Password fields */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot')}
                    className="text-xs text-brand-primary dark:text-indigo-400 hover:underline font-bold"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Confirm Password fields */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 active:scale-98 text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100 dark:shadow-neutral-950 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                {mode === 'login' ? 'Sign In Account' : mode === 'register' ? 'Create Account' : 'Send Recovery Link'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-4">
          {mode === 'login' ? (
            <span className="text-xs text-neutral-500">
              Don't have an account?{' '}
              <button onClick={() => setMode('register')} className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">
                Register
              </button>
            </span>
          ) : (
            <span className="text-xs text-neutral-500">
              Already registered?{' '}
              <button onClick={() => setMode('login')} className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Guest Mode Fallback / Enterprise Bypass Trigger */}
      <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center space-y-3">
        <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 font-bold">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Frictionless Sandbox Mode</span>
        </div>
        <button
          onClick={handleQuickGuestLogin}
          className="w-full py-2.5 bg-neutral-150 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 active:scale-98 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-extrabold border border-neutral-200/50 dark:border-neutral-700/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          Instant Guest Log In (Rana Prathap)
        </button>
      </div>
    </div>
  );
}
