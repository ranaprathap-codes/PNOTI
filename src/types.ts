/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  customRepeat?: string; // e.g. "Every 3 days"
  category: string; // e.g. "Work", "Personal", "Health", "Finance"
  priority: 'low' | 'medium' | 'high';
  audioUrl?: string; // base64 or stock id
  audioName?: string; // label of selected sound
  vibration: boolean;
  icon: string; // icon identifier (lucide icon name)
  enabled: boolean;
  completed: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  body: string; // text or JSON string for rich body
  isRichText: boolean;
  checklist?: ChecklistItem[];
  pinned: boolean;
  archived: boolean;
  favorite: boolean;
  color?: string; // hex or tailwind class name
  category: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  themeMode: 'light' | 'dark' | 'system';
  vibrationEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  defaultCategory: string;
  notificationsEnabled: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  settings: AppSettings;
  createdAt: string;
}
