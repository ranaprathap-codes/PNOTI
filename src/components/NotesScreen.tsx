/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Note, ChecklistItem } from '../types';
import { 
  Pin, 
  Trash2, 
  Star, 
  Archive, 
  Search, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  FileText, 
  ListTodo, 
  PlusCircle, 
  FolderSync, 
  Heart,
  Undo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioEngine } from '../utils/audio';

interface NotesScreenProps {
  notes: Note[];
  onSaveNote: (note: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

const PASTEL_COLORS = [
  { name: 'Default', bgClass: 'bg-white dark:bg-[#1C1A22] text-[#1D1B20] dark:text-[#E6E1E5] border-[#CAC4D0] dark:border-[#4A4458]' },
  { name: 'Peach', bgClass: 'bg-[#FDF4E7] dark:bg-[#3E2D23]/30 text-[#493122] dark:text-[#F3E3D8] border-[#EAD0BE] dark:border-[#523A2C]/80' },
  { name: 'Mint', bgClass: 'bg-[#EAF6EC] dark:bg-[#1B3524]/30 text-[#133C1E] dark:text-[#D1EBD6] border-[#BCDDBE] dark:border-[#224E2E]/80' },
  { name: 'Sky', bgClass: 'bg-[#E8F1FC] dark:bg-[#1A2E40]/30 text-[#132A3E] dark:text-[#D0E2F3] border-[#BDD4EA] dark:border-[#21435D]/80' },
  { name: 'Lavender', bgClass: 'bg-[#F3EDF7] dark:bg-[#2B2930]/45 text-[#21005D] dark:text-[#E8DEF8] border-[#EADDFF] dark:border-[#4A4458]' },
  { name: 'Rose', bgClass: 'bg-[#FDF2F4] dark:bg-[#3B1F27]/30 text-[#541223] dark:text-[#FDD5DF] border-[#F2B8B5] dark:border-[#4D232E]/80' },
];

export default function NotesScreen({
  notes,
  onSaveNote,
  onDeleteNote,
  onTogglePin,
  onToggleFavorite,
  onToggleArchive
}: NotesScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'archived'>('all');
  
  // Editor States
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note> | null>(null);
  
  // Note Form Fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedColor, setSelectedColor] = useState('Default');
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Process and filter notes list
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch = 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        n.body.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchTab = 
        activeTab === 'all' ? !n.archived :
        activeTab === 'favorites' ? n.favorite && !n.archived :
        n.archived; // archived tab
      
      return matchSearch && matchTab;
    });
  }, [notes, searchTerm, activeTab]);

  // Split Pinned and Regular
  const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.pinned), [filteredNotes]);
  const regularNotes = useMemo(() => filteredNotes.filter(n => !n.pinned), [filteredNotes]);

  // Open note in editor
  const handleOpenEditor = (note?: Note) => {
    audioEngine.vibrate(25);
    if (note) {
      setCurrentNote(note);
      setTitle(note.title);
      setBody(note.body);
      setSelectedColor(note.color || 'Default');
      setIsChecklistMode(!!note.checklist && note.checklist.length > 0);
      setChecklist(note.checklist || []);
    } else {
      setCurrentNote(null);
      setTitle('');
      setBody('');
      setSelectedColor('Default');
      setIsChecklistMode(false);
      setChecklist([]);
    }
    setNewChecklistItem('');
    setIsEditing(true);
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: Math.random().toString(),
      text: newChecklistItem.trim(),
      done: false
    };
    setChecklist([...checklist, newItem]);
    setNewChecklistItem('');
    audioEngine.vibrate(20);
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    ));
    audioEngine.vibrate(20);
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
    audioEngine.vibrate(15);
  };

  const handleSave = () => {
    if (!title.trim() && !body.trim() && checklist.length === 0) {
      alert('Please fill out some content before saving.');
      return;
    }

    const savedPayload: Partial<Note> = {
      ...currentNote,
      title: title.trim() || 'Untitled Note',
      body: body.trim(),
      isRichText: false,
      checklist: isChecklistMode ? checklist : undefined,
      color: selectedColor,
    };

    onSaveNote(savedPayload);
    setIsEditing(false);
    audioEngine.vibrate([30, 30]);
  };

  return (
    <div id="notes-tab-container" className="flex-1 flex flex-col p-5 overflow-y-auto bg-[#FDF7FF] dark:bg-[#131117] transition-colors duration-200">
      
      {/* Header and Sync indicator */}
      <div className="flex items-center justify-between mb-4 mt-2">
        <div>
          <h2 className="text-xl font-black text-[#21005D] dark:text-[#E6E1E5] flex items-center gap-1.5">
            Cloud Notes
            <FolderSync className="w-5 h-5 text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} />
          </h2>
          <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] font-bold uppercase tracking-wider">Automatic Live Cloud Backup</p>
        </div>

        <button 
          onClick={() => handleOpenEditor()}
          className="w-10 h-10 rounded-xl bg-[#6750A4] dark:bg-[#D0BCFF] hover:bg-[#5a4392] dark:hover:bg-[#bba7ec] text-white dark:text-[#381E72] flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 mb-4 bg-[#EADDFF]/50 dark:bg-[#2B2930] p-1 rounded-xl">
        {(['all', 'favorites', 'archived'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              audioEngine.vibrate(15);
            }}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all capitalize cursor-pointer ${
              activeTab === tab 
                ? 'bg-[#E8DEF8] dark:bg-[#4A4458] text-[#21005D] dark:text-[#E8DEF8] shadow-xs' 
                : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#21005D] dark:hover:text-[#E8DEF8]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Live Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-[#49454F] dark:text-[#CAC4D0]" />
        <input 
          type="text" 
          placeholder="Search within notes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#F3EDF7] dark:bg-[#2B2930] text-[#1D1B20] dark:text-[#E6E1E5] rounded-full border-none focus:ring-2 focus:ring-[#6750A4] dark:focus:ring-[#D0BCFF] outline-none text-xs font-semibold shadow-xs transition-all"
        />
      </div>

      {/* Main Feed with scroll */}
      <div className="flex-1 flex flex-col min-h-0 space-y-5 pb-4">
        
        {/* Pinned Section */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1">
              <Pin className="w-3.5 h-3.5 text-indigo-500" /> Pinned Notes ({pinnedNotes.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {pinnedNotes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onEdit={() => handleOpenEditor(note)} 
                  onTogglePin={() => onTogglePin(note.id)}
                  onToggleFavorite={() => onToggleFavorite(note.id)}
                  onToggleArchive={() => onToggleArchive(note.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Notes Section */}
        <div className="space-y-2 flex-1 flex flex-col">
          {pinnedNotes.length > 0 && (
            <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              Other Notes ({regularNotes.length})
            </h3>
          )}

          {filteredNotes.length === 0 ? (
            <div className="flex-1 bg-white dark:bg-neutral-850 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center">
                <FileText className="w-5 h-5 text-neutral-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">No Notes Available</h4>
                <p className="text-[11px] text-neutral-500 max-w-xs leading-relaxed">
                  Backup syncing is running in the background. Tap the plus button to create your first secure note.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1">
              {regularNotes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onEdit={() => handleOpenEditor(note)} 
                  onTogglePin={() => onTogglePin(note.id)}
                  onToggleFavorite={() => onToggleFavorite(note.id)}
                  onToggleArchive={() => onToggleArchive(note.id)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom overlay full page Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-neutral-950/60 flex items-end justify-center z-50 animate-fade-in"
          >
            <motion.div 
              initial={{ y: 150 }}
              animate={{ y: 0 }}
              exit={{ y: 150 }}
              className="bg-white dark:bg-neutral-900 w-full rounded-t-[32px] max-h-[90%] overflow-y-auto p-6 shadow-2xl border-t border-neutral-200 dark:border-neutral-800 flex flex-col space-y-4"
            >
              {/* Editor Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                  <Edit3 className="w-4 h-4 text-indigo-500" /> Write Synced Note
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsChecklistMode(!isChecklistMode)}
                    className={`py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer border ${
                      isChecklistMode 
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-indigo-400' 
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <ListTodo className="w-3.5 h-3.5" />
                    List Mode
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title input */}
              <input 
                type="text" 
                placeholder="Give your note a title..." 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-850 text-neutral-850 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all"
              />

              {/* Note color picker accent */}
              <div>
                <span className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">Notebook Color Accent</span>
                <div className="flex gap-2">
                  {PASTEL_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setSelectedColor(c.name);
                        audioEngine.vibrate(20);
                      }}
                      className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all ${
                        c.bgClass.split(' ')[0]
                      } ${
                        selectedColor === c.name ? 'border-indigo-600 dark:border-indigo-400 scale-110 shadow-md' : 'border-neutral-350 dark:border-neutral-700'
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Checklist Mode Form or Textarea body */}
              {isChecklistMode ? (
                <div className="space-y-3.5">
                  <span className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Checklist Items ({checklist.length})</span>
                  
                  {/* Item inputs form */}
                  <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add an item to the checklist..." 
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-850 text-neutral-850 dark:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button 
                      type="submit" 
                      className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" /> Add
                    </button>
                  </form>

                  {/* List feed */}
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                    {checklist.length === 0 ? (
                      <p className="text-[10px] text-neutral-400 italic">No checklist items added yet. Write one above!</p>
                    ) : (
                      checklist.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleToggleChecklistItem(item.id)}
                            className="flex items-center gap-2 text-left text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer"
                          >
                            <input 
                              type="checkbox" 
                              checked={item.done} 
                              readOnly 
                              className="accent-indigo-600 rounded cursor-pointer pointer-events-none"
                            />
                            <span className={item.done ? 'line-through text-neutral-400' : ''}>{item.text}</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleRemoveChecklistItem(item.id)}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <span className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Note Body</span>
                  <textarea 
                    placeholder="Start typing your synced ideas, logs or tasks here..." 
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-850 text-neutral-850 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all leading-relaxed"
                  />
                </div>
              )}

              {/* Action Submit */}
              <button
                onClick={handleSave}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-150 dark:shadow-neutral-950 transition-all cursor-pointer"
              >
                <Check className="w-5 h-5" /> Save Synced Note
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Subcomponent: NoteCard representation
interface NoteCardProps {
  key?: string;
  note: Note;
  onEdit: () => void;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
}

function NoteCard({ note, onEdit, onTogglePin, onToggleFavorite, onToggleArchive }: NoteCardProps) {
  const colorObj = PASTEL_COLORS.find(c => c.name === note.color) || PASTEL_COLORS[0];

  return (
    <div 
      className={`p-4 rounded-xl border flex flex-col justify-between h-[160px] shadow-xs relative m3-card ${colorObj.bgClass}`}
    >
      {/* Pin action overlay top-right */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          audioEngine.vibrate(20);
          onTogglePin();
        }}
        className={`absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${
          note.pinned ? 'text-[#6750A4] dark:text-[#D0BCFF]' : 'text-neutral-300 hover:text-neutral-500'
        }`}
      >
        <Pin className="w-3.5 h-3.5 fill-current rotate-45" />
      </button>

      {/* Favorite badge top-left */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          audioEngine.vibrate(20);
          onToggleFavorite();
        }}
        className={`absolute top-2.5 right-8 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${
          note.favorite ? 'text-rose-500' : 'text-neutral-300 hover:text-rose-400'
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${note.favorite ? 'fill-current' : ''}`} />
      </button>

      {/* Main card body click-to-edit */}
      <div className="flex-1 min-w-0 pr-6 pt-1 cursor-pointer" onClick={onEdit}>
        <h4 className="text-xs font-black truncate leading-tight uppercase tracking-wide">
          {note.title}
        </h4>
        
        {note.checklist && note.checklist.length > 0 ? (
          <div className="mt-2 space-y-1">
            {note.checklist.slice(0, 2).map(item => (
              <div key={item.id} className="flex items-center gap-1.5 text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                <input type="checkbox" checked={item.done} readOnly className="w-2.5 h-2.5 accent-indigo-600" />
                <span className={item.done ? 'line-through text-neutral-400' : ''}>{item.text}</span>
              </div>
            ))}
            {note.checklist.length > 2 && (
              <span className="text-[9px] text-neutral-400 italic block pt-0.5">+{note.checklist.length - 2} more items</span>
            )}
          </div>
        ) : (
          <p className="text-[11px] leading-relaxed line-clamp-4 text-neutral-500 dark:text-neutral-400 mt-1.5 font-medium">
            {note.body || <span className="italic text-neutral-400">Empty note body. Tap to write details.</span>}
          </p>
        )}
      </div>

      {/* Bottom Actions footer */}
      <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-[9px] text-neutral-400 font-bold mt-2">
        <span>{note.createdAt.split('T')[0]}</span>
        
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioEngine.vibrate(15);
              onToggleArchive();
            }}
            className={`p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
              note.archived ? 'text-amber-500' : 'text-neutral-400 hover:text-amber-500'
            }`}
            title={note.archived ? "Unarchive note" : "Archive note"}
          >
            {note.archived ? <Undo2 className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioEngine.vibrate([30, 10]);
              onEdit();
            }}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-neutral-400 hover:text-indigo-500"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
