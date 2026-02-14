import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, CheckCircle2, Plus, ChevronLeft, ChevronRight, Settings2, X, Target, Trash, RotateCcw, Sparkles, Leaf, BarChart2 } from 'lucide-react';
import { useStore, type Difficulty } from '../store/useStore';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';

import { useNavigate } from 'react-router-dom';

export default function HabitsPage() {
  const navigate = useNavigate();
  const { habits, toggleHabit, updateHabitStreak, addHabit, decrementHabitCount, deleteHabit, settings } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDifficulty, setNewHabitDifficulty] = useState<Difficulty>('medium');
  
  // Обновляем стрики при загрузке
  useEffect(() => {
    habits.forEach(h => updateHabitStreak(h.id));
  }, []);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      addHabit({
        name: newHabitName.trim(),
        frequency: 'daily',
        color: '#10b981', // Emerald-500
        icon: 'Sparkles',
        difficulty: newHabitDifficulty
      });
      setNewHabitName('');
      setNewHabitDifficulty('medium');
      setShowAddModal(false);
      setIsEditMode(false);
    }
  };

  return (
    <div className="min-h-full bg-black text-white p-4 pb-24">
      <header className="pt-12 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/profile')}
              className="p-2 bg-zinc-900 rounded-xl text-zinc-400 active:scale-95 transition-all hover:bg-emerald-500/10 hover:text-emerald-500"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
              РИТУАЛЫ <Sparkles className="text-emerald-500 fill-emerald-500" size={24} />
            </h1>
          </div>
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg",
              isEditMode 
                ? "bg-red-500 text-white shadow-red-500/20" 
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            )}
          >
            {isEditMode ? 'Готово' : 'Править'}
          </button>
        </div>

        {/* Календарная лента */}
        <div className="flex items-center justify-between bg-zinc-900/30 backdrop-blur-md p-2 rounded-2xl border border-zinc-800/50">
          <button 
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 text-zinc-500 hover:text-emerald-500 active:scale-90 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60 mb-0.5">
              {isToday(selectedDate) ? 'Сегодня' : format(selectedDate, 'EEEE', { locale: ru })}
            </span>
            <span className="text-sm font-black uppercase tracking-tight">
              {format(selectedDate, 'd MMMM', { locale: ru })}
            </span>
          </div>

          <button 
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 text-zinc-500 hover:text-emerald-500 active:scale-90 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Список привычек */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600 border-2 border-dashed border-zinc-900 rounded-[3rem] bg-zinc-900/10">
            <Sparkles size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-bold uppercase tracking-widest mb-6 opacity-40">Нет активных ритуалов</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-8 py-4 bg-emerald-500 text-black font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
            >
              Начать рост
            </button>
          </div>
        ) : (
          <>
            {habits.map((habit) => {
              const count = habit.completions?.[dateKey] || 0;
              const isCompleted = count > 0;
              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "w-full flex items-center gap-4 p-5 rounded-[2.5rem] border transition-all duration-500",
                    isCompleted 
                      ? "bg-emerald-500 border-emerald-400 text-black shadow-[0_15px_35px_rgba(16,185,129,0.25)]" 
                      : "bg-zinc-900/40 border-zinc-800/50 text-white hover:border-emerald-500/30"
                  )}
                >
                  <div 
                    onClick={() => toggleHabit(habit.id, dateKey)}
                    className={cn(
                      "w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-300 cursor-pointer",
                      isCompleted ? "bg-black/10 scale-95" : "bg-zinc-800 shadow-inner"
                    )}
                  >
                    <Sparkles 
                      size={28} 
                      fill={isCompleted ? "black" : "none"} 
                      className={cn(
                        "transition-transform duration-500",
                        isCompleted ? "text-black scale-110" : "text-emerald-500",
                        !isCompleted && "group-hover:rotate-12"
                      )} 
                    />
                  </div>

                  <div className="flex-1 text-left" onClick={() => toggleHabit(habit.id, dateKey)}>
                    <h3 className="font-black text-xl leading-tight uppercase tracking-tight">{habit.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 bg-black/5 px-2 py-0.5 rounded-full">
                        <Flame size={14} className={isCompleted ? "text-black/60" : "text-orange-500"} />
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          isCompleted ? "text-black/60" : "text-zinc-500"
                        )}>
                          {habit.streak} ДНЕЙ
                        </span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full border",
                        isCompleted ? "bg-black/10 border-black/10 text-black" : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      )}>
                        <BarChart2 size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest">
                          {habit.difficulty === 'high' ? 'Высокая' : habit.difficulty === 'low' ? 'Низкая' : 'Средняя'}
                        </span>
                      </div>
                      {count > 0 && (
                        <div className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                          isCompleted ? "bg-black/10 border-black/10 text-black" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        )}>
                          ×{count}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {isCompleted && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          decrementHabitCount(habit.id, dateKey);
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-black/20 bg-black/10 text-black active:scale-90 transition-all hover:bg-black/20"
                        title="Отменить последнее выполнение"
                      >
                        <RotateCcw size={18} strokeWidth={2.5} />
                      </button>
                    )}
                    
                    {!isCompleted && (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-zinc-800 text-transparent opacity-20">
                        <CheckCircle2 size={24} />
                      </div>
                    )}
                    
                    {isEditMode && (
                      <motion.button 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Удалить этот ритуал навсегда?')) {
                            deleteHabit(habit.id);
                          }
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/20"
                      >
                        <Trash size={18} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Кнопка "+" под последним ритуалом */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="w-full py-8 bg-zinc-900/20 border-2 border-dashed border-zinc-800/50 rounded-[2.5rem] flex flex-col items-center justify-center text-zinc-600 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:border-emerald-500/30 group-hover:scale-110 transition-all">
                <Plus size={32} className="text-zinc-500 group-hover:text-emerald-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Новый ритуал</span>
            </motion.button>
          </>
        )}
      </div>

      {/* Модальное окно добавления */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 rounded-t-[3rem] p-10 z-[70] pb-16"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-[0_10px_20px_rgba(16,185,129,0.3)]">
                    <Target size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Новый Ритуал</h2>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Путь к совершенству</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-3 block ml-1">Что будем внедрять?</label>
                  <input
                    autoFocus
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                    placeholder="Например: Медитация 10 мин"
                    className="w-full bg-black border-2 border-zinc-800 rounded-[1.5rem] px-8 py-5 text-white font-bold text-lg focus:outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-700"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-3 block ml-1">Сложность ритуала</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setNewHabitDifficulty(d)}
                        className={cn(
                          "flex-1 py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest",
                          newHabitDifficulty === d
                            ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_10px_25px_rgba(16,185,129,0.3)]"
                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        )}
                      >
                        {d === 'low' ? 'Низкая' : d === 'medium' ? 'Средняя' : 'Высокая'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter text-center mt-2">
                    {(() => {
                      const rewards = settings.xpSettings?.habits || { low: 10, medium: 15, high: 25 };
                      const currentReward = rewards[newHabitDifficulty];
                      return `${newHabitDifficulty === 'high' ? 'Высокая' : newHabitDifficulty === 'low' ? 'Низкая' : 'Средняя'} сложность дает ${currentReward} XP`;
                    })()}
                  </p>
                </div>

                <button
                  onClick={handleAddHabit}
                  disabled={!newHabitName.trim()}
                  className="w-full bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black py-6 rounded-[1.5rem] uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(16,185,129,0.25)] active:scale-[0.98] transition-all text-sm"
                >
                  Создать Ритуал
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
