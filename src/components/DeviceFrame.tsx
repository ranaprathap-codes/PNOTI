/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Battery, 
  Signal, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  Settings as SettingsIcon, 
  Bell, 
  Play, 
  Square,
  Sparkles,
  RefreshCw,
  Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioEngine } from '../utils/audio';

interface DeviceFrameProps {
  children: React.ReactNode;
  themeMode: 'light' | 'dark';
  activeNotification: {
    id: string;
    title: string;
    description: string;
    soundName?: string;
    audioUrl?: string;
    onDismiss: () => void;
  } | null;
}

export default function DeviceFrame({ children, themeMode, activeNotification }: DeviceFrameProps) {
  const [time, setTime] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(87);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [flashScreen, setFlashScreen] = useState(false);

  // Keep clock updated
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 12-hour format
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Flash screen effect when a notification is active
  useEffect(() => {
    if (activeNotification) {
      setFlashScreen(true);
      const timer = setTimeout(() => setFlashScreen(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  return (
    <div id="device-shell-container" className="min-h-screen bg-slate-900 flex items-center justify-center p-0 md:p-6 select-none overflow-hidden font-sans">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-secondary/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Phone Device */}
      <div 
        id="physical-phone-frame" 
        className="relative w-full max-w-md h-full md:h-[840px] bg-neutral-950 md:rounded-[48px] md:shadow-2xl md:border-[10px] border-neutral-800 flex flex-col overflow-hidden transition-all duration-300"
      >
        {/* Dynamic Notification Flash Overlays */}
        {flashScreen && (
          <div className="absolute inset-0 z-50 bg-brand-secondary/30 pointer-events-none animate-ping" />
        )}

        {/* Physical Camera Notch */}
        <div className="hidden md:block absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-neutral-950 rounded-b-2xl z-50">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-neutral-900 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-blue-900/60 rounded-full" />
          </div>
        </div>

        {/* Android Status Bar */}
        <div 
          id="android-status-bar" 
          className={`h-11 px-6 pt-2 flex items-center justify-between text-xs font-semibold z-40 transition-colors duration-200 ${
            themeMode === 'dark' ? 'bg-[#131117] text-[#F3EDF7]' : 'bg-[#FDF7FF] text-[#1D1B20]'
          }`}
        >
          <span className="cursor-default flex items-center gap-1.5 font-sans font-semibold">
            {time}
            <Sparkles className="w-3.5 h-3.5 text-brand-secondary animate-pulse" />
          </span>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-1">
              <span className="text-[10px]">{batteryLevel}%</span>
              <Battery className="w-4 h-4 rotate-0" />
            </div>
          </div>
        </div>

        {/* Dropdown Notification shade & Settings Tray */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '360px', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="absolute top-11 left-0 right-0 bg-neutral-900 border-b border-neutral-800 text-white z-40 flex flex-col p-5 shadow-xl rounded-b-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-neutral-400">System Dashboard</span>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-neutral-800"
                >
                  <ChevronUp className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Status metrics inside drawer */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-neutral-800/80 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-brand-secondary" />
                    <span className="text-xs">Sound</span>
                  </div>
                  <span className="text-xs text-brand-secondary font-bold">{volume}%</span>
                </div>
                <div className="bg-neutral-800/80 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs">Notifications</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Active</span>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="bg-neutral-800/50 p-4 rounded-xl mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-400">Ring & Alarm Volume</span>
                  <Volume2 className="w-4 h-4 text-brand-secondary" />
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volume}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    setVolume(v);
                    audioEngine.vibrate(30);
                  }}
                  className="w-full accent-brand-secondary h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="mt-auto flex items-center justify-between pt-2 border-t border-neutral-800 text-xs text-neutral-500">
                <span>PNotified Premium Client v2.4.0</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  Cloud Synced
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Float-down Ringing Notification Modal (Highest Priority UI) */}
        <AnimatePresence>
          {activeNotification && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-12 left-4 right-4 bg-indigo-950 border-2 border-indigo-500 text-white p-4 rounded-2xl z-50 shadow-2xl flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-900/80 border border-indigo-400 flex items-center justify-center animate-bounce-subtle">
                  <Bell className="w-5 h-5 text-indigo-300 animate-swing" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase">PNotified Alert</span>
                    <span className="text-[10px] text-indigo-400">Triggering Now</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white truncate">{activeNotification.title}</h4>
                  <p className="text-xs text-indigo-200 mt-0.5 line-clamp-2">{activeNotification.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={() => {
                    if (activeNotification.audioUrl) {
                      audioEngine.playCustomAudio(activeNotification.audioUrl, volume / 100);
                    } else if (activeNotification.soundName) {
                      audioEngine.playStockSound(activeNotification.soundName, volume / 100);
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-850 hover:bg-indigo-800 text-indigo-200 hover:text-white border border-indigo-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" /> Replay Sound
                </button>
                <button 
                  onClick={() => {
                    audioEngine.stop();
                    activeNotification.onDismiss();
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-red-950"
                >
                  <Square className="w-3.5 h-3.5" /> Dismiss Alarm
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content viewport area (The Screen of the Phone) */}
        <div id="phone-screen-content" className="flex-1 overflow-hidden relative flex flex-col bg-[#FDF7FF] dark:bg-[#131117]">
          {children}
        </div>

        {/* Bottom Android Navigation bar */}
        <div 
          id="android-nav-bar" 
          className={`h-12 flex items-center justify-center gap-16 border-t z-30 transition-colors duration-200 ${
            themeMode === 'dark' ? 'bg-[#131117] border-[#2C2930] text-[#CAC4D0]' : 'bg-[#F3EDF7] border-[#EADDFF] text-[#49454F]'
          }`}
        >
          {/* Back Action button (left caret) */}
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-800/10 dark:hover:bg-neutral-100/10 active:scale-95 transition-all"
            onClick={() => {
              // Trigger simple back gesture trigger or visual vibration
              audioEngine.vibrate(20);
            }}
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
            </svg>
          </button>

          {/* Home button (circle) */}
          <button 
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-neutral-800/10 dark:hover:bg-neutral-100/10 active:scale-90 transition-all"
            onClick={() => {
              audioEngine.vibrate(30);
              // Simply pulse home state trigger on event
              const clickEvent = new CustomEvent('navigate-home');
              window.dispatchEvent(clickEvent);
            }}
          >
            <div className="w-4.5 h-4.5 rounded-full border-2 border-current" />
          </button>

          {/* Recents button (square) */}
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-800/10 dark:hover:bg-neutral-100/10 active:scale-95 transition-all"
            onClick={() => {
              audioEngine.vibrate(20);
              setIsDrawerOpen(!isDrawerOpen);
            }}
          >
            <div className="w-4 h-4 rounded-sm border-2 border-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
