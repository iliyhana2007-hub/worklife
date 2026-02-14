import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Zap, 
  Flame, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3, 
  Trophy,
  Activity,
  X,
  ChevronRight,
  Target,
  Rocket,
  PlusCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Sparkles,
  Leaf,
  Shield
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { calculateLevel, calculateHabitReward } from '../utils/xpUtils';
import { cn } from '@/lib/utils';
import { LevelUpHeader } from '@/components/LevelUpHeader';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, startOfMonth, isWithinInterval, subDays, eachDayOfInterval, isBefore } from 'date-fns';
import { ru } from 'date-fns/locale';

import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { xp, habits, days, marathons, activeMarathonId, startMarathon, endMarathon, settings } = useStore();
  const globalLevel = calculateLevel(xp.total);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showMarathonModal, setShowMarathonModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('today');
  const [customRange, setCustomRange] = useState({ 
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), 
    end: format(new Date(), 'yyyy-MM-dd') 
  });

  const activeMarathon = marathons.find(m => m.id === activeMarathonId);

  const [newMarathon, setNewMarathon] = useState({
    title: '',
    goal: '',
    duration: 7,
    color: '#EAB308',
    isHardcore: false,
    dailyPlan: {
      typeTasks: { work: 0, life: 0 },
      specificTasks: [] as string[],
      habits: [] as string[]
    }
  });

  const [tempSpecificTask, setTempSpecificTask] = useState('');

  const calculateMultiplier = (duration: number, isHardcore: boolean) => {
    const base = 1.0 + (duration / 14); // 2 days -> 1.14, 14 days -> 2.0
    return Number((base + (isHardcore ? 0.5 : 0)).toFixed(2));
  };

  const handleStartMarathon = () => {
    if (!newMarathon.title) return;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + newMarathon.duration);
    
    startMarathon({
      title: newMarathon.title,
      goal: newMarathon.goal,
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString(),
      multiplier: calculateMultiplier(newMarathon.duration, newMarathon.isHardcore),
      color: newMarathon.color,
      isHardcore: newMarathon.isHardcore,
      dailyPlan: newMarathon.dailyPlan
    });
    setShowMarathonModal(false);
  };

  // Statistics Calculation based on period
  const stats = useMemo(() => {
    let start: Date;
    let end: Date = endOfDay(new Date());

    switch (statsPeriod) {
      case 'today':
        start = startOfDay(new Date());
        break;
      case 'week':
        start = startOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(new Date());
        break;
      case 'all':
        start = new Date(0); // Beginning of time
        break;
      case 'custom':
        start = startOfDay(parseISO(customRange.start));
        end = endOfDay(parseISO(customRange.end));
        break;
      default:
        start = startOfDay(new Date());
    }

    const interval = { start, end };

    const filteredDays = Object.entries(days).filter(([date]) => {
      const dayDate = parseISO(date);
      if (statsPeriod === 'all') return true;
      return isWithinInterval(dayDate, interval);
    });

    const totalDays = statsPeriod === 'all' 
      ? filteredDays.length 
      : eachDayOfInterval({ 
          start, 
          end: isBefore(end, new Date()) ? end : endOfDay(new Date()) 
        }).length;
    const goodDays = filteredDays.filter(([, d]) => d.status === 'good').length;
    
    const allCompletedTasks = filteredDays.flatMap(([date, day]) => {
      const completedBlocks = day.blocks?.filter(b => b.type === 'todo' && b.completed && b.content?.trim() !== '') || [];
      return completedBlocks.map(block => ({
        id: block.id,
        content: block.content,
        date: date,
        tag: block.tag
      }));
    }).sort((a, b) => b.date.localeCompare(a.date));

    const completedTasksCount = allCompletedTasks.length;
    
    // Better XP calculation: use actual XP rewards from blocks and habits
    const taskXp = filteredDays.reduce((acc, [, day]) => {
      const completedBlocks = day.blocks?.filter(b => b.type === 'todo' && b.completed && b.content?.trim() !== '') || [];
      return acc + completedBlocks.reduce((sum, b) => sum + (b.xpReward || 0), 0);
    }, 0);

    // Habits XP calculation: we need to know if a multiplier was active
    // Since we don't store snapshots for habits, we'll estimate or check marathons
    const habitXp = habits.reduce((acc, h) => {
      const completions = h.completions || {};
      
      return acc + Object.entries(completions).reduce((sum, [dateStr, count]) => {
        const date = parseISO(dateStr);
        if (statsPeriod !== 'all' && !isWithinInterval(date, interval)) return sum;
        
        const marathonAtTime = marathons.find(m => 
          isWithinInterval(date, { start: parseISO(m.startDate), end: parseISO(m.endDate) })
        );
        const multiplier = marathonAtTime ? marathonAtTime.multiplier : 1;
        const baseReward = calculateHabitReward(h.difficulty || 'medium', settings.xpSettings?.habits);
        return sum + (baseReward * count * multiplier);
      }, 0);
    }, 0);

    const totalHabitCompletions = habits.reduce((acc, h) => {
      const completions = h.completions || {};
      const countInPeriod = Object.entries(completions).reduce((sum, [dateStr, count]) => {
        const date = parseISO(dateStr);
        if (statsPeriod !== 'all' && !isWithinInterval(date, interval)) return sum;
        return sum + count;
      }, 0);
      return acc + countInPeriod;
    }, 0);

    const tasksByTag = allCompletedTasks.reduce((acc, task) => {
      const tag = task.tag || 'other';
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

    const marathonXp = marathons
      .filter(m => {
        if (statsPeriod === 'all') return true;
        return isWithinInterval(parseISO(m.endDate), interval) || (m.status === 'active' && isWithinInterval(new Date(), interval));
      })
      .reduce((acc, m) => acc + m.xpEarned, 0);

    return {
      totalDays,
      goodDays,
      goodDaysPercent: totalDays > 0 ? Math.round((goodDays / totalDays) * 100) : 0,
      completedTasksCount,
      allCompletedTasks,
      totalHabitCompletions,
      habitXp,
      taskXp,
      tasksByTag,
      maxStreak,
      marathonXp,
      totalPeriodXp: Math.round(taskXp + habitXp)
    };
  }, [days, habits, statsPeriod, customRange, marathons, settings.xpSettings?.habits]);

  return (
    <div className="min-h-full bg-black p-4 pb-24 text-zinc-100">
      <header className="mb-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-500">
              <User size={48} className="text-white drop-shadow-lg" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white text-[10px] font-black px-2 py-1 rounded-xl border-4 border-black shadow-2xl">
              LVL {globalLevel}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-1">Герой</h1>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Ваш путь к мастерству</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Опыт</span>
                <span className="text-xl font-black text-indigo-400 leading-none">{xp.total} <span className="text-xs text-zinc-600">XP</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              {activeMarathon && (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/20 animate-pulse">
                  <Flame size={12} className="text-orange-500" />
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider">
                    В марафоне
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <Shield size={12} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">
                  Защищен
                </span>
              </div>
            </div>
          </div>
        </div>
        <LevelUpHeader />
      </header>

      <main className="space-y-8">
        {/* Rituals Shortcut Widget */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-500" />
              <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Ежедневные ритуалы</h2>
            </div>
            <button onClick={() => navigate('/habits')} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">Все</button>
          </div>
          <button
            onClick={() => navigate('/habits')}
            className="w-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-[2.5rem] p-6 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-emerald-500/30"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500 shadow-inner">
                <Leaf size={32} fill="currentColor" className="group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1.5">Ритуалы</h3>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${habits.length > 0 ? (habits.filter(h => h.completedDates.includes(format(new Date(), 'yyyy-MM-dd'))).length / habits.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    {habits.filter(h => h.completedDates.includes(format(new Date(), 'yyyy-MM-dd'))).length}/{habits.length}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-white group-hover:border-emerald-500/50 transition-all">
              <ChevronRight size={20} />
            </div>
          </button>
        </section>

        {/* Statistics Period Selector */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-500" />
              <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Сводка активности</h2>
            </div>
            <BarChart3 size={16} className="text-zinc-700" />
          </div>
          
          <div className="flex bg-zinc-900/60 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-zinc-800/50 shadow-inner">
            {(['all', 'month', 'week', 'today'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setStatsPeriod(p)}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                  statsPeriod === p 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-105" 
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {p === 'all' ? 'Всё' : p === 'month' ? 'Месяц' : p === 'week' ? 'Неделя' : 'Сегодня'}
              </button>
            ))}
            <button
              onClick={() => setStatsPeriod('custom')}
              className={cn(
                "w-12 flex items-center justify-center rounded-xl transition-all duration-300",
                statsPeriod === 'custom' ? "bg-indigo-600 text-white shadow-xl" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Calendar size={18} />
            </button>
          </div>
          
          {statsPeriod === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3 pt-2"
            >
              <div className="space-y-1">
                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-2">Начало</label>
                <input 
                  type="date" 
                  value={customRange.start}
                  onChange={e => setCustomRange({...customRange, start: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-2">Конец</label>
                <input 
                  type="date" 
                  value={customRange.end}
                  onChange={e => setCustomRange({...customRange, end: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={48} className="text-indigo-500" />
              </div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Опыт за период</span>
              <span className="text-3xl font-black text-white">{stats.totalPeriodXp}</span>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1 h-1 rounded-full bg-indigo-500" />
                <span className="text-[8px] font-black text-indigo-500/80 uppercase tracking-widest">Уровень растет</span>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Flame size={48} className="text-orange-500" />
              </div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Макс. стрик</span>
              <span className="text-3xl font-black text-white">{stats.maxStreak}</span>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1 h-1 rounded-full bg-orange-500" />
                <span className="text-[8px] font-black text-orange-500/80 uppercase tracking-widest">Дней подряд</span>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle2 size={48} className="text-emerald-500" />
              </div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Задач выполнено</span>
              <span className="text-3xl font-black text-white">{stats.completedTasksCount}</span>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest">Продуктивность</span>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity size={48} className="text-blue-500" />
              </div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Ритуалов</span>
              <span className="text-3xl font-black text-white">{stats.totalHabitCompletions}</span>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1 h-1 rounded-full bg-blue-500" />
                <span className="text-[8px] font-black text-blue-500/80 uppercase tracking-widest">Всего повторений</span>
              </div>
            </div>
          </div>
        </section>

        {/* Marathon Section */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Марафоны</h2>
            {!activeMarathon && (
              <button 
                onClick={() => setShowMarathonModal(true)}
                className="text-xs font-bold text-yellow-500 flex items-center gap-1 active:opacity-50 transition-opacity"
              >
                <PlusCircle size={14} /> Создать
              </button>
            )}
          </div>

          {activeMarathon ? (
            <div 
              className="border rounded-2xl p-5 relative overflow-hidden"
              style={{ 
                backgroundColor: `${activeMarathon.color}10`,
                borderColor: `${activeMarathon.color}30`
              }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Rocket size={18} style={{ color: activeMarathon.color }} />
                    <h3 className="font-bold text-white">{activeMarathon.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeMarathon.isHardcore && (
                      <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">Hardcore</span>
                    )}
                    <span className="text-[10px] font-bold bg-white/10 text-white px-1.5 py-0.5 rounded">x{activeMarathon.multiplier} XP</span>
                  </div>
                </div>
                
                {activeMarathon.goal && (
                  <p className="text-xs text-zinc-400 mb-4 bg-black/20 p-2 rounded-lg border border-white/5">
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold mb-1">Глобальная цель:</span>
                    {activeMarathon.goal}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">План на день</span>
                      <div className="flex gap-2">
                        {activeMarathon.dailyPlan.typeTasks?.work && (
                          <div className="flex items-center gap-1 text-[10px] text-zinc-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {activeMarathon.dailyPlan.typeTasks.work} work
                          </div>
                        )}
                        {activeMarathon.dailyPlan.typeTasks?.life && (
                          <div className="flex items-center gap-1 text-[10px] text-zinc-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {activeMarathon.dailyPlan.typeTasks.life} life
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Ошибки</span>
                      <span className={cn(
                        "text-xs font-black",
                        activeMarathon.failureCount > 0 ? "text-red-500" : "text-green-500"
                      )}>
                        {activeMarathon.failureCount} / {activeMarathon.isHardcore ? 1 : 2}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-zinc-500">Дни марафона</span>
                      <span className="text-white">{activeMarathon.completedDays.length} / {Math.ceil((parseISO(activeMarathon.endDate).getTime() - parseISO(activeMarathon.startDate).getTime()) / (1000 * 60 * 60 * 24))}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min(100, (activeMarathon.completedDays.length / Math.ceil((parseISO(activeMarathon.endDate).getTime() - parseISO(activeMarathon.startDate).getTime()) / (1000 * 60 * 60 * 24))) * 100)}%` 
                        }}
                        className="h-full"
                        style={{ backgroundColor: activeMarathon.color }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-bold uppercase">
                      <Clock size={10} />
                      До {format(parseISO(activeMarathon.endDate), 'd MMM', { locale: ru })}
                    </div>
                    <button 
                      onClick={() => endMarathon(activeMarathon.id, false)}
                      className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-red-400 transition-colors"
                    >
                      Сдаться
                    </button>
                  </div>
                </div>
              </div>
              <div 
                className="absolute top-0 right-0 -mr-8 -mt-8 rotate-12 opacity-5"
                style={{ color: activeMarathon.color }}
              >
                <Rocket size={120} />
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowMarathonModal(true)}
              className="w-full bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all active:scale-[0.98]"
            >
              <Target size={32} strokeWidth={1.5} />
              <span className="text-sm font-medium">Нет активного марафона</span>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">Нажми, чтобы бросить себе вызов</span>
            </button>
          )}
        </section>

        {/* History of Marathons */}
        {marathons.filter(m => m.status !== 'active').length > 0 && (
          <section className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">История марафонов</h2>
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors"
              >
                СМОТРЕТЬ ВСЕ
              </button>
            </div>
            <div className="space-y-2">
              {marathons.filter(m => m.status !== 'active').slice(0, 3).map(m => (
                <div key={m.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      m.status === 'completed' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {m.status === 'completed' ? <Trophy size={16} /> : <X size={16} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{m.title}</h4>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">{format(parseISO(m.startDate), 'd MMM', { locale: ru })} — {m.status === 'completed' ? 'Успех' : 'Провал'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-zinc-400">+{m.xpEarned} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Detailed Stats Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Распределение задач</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-4">
            {Object.entries(stats.tasksByTag).length > 0 ? (
              Object.entries(stats.tasksByTag).map(([tag, count]) => (
                <DetailRow 
                  key={tag}
                  icon={<Target size={16} className={cn(
                    tag === 'work' ? "text-blue-500" : 
                    tag === 'life' ? "text-green-500" : 
                    tag === 'study' ? "text-purple-500" :
                    tag === 'urgent' ? "text-red-500" :
                    "text-zinc-500"
                  )} />}
                  label={
                    tag === 'work' ? "Работа" : 
                    tag === 'life' ? "Личное" : 
                    tag === 'study' ? "Учеба" :
                    tag === 'urgent' ? "Срочно" :
                    "Другое"
                  }
                  value={count}
                />
              ))
            ) : (
              <p className="text-xs text-zinc-500 text-center py-2">Нет данных за этот период</p>
            )}
          </div>
        </section>

        {/* Achievements Preview (Placeholder) */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Достижения</h2>
            <span className="text-[10px] text-zinc-600">СКОРО</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-none w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center opacity-40 grayscale">
                <Trophy size={24} className="mb-2 text-zinc-500" />
                <div className="h-1.5 w-12 bg-zinc-800 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Completed Tasks Modal */}
      <AnimatePresence>
        {showMarathonModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMarathonModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 top-10 bg-zinc-900 border-t border-zinc-800 rounded-t-[32px] z-50 flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white">Новый марафон 🚀</h2>
                <button onClick={() => setShowMarathonModal(false)} className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
                {/* Basic Info */}
                <section className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Название и цвет</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Напр: Спринт по коду"
                        value={newMarathon.title}
                        onChange={e => setNewMarathon({...newMarathon, title: e.target.value})}
                        className="flex-1 bg-zinc-800 border-zinc-700 rounded-2xl px-4 py-3 text-white focus:ring-1 focus:ring-yellow-500/50 outline-none"
                      />
                      <input 
                        type="color" 
                        value={newMarathon.color}
                        onChange={e => setNewMarathon({...newMarathon, color: e.target.value})}
                        className="w-12 h-12 bg-zinc-800 border-zinc-700 rounded-2xl p-1 outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Глобальная цель</label>
                    <textarea 
                      placeholder="Какого результата хочешь достичь?"
                      value={newMarathon.goal}
                      onChange={e => setNewMarathon({...newMarathon, goal: e.target.value})}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-2xl px-4 py-3 text-white focus:ring-1 focus:ring-yellow-500/50 outline-none h-20 resize-none"
                    />
                  </div>
                </section>

                {/* Duration & Hardcore */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Длительность и режим</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Hardcore</span>
                      <button 
                        onClick={() => {
                          const isHardcore = !newMarathon.isHardcore;
                          const duration = isHardcore && newMarathon.duration < 3 ? 3 : newMarathon.duration;
                          setNewMarathon({...newMarathon, isHardcore, duration});
                        }}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors",
                          newMarathon.isHardcore ? "bg-red-500" : "bg-zinc-700"
                        )}
                      >
                        <motion.div 
                          animate={{ x: newMarathon.isHardcore ? 22 : 2 }}
                          className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                        />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between px-1">
                      <span className="text-xs font-bold text-white">{newMarathon.duration} дней</span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Макс 14</span>
                    </div>
                    <input 
                      type="range" 
                      min={newMarathon.isHardcore ? 3 : 2} 
                      max={14} 
                      value={newMarathon.duration}
                      onChange={e => setNewMarathon({...newMarathon, duration: Number(e.target.value)})}
                      className="w-full accent-yellow-500"
                    />
                    {newMarathon.isHardcore && (
                      <p className="text-[10px] text-red-400 font-bold uppercase italic">Хардкор режим: минимум 3 дня, 1 пропуск — провал!</p>
                    )}
                  </div>
                </section>

                {/* Daily Plan Minimum */}
                <section className="space-y-4">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Ежедневный план минимум</label>
                  
                  <div className="bg-zinc-800/50 rounded-2xl p-4 space-y-6">
                    {/* Task Counts */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">Задач Work</span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setNewMarathon({
                              ...newMarathon, 
                              dailyPlan: {
                                ...newMarathon.dailyPlan, 
                                typeTasks: { ...newMarathon.dailyPlan.typeTasks, work: Math.max(0, (newMarathon.dailyPlan.typeTasks.work || 0) - 1) }
                              }
                            })}
                            className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-white"
                          >-</button>
                          <span className="text-sm font-bold text-white">{newMarathon.dailyPlan.typeTasks.work || 0}</span>
                          <button 
                            onClick={() => setNewMarathon({
                              ...newMarathon, 
                              dailyPlan: {
                                ...newMarathon.dailyPlan, 
                                typeTasks: { ...newMarathon.dailyPlan.typeTasks, work: (newMarathon.dailyPlan.typeTasks.work || 0) + 1 }
                              }
                            })}
                            className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-white"
                          >+</button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">Задач Life</span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setNewMarathon({
                              ...newMarathon, 
                              dailyPlan: {
                                ...newMarathon.dailyPlan, 
                                typeTasks: { ...newMarathon.dailyPlan.typeTasks, life: Math.max(0, (newMarathon.dailyPlan.typeTasks.life || 0) - 1) }
                              }
                            })}
                            className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-white"
                          >-</button>
                          <span className="text-sm font-bold text-white">{newMarathon.dailyPlan.typeTasks.life || 0}</span>
                          <button 
                            onClick={() => setNewMarathon({
                              ...newMarathon, 
                              dailyPlan: {
                                ...newMarathon.dailyPlan, 
                                typeTasks: { ...newMarathon.dailyPlan.typeTasks, life: (newMarathon.dailyPlan.typeTasks.life || 0) + 1 }
                              }
                            })}
                            className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-white"
                          >+</button>
                        </div>
                      </div>
                    </div>

                    {/* Specific Tasks */}
                    <div className="space-y-3">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">Конкретные задачи</span>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Напр: 10 звонков"
                          value={tempSpecificTask}
                          onChange={e => setTempSpecificTask(e.target.value)}
                          className="flex-1 bg-zinc-900 border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                        <button 
                          onClick={() => {
                            if (!tempSpecificTask.trim()) return;
                            setNewMarathon({
                              ...newMarathon,
                              dailyPlan: {
                                ...newMarathon.dailyPlan,
                                specificTasks: [...newMarathon.dailyPlan.specificTasks, tempSpecificTask.trim()]
                              }
                            });
                            setTempSpecificTask('');
                          }}
                          className="bg-zinc-700 px-3 rounded-xl text-xs font-bold"
                        >Добавить</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {newMarathon.dailyPlan.specificTasks.map(t => (
                          <div key={t} className="bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-lg flex items-center gap-2">
                            <span className="text-[10px] text-zinc-300">{t}</span>
                            <button onClick={() => setNewMarathon({
                              ...newMarathon,
                              dailyPlan: {
                                ...newMarathon.dailyPlan,
                                specificTasks: newMarathon.dailyPlan.specificTasks.filter(item => item !== t)
                              }
                            })}><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Habits */}
                    <div className="space-y-3">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">Привычки</span>
                      <div className="grid grid-cols-2 gap-2">
                        {habits.map(h => (
                          <button
                            key={h.id}
                            onClick={() => {
                              const isSelected = newMarathon.dailyPlan.habits.includes(h.id);
                              setNewMarathon({
                                ...newMarathon,
                                dailyPlan: {
                                  ...newMarathon.dailyPlan,
                                  habits: isSelected 
                                    ? newMarathon.dailyPlan.habits.filter(id => id !== h.id)
                                    : [...newMarathon.dailyPlan.habits, h.id]
                                }
                              });
                            }}
                            className={cn(
                              "text-left p-2 rounded-xl border transition-all flex items-center gap-2",
                              newMarathon.dailyPlan.habits.includes(h.id) 
                                ? "bg-yellow-500/10 border-yellow-500/50" 
                                : "bg-zinc-900 border-zinc-800"
                            )}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                            <span className="text-[10px] font-medium text-zinc-300 truncate">{h.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Multiplier Info */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex gap-3">
                  <Zap size={20} className="text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white mb-1">Буст опыта: x{calculateMultiplier(newMarathon.duration, newMarathon.isHardcore)}</p>
                    <p className="text-[10px] text-zinc-400">
                      Весь получаемый опыт будет умножен. Чем дольше марафон, тем выше множитель!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-900 border-t border-zinc-800">
                <button 
                  onClick={handleStartMarathon}
                  className="w-full py-4 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-transform shadow-lg shadow-yellow-500/10"
                >
                  Запустить марафон
                </button>
              </div>
            </motion.div>
          </>
        )}

        {showTasksModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTasksModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 top-20 bg-zinc-900 border-t border-zinc-800 rounded-t-[32px] z-50 flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-zinc-800">
                <div>
                  <h2 className="text-xl font-bold text-white">Выполненные задачи</h2>
                  <p className="text-sm text-zinc-500">{stats.completedTasksCount} задач за все время</p>
                </div>
                <button 
                  onClick={() => setShowTasksModal(false)}
                  className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {stats.allCompletedTasks.length > 0 ? (
                  stats.allCompletedTasks.map((task, index) => {
                    const taskDate = parseISO(task.date);
                    const isNewDay = index === 0 || task.date !== stats.allCompletedTasks[index - 1].date;

                    return (
                      <React.Fragment key={task.id}>
                        {isNewDay && (
                          <div className="pt-4 pb-2 px-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              {format(taskDate, 'd MMMM yyyy', { locale: ru })}
                            </span>
                          </div>
                        )}
                        <div className="bg-zinc-800/50 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                            <CheckCircle2 size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-zinc-200 text-sm leading-tight line-through opacity-60">
                              {task.content || 'Без названия'}
                            </p>
                            {task.tag && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mt-1 inline-block">
                                    #{task.tag}
                                </span>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <CheckCircle2 size={48} className="text-zinc-800 mb-4" />
                    <p className="text-zinc-500 italic">Пока нет выполненных задач.<br/>Пора что-нибудь сделать!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {showHistoryModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 top-20 bg-zinc-900 border-t border-zinc-800 rounded-t-[32px] z-50 flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white">Все марафоны 🏆</h2>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {marathons.filter(m => m.status !== 'active').sort((a, b) => b.startDate.localeCompare(a.startDate)).map(m => (
                  <div key={m.id} className="bg-zinc-800/50 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        m.status === 'completed' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {m.status === 'completed' ? <Trophy size={24} /> : <AlertTriangle size={24} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{m.title}</h3>
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-0.5">
                          {format(parseISO(m.startDate), 'd MMM', { locale: ru })} — {format(parseISO(m.endDate), 'd MMM', { locale: ru })}
                        </p>
                        <div className="flex gap-1.5 mt-2">
                          {m.isHardcore && <span className="text-[8px] font-black bg-red-500/20 text-red-500 px-1 rounded uppercase tracking-tighter">Hardcore</span>}
                          <span className="text-[8px] font-black bg-white/5 text-zinc-400 px-1 rounded uppercase tracking-tighter">x{m.multiplier} XP</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-white">+{m.xpEarned} XP</div>
                      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                        {m.completedDays.length} дн.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3 text-zinc-400">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}
