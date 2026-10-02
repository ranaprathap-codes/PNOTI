/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Reminder } from '../types';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3, 
  Filter, 
  Calendar, 
  FolderPlus, 
  Bell, 
  BellOff, 
  ListTodo, 
  SearchX, 
  TrendingUp, 
  FileText,
  CheckCircle,
  Tag,
  CircleAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioEngine } from '../utils/audio';

interface DashboardScreenProps {
  reminders: Reminder[];
  notesCount: number;
  userName: string;
  onAddReminder: () => void;
  onEditReminder: (reminder: Reminder) => void;
  onToggleReminderStatus: (id: string) => void;
  onToggleReminderEnabled: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onNavigateToNotes: () => void;
}

const CATEGORIES = ['All', 'Personal', 'Work', 'Health', 'Finance', 'Social', 'Other'];

export default function DashboardScreen({
  reminders,
  notesCount,
  userName,
  onAddReminder,
  onEditReminder,
  onToggleReminderStatus,
  onToggleReminderEnabled,
  onDeleteReminder,
  onNavigateToNotes
}: DashboardScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Greeting based on hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Filter and Search reminders
  const filteredReminders = useMemo(() => {
    return reminders.filter((rem) => {
      const matchSearch = 
        rem.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rem.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'All' || rem.category === selectedCategory;
      const matchPriority = filterPriority === 'all' || rem.priority === filterPriority;
      return matchSearch && matchCategory && matchPriority;
    });
  }, [reminders, searchTerm, selectedCategory, filterPriority]);

  // Status Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayActive = reminders.filter(r => r.date === todayStr && !r.completed && r.enabled).length;
    const completed = reminders.filter(r => r.completed).length;
    const totalActive = reminders.filter(r => !r.completed && r.enabled).length;
    return { todayActive, completed, totalActive };
  }, [reminders]);

  return (
    <div id="dashboard-container" className="flex-1 flex flex-col p-5 overflow-y-auto bg-[#FDF7FF] dark:bg-[#131117] transition-colors duration-200">
      
      {/* Top Greeting Header */}
      <div className="flex items-center justify-between mb-5 mt-2">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0] uppercase tracking-widest">{greeting},</p>
          <h2 className="text-xl font-black text-[#21005D] dark:text-[#E6E1E5] flex items-center gap-1.5">
            {userName}
            <span className="text-xs bg-[#E8DEF8] dark:bg-[#4A4458] text-[#21005D] dark:text-[#E8DEF8] font-bold py-0.5 px-2.5 rounded-full border border-[#D0BCFF] dark:border-[#938F99]">Pro</span>
          </h2>
        </div>
        <button 
          onClick={onAddReminder}
          className="w-10 h-10 rounded-xl bg-[#6750A4] dark:bg-[#D0BCFF] hover:bg-[#5a4392] dark:hover:bg-[#bba7ec] text-white dark:text-[#381E72] flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#E8DEF8] dark:bg-[#2B2930] p-3 rounded-2xl border border-[#D0BCFF] dark:border-[#4A4458] flex flex-col justify-between h-24 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
            <Clock className="w-16 h-16 text-[#6750A4] dark:text-[#D0BCFF]" />
          </div>
          <span className="text-[10px] font-bold text-[#21005D] dark:text-[#D0BCFF] uppercase tracking-wider">Today</span>
          <span className="text-2xl font-black text-[#21005D] dark:text-[#D0BCFF] mt-1">{metrics.todayActive}</span>
          <span className="text-[9px] text-[#49454F] dark:text-[#CAC4D0] font-bold">Active Alarms</span>
        </div>

        <button 
          onClick={onNavigateToNotes}
          className="bg-white dark:bg-[#1C1A22] p-3 rounded-2xl border border-[#CAC4D0] dark:border-[#4A4458] flex flex-col text-left justify-between h-24 relative overflow-hidden hover:border-[#6750A4] dark:hover:border-[#D0BCFF] transition-all cursor-pointer"
        >
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
            <FileText className="w-16 h-16 text-[#6750A4] dark:text-[#D0BCFF]" />
          </div>
          <span className="text-[10px] font-bold text-[#49454F] dark:text-[#CAC4D0] uppercase tracking-wider">Cloud Notes</span>
          <span className="text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5] mt-1">{notesCount}</span>
          <span className="text-[9px] text-[#49454F] dark:text-[#CAC4D0] font-bold">Synced Backup</span>
        </button>

        <div className="bg-[#D3E3FD] dark:bg-[#004494]/20 p-3 rounded-2xl border border-[#A8C7FA] dark:border-[#004494]/30 flex flex-col justify-between h-24 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
            <CheckCircle2 className="w-16 h-16 text-blue-500" />
          </div>
          <span className="text-[10px] font-bold text-[#041E49] dark:text-[#A8C7FA] uppercase tracking-wider">Completed</span>
          <span className="text-2xl font-black text-[#041E49] dark:text-[#A8C7FA] mt-1">{metrics.completed}</span>
          <span className="text-[9px] text-[#49454F] dark:text-[#CAC4D0] font-bold">History Items</span>
        </div>
      </div>

      {/* Live Search and Filters */}
      <div className="space-y-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-[#49454F] dark:text-[#CAC4D0]" />
          <input 
            type="text" 
            placeholder="Search reminders or descriptions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F3EDF7] dark:bg-[#2B2930] text-[#1D1B20] dark:text-[#E6E1E5] rounded-full border-none focus:ring-2 focus:ring-[#6750A4] dark:focus:ring-[#D0BCFF] outline-none text-xs font-semibold shadow-xs transition-all"
          />
        </div>

        {/* Categories Swipe bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                audioEngine.vibrate(15);
              }}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#E8DEF8] dark:bg-[#4A4458] text-[#21005D] dark:text-[#E8DEF8] border-[#D0BCFF] dark:border-[#4A4458] shadow-xs'
                  : 'bg-white dark:bg-[#1C1A22] text-[#49454F] dark:text-[#CAC4D0] border-[#CAC4D0] dark:border-[#4A4458] hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders Feed */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
            <ListTodo className="w-4 h-4 text-indigo-500" />
            Reminders ({filteredReminders.length})
          </h3>
          
          {/* Priority filter toggle */}
          <div className="flex items-center gap-1 bg-neutral-200/50 dark:bg-neutral-800/80 p-0.5 rounded-lg text-[9px] font-bold">
            {(['all', 'high'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setFilterPriority(p);
                  audioEngine.vibrate(15);
                }}
                className={`px-2 py-0.5 rounded uppercase tracking-wider capitalize cursor-pointer ${
                  filterPriority === p 
                    ? 'bg-white dark:bg-neutral-700 text-neutral-800 dark:text-white shadow-xs' 
                    : 'text-neutral-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredReminders.length === 0 ? (
          <div className="flex-1 bg-white dark:bg-neutral-850 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center">
              <SearchX className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">No Reminders Found</h4>
              <p className="text-[11px] text-neutral-500 max-w-xs leading-relaxed">
                Try revising your filters or click the plus button above to schedule your next PNotified reminder.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 pb-4">
            <AnimatePresence>
              {filteredReminders.map((rem) => {
                // Color mapping for Priority badges in High Density theme
                const priorityStyles = {
                  high: 'bg-[#FFD8E4] text-[#31111D] border-[#F2B8B5] dark:bg-[#8C1D18]/30 dark:text-[#FFB2B2] dark:border-[#8C1D18]/80',
                  medium: 'bg-[#FFF8E1] text-[#B78103] border-[#FFE082] dark:bg-[#4E342E]/30 dark:text-[#FFE082] dark:border-[#4E342E]/80',
                  low: 'bg-[#C4E7CB] text-[#072711] border-[#A2D2A9] dark:bg-[#0F5132]/20 dark:text-[#C4E7CB] dark:border-[#0F5132]/80',
                };

                return (
                  <motion.div
                    key={rem.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 bg-white dark:bg-[#1C1A22] rounded-xl border border-[#CAC4D0] dark:border-[#4A4458] shadow-xs flex items-start gap-3 relative transition-all group ${
                      rem.completed ? 'opacity-60 bg-[#F3EDF7]/30 dark:bg-[#1C1A22]/50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => {
                        audioEngine.vibrate(30);
                        onToggleReminderStatus(rem.id);
                      }}
                      className="mt-0.5 shrink-0 w-5.5 h-5.5 rounded-full border-2 border-[#CAC4D0] dark:border-[#4A4458] flex items-center justify-center hover:border-[#6750A4] dark:hover:border-[#D0BCFF] transition-colors cursor-pointer"
                    >
                      {rem.completed && (
                        <CheckCircle className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF] animate-pulse" />
                      )}
                    </button>

                    {/* Meta Fields */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Title */}
                        <h4 className={`text-xs font-bold truncate ${
                          rem.completed ? 'line-through text-[#49454F] dark:text-[#CAC4D0]' : 'text-[#1D1B20] dark:text-[#E6E1E5]'
                        }`}>
                          {rem.title}
                        </h4>
                        
                        {/* Priority Badge */}
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border capitalize ${
                          priorityStyles[rem.priority]
                        }`}>
                          {rem.priority}
                        </span>

                        {/* Repeat details */}
                        {rem.repeat !== 'none' && (
                          <span className="text-[8px] bg-[#E8DEF8] dark:bg-[#4A4458] text-[#21005D] dark:text-[#E8DEF8] border border-[#D0BCFF] dark:border-[#4A4458] font-bold px-1 py-0.2 rounded uppercase tracking-wider flex items-center gap-0.5">
                            <Clock className="w-2 h-2" />
                            {rem.repeat}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {rem.description && (
                        <p className={`text-[11px] leading-relaxed line-clamp-2 ${
                          rem.completed ? 'text-[#49454F] dark:text-[#CAC4D0]' : 'text-[#49454F] dark:text-[#CAC4D0]'
                        }`}>
                          {rem.description}
                        </p>
                      )}

                      {/* Schedule details */}
                      <div className="flex items-center gap-3 text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-extrabold pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {rem.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#6750A4] dark:text-[#D0BCFF]" />
                          {rem.time}
                        </span>
                        <span className="text-[#6750A4] dark:text-[#D0BCFF]">
                          🎵 {rem.audioName || 'Gentle Chimes'}
                        </span>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-1 self-center pl-1">
                      {/* Enable/Disable Alarm bell */}
                      <button
                        onClick={() => {
                          audioEngine.vibrate(20);
                          onToggleReminderEnabled(rem.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          rem.enabled 
                            ? 'text-[#21005D] dark:text-[#E8DEF8] bg-[#E8DEF8] dark:bg-[#4A4458] border-[#D0BCFF] dark:border-[#4A4458]' 
                            : 'text-[#49454F] dark:text-[#CAC4D0] bg-[#F3EDF7] dark:bg-[#2B2930] border-[#CAC4D0] dark:border-[#4A4458]'
                        }`}
                        title={rem.enabled ? "Reminder Active" : "Reminder Silenced"}
                      >
                        {rem.enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          audioEngine.vibrate(20);
                          onEditReminder(rem);
                        }}
                        className="p-1.5 rounded-lg border border-[#CAC4D0] dark:border-[#4A4458] text-[#49454F] dark:text-[#CAC4D0] hover:text-[#21005D] hover:bg-[#F3EDF7] dark:hover:bg-[#2B2930] transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          audioEngine.vibrate([40, 10]);
                          onDeleteReminder(rem.id);
                        }}
                        className="p-1.5 rounded-lg border border-[#F2B8B5] dark:border-[#8C1D18]/40 text-[#B3261E] dark:text-[#F2B8B5] hover:text-[#B3261E] hover:bg-[#FFD8E4] dark:hover:bg-[#8C1D18]/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  );
}
