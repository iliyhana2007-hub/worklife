import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, eachMonthOfInterval, isBefore, isToday, getDay, isSameMonth, isAfter, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileText, Check, Maximize2, Minimize2 } from 'lucide-react';
import { useStore, type DayStatus } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { RowStrikeThrough, BigMonthCross } from '@/components/HandDrawn';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// --- Stats Component ---
const StatsWidget = ({ 
  stats, 
  mode, 
  onToggle 
}: { 
  stats: { good: number; bad: number; neutral: number; total: number }; 
  mode: 'count' | 'percent'; 
  onToggle: () => void;
}) => {
  const display = (value: number) => {
    if (mode === 'count') return value;
    return stats.total > 0 ? Math.round((value / stats.total) * 100) + '%' : '0%';
  };

  return (
    <button 
      onClick={onToggle}
      className="flex items-center justify-center gap-4 py-2 w-full active:opacity-70 transition-opacity"
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white" />
        <span className="text-white font-medium text-base">{display(stats.good)}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-red-500 font-medium text-base">{display(stats.bad)}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full border border-zinc-700" />
        <span className="text-zinc-500 font-medium text-base">{display(stats.neutral)}</span>
      </div>
    </button>
  );
};

// --- Mini Month Component (for Year View) ---
const MiniMonth = ({ 
  month, 
  daysData, 
  onSelect 
}: { 
  month: Date; 
  daysData: Record<string, DayStatus>; 
  onSelect: () => void;
}) => {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const startDay = getDay(start);
  const padding = (startDay + 6) % 7; 
  const blanks = Array(padding).fill(null);

  const isFullyPast = isBefore(endOfMonth(month), new Date());

  return (
    <div onClick={onSelect} className="flex flex-col gap-1 cursor-pointer relative">
      {isFullyPast && (
        <BigMonthCross className="absolute inset-0 w-full h-full text-red-600/40 pointer-events-none z-20" />
      )}
      <div className="text-red-500 font-semibold text-[13px] capitalize mb-1">
        {format(month, 'LLLL', { locale: ru })}
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {blanks.map((_, i) => <div key={i} />)}
        {days.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const isFuture = isAfter(startOfDay(date), startOfDay(new Date()));
            const status = isFuture ? undefined : daysData[dateKey];
            const isCurrent = isToday(date);
            
            return (
                <div 
                    key={dateKey} 
                    className={cn(
                        "aspect-square rounded-full flex items-center justify-center text-[5px] font-medium",
                        status === 'good' && "bg-white text-black",
                        status === 'bad' && "bg-red-500 text-white",
                        status === 'neutral' && isCurrent && "bg-red-500 text-white"
                    )}
                >
                    {format(date, 'd')}
                </div>
            );
        })}
      </div>
    </div>
  );
};

// --- Month View Component ---
const MonthView = ({
  monthDate,
  days,
  onDayClick,
  onCycleStatus,
  openMonthNote
}: {
  monthDate: Date;
  days: Record<string, { status: DayStatus; note?: string }>;
  onDayClick: (date: Date) => void;
  onCycleStatus: (date: Date, e: React.MouseEvent) => void;
  openMonthNote: (date: Date) => void;
}) => {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const daysInMonth = eachDayOfInterval({ start, end });
  const startDay = getDay(start);
  const padding = (startDay + 6) % 7; 
  const blanks = Array(padding).fill(null);

  // Group days into weeks for row-based strikethrough
  const allCells = [...blanks, ...daysInMonth];
  const weeks = [];
  for (let i = 0; i < allCells.length; i += 7) {
      weeks.push(allCells.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col mb-8" data-month={format(monthDate, 'yyyy-MM')}>
      {/* Month Name Header (Sticky) - iOS Style Large Title */}
      <div className="px-4 py-2 sticky top-0 bg-black/95 backdrop-blur-sm z-30">
        <span className="text-white font-bold text-3xl capitalize">
          {format(monthDate, 'LLLL', { locale: ru })}
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 mt-1">
        {weeks.map((week, weekIndex) => {
            // Check if week is fully in past or partially
            let firstPastIdx = -1;
            let lastPastIdx = -1;

            week.forEach((date, idx) => {
                if (date && isBefore(date, new Date()) && !isToday(date)) {
                    if (firstPastIdx === -1) firstPastIdx = idx;
                    lastPastIdx = idx;
                }
            });
            
            const showLine = firstPastIdx !== -1;
            
            return (
                <div key={weekIndex} className="grid grid-cols-7 auto-rows-[42px] relative">
                    {/* Row Strikethrough Overlay */}
                    {showLine && (
                        <div 
                          className="absolute inset-y-0 pointer-events-none z-20"
                          style={{
                              left: `${(firstPastIdx * 100) / 7}%`,
                              width: `${((lastPastIdx - firstPastIdx + 1) * 100) / 7}%`
                          }}
                        >
                            <RowStrikeThrough 
                              variant={weekIndex + monthDate.getMonth()} 
                              className="w-full h-full text-red-600/90" 
                            />
                        </div>
                    )}

                    {week.map((date, dayIdx) => {
                        if (!date) return <div key={`blank-${weekIndex}-${dayIdx}`} />;
                        
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const dayData = days[dateKey];
                        const isFuture = isAfter(startOfDay(date), startOfDay(new Date()));
                        const status = isFuture ? 'neutral' : (dayData?.status || 'neutral');
                        const isTodayDate = isToday(date);
                        const hasNote = !!dayData?.note;
                        
                        return (
                          <div 
                            key={dateKey} 
                            className="relative flex flex-col items-center justify-center"
                          >
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => onCycleStatus(date, e)}
                              className={cn(
                                "w-8 h-8 flex items-center justify-center rounded-full text-[17px] font-normal transition-all duration-200 relative z-10",
                                status === 'neutral' && isTodayDate && "border border-white text-white font-semibold", 
                                status === 'neutral' && !isTodayDate && "text-white",
                                status === 'good' && "bg-white text-black font-semibold", 
                                status === 'bad' && "bg-red-500 text-white font-semibold", 
                              )}
                            >
                              {format(date, 'd')}
                            </motion.button>

                            {hasNote && (
                              <div className="absolute bottom-1 w-1 h-1 bg-zinc-500 rounded-full" />
                            )}
                            
                            {/* Invisible hit area for note opening */}
                            <div 
                              className="absolute inset-0 z-0" 
                              onClick={() => onDayClick(date)}
                            />
                          </div>
                        );
                    })}
                </div>
            );
        })}
      </div>

      {/* Month Footer */}
      <div className="px-4 pt-4">
          <button 
              onClick={() => openMonthNote(monthDate)}
              className="w-full py-3 text-red-500 font-medium text-base bg-zinc-900 rounded-xl"
          >
              Что сделал?
          </button>
      </div>
    </div>
  );
};

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0
  })
};

const InfiniteMonthScroll = ({
  initialDate,
  onVisibleDateChange,
  days,
  onDayClick,
  onCycleStatus,
  openMonthNote
}: {
  initialDate: Date;
  onVisibleDateChange: (date: Date) => void;
  days: Record<string, { status: DayStatus; note?: string }>;
  onDayClick: (date: Date) => void;
  onCycleStatus: (date: Date, e: React.MouseEvent) => void;
  openMonthNote: (date: Date) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Maintain a list of months. Start with [prev, current, next]
  const [months, setMonths] = useState<Date[]>(() => [
    subMonths(initialDate, 1),
    initialDate,
    addMonths(initialDate, 1)
  ]);
  
  // To restore scroll position when adding to top
  const previousScrollHeightRef = useRef<number>(0);
  const isPrependingRef = useRef(false);

  // Initialize intersection observer to update current visible month
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      // Find the entry that is most visible
      let maxRatio = 0;
      let mostVisibleDate: Date | null = null;

      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          const dateStr = entry.target.getAttribute('data-month');
          if (dateStr) {
            mostVisibleDate = new Date(dateStr + '-01');
          }
        }
      });

      if (mostVisibleDate) {
        onVisibleDateChange(mostVisibleDate);
      }
    }, {
      root: container,
      threshold: [0.1, 0.5, 0.9] // Check at multiple thresholds
    });

    const monthElements = container.querySelectorAll('[data-month]');
    monthElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [months, onVisibleDateChange]);

  // Handle scroll for infinite loading
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // Load Previous
    if (scrollTop < 100) {
      isPrependingRef.current = true;
      previousScrollHeightRef.current = scrollHeight;
      setMonths(prev => {
        const first = prev[0];
        return [subMonths(first, 1), ...prev];
      });
    }

    // Load Next
    if (scrollTop + clientHeight > scrollHeight - 100) {
      setMonths(prev => {
        const last = prev[prev.length - 1];
        return [...prev, addMonths(last, 1)];
      });
    }
  };

  // Restore scroll position after prepending
  useLayoutEffect(() => {
    if (isPrependingRef.current && containerRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const diff = newScrollHeight - previousScrollHeightRef.current;
      containerRef.current.scrollTop += diff;
      isPrependingRef.current = false;
    }
  }, [months]);

  // Initial scroll to center month (currentDate)
  useEffect(() => {
    if (containerRef.current) {
      // Find the element for initialDate
      const dateStr = format(initialDate, 'yyyy-MM');
      const el = containerRef.current.querySelector(`[data-month="${dateStr}"]`);
      if (el) {
        el.scrollIntoView({ block: 'start' });
      }
    }
  }, []); // Run only once on mount

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto no-scrollbar relative h-full"
    >
      {months.map(month => (
        <MonthView
          key={month.toISOString()}
          monthDate={month}
          days={days}
          onDayClick={onDayClick}
          onCycleStatus={onCycleStatus}
          openMonthNote={openMonthNote}
        />
      ))}
    </div>
  );
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'year'>('month');
  const [direction, setDirection] = useState(0);
  const [statsModes, setStatsModes] = useState<{ month: 'count' | 'percent'; year: 'count' | 'percent' }>({
    month: 'count',
    year: 'count'
  });
  const [showMiniNotes, setShowMiniNotes] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingMonthNote, setEditingMonthNote] = useState(false);
  const [monthNoteTarget, setMonthNoteTarget] = useState<Date | null>(null); // Which month we are editing note for
  const [expandedYearNotes, setExpandedYearNotes] = useState<Record<string, boolean>>({});
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const controls = useAnimation();
  
  useEffect(() => {
    if (isNoteOpen || editingMonthNote) {
        controls.set({ y: "calc(100% - 350px)" });
    }
  }, [isNoteOpen, editingMonthNote, controls]);
  
  // Store
  const { days, setDayStatus, setDayNote, monthNotes, setMonthNote } = useStore();

  // Navigation
  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentDate(d => view === 'month' ? addMonths(d, newDirection) : addMonths(d, newDirection * 12));
  };

  // Helper to calculate stats
  const calculateStats = (start: Date, end: Date) => {
    const periodDays = eachDayOfInterval({ start, end });
    const validDays = periodDays.filter(d => isBefore(d, new Date()) || isToday(d));
    
    let good = 0, bad = 0, neutral = 0;
    validDays.forEach(d => {
      const dateKey = format(d, 'yyyy-MM-dd');
      const status = days[dateKey]?.status || 'neutral';
      if (status === 'good') good++;
      else if (status === 'bad') bad++;
      else neutral++;
    });

    return { good, bad, neutral, total: validDays.length };
  };

  // Stats for current view
  const currentStats = useMemo(() => {
    if (view === 'month') {
        return calculateStats(startOfMonth(currentDate), endOfMonth(currentDate));
    } else {
        return calculateStats(startOfYear(currentDate), endOfMonth(addMonths(startOfYear(currentDate), 11)));
    }
  }, [currentDate, days, view]);

  // Handlers
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dateKey = format(date, 'yyyy-MM-dd');
    setNoteContent(days[dateKey]?.note || '');
    setIsNoteOpen(true);
  };

  const cycleStatus = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent changing status for future days
    if (isAfter(startOfDay(date), startOfDay(new Date()))) return;

    const dateKey = format(date, 'yyyy-MM-dd');
    const currentStatus = days[dateKey]?.status || 'neutral';
    const nextStatus: DayStatus = currentStatus === 'neutral' ? 'good' : currentStatus === 'good' ? 'bad' : 'neutral';
    setDayStatus(dateKey, nextStatus);
  };

  const openMonthNote = (monthDate: Date) => {
      setMonthNoteTarget(monthDate);
      setNoteContent(monthNotes[format(monthDate, 'yyyy-MM')] || '');
      setEditingMonthNote(true);
  };

  // Render Month View
  const renderMonth = () => {
    // Initial load state logic is handled by InfiniteMonthScroll component below
    return (
      <InfiniteMonthScroll
        initialDate={currentDate}
        onVisibleDateChange={setCurrentDate}
        days={days}
        onDayClick={handleDayClick}
        onCycleStatus={cycleStatus}
        openMonthNote={openMonthNote}
      />
    );
  };

  // Render Year View
  const renderYear = () => {
    const months = eachMonthOfInterval({
        start: startOfYear(currentDate),
        end: endOfMonth(addMonths(startOfYear(currentDate), 11))
    });

    return (
        <div className="flex flex-col h-full overflow-y-auto pb-20 no-scrollbar">
            <div className="grid grid-cols-3 gap-x-4 gap-y-8 p-4">
                {months.map((month, idx) => {
                    // Extract simplified status for this month for rendering dots
                    const mStart = startOfMonth(month);
                    const mEnd = endOfMonth(month);
                    const mDays = eachDayOfInterval({ start: mStart, end: mEnd });
                    const mDaysData: Record<string, DayStatus> = {};
                    mDays.forEach(d => {
                        const k = format(d, 'yyyy-MM-dd');
                        if (days[k]?.status) mDaysData[k] = days[k].status;
                    });

                    const isPastOrCurrent = isBefore(mStart, new Date()) || isSameMonth(mStart, new Date());
                    const monthKey = format(month, 'yyyy-MM');
                    const isExpanded = expandedYearNotes[monthKey];

                    return (
                        <div key={idx} className="flex flex-col gap-2">
                             <MiniMonth 
                                month={month} 
                                daysData={mDaysData}
                                onSelect={() => {
                                    setCurrentDate(month);
                                    setView('month');
                                }}
                             />
                             {/* Month Summary Button for Year View */}
                             {isPastOrCurrent && (
                                 <div className="mt-1">
                                     {showMiniNotes ? (
                                         <div 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setExpandedYearNotes(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
                                            }}
                                            className={cn(
                                                "w-full py-1 px-2 bg-zinc-900/50 rounded-lg cursor-pointer transition-all duration-200",
                                                isExpanded && "bg-zinc-900 ring-1 ring-white/10"
                                            )}
                                         >
                                             <p className={cn(
                                                 "text-[9px] leading-tight transition-colors duration-200",
                                                 isExpanded ? "text-zinc-200 whitespace-pre-wrap" : "text-zinc-500 line-clamp-2"
                                             )}>
                                                 {monthNotes[monthKey] || "..."}
                                             </p>
                                         </div>
                                     ) : (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); openMonthNote(month); }}
                                            className="w-full py-1 text-red-500/80 text-[10px] font-medium bg-zinc-900/50 rounded-lg"
                                        >
                                            Итог
                                        </button>
                                     )}
                                 </div>
                             )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* iOS Header */}
      <div className="flex items-center px-4 pb-2 pt-safe min-h-[50px]">
        {/* Left Side - Empty for "Close" button space */}
        <div className="flex-1 flex justify-start min-w-0">
        </div>

        {/* Center Side */}
        <div className="flex-none flex justify-center">
            {view === 'month' && (
                 <button 
                    onClick={() => setView('year')}
                    className="flex items-center text-red-500 gap-1 active:opacity-60 transition-opacity"
                >
                    <ChevronLeft size={20} strokeWidth={2.5} />
                    <span className="text-lg font-medium tracking-tight">{format(currentDate, 'yyyy')}</span>
                </button>
            )}
            {view === 'year' && (
                 <button 
                     onClick={() => setView('month')}
                     className="flex flex-col items-center"
                 >
                     <span className="text-red-500 text-xs font-medium mb-0.5">
                         {format(currentDate, 'yyyy')}
                     </span>
                     <span className="text-3xl font-bold tracking-tight capitalize">
                         {format(currentDate, 'yyyy')}
                     </span>
                 </button>
            )}
        </div>

        {/* Right Side */}
        <div className="flex-1 flex justify-end items-center gap-4 min-w-0">
            {/* Toggle Mini Notes (Only for Year View) */}
            {view === 'year' && (
                <button 
                    onClick={() => setShowMiniNotes(!showMiniNotes)}
                    className={cn(
                        "p-1.5 rounded-full transition-colors",
                        showMiniNotes ? "bg-red-500/20 text-red-500" : "text-zinc-500"
                    )}
                >
                    <FileText size={18} strokeWidth={2.5} />
                </button>
            )}

            {/* Pagination controls removed for Month View as we have infinite scroll */}
            {view === 'year' && (
                <>
                    <button 
                        onClick={() => paginate(-1)} 
                        className="text-red-500 hover:opacity-70 transition-opacity"
                    >
                        <ChevronLeft size={24} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={() => paginate(1)} 
                        className="text-red-500 hover:opacity-70 transition-opacity"
                    >
                        <ChevronRight size={24} strokeWidth={2.5} />
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Global Stats Widget (Visible in both views, context aware) */}
      <div className="border-b border-zinc-900 bg-black z-10">
          <StatsWidget 
            stats={currentStats} 
            mode={statsModes[view]} 
            onToggle={() => setStatsModes(prev => ({
                ...prev,
                [view]: prev[view] === 'count' ? 'percent' : 'count'
            }))} 
          />
          
          {/* Weekday Headers - Visible ONLY in Month View */}
          {view === 'month' && (
             <div className="grid grid-cols-7 py-2 border-b border-zinc-800 bg-black">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 uppercase">{d}</div>
                ))}
             </div>
          )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
                key={view}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                }}
                className="absolute inset-0 w-full h-full flex flex-col"
            >
                {view === 'month' ? renderMonth() : renderYear()}
            </motion.div>
        </AnimatePresence>
      </div>

      {/* Note Modal (Centered Glassmorphism) */}
      <AnimatePresence>
        {(isNoteOpen || editingMonthNote) && (
            <>
                {/* Backdrop with heavy blur for focus */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={() => { setIsNoteOpen(false); setEditingMonthNote(false); setMonthNoteTarget(null); }}
                >
                    {/* Centered Modal Card */}
                    <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            width: "100%",
                            maxWidth: "24rem",
                            height: "auto",
                            borderRadius: "1.5rem"
                        }} 
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "bg-zinc-900/90 border border-zinc-800/50 shadow-2xl overflow-hidden relative flex flex-col max-w-sm rounded-3xl max-h-[70vh]"
                        )}
                    >
                        {/* Subtle gradient glow at top */}
                        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />

                        {/* Header */}
                        <div className="flex justify-between items-center px-5 pt-5 pb-2 relative z-10 shrink-0">
                            <span className="text-zinc-400 font-medium text-sm capitalize">
                                {editingMonthNote 
                                    ? (monthNoteTarget ? format(monthNoteTarget, 'LLLL yyyy', { locale: ru }) : 'Итоги месяца') 
                                    : (selectedDate ? format(selectedDate, 'd MMMM', { locale: ru }) : 'Заметка')
                                }
                            </span>
                        </div>

                        {/* Content Area */}
                        <div className="px-5 py-2 relative z-10 flex-1 flex flex-col">
                            <textarea 
                                className="w-full bg-transparent text-white text-lg leading-relaxed resize-none focus:outline-none placeholder:text-zinc-600/70 h-[140px]"
                                placeholder="Опишите этот день..."
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-end items-center px-5 pb-5 relative z-10 shrink-0">
                            <button 
                                onClick={() => {
                                    if (editingMonthNote) {
                                        const target = monthNoteTarget || currentDate;
                                        setMonthNote(format(target, 'yyyy-MM'), noteContent);
                                        setEditingMonthNote(false);
                                        setMonthNoteTarget(null);
                                    } else {
                                        if (selectedDate) {
                                            const dateKey = format(selectedDate, 'yyyy-MM-dd');
                                            setDayNote(dateKey, noteContent);
                                            setIsNoteOpen(false);
                                        }
                                    }
                                }}
                                className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-medium rounded-full shadow-lg shadow-red-500/20 transition-all duration-200"
                            >
                                <span>Сохранить</span>
                                <Check size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}