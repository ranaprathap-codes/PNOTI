/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  db, 
  auth, 
  onAuthStateChanged,
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from './lib/firebase';
import { Reminder, Note, AppSettings, UserProfile } from './types';
import DeviceFrame from './components/DeviceFrame';
import AuthScreen from './components/AuthScreen';
import DashboardScreen from './components/DashboardScreen';
import NotesScreen from './components/NotesScreen';
import SettingsScreen from './components/SettingsScreen';
import ReminderDialog from './components/ReminderDialog';
import { 
  Bell, 
  FileText, 
  Settings as SettingsIcon, 
  Volume2, 
  Moon, 
  Sun,
  ShieldAlert
} from 'lucide-react';
import { audioEngine } from './utils/audio';

// Default system settings preset
const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'dark',
  vibrationEnabled: true,
  soundVolume: 0.7,
  defaultCategory: 'Personal',
  notificationsEnabled: true
};

export default function App() {
  const [user, setUser] = useState<{ uid: string; email: string; displayName: string } | null>(null);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'notes' | 'settings'>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Reminders & Notes state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Dialog Controls
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Active notification triggering state
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    title: string;
    description: string;
    soundName?: string;
    audioUrl?: string;
    onDismiss: () => void;
  } | null>(null);

  // Monitor auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
        });
      } else {
        // Clear state if logged out
        const localUser = localStorage.getItem('pnotified_local_user');
        if (localUser) {
          setUser(JSON.parse(localUser));
        } else {
          setUser(null);
        }
      }
    });

    // Handle home button click inside device frame
    const handleHomeNav = () => {
      setCurrentTab('dashboard');
    };
    window.addEventListener('navigate-home', handleHomeNav);

    return () => {
      unsubscribe();
      window.removeEventListener('navigate-home', handleHomeNav);
    };
  }, []);

  // Fetch reminders and notes whenever auth or user changes
  useEffect(() => {
    if (!user) {
      setReminders([]);
      setNotes([]);
      return;
    }

    const loadData = async () => {
      try {
        // Query Firestore collections with security boundaries
        const remindersQuery = query(collection(db, 'reminders'), where('createdBy', '==', user.uid));
        const remindersSnap = await getDocs(remindersQuery);
        const remindersList: Reminder[] = [];
        remindersSnap.forEach((docSnap) => {
          remindersList.push(docSnap.data() as Reminder);
        });

        const notesQuery = query(collection(db, 'notes'), where('createdBy', '==', user.uid));
        const notesSnap = await getDocs(notesQuery);
        const notesList: Note[] = [];
        notesSnap.forEach((docSnap) => {
          notesList.push(docSnap.data() as Note);
        });

        // Sort reminders by date and time
        remindersList.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
        setReminders(remindersList);

        // Sort notes (pinned on top, then newest first)
        notesList.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.createdAt.localeCompare(a.createdAt);
        });
        setNotes(notesList);

        // Backup locally to localStorage as dual-persistence resilience
        localStorage.setItem(`reminders_${user.uid}`, JSON.stringify(remindersList));
        localStorage.setItem(`notes_${user.uid}`, JSON.stringify(notesList));

      } catch (err) {
        console.warn("Firestore access error, fallback to offline LocalStorage caches.");
        const cachedReminders = localStorage.getItem(`reminders_${user.uid}`);
        const cachedNotes = localStorage.getItem(`notes_${user.uid}`);
        
        if (cachedReminders) setReminders(JSON.parse(cachedReminders));
        if (cachedNotes) setNotes(JSON.parse(cachedNotes));
      }
    };

    loadData();
  }, [user]);

  // Settings Loader
  useEffect(() => {
    if (user) {
      const storedSettings = localStorage.getItem(`settings_${user.uid}`);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, [user]);

  // Background Loop Scheduler for triggering alarms
  useEffect(() => {
    if (reminders.length === 0 || activeNotification) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentDateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`; // HH:mm

      // Check if any matching enabled and uncompleted alarm matches
      const triggeredAlarm = reminders.find(r => 
        r.enabled && 
        !r.completed && 
        r.date === currentDateStr && 
        r.time === currentTimeStr
      );

      if (triggeredAlarm) {
        // Trigger alarm alert inside device shell
        if (settings.notificationsEnabled) {
          audioEngine.vibrate([100, 50, 100, 50, 100]);
          if (triggeredAlarm.audioUrl) {
            audioEngine.playCustomAudio(triggeredAlarm.audioUrl, settings.soundVolume);
          } else {
            audioEngine.playStockSound(triggeredAlarm.audioName || 'Gentle Chimes', settings.soundVolume);
          }

          setActiveNotification({
            id: triggeredAlarm.id,
            title: triggeredAlarm.title,
            description: triggeredAlarm.description || 'PNotified reminder trigger alert!',
            soundName: triggeredAlarm.audioName,
            audioUrl: triggeredAlarm.audioUrl,
            onDismiss: () => handleDismissAlarm(triggeredAlarm.id)
          });
        }
      }
    }, 5000); // Check schedule every 5 seconds

    return () => clearInterval(interval);
  }, [reminders, activeNotification, settings]);

  // Auth screen login/register trigger
  const handleAuthSuccess = (userData: { uid: string; email: string; displayName: string }) => {
    setUser(userData);
    localStorage.setItem('pnotified_local_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pnotified_local_user');
    setCurrentTab('dashboard');
  };

  // Update Settings
  const handleUpdateSettings = (updated: Partial<AppSettings>) => {
    if (!user) return;
    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    localStorage.setItem(`settings_${user.uid}`, JSON.stringify(newSettings));
  };

  // Create/Edit Reminders Saving logic
  const handleSaveReminder = async (payload: Partial<Reminder>) => {
    if (!user) return;

    const reminderId = editingReminder ? editingReminder.id : Math.random().toString();
    const nowStr = new Date().toISOString();

    const finalReminder: Reminder = {
      id: reminderId,
      title: payload.title || 'Untitled',
      description: payload.description || '',
      date: payload.date || nowStr.split('T')[0],
      time: payload.time || '12:00',
      repeat: payload.repeat || 'none',
      customRepeat: payload.customRepeat,
      category: payload.category || 'Personal',
      priority: payload.priority || 'medium',
      audioName: payload.audioName || 'Gentle Chimes',
      audioUrl: payload.audioUrl,
      vibration: payload.vibration !== undefined ? payload.vibration : true,
      icon: payload.icon || 'Bell',
      enabled: payload.enabled !== undefined ? payload.enabled : true,
      completed: payload.completed !== undefined ? payload.completed : false,
      createdBy: user.uid,
      createdAt: editingReminder ? editingReminder.createdAt : nowStr,
      updatedAt: nowStr,
    };

    // Update local state first for instant responsiveness (smooth scroll/UI)
    const updatedList = editingReminder
      ? reminders.map(r => r.id === reminderId ? finalReminder : r)
      : [...reminders, finalReminder];
    
    updatedList.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    setReminders(updatedList);
    setIsReminderDialogOpen(false);
    setEditingReminder(null);

    // Sync directly to Firestore
    try {
      await setDoc(doc(db, 'reminders', reminderId), finalReminder);
      localStorage.setItem(`reminders_${user.uid}`, JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Could not save to Cloud Firestore, saved to local cache:", e);
    }
  };

  const handleToggleReminderStatus = async (id: string) => {
    if (!user) return;
    const target = reminders.find(r => r.id === id);
    if (!target) return;

    const updated = { ...target, completed: !target.completed, updatedAt: new Date().toISOString() };
    const newList = reminders.map(r => r.id === id ? updated : r);
    setReminders(newList);

    try {
      await setDoc(doc(db, 'reminders', id), updated);
      localStorage.setItem(`reminders_${user.uid}`, JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleReminderEnabled = async (id: string) => {
    if (!user) return;
    const target = reminders.find(r => r.id === id);
    if (!target) return;

    const updated = { ...target, enabled: !target.enabled, updatedAt: new Date().toISOString() };
    const newList = reminders.map(r => r.id === id ? updated : r);
    setReminders(newList);

    try {
      await setDoc(doc(db, 'reminders', id), updated);
      localStorage.setItem(`reminders_${user.uid}`, JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!user) return;
    const newList = reminders.filter(r => r.id !== id);
    setReminders(newList);

    try {
      await deleteDoc(doc(db, 'reminders', id));
      localStorage.setItem(`reminders_${user.uid}`, JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  // Alarm triggered dismiss action
  const handleDismissAlarm = async (id: string) => {
    if (!user) return;
    const target = reminders.find(r => r.id === id);
    if (!target) {
      setActiveNotification(null);
      return;
    }

    let updated: Reminder;
    
    // Custom repeats scheduler calculations
    if (target.repeat !== 'none') {
      const nextDate = new Date(target.date + 'T' + target.time);
      if (target.repeat === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      else if (target.repeat === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (target.repeat === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (target.repeat === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
      
      const newDateStr = nextDate.toISOString().split('T')[0];
      updated = { ...target, date: newDateStr, updatedAt: new Date().toISOString() };
    } else {
      updated = { ...target, completed: true, updatedAt: new Date().toISOString() };
    }

    const newList = reminders.map(r => r.id === id ? updated : r);
    newList.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    setReminders(newList);
    setActiveNotification(null);

    try {
      await setDoc(doc(db, 'reminders', id), updated);
      localStorage.setItem(`reminders_${user.uid}`, JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  // Notes Saving and Action updates
  const handleSaveNote = async (payload: Partial<Note>) => {
    if (!user) return;

    const noteId = payload.id || Math.random().toString();
    const nowStr = new Date().toISOString();

    const finalNote: Note = {
      id: noteId,
      title: payload.title || 'Untitled',
      body: payload.body || '',
      isRichText: payload.isRichText || false,
      checklist: payload.checklist,
      pinned: payload.pinned || false,
      archived: payload.archived || false,
      favorite: payload.favorite || false,
      color: payload.color || 'Default',
      category: payload.category || 'General',
      createdBy: user.uid,
      createdAt: payload.createdAt || nowStr,
      updatedAt: nowStr
    };

    const isExisting = notes.some(n => n.id === noteId);
    const newList = isExisting
      ? notes.map(n => n.id === noteId ? finalNote : n)
      : [finalNote, ...notes];

    // Sort: pinned first, then newest
    newList.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    setNotes(newList);

    try {
      await setDoc(doc(db, 'notes', noteId), finalNote);
      localStorage.setItem(`notes_${user.uid}`, JSON.stringify(newList));
    } catch (e) {
      console.warn("Could not sync note to firestore, cached locally:", e);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!user) return;
    const newList = notes.filter(n => n.id !== id);
    setNotes(newList);

    try {
      await deleteDoc(doc(db, 'notes', id));
      localStorage.setItem(`notes_${user.uid}`, JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNotePin = async (id: string) => {
    if (!user) return;
    const target = notes.find(n => n.id === id);
    if (!target) return;

    const updated = { ...target, pinned: !target.pinned, updatedAt: new Date().toISOString() };
    const newList = notes.map(n => n.id === id ? updated : n);
    
    newList.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    setNotes(newList);

    try {
      await setDoc(doc(db, 'notes', id), updated);
      localStorage.setItem(`notes_${user.uid}`, JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNoteFavorite = async (id: string) => {
    if (!user) return;
    const target = notes.find(n => n.id === id);
    if (!target) return;

    const updated = { ...target, favorite: !target.favorite, updatedAt: new Date().toISOString() };
    const newList = notes.map(n => n.id === id ? updated : n);
    setNotes(newList);

    try {
      await setDoc(doc(db, 'notes', id), updated);
      localStorage.setItem(`notes_${user.uid}`, JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNoteArchive = async (id: string) => {
    if (!user) return;
    const target = notes.find(n => n.id === id);
    if (!target) return;

    const updated = { ...target, archived: !target.archived, updatedAt: new Date().toISOString() };
    const newList = notes.map(n => n.id === id ? updated : n);
    setNotes(newList);

    try {
      await setDoc(doc(db, 'notes', id), updated);
      localStorage.setItem(`notes_${user.uid}`, JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DeviceFrame themeMode={settings.themeMode} activeNotification={activeNotification}>
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${settings.themeMode === 'dark' ? 'dark' : ''}`}>
        
        {/* Main Application screen */}
        <div id="m3-app-body" className="flex-1 overflow-hidden flex flex-col bg-[#FDF7FF] dark:bg-[#131117] transition-colors duration-200">
          {!user ? (
            <AuthScreen onAuthSuccess={handleAuthSuccess} themeMode={settings.themeMode} />
          ) : (
            <>
              {/* Active Tab viewport */}
              <div className="flex-1 overflow-hidden flex flex-col relative">
                {currentTab === 'dashboard' && (
                  <DashboardScreen 
                    reminders={reminders}
                    notesCount={notes.length}
                    userName={user.displayName}
                    onAddReminder={() => {
                      setEditingReminder(null);
                      setIsReminderDialogOpen(true);
                      audioEngine.vibrate(20);
                    }}
                    onEditReminder={(rem) => {
                      setEditingReminder(rem);
                      setIsReminderDialogOpen(true);
                    }}
                    onToggleReminderStatus={handleToggleReminderStatus}
                    onToggleReminderEnabled={handleToggleReminderEnabled}
                    onDeleteReminder={handleDeleteReminder}
                    onNavigateToNotes={() => setCurrentTab('notes')}
                  />
                )}

                {currentTab === 'notes' && (
                  <NotesScreen 
                    notes={notes}
                    onSaveNote={handleSaveNote}
                    onDeleteNote={handleDeleteNote}
                    onTogglePin={handleToggleNotePin}
                    onToggleFavorite={handleToggleNoteFavorite}
                    onToggleArchive={handleToggleNoteArchive}
                  />
                )}

                {currentTab === 'settings' && (
                  <SettingsScreen 
                    settings={settings}
                    user={user}
                    onUpdateSettings={handleUpdateSettings}
                    onLogout={handleLogout}
                  />
                )}
              </div>

              {/* High Polished M3 Tabbed Navigation bar (bottom screen) */}
              <div className="h-20 border-t border-[#EADDFF] dark:border-[#2C2930] bg-[#F3EDF7] dark:bg-[#1C1A22] flex items-center justify-around z-30 transition-colors duration-200 px-6">
                <button
                  onClick={() => {
                    setCurrentTab('dashboard');
                    audioEngine.vibrate(20);
                  }}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div className={`w-16 h-8 rounded-full flex items-center justify-center transition-all ${
                    currentTab === 'dashboard' 
                      ? 'bg-[#E8DEF8] dark:bg-[#4A4458] text-[#21005D] dark:text-[#E8DEF8] font-bold' 
                      : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-[#EADDFF] dark:hover:bg-[#36343B]'
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] uppercase tracking-wider ${
                    currentTab === 'dashboard'
                      ? 'font-bold text-[#1D1B20] dark:text-[#E6E1E5]'
                      : 'font-medium text-[#49454F] dark:text-[#CAC4D0]'
                  }`}>Alarms</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('notes');
                    audioEngine.vibrate(20);
                  }}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div className={`w-16 h-8 rounded-full flex items-center justify-center transition-all ${
                    currentTab === 'notes' 
                      ? 'bg-[#E8DEF8] dark:bg-[#4A4458] text-[#21005D] dark:text-[#E8DEF8] font-bold' 
                      : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-[#EADDFF] dark:hover:bg-[#36343B]'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] uppercase tracking-wider ${
                    currentTab === 'notes'
                      ? 'font-bold text-[#1D1B20] dark:text-[#E6E1E5]'
                      : 'font-medium text-[#49454F] dark:text-[#CAC4D0]'
                  }`}>Notes</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('settings');
                    audioEngine.vibrate(20);
                  }}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div className={`w-16 h-8 rounded-full flex items-center justify-center transition-all ${
                    currentTab === 'settings' 
                      ? 'bg-[#E8DEF8] dark:bg-[#4A4458] text-[#21005D] dark:text-[#E8DEF8] font-bold' 
                      : 'text-[#49454F] dark:text-[#CAC4D0] hover:bg-[#EADDFF] dark:hover:bg-[#36343B]'
                  }`}>
                    <SettingsIcon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] uppercase tracking-wider ${
                    currentTab === 'settings'
                      ? 'font-bold text-[#1D1B20] dark:text-[#E6E1E5]'
                      : 'font-medium text-[#49454F] dark:text-[#CAC4D0]'
                  }`}>Config</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Global Reminder Scheduling dialog */}
        {isReminderDialogOpen && (
          <ReminderDialog 
            reminder={editingReminder}
            onClose={() => {
              setIsReminderDialogOpen(false);
              setEditingReminder(null);
            }}
            onSave={handleSaveReminder}
          />
        )}

      </div>
    </DeviceFrame>
  );
}
