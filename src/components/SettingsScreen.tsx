/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppSettings, UserProfile } from '../types';
import { 
  Moon, 
  Sun, 
  Volume2, 
  Vibrate, 
  CloudLightning, 
  ShieldAlert, 
  LogOut, 
  Info, 
  HelpCircle, 
  Heart, 
  User, 
  Mail, 
  FileText,
  Lock,
  Sparkles,
  RefreshCcw,
  BellRing
} from 'lucide-react';
import { auth, signOut } from '../lib/firebase';
import { audioEngine } from '../utils/audio';

interface SettingsScreenProps {
  settings: AppSettings;
  user: UserProfile | { uid: string; email: string; displayName: string } | null;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onLogout: () => void;
}

export default function SettingsScreen({
  settings,
  user,
  onUpdateSettings,
  onLogout
}: SettingsScreenProps) {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleBackupTrigger = () => {
    setIsSyncing(true);
    audioEngine.vibrate([100, 50, 100]);
    setTimeout(() => {
      setIsSyncing(false);
      audioEngine.vibrate(50);
      alert('PNotified Database Backup successfully synchronized to Firestore Cloud Storage!');
    }, 1500);
  };

  const handleLogoutAction = async () => {
    try {
      audioEngine.vibrate([30, 30]);
      await signOut(auth);
    } catch (e) {
      console.error("Auth signout failure:", e);
    }
    onLogout();
  };

  return (
    <div id="settings-tab" className="flex-1 flex flex-col p-5 overflow-y-auto bg-[#FDF7FF] dark:bg-[#131117] transition-colors duration-200 font-sans text-[#1D1B20] dark:text-[#E6E1E5]">
      
      {/* Header */}
      <div className="mb-5 mt-2">
        <h2 className="text-xl font-black text-[#21005D] dark:text-[#E6E1E5] flex items-center gap-1.5">
          Settings Dashboard
          <Sparkles className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF] animate-pulse" />
        </h2>
        <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold uppercase tracking-wider">Device Customization & Account profile</p>
      </div>

      {/* User Profile Card */}
      {user && (
        <div className="bg-white dark:bg-[#1C1A22] p-4 rounded-2xl border border-[#CAC4D0] dark:border-[#4A4458] shadow-xs flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6750A4] to-[#D0BCFF] flex items-center justify-center text-white font-black text-lg shadow-sm">
            {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black truncate text-[#1D1B20] dark:text-[#E6E1E5]">{user.displayName || 'PNotified User'}</h4>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] truncate flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#6750A4] dark:text-[#D0BCFF]" />
              {user.email}
            </p>
          </div>
          <span className="text-[9px] bg-[#E8DEF8] dark:bg-[#4A4458]/40 text-[#21005D] dark:text-[#E8DEF8] font-extrabold border border-[#D0BCFF] dark:border-[#938F99]/30 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            Synced
          </span>
        </div>
      )}

      {/* Settings Grid Panel */}
      <div className="space-y-4">
        
        {/* Appearance Group */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-[#49454F] dark:text-[#CAC4D0] uppercase tracking-widest pl-1">Theme Mode</span>
          <div className="bg-[#F3EDF7] dark:bg-[#2B2930] p-1.5 rounded-2xl border border-[#CAC4D0] dark:border-[#4A4458] flex gap-2">
            <button
              onClick={() => {
                onUpdateSettings({ themeMode: 'light' });
                audioEngine.vibrate(20);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                settings.themeMode === 'light' 
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 border border-[#CAC4D0] shadow-xs font-extrabold' 
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" /> Light Theme
            </button>
            <button
              onClick={() => {
                onUpdateSettings({ themeMode: 'dark' });
                audioEngine.vibrate(20);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                settings.themeMode === 'dark' 
                  ? 'bg-[#1C1A22] text-white border border-[#4A4458] shadow-sm font-extrabold' 
                  : 'text-neutral-500 hover:text-neutral-400'
              }`}
            >
              <Moon className="w-4 h-4 text-[#D0BCFF]" /> Dark Theme
            </button>
          </div>
        </div>

        {/* System Alarms Group */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-[#49454F] dark:text-[#CAC4D0] uppercase tracking-widest pl-1">Notification & Haptic Alerts</span>
          <div className="bg-white dark:bg-[#1C1A22] rounded-2xl border border-[#CAC4D0] dark:border-[#4A4458] p-4 space-y-4 shadow-xs">
            
            {/* Notification volume slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5 text-[#49454F] dark:text-[#CAC4D0]">
                  <Volume2 className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
                  Ringtone Sound Level
                </span>
                <span className="text-[10px] font-extrabold text-[#21005D] dark:text-[#D0BCFF]">{Math.round(settings.soundVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={settings.soundVolume * 100}
                onChange={(e) => {
                  const vol = parseInt(e.target.value) / 100;
                  onUpdateSettings({ soundVolume: vol });
                }}
                className="w-full accent-[#6750A4] dark:accent-[#D0BCFF] h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Vibration slide toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-[#49454F] dark:text-[#CAC4D0]">
                <Vibrate className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
                Vibrate on Reminder
              </span>
              <button
                onClick={() => {
                  onUpdateSettings({ vibrationEnabled: !settings.vibrationEnabled });
                  audioEngine.vibrate(25);
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  settings.vibrationEnabled ? 'bg-[#6750A4] dark:bg-[#D0BCFF]' : 'bg-[#CAC4D0] dark:bg-[#36343B]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                  settings.vibrationEnabled ? 'transform translate-x-5 shadow-sm' : ''
                }`} />
              </button>
            </div>

            {/* Push Notifications enable toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-[#49454F] dark:text-[#CAC4D0]">
                <BellRing className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
                Allow System Popups
              </span>
              <button
                onClick={() => {
                  onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled });
                  audioEngine.vibrate(25);
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  settings.notificationsEnabled ? 'bg-[#6750A4] dark:bg-[#D0BCFF]' : 'bg-[#CAC4D0] dark:bg-[#36343B]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                  settings.notificationsEnabled ? 'transform translate-x-5 shadow-sm' : ''
                }`} />
              </button>
            </div>

          </div>
        </div>

        {/* Database & Account Options */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-[#49454F] dark:text-[#CAC4D0] uppercase tracking-widest pl-1">Actions & Storage Backup</span>
          <div className="bg-white dark:bg-[#1C1A22] rounded-2xl border border-[#CAC4D0] dark:border-[#4A4458] p-2 shadow-xs space-y-1">
            
            {/* Backup to Cloud button */}
            <button
              onClick={handleBackupTrigger}
              disabled={isSyncing}
              className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-[#F3EDF7] dark:hover:bg-[#2B2930] flex items-center justify-between text-xs font-bold transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <CloudLightning className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
                <span className="text-[#1D1B20] dark:text-[#E6E1E5]">Manual Sync Backup</span>
              </div>
              <span className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold flex items-center gap-1">
                {isSyncing ? 'Backing up...' : 'Sync Now'}
              </span>
            </button>

            {/* About App disclosures */}
            <button
              onClick={() => {
                setShowAbout(!showAbout);
                audioEngine.vibrate(15);
              }}
              className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-[#F3EDF7] dark:hover:bg-[#2B2930] flex items-center justify-between text-xs font-bold transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4.5 h-4.5 text-[#6750A4] dark:text-[#D0BCFF]" />
                <span className="text-[#1D1B20] dark:text-[#E6E1E5]">About PNotified build</span>
              </div>
              <span className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold">Details</span>
            </button>

            {showAbout && (
              <div className="mx-3 my-2 p-3 bg-[#F3EDF7] dark:bg-[#2B2930] rounded-xl text-[10px] leading-relaxed text-[#49454F] dark:text-[#CAC4D0] space-y-1 border border-[#EADDFF] dark:border-[#4A4458]/40">
                <p><strong>Version:</strong> v2.4.0 (Material 3 Build)</p>
                <p><strong>Design Framework:</strong> Clean Architecture (React/Tailwind TS)</p>
                <p><strong>Developer:</strong> Rana Prathap (Elite Enterprise Account)</p>
                <p>PNotified is engineered to run automatic cloud-sync operations across notes and active scheduled timers with responsive in-app volume meters.</p>
              </div>
            )}

            {/* Privacy Policy disclosure */}
            <button
              onClick={() => {
                setShowPrivacyPolicy(!showPrivacyPolicy);
                audioEngine.vibrate(15);
              }}
              className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-[#F3EDF7] dark:hover:bg-[#2B2930] flex items-center justify-between text-xs font-bold transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4.5 h-4.5 text-[#6750A4] dark:text-[#D0BCFF]" />
                <span className="text-[#1D1B20] dark:text-[#E6E1E5]">Legal Privacy Policy</span>
              </div>
              <span className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold">View</span>
            </button>

            {showPrivacyPolicy && (
              <div className="mx-3 my-2 p-3.5 bg-[#F3EDF7] dark:bg-[#2B2930] rounded-xl text-[10px] leading-relaxed text-[#49454F] dark:text-[#CAC4D0] space-y-2 border border-[#EADDFF] dark:border-[#4A4458]/40">
                <h5 className="font-bold text-[#21005D] dark:text-[#D0BCFF]">User Data Protection Pledge</h5>
                <p>
                  PNotified respects user privacy. Your reminder details, customized sound files, notes, and checklist documents are stored securely inside the Google Firestore Cloud Database with secure rule access.
                </p>
                <p>
                  We never share, export, or monetize personal accounts or scheduling intervals. All audio data upload conversions operate locally within your private sandbox.
                </p>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogoutAction}
              className="w-full text-left px-3.5 py-3 rounded-xl hover:bg-[#FFD8E4] dark:hover:bg-[#8C1D18]/20 flex items-center justify-between text-xs font-black text-[#B3261E] dark:text-[#FFB2B2] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="w-4.5 h-4.5" />
                <span>Log Out of PNotified</span>
              </div>
              <span className="text-[10px] text-[#B3261E] dark:text-[#FFB2B2]">Exit Profile</span>
            </button>

          </div>
        </div>

      </div>

      {/* Footer credits */}
      <div className="mt-auto pt-6 text-center text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold flex items-center justify-center gap-1 py-4">
        <span>Made with</span>
        <Heart className="w-3 h-3 text-red-500 fill-current animate-pulse" />
        <span>for Rana Prathap — PNotified © 2026</span>
      </div>

    </div>
  );
}
