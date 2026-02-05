import { useState, useMemo } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, eachMonthOfInterval, isBefore, isToday, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import { useStore, type DayStatus } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { StrikeThrough, Cross } from '@/components/HandDrawn';
import { motion, AnimatePresence } from 'framer-motion';

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0
  })
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'year'>('month');
  const [direction, setDirection] = useState(0);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingMonthNote, setEditingMonthNote] = useState(false);
  
  // Store
  const { days, setDayStatus, setDayNote, monthNotes, setMonthNote } = useStore();

  // Navigation
  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentDate(d => view === 'month' ? addMonths(d, newDirection) : addMonths(d, newDirection * 12));
  };

  // Stats
  const stats = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start, end });
    const validDays = monthDays.filter(d => isBefore(d, new Date()) || isToday(d));
    
    if (validDays.length === 0) return { good: 0, bad: 0, neutral: 0 };

    let good = 0, bad = 0, neutral = 0;
    validDays.forEach(d => {
      const dateKey = format(d, 'yyyy-MM-dd');
      const status = days[dateKey]?.status || 'neutral';
      if (status === 'good') good++;
      else if (status === 'bad') bad++;
      else neutral++;
    });

    const total = validDays.length;
    return {
      good: Math.round((good / total) * 100),
      bad: Math.round((bad / total) * 100),
      neutral: Math.round((neutral / total) * 100),
    };
  }, [currentDate, days]);

  // Handlers
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dateKey = format(date, 'yyyy-MM-dd');
    setNoteContent(days[dateKey]?.note || '');
    setIsNoteOpen(true);
  };

  const cycleStatus = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    const dateKey = format(date, 'yyyy-MM-dd');
    const currentStatus = days[dateKey]?.status || 'neutral';
    const nextStatus: DayStatus = currentStatus === 'neutral' ? 'good' : currentStatus === 'good' ? 'bad' : 'neutral';
    setDayStatus(dateKey, nextStatus);
  };

  const saveNote = () => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      setDayNote(dateKey, noteContent);
      setIsNoteOpen(false);
    }
  };

  // Render Month View
  const renderMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start, end });
    const startDay = start.getDay();
    const padding = (startDay + 6) % 7; 
    const blanks = Array(padding).fill(null);
    const ruWeekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
      <div className="flex flex-col h-full">
        {/* Stats Header */}
        <div className="mx-4 mt-2 p-4 bg-card/50 backdrop-blur-md rounded-2xl border border-white/5 flex items-center justify-between shadow-lg">
          <div className="flex flex-col items-center">
            <span className="text-xs text-zinc-500 font-medium mb-1">Успех</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-lg font-bold text-white">{stats.good}%</span>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-zinc-500 font-medium mb-1">Провал</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-lg font-bold text-white">{stats.bad}%</span>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-zinc-500 font-medium mb-1">Нейтрально</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-zinc-600" />
              <span className="text-lg font-bold text-white">{stats.neutral}%</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 px-4 pt-6">
          <div className="grid grid-cols-7 mb-4">
            {ruWeekDays.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {blanks.map((_, i) => <div key={`blank-${i}`} />)}
            {daysInMonth.map(date => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const dayData = days[dateKey];
              const status = dayData?.status || 'neutral';
              const isPast = isBefore(date, new Date()) && !isToday(date);
              const isTodayDate = isToday(date);
              const hasNote = !!dayData?.note;
              
              return (
                <motion.button 
                  key={dateKey} 
                  onClick={() => handleDayClick(date)}
                  whileTap={{ scale: 0.9 }}
                  className="relative flex flex-col items-center justify-start group"
                >
                  <div 
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden",
                      status === 'neutral' && isTodayDate && "bg-white/10 text-white ring-1 ring-white/20",
                      status === 'neutral' && !isTodayDate && "text-zinc-400 hover:bg-white/5",
                      status === 'good' && "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]",
                      status === 'bad' && "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_4px_12px_rgba(244,63,94,0.3)]",
                    )}
                    onClick={(e) => cycleStatus(date, e)}
                  >
                    <span className="relative z-10">{format(date, 'd')}</span>
                    {isPast && (
                      <div className="absolute inset-0 pointer-events-none z-20">
                         <StrikeThrough className="w-full h-full text-white/90 drop-shadow-md" />
                      </div>
                    )}
                  </div>
                  {hasNote && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }}
                      className="w-1 h-1 bg-white/50 rounded-full mt-1.5" 
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Month Note Button */}
        <div className="p-6">
             <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    setNoteContent(monthNotes[format(currentDate, 'yyyy-MM')] || '');
                    setEditingMonthNote(true);
                }}
                className="w-full py-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-sm font-medium flex items-center justify-center gap-2 text-zinc-300 hover:bg-zinc-800 transition-colors shadow-lg"
             >
                <FileText className="w-4 h-4 text-zinc-500" />
                Итог месяца
             </motion.button>
        </div>
      </div>
    );
  };

  const renderYear = () => {
    const months = eachMonthOfInterval({
        start: startOfYear(currentDate),
        end: endOfMonth(addMonths(startOfYear(currentDate), 11))
    });

    const ruMonths = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

    return (
        <div className="grid grid-cols-3 gap-4 p-4 mt-4">
            {months.map((month, idx) => {
                const isPastMonth = isBefore(endOfMonth(month), new Date());
                const isCurrentMonth = isSameDay(startOfMonth(month), startOfMonth(new Date()));
                
                return (
                    <motion.button
                        key={idx}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setCurrentDate(month);
                            setView('month');
                        }}
                        className={cn(
                            "relative h-24 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all",
                            isCurrentMonth ? "bg-white/10 border-white/20 text-white" : "bg-card border-white/5 text-zinc-400 hover:border-white/10"
                        )}
                    >
                        <span className="text-lg font-medium">{ruMonths[idx]}</span>
                        {isPastMonth && (
                             <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-80">
                                <Cross className="w-full h-full text-red-500/80" />
                            </div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background pt-safe-top">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent cursor-pointer" onClick={() => setView(view === 'month' ? 'year' : 'month')}>
          {view === 'month' ? (
              <span className="flex items-center gap-2">
                  {format(currentDate, 'LLLL yyyy')}
                  <ChevronRight className="w-4 h-4 text-zinc-600 rotate-90" />
              </span>
          ) : format(currentDate, 'yyyy')}
        </h1>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => paginate(-1)} className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800">
            <ChevronLeft size={20} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => paginate(1)} className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800">
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
                key={currentDate.toString() + view}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                }}
                className="absolute inset-0 w-full h-full"
            >
                {view === 'month' ? renderMonth() : renderYear()}
            </motion.div>
        </AnimatePresence>
      </div>

      {/* Note Sheet (Bottom Sheet Simulation) */}
      <AnimatePresence>
        {(isNoteOpen || editingMonthNote) && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    onClick={() => { setIsNoteOpen(false); setEditingMonthNote(false); }}
                />
                <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl border-t border-white/10 z-50 p-6 pb-safe"
                    style={{ maxHeight: '80vh' }}
                >
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6" />
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">
                            {editingMonthNote ? `Итоги: ${format(currentDate, 'LLLL')}` : selectedDate && format(selectedDate, 'd MMMM')}
                        </h3>
                        <button onClick={() => { setIsNoteOpen(false); setEditingMonthNote(false); }} className="p-2 bg-zinc-800 rounded-full text-zinc-400">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <textarea 
                        className="w-full h-40 bg-zinc-950/50 rounded-xl border border-white/5 p-4 text-base resize-none focus:outline-none focus:ring-1 focus:ring-white/20 mb-6"
                        placeholder="Напишите заметку..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        autoFocus
                    />
                    
                    <button 
                        onClick={() => {
                            if (editingMonthNote) {
                                setMonthNote(format(currentDate, 'yyyy-MM'), noteContent);
                                setEditingMonthNote(false);
                            } else {
                                saveNote();
                            }
                        }}
                        className="w-full py-4 bg-white text-black rounded-xl font-semibold text-lg active:scale-95 transition-transform"
                    >
                        Сохранить
                    </button>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}
