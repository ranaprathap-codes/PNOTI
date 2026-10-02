/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';
import { 
  X, 
  Bell, 
  Calendar, 
  Clock, 
  Repeat, 
  Volume2, 
  ShieldCheck, 
  FileAudio, 
  Check, 
  Play, 
  Square,
  Sparkles,
  Award,
  Bookmark,
  Briefcase,
  Heart,
  DollarSign
} from 'lucide-react';
import { STOCK_SOUNDS, audioEngine } from '../utils/audio';

interface ReminderDialogProps {
  reminder?: Reminder | null; // If editing, pass existing reminder
  onClose: () => void;
  onSave: (reminder: Partial<Reminder>) => void;
}

const CATEGORIES = ['Personal', 'Work', 'Health', 'Finance', 'Social', 'Other'];
const PRIORITIES: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
const ICONS = [
  { name: 'Bell', icon: Bell },
  { name: 'Calendar', icon: Calendar },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Award', icon: Award },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Heart', icon: Heart },
  { name: 'DollarSign', icon: DollarSign }
];

export default function ReminderDialog({ reminder, onClose, onSave }: ReminderDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState<Reminder['repeat']>('none');
  const [customRepeat, setCustomRepeat] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<Reminder['priority']>('medium');
  const [soundName, setSoundName] = useState('Gentle Chimes');
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [vibration, setVibration] = useState(true);
  const [icon, setIcon] = useState('Bell');
  const [enabled, setEnabled] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Hydrate fields if editing
  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setDescription(reminder.description || '');
      setDate(reminder.date);
      setTime(reminder.time);
      setRepeat(reminder.repeat);
      setCustomRepeat(reminder.customRepeat || '');
      setCategory(reminder.category);
      setPriority(reminder.priority);
      setSoundName(reminder.audioName || 'Gentle Chimes');
      setAudioUrl(reminder.audioUrl);
      setVibration(reminder.vibration);
      setIcon(reminder.icon || 'Bell');
      setEnabled(reminder.enabled);
    } else {
      // Set default date to today, time to current + 30 mins
      const today = new Date();
      const offsetDate = today.toISOString().split('T')[0];
      setDate(offsetDate);
      
      const hours = String((today.getHours() + 1) % 24).padStart(2, '0');
      setTime(`${hours}:00`);
    }
  }, [reminder]);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('File size exceeds the 8MB limit. Please upload a smaller MP3.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Data = uploadEvent.target?.result as string;
        setAudioUrl(base64Data);
        setSoundName(file.name);
        audioEngine.vibrate(30);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSoundPreview = () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (audioUrl) {
        audioEngine.playCustomAudio(audioUrl, 0.8);
      } else {
        audioEngine.playStockSound(soundName, 0.8);
      }
      if (vibration) {
        audioEngine.vibrate([100, 50, 100]);
      }
      // Auto turn off preview indicator after 3s
      setTimeout(() => setIsPlaying(false), 3000);
    }
  };

  const handleSave = () => {
    setValidationError('');
    if (!title.trim()) {
      setValidationError('Please enter a reminder title.');
      return;
    }
    if (!date) {
      setValidationError('Please select a target date.');
      return;
    }
    if (!time) {
      setValidationError('Please select a target time.');
      return;
    }

    const payload: Partial<Reminder> = {
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      repeat,
      customRepeat: repeat === 'custom' ? customRepeat : undefined,
      category,
      priority,
      audioName: soundName,
      audioUrl,
      vibration,
      icon,
      enabled,
      completed: reminder ? reminder.completed : false,
    };

    onSave(payload);
  };

  return (
    <div id="reminder-modal" className="absolute inset-0 bg-neutral-950/60 flex items-end justify-center z-50 animate-fade-in font-sans">
      <div className="bg-white dark:bg-neutral-900 w-full rounded-t-[32px] max-h-[85%] overflow-y-auto p-6 shadow-2xl border-t border-neutral-200 dark:border-neutral-800 flex flex-col space-y-5 animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
            <Bell className="w-5 h-5 text-indigo-500 animate-swing" />
            {reminder ? 'Edit Reminder' : 'New Reminder'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 rounded-xl font-bold flex items-center gap-2">
            <span>{validationError}</span>
          </div>
        )}

        {/* Title & Description input */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-1 uppercase tracking-wider">Reminder Title</label>
            <input 
              type="text" 
              placeholder="What do you need to do?" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-750 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-1 uppercase tracking-wider">Short Description</label>
            <textarea 
              placeholder="Add optional notes or details" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-750 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-1 uppercase tracking-wider">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-750 focus:ring-2 focus:ring-indigo-500 text-xs font-bold outline-none cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-1 uppercase tracking-wider">Time</label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-750 focus:ring-2 focus:ring-indigo-500 text-xs font-bold outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Priority & Category Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-1.5 uppercase tracking-wider">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-750 focus:ring-2 focus:ring-indigo-500 text-xs font-bold outline-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-1.5 uppercase tracking-wider">Priority</label>
            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
              {PRIORITIES.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => {
                    setPriority(p);
                    audioEngine.vibrate(20);
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all capitalize cursor-pointer ${
                    priority === p 
                      ? p === 'high' 
                        ? 'bg-red-600 text-white shadow-sm shadow-red-950' 
                        : p === 'medium' 
                          ? 'bg-amber-500 text-neutral-900 shadow-sm'
                          : 'bg-emerald-600 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Repeating Options */}
        <div>
          <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <Repeat className="w-3.5 h-3.5" /> Repeat Interval
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => {
                  setRepeat(r);
                  audioEngine.vibrate(20);
                }}
                className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center uppercase tracking-wide cursor-pointer transition-all ${
                  repeat === r 
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-sm'
                    : 'bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {repeat === 'custom' && (
            <input 
              type="text" 
              placeholder="e.g. Every 3 days, every alternate weekday" 
              value={customRepeat}
              onChange={(e) => setCustomRepeat(e.target.value)}
              className="mt-2 w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-lg border border-neutral-200 dark:border-neutral-750 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-1.5 uppercase tracking-wider">Notification Icon</label>
          <div className="flex gap-2 overflow-x-auto py-1">
            {ICONS.map(({ name, icon: IconComponent }) => (
              <button
                type="button"
                key={name}
                onClick={() => {
                  setIcon(name);
                  audioEngine.vibrate(20);
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                  icon === name 
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-500 font-bold scale-105'
                    : 'bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-500'
                }`}
              >
                <IconComponent className="w-4.5 h-4.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Sound & Vibration section */}
        <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide flex items-center gap-1">
              <Volume2 className="w-4 h-4 text-indigo-500" /> Audio Notification
            </span>
            <button
              type="button"
              onClick={toggleSoundPreview}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                isPlaying 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
              }`}
            >
              {isPlaying ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
              {isPlaying ? 'Mute' : 'Preview'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Stock sound dropdown */}
            <div>
              <select
                value={audioUrl ? "Custom Upload" : soundName}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'Custom Upload') {
                    // Do nothing, let upload trigger
                  } else {
                    setSoundName(val);
                    setAudioUrl(undefined);
                  }
                  audioEngine.vibrate(20);
                }}
                className="w-full px-2 py-2 bg-white dark:bg-neutral-800 border border-neutral-250 dark:border-neutral-700 rounded-lg text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer outline-none"
              >
                {STOCK_SOUNDS.map((sound) => (
                  <option key={sound} value={sound}>{sound}</option>
                ))}
                {audioUrl && <option value="Custom Upload">📁 Custom: {soundName.substring(0, 10)}...</option>}
              </select>
            </div>

            {/* Custom file uploader */}
            <div className="relative">
              <input
                type="file"
                accept="audio/mp3, audio/*"
                onChange={handleAudioUpload}
                className="hidden"
                id="reminder-audio-upload"
              />
              <label
                htmlFor="reminder-audio-upload"
                className="w-full py-2 px-3 border border-dashed border-indigo-400 dark:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <FileAudio className="w-3.5 h-3.5" />
                Upload MP3
              </label>
            </div>
          </div>

          {/* Vibration slider toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-neutral-500 font-bold">Haptic Alarm Vibration</span>
            <button
              type="button"
              onClick={() => {
                setVibration(!vibration);
                audioEngine.vibrate(25);
              }}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                vibration ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                vibration ? 'transform translate-x-5 shadow-sm' : ''
              }`} />
            </button>
          </div>
        </div>

        {/* Enabled / Disabled status */}
        <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-neutral-700 dark:text-neutral-300">Active Status</span>
            <span className="text-[10px] text-neutral-500">Enable notification on target schedule</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEnabled(!enabled);
              audioEngine.vibrate(25);
            }}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
              enabled ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
              enabled ? 'transform translate-x-5 shadow-sm' : ''
            }`} />
          </button>
        </div>

        {/* Submit Save */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-sm font-extrabold rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-150 dark:shadow-neutral-950 transition-all cursor-pointer"
        >
          <Check className="w-5 h-5" />
          {reminder ? 'Save Changes' : 'Schedule Reminder'}
        </button>

      </div>
    </div>
  );
}
