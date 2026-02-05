import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { telegramStorage } from './storage';
import { v4 as uuidv4 } from 'uuid';

export type DayStatus = 'neutral' | 'good' | 'bad';

export interface DayData {
  status: DayStatus;
  note?: string;
}

export interface Lead {
  id: string;
  name?: string;
  link?: string;
  firstContactDate?: string; // ISO date
  notes?: string;
  status: 'new' | 'responded' | 'interview' | 'rejected';
  history: LeadHistoryItem[];
  isWork?: boolean; // Derived from counter context when created, or just always true for CRM leads? 
  // Requirement: "Только рабочие попадают в CRM" -> leads list only contains work leads.
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
}

export interface AppState {
  // Calendar
  days: Record<string, DayData>; // key: YYYY-MM-DD
  monthNotes: Record<string, string>; // key: YYYY-MM
  setDayStatus: (date: string, status: DayStatus) => void;
  setDayNote: (date: string, note: string) => void;
  setMonthNote: (month: string, note: string) => void;

  // Leads / Counters
  counters: Counter[];
  leads: Lead[];
  addCounter: (name: string, type: 'work' | 'personal') => void;
  toggleCounterType: (id: string) => void;
  updateCounterName: (id: string, name: string) => void;
  incrementCounter: (id: string) => void;
  decrementCounter: (id: string) => void;
  
  // CRM
  addLead: (lead: Omit<Lead, 'id' | 'history'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  addLeadHistory: (leadId: string, action: string) => void;
  deleteLead: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      days: {},
      monthNotes: {},
      counters: [
        { id: '1', name: 'Leads', value: 0, type: 'work' },
      ],
      leads: [],

      setDayStatus: (date, status) =>
        set((state) => ({
          days: {
            ...state.days,
            [date]: { ...state.days[date], status },
          },
        })),
      setDayNote: (date, note) =>
        set((state) => ({
          days: {
            ...state.days,
            [date]: { ...state.days[date], note },
          },
        })),
      setMonthNote: (month, note) =>
        set((state) => ({
          monthNotes: {
            ...state.monthNotes,
            [month]: note,
          },
        })),

      addCounter: (name, type) =>
        set((state) => {
          if (state.counters.length >= 15) return state;
          return {
            counters: [...state.counters, { id: uuidv4(), name, value: 0, type }],
          };
        }),
      toggleCounterType: (id) =>
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id ? { ...c, type: c.type === 'work' ? 'personal' : 'work' } : c
          ),
        })),
      updateCounterName: (id, name) =>
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id ? { ...c, name } : c
          ),
        })),
      incrementCounter: (id) =>
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id ? { ...c, value: c.value + 1 } : c
          ),
        })),
      decrementCounter: (id) =>
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id ? { ...c, value: c.value - 1 } : c
          ),
        })),

      addLead: (lead) =>
        set((state) => ({
          leads: [
            ...state.leads,
            { ...lead, id: uuidv4(), history: [] },
          ],
        })),
      updateLead: (id, updates) =>
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
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
        })),
      deleteLead: (id) =>
        set((state) => ({
            leads: state.leads.filter(l => l.id !== id)
        }))
    }),
    {
      name: 'worklife-storage',
      storage: createJSONStorage(() => telegramStorage),
    }
  )
);
