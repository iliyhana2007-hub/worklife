import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { telegramStorage } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { calculateHabitReward } from '../utils/xpUtils';

export type DayStatus = 'neutral' | 'good' | 'bad';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export type TaskTag = 'work' | 'life' | 'study' | 'other' | 'urgent';

export type Difficulty = 'low' | 'medium' | 'high';

export interface ContentBlock {
  id: string;
  type: 'text' | 'todo';
  content: string;
  completed?: boolean;
  xpReward?: number; // Snapshot of XP rewarded when completed
  tag?: TaskTag;
  difficulty?: Difficulty;
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
  total: number; // Permanent XP that never resets
}

export interface MarathonDailyPlan {
  typeTasks?: {
    work?: number;
    life?: number;
  };
  specificTasks?: { text: string; tag?: TaskTag }[];
  habits?: string[];
}

export interface Marathon {
  id: string;
  title: string;
  goal: string;
  startDate: string; // ISO
  endDate: string; // ISO
  status: 'active' | 'completed' | 'failed';
  xpEarned: number;
  multiplier: number;
  dailyPlan: MarathonDailyPlan;
  color: string;
  isHardcore: boolean;
  missedDays: string[]; // YYYY-MM-DD
  completedDays: string[]; // YYYY-MM-DD
  failureCount: number;
}

export interface Settings {
  language: 'ru' | 'en';
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  xpSettings?: {
    tasks: {
      low: number;
      medium: number;
      high: number;
    };
    habits: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  color: string;
  icon: string;
  createdAt: number;
  completedDates: string[]; // YYYY-MM-DD
  completions?: Record<string, number>; // key: YYYY-MM-DD, value: count
  streak: number;
  difficulty?: Difficulty;
}

export interface AppState {
  // Settings
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;

  // Habits
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak'>) => void;
  toggleHabit: (id: string, date: string) => void;
  deleteHabit: (id: string) => void;
  updateHabitStreak: (id: string) => void;

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
  addXP: (amount: number) => void;
  resetHabitCount: (id: string, date: string) => void;
  decrementHabitCount: (id: string, date: string) => void;

  // CalendarMarathons
  marathons: Marathon[];
  activeMarathonId: string | null;
  startMarathon: (marathon: Omit<Marathon, 'id' | 'status' | 'xpEarned' | 'missedDays' | 'completedDays' | 'failureCount'>) => void;
  updateMarathonProgress: () => void;
  endMarathon: (id: string, success: boolean) => void;
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
        language: 'ru',
        theme: 'dark',
        notificationsEnabled: true,
        soundEnabled: true,
        xpSettings: {
          tasks: {
            low: 5,
            medium: 10,
            high: 20
          },
          habits: {
            low: 10,
            medium: 15,
            high: 25
          }
        }
      },
      habits: [],
      marathons: [],
      activeMarathonId: null,

      addHabit: (habit) =>
        set((state) => ({
          habits: [
            ...state.habits,
            {
              ...habit,
              id: uuidv4(),
              createdAt: Date.now(),
              completedDates: [],
              streak: 0,
            },
          ],
          lastModified: Date.now(),
        })),

      toggleHabit: (id, date) =>
        set((state) => {
          let xpAdded = 0;
          const habits = state.habits.map((h) => {
            if (h.id === id) {
              const completions = h.completions || {};
              const currentCount = completions[date] || 0;
              
              // Increment count
              const newCount = currentCount + 1;
              xpAdded = calculateHabitReward(h.difficulty || 'medium', state.settings.xpSettings?.habits);
              
              const newCompletions = { ...completions, [date]: newCount };
              const newCompletedDates = h.completedDates.includes(date) 
                ? h.completedDates 
                : [...h.completedDates, date];

              return { 
                ...h, 
                completions: newCompletions,
                completedDates: newCompletedDates 
              };
            }
            return h;
          });
          
          // Apply XP
          if (xpAdded !== 0) {
            const activeMarathon = state.marathons.find(m => m.id === state.activeMarathonId);
            const multiplier = activeMarathon ? activeMarathon.multiplier : 1;
            const adjustedAmount = xpAdded * multiplier;

            state.xp.total = Math.max(0, state.xp.total + adjustedAmount);
            
            if (activeMarathon) {
              state.marathons = state.marathons.map(m => 
                m.id === state.activeMarathonId 
                  ? { ...m, xpEarned: m.xpEarned + adjustedAmount } 
                  : m
              );
            }
          }
          
          // Trigger marathon progress update
          setTimeout(() => {
            get().updateMarathonProgress();
            get().updateHabitStreak(id);
          }, 0);
          
          return { 
            habits, 
            xp: { ...state.xp },
            marathons: [...state.marathons],
            lastModified: Date.now() 
          };
        }),

      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          lastModified: Date.now(),
        })),

      updateHabitStreak: (id) =>
        set((state) => {
          const habits = state.habits.map((h) => {
            if (h.id === id) {
              // Basic streak logic: count consecutive days from today backwards
              let streak = 0;
              const today = new Date();
              for (let i = 0; i < 365; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const dateStr = format(checkDate, 'yyyy-MM-dd');
                if (h.completedDates.includes(dateStr)) {
                  streak++;
                } else if (i > 0) { // Allow skipping today, but not previous days
                  break;
                }
              }
              return { ...h, streak };
            }
            return h;
          });
          return { habits, lastModified: Date.now() };
        }),

      setSettings: (newSettings) => 
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
          lastModified: Date.now(),
        })),

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
      setDayBlocks: (date, blocks) => {
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
        }));
        get().updateMarathonProgress();
      },
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

           // Business XP for counters
           const xpAdded = 10;
           const activeMarathon = state.marathons.find(m => m.id === state.activeMarathonId);
           const multiplier = activeMarathon ? activeMarathon.multiplier : 1;
           const adjustedAmount = xpAdded * multiplier;

           const newXp = {
             ...state.xp,
             total: state.xp.total + adjustedAmount
           };

           let newMarathons = state.marathons;
           if (activeMarathon) {
             newMarathons = state.marathons.map(m => 
               m.id === state.activeMarathonId 
                 ? { ...m, xpEarned: m.xpEarned + adjustedAmount } 
                 : m
             );
           }

           return {
             counters: state.counters.map((c) =>
               c.id === id ? { ...c, value: c.value + 1 } : c
             ),
             leads: newLeads,
             xp: newXp,
             marathons: newMarathons,
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

             // Deduct business XP
             const xpToRemove = 10;
             const adjustedAmount = xpToRemove; // penalties are NOT multiplied

             const newXp = {
               ...state.xp,
               total: Math.max(0, state.xp.total - adjustedAmount)
             };

             const newMarathons = state.marathons; // do not decrease marathon xpEarned on penalties

             return {
               counters: state.counters.map((c) =>
                 c.id === id ? { ...c, value: Math.max(0, c.value - 1) } : c
               ),
               leads: newLeads,
               xp: newXp,
               marathons: newMarathons,
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
      xp: { total: 0 },
      addXP: (amount) =>
        set((state) => {
          const activeMarathon = state.marathons.find(m => m.id === state.activeMarathonId);
          const multiplier = activeMarathon ? activeMarathon.multiplier : 1;
          const adjustedAmount = amount > 0 ? amount * multiplier : amount;

          // Update marathon progress if active
          let newMarathons = state.marathons;
          if (activeMarathon && amount > 0) {
            newMarathons = state.marathons.map(m => 
              m.id === state.activeMarathonId 
                ? { ...m, xpEarned: m.xpEarned + adjustedAmount } 
                : m
            );
          }

          return {
            xp: {
              ...state.xp,
              total: Math.max(0, state.xp.total + adjustedAmount),
            },
            marathons: newMarathons,
            lastModified: Date.now(),
          };
        }),

      resetHabitCount: (id, date) =>
        set((state) => {
          const habits = state.habits.map((h) => {
            if (h.id === id) {
              const completions = h.completions || {};
              const currentCount = completions[date] || 0;
              if (currentCount === 0) return h;

              // XP reduction logic
              const baseHabitReward = calculateHabitReward(h.difficulty || 'medium', state.settings.xpSettings?.habits);
              const xpToDeduct = baseHabitReward * currentCount; // penalties are NOT multiplied

              state.xp.total = Math.max(0, state.xp.total - xpToDeduct);
              // Do not decrease marathon xpEarned on penalties

              const newCompletions = { ...completions, [date]: 0 };
              const newCompletedDates = h.completedDates.filter(d => d !== date);

              return { ...h, completions: newCompletions, completedDates: newCompletedDates };
            }
            return h;
          });

          // Trigger streak update
          setTimeout(() => {
            get().updateHabitStreak(id);
            get().updateMarathonProgress();
          }, 0);

          return { habits, xp: { ...state.xp }, marathons: [...state.marathons], lastModified: Date.now() };
        }),

      decrementHabitCount: (id, date) =>
        set((state) => {
          let xpToDeduct = 0;
          const habits = state.habits.map((h) => {
            if (h.id === id) {
              const completions = h.completions || {};
              const currentCount = completions[date] || 0;
              if (currentCount <= 0) return h;

              const newCount = currentCount - 1;
              xpToDeduct = calculateHabitReward(h.difficulty || 'medium', state.settings.xpSettings?.habits);

              const newCompletions = { ...completions, [date]: newCount };
              const newCompletedDates = newCount === 0 
                ? h.completedDates.filter(d => d !== date)
                : h.completedDates;

              return { ...h, completions: newCompletions, completedDates: newCompletedDates };
            }
            return h;
          });

          if (xpToDeduct > 0) {
            const adjustedDeduction = xpToDeduct; // penalties are NOT multiplied

            state.xp.total = Math.max(0, state.xp.total - adjustedDeduction);
            // Do not decrease marathon xpEarned on penalties
          }

          setTimeout(() => {
            get().updateHabitStreak(id);
            get().updateMarathonProgress();
          }, 0);

          return { habits, xp: { ...state.xp }, marathons: [...state.marathons], lastModified: Date.now() };
        }),

      startMarathon: (marathon) =>
        set((state) => {
          const id = uuidv4();
          const newMarathon: Marathon = {
            ...marathon,
            id,
            status: 'active',
            xpEarned: 0,
            missedDays: [],
            completedDays: [],
            failureCount: 0
          };
          return {
            marathons: [...state.marathons, newMarathon],
            activeMarathonId: id,
            lastModified: Date.now()
          };
        }),

      updateMarathonProgress: () =>
        set((state) => {
          if (!state.activeMarathonId) return state;
          const marathon = state.marathons.find(m => m.id === state.activeMarathonId);
          if (!marathon || marathon.status !== 'active') return state;

          const todayStr = new Date().toISOString().split('T')[0];
          
          // Helper to check if a specific date was completed according to plan
          const checkDateCompletion = (dateStr: string) => {
            const dayData = state.days[dateStr];
            if (!dayData) return false;
            
            const { dailyPlan } = marathon;
            
            // 1. Type tasks
            if (dailyPlan.typeTasks) {
              const blocks = dayData.blocks || [];
              if (dailyPlan.typeTasks.work) {
                const workCompleted = blocks.filter(b => b.tag === 'work' && b.completed).length;
                if (workCompleted < dailyPlan.typeTasks.work) return false;
              }
              if (dailyPlan.typeTasks.life) {
                const lifeCompleted = blocks.filter(b => b.tag === 'life' && b.completed).length;
                if (lifeCompleted < dailyPlan.typeTasks.life) return false;
              }
            }

            // 2. Specific tasks
            if (dailyPlan.specificTasks && dailyPlan.specificTasks.length > 0) {
              const blocks = dayData.blocks || [];
              for (const item of dailyPlan.specificTasks) {
                const requiredTag = item.tag;
                const requiredText = item.text.toLowerCase();
                const ok = blocks.some(b => {
                  if (!b.completed) return false;
                  const textMatch = (b.content || '').toLowerCase().includes(requiredText);
                  const tagMatch = requiredTag ? (b.tag === requiredTag) : true;
                  return textMatch && tagMatch;
                });
                if (!ok) return false;
              }
            }

            // 3. Habits
            if (dailyPlan.habits && dailyPlan.habits.length > 0) {
              for (const habitId of dailyPlan.habits) {
                const habit = state.habits.find(h => h.id === habitId);
                if (!habit || !habit.completedDates.includes(dateStr)) return false;
              }
            }
            
            return true;
          };

          // Re-calculate all days from start until today (or date)
          const start = new Date(marathon.startDate);
          const current = new Date(todayStr);
          const newCompletedDays: string[] = [];
          const newMissedDays: string[] = [];
          
          // Iterate through each day of the marathon up to today
          const tempDate = new Date(start);
          let consecutiveMisses = 0;
          let maxConsecutiveMisses = 0;

          while (tempDate <= current) {
            const dStr = tempDate.toISOString().split('T')[0];
            if (checkDateCompletion(dStr)) {
              newCompletedDays.push(dStr);
              consecutiveMisses = 0;
            } else if (dStr < todayStr) {
              // Only count as missed if it's in the past
              newMissedDays.push(dStr);
              consecutiveMisses++;
              maxConsecutiveMisses = Math.max(maxConsecutiveMisses, consecutiveMisses);
            }
            tempDate.setDate(tempDate.getDate() + 1);
          }

          const newFailureCount = newMissedDays.length;
          let newStatus: 'active' | 'failed' | 'completed' = marathon.status;

          // Failure logic: 
          // Hardcore: any miss fails
          // Normal: 2 consecutive misses fail
          const isFailed = marathon.isHardcore ? newFailureCount > 0 : maxConsecutiveMisses >= 2;
          
          if (isFailed) {
            newStatus = 'failed';
          } else {
            // Check if marathon is finished successfully
            const end = new Date(marathon.endDate);
            if (current >= end) {
              newStatus = 'completed';
            }
          }

          const newMarathons = state.marathons.map(m => 
            m.id === state.activeMarathonId 
              ? { ...m, completedDays: newCompletedDays, missedDays: newMissedDays, failureCount: newFailureCount, status: newStatus } 
              : m
          );

          return {
            marathons: newMarathons,
            activeMarathonId: newStatus === 'active' ? state.activeMarathonId : null,
            lastModified: Date.now()
          };
        }),

      endMarathon: (id, success) =>
        set((state) => ({
          marathons: state.marathons.map(m => 
            m.id === id ? { ...m, status: success ? 'completed' : 'failed' } : m
          ),
          activeMarathonId: state.activeMarathonId === id ? null : state.activeMarathonId,
          lastModified: Date.now()
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
        state?.updateMarathonProgress();
      },
    }
  )
);
