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
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      days: {},
      monthNotes: {},
      counters: [
        { id: '1', name: 'Leads', value: 0, type: 'work', color: '#EF4444' },
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

      addCounter: (name, type, color) =>
        set((state) => {
          if (state.counters.length >= 15) return state;
          return {
            counters: [...state.counters, { id: uuidv4(), name, value: 0, type, color: color || '#EF4444' }],
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
      updateCounterColor: (id, color) =>
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id ? { ...c, color } : c
          ),
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
             leads: newLeads
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
               leads: newLeads
             };
          });
      },

      addLead: (lead) =>
        set((state) => ({
          leads: [
            ...state.leads,
            { ...lead, id: uuidv4(), history: [], createdAt: Date.now() },
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
      name: 'worklife-storage-v2',
      storage: createJSONStorage(() => telegramStorage),
    }
  )
);
