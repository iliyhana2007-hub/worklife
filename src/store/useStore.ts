import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { telegramStorage } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { isSameDay, isSameWeek, isSameMonth, isSameYear } from 'date-fns';

export type DayStatus = 'neutral' | 'good' | 'bad';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'todo';
  content: string;
  completed?: boolean;
  xpReward?: number; // Snapshot of XP rewarded when completed
}

export interface DayData {
  status: DayStatus;
  note?: string;
  todos?: TodoItem[];
  blocks?: ContentBlock[];
  lastModified?: number;
}

export interface MonthData {
  note: string;
  todos?: TodoItem[];
  blocks?: ContentBlock[];
  lastModified?: number;
}

export interface Lead {
  id: string;
  name?: string;
  link?: string;
  firstContactDate?: string; // ISO date
  notes?: string;
  status: 'new' | 'responded' | 'interview' | 'rejected';
  offer?: 'model' | 'agent' | 'chatter' | 'operator'; // New field for offer type
  history: LeadHistoryItem[];
  isWork?: boolean;
  sourceCounterId?: string; // Links lead to specific counter
  createdAt: number; // Timestamp for 15s deletion rule
}

export interface LeadHistoryItem {
  id: string;
  timestamp: string;
  action: string;
}

export interface Counter {
  id: string;
  name: string;
  value: number;
  type: 'work' | 'personal';
  color?: string; // Hex color
}

export interface Objection {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

export interface Technique {
  id: string;
  title: string;
  content: string;
  category: string;
}

export interface XP {
  character: number;
  business: number;
}

export type XpResetFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export interface Settings {
  xpResetFrequency: XpResetFrequency;
  language: 'ru' | 'en';
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

export interface AppState {
  // Settings
  settings: Settings;
  lastXpReset: number; // Timestamp of last reset
  setSettings: (settings: Partial<Settings>) => void;
  resetXP: () => void;
  checkXpReset: () => void;

  // Calendar
  days: Record<string, DayData>; // key: YYYY-MM-DD
  monthNotes: Record<string, MonthData | string>; // key: YYYY-MM (string for backward compat)
  setDayStatus: (date: string, status: DayStatus) => void;
  setDayNote: (date: string, note: string, todos?: TodoItem[]) => void;
  setDayBlocks: (date: string, blocks: ContentBlock[]) => void;
  setMonthNote: (month: string, note: string, todos?: TodoItem[]) => void;
  setMonthBlocks: (month: string, blocks: ContentBlock[]) => void;

  // Leads / Counters
  counters: Counter[];
  leads: Lead[];
  addCounter: (name: string, type: 'work' | 'personal', color?: string) => void;
  toggleCounterType: (id: string) => void;
  updateCounterName: (id: string, name: string) => void;
  updateCounterColor: (id: string, color: string) => void;
  incrementCounter: (id: string) => void;
  decrementCounter: (id: string) => void;
  
  // CRM
  addLead: (lead: Omit<Lead, 'id' | 'history' | 'createdAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  addLeadHistory: (leadId: string, action: string) => void;
  deleteLead: (id: string) => void;

  // Settings
  googleSheetUrl?: string;
  setGoogleSheetUrl: (url: string) => void;
  
  // Sync
  lastModified: number; // Global timestamp for sync conflict resolution
  setFullState: (data: Partial<AppState>) => void;
  updateLastModified: () => void;

  // Dojo (Objections & Techniques)
  objections: Objection[];
  techniques: Technique[];
  addObjection: (objection: Omit<Objection, 'id'>) => void;
  updateObjection: (id: string, updates: Partial<Objection>) => void;
  deleteObjection: (id: string) => void;
  addTechnique: (technique: Omit<Technique, 'id'>) => void;
  updateTechnique: (id: string, updates: Partial<Technique>) => void;
  deleteTechnique: (id: string) => void;

  // Level Up System
  xp: XP;
  addXP: (type: 'character' | 'business', amount: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      days: {},
      monthNotes: {},
      counters: [
        { id: '1', name: 'Leads', value: 0, type: 'work', color: '#EF4444' },
      ],
      leads: [],
      googleSheetUrl: '',
      lastModified: Date.now(),
      
      // Settings Initial State
      settings: {
        xpResetFrequency: 'never',
        language: 'ru',
        theme: 'dark',
        notificationsEnabled: true,
        soundEnabled: true,
      },
      lastXpReset: Date.now(),

      setSettings: (newSettings) => 
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
          lastModified: Date.now(),
        })),

      resetXP: () => 
          set(() => ({
          xp: { character: 0, business: 0 },
          lastXpReset: Date.now(),
          lastModified: Date.now(),
        })),

      checkXpReset: () => {
        const state = get();
        const { xpResetFrequency } = state.settings;
        const lastReset = state.lastXpReset || 0;
        const now = Date.now();
        const lastDate = new Date(lastReset);
        const currentDate = new Date(now);

        let shouldReset = false;

        switch (xpResetFrequency) {
          case 'daily':
            if (!isSameDay(lastDate, currentDate)) shouldReset = true;
            break;
          case 'weekly':
            if (!isSameWeek(lastDate, currentDate, { weekStartsOn: 1 })) shouldReset = true;
            break;
          case 'monthly':
            if (!isSameMonth(lastDate, currentDate)) shouldReset = true;
            break;
          case 'yearly':
            if (!isSameYear(lastDate, currentDate)) shouldReset = true;
            break;
          case 'never':
          default:
            shouldReset = false;
        }

        if (shouldReset) {
            set({
                xp: { character: 0, business: 0 },
                lastXpReset: now,
                lastModified: now
            });
        }
      },

      setGoogleSheetUrl: (url) => set({ googleSheetUrl: url }),

      updateLastModified: () => set({ lastModified: Date.now() }),

      setFullState: (data) => set((state) => ({
        ...state,
        ...data,
        // When we import, we accept the remote timestamp
      })),

      setDayStatus: (date, status) =>
        set((state) => ({
          days: {
            ...state.days,
            [date]: { ...state.days[date], status },
          },
          lastModified: Date.now(),
        })),
      setDayNote: (date, note, todos) =>
        set((state) => ({
          days: {
            ...state.days,
            [date]: { 
              ...state.days[date], 
              note, 
              todos,
              lastModified: Date.now()
            },
          },
          lastModified: Date.now(),
        })),
      setDayBlocks: (date, blocks) =>
        set((state) => ({
          days: {
            ...state.days,
            [date]: { 
              ...state.days[date], 
              blocks,
              lastModified: Date.now()
            },
          },
          lastModified: Date.now(),
        })),
      setMonthNote: (month, note, todos) =>
        set((state) => ({
          monthNotes: {
            ...state.monthNotes,
            [month]: {
              note,
              todos,
              lastModified: Date.now()
            },
          },
          lastModified: Date.now(),
        })),
      setMonthBlocks: (month, blocks) =>
        set((state) => ({
          monthNotes: {
            ...state.monthNotes,
            [month]: {
              ...(typeof state.monthNotes[month] === 'string' 
                  ? { note: state.monthNotes[month] as string } 
                  : state.monthNotes[month] as MonthData),
              blocks,
              lastModified: Date.now()
            },
          },
          lastModified: Date.now(),
        })),

      addCounter: (name, type, color) =>
        set((state) => {
          if (state.counters.length >= 15) return state;
          return {
            counters: [...state.counters, { id: uuidv4(), name, value: 0, type, color: color || '#EF4444' }],
            lastModified: Date.now(),
          };
        }),
      toggleCounterType: (id) =>
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id ? { ...c, type: c.type === 'work' ? 'personal' : 'work' } : c
          ),
          lastModified: Date.now(),
        })),
      updateCounterName: (id, name) =>
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id ? { ...c, name } : c
          ),
          lastModified: Date.now(),
        })),
      updateCounterColor: (id, color) =>
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id ? { ...c, color } : c
          ),
          lastModified: Date.now(),
        })),
      incrementCounter: (id) => {
        set((state) => {
           const counter = state.counters.find(c => c.id === id);
           if (!counter) return state;
           
           // If work counter, auto-create lead
           let newLeads = state.leads;
           if (counter.type === 'work') {
               const newLead: Lead = {
                   id: uuidv4(),
                   status: 'new',
                   history: [],
                   isWork: true,
                   sourceCounterId: id,
                   createdAt: Date.now(),
                   firstContactDate: new Date().toISOString()
               };
               newLeads = [...state.leads, newLead];
           }

           return {
             counters: state.counters.map((c) =>
               c.id === id ? { ...c, value: c.value + 1 } : c
             ),
             leads: newLeads,
             lastModified: Date.now(),
           };
        });
      },
      decrementCounter: (id) => {
          set((state) => {
             const counter = state.counters.find(c => c.id === id);
             if (!counter) return state;
             
             let newLeads = state.leads;
             if (counter.type === 'work') {
                 // Find last lead from this counter created < 15s ago
                 const now = Date.now();
                 // Reverse search to find the most recent one
                 const leadsReversed = [...state.leads].reverse();
                 const leadIndexReversed = leadsReversed.findIndex(l => 
                     l.sourceCounterId === id && 
                     (now - l.createdAt) < 15000
                 );
                 
                 if (leadIndexReversed !== -1) {
                     // Found one to delete
                     const leadToDelete = leadsReversed[leadIndexReversed];
                     newLeads = state.leads.filter(l => l.id !== leadToDelete.id);
                 }
             }

             return {
               counters: state.counters.map((c) =>
                 c.id === id ? { ...c, value: c.value - 1 } : c
               ),
               leads: newLeads,
               lastModified: Date.now(),
             };
          });
      },

      // Dojo Actions
      objections: [],
      techniques: [],
      addObjection: (objection) =>
        set((state) => ({
          objections: [...state.objections, { ...objection, id: uuidv4() }],
          lastModified: Date.now(),
        })),
      updateObjection: (id, updates) =>
        set((state) => ({
          objections: state.objections.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
          lastModified: Date.now(),
        })),
      deleteObjection: (id) =>
        set((state) => ({
          objections: state.objections.filter((o) => o.id !== id),
          lastModified: Date.now(),
        })),
      addTechnique: (technique) =>
        set((state) => ({
          techniques: [...state.techniques, { ...technique, id: uuidv4() }],
          lastModified: Date.now(),
        })),
      updateTechnique: (id, updates) =>
        set((state) => ({
          techniques: state.techniques.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
          lastModified: Date.now(),
        })),
      deleteTechnique: (id) =>
        set((state) => ({
          techniques: state.techniques.filter((t) => t.id !== id),
          lastModified: Date.now(),
        })),

      // XP Actions
      xp: { character: 0, business: 0 },
      addXP: (type, amount) =>
        set((state) => ({
          xp: {
            ...state.xp,
            [type]: Math.max(0, state.xp[type] + amount),
          },
          lastModified: Date.now(),
        })),

      addLead: (lead) =>
        set((state) => ({
          leads: [
            ...state.leads,
            { ...lead, id: uuidv4(), history: [], createdAt: Date.now() },
          ],
          lastModified: Date.now(),
        })),
      updateLead: (id, updates) =>
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
          lastModified: Date.now(),
        })),
      addLeadHistory: (leadId, action) =>
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  history: [
                    ...l.history,
                    { id: uuidv4(), timestamp: new Date().toISOString(), action },
                  ],
                }
              : l
          ),
          lastModified: Date.now(),
        })),
      deleteLead: (id) =>
        set((state) => ({
            leads: state.leads.filter(l => l.id !== id),
            lastModified: Date.now(),
        }))
    }),
    {
      name: 'worklife-storage-v2',
      storage: createJSONStorage(() => telegramStorage),
      onRehydrateStorage: () => (state) => {
        state?.checkXpReset();
      },
    }
  )
);
