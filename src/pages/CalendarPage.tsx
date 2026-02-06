import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, eachMonthOfInterval, isBefore, isToday, getDay, isSameMonth, isAfter, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileText, Circle, CheckCircle2, Plus, X } from 'lucide-react';
import { useStore, type DayStatus, type TodoItem, type ContentBlock } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { RowStrikeThrough, BigMonthCross } from '@/components/HandDrawn';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

// --- Auto Resize Textarea ---
const AutoResizeTextarea = ({ 
  value, 
  onChange, 
  onKeyDown, 
  onFocus,
  autoFocus, 
  className, 
  placeholder,
  inputRef 
}: any) => {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  
  useLayoutEffect(() => {
    const el = inputRef?.current || innerRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea 
      ref={inputRef || innerRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      autoFocus={autoFocus}
      className={className}
      placeholder={placeholder}
      rows={1}
    />
  );
};

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
      className="flex items-center justify-center gap-4 py-2 w-full active:opacity-70 transition-opacity select-none"
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
                        "aspect-square rounded-full flex items-center justify-center text-[5px] font-medium select-none",
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

  // Long press handling
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handlePointerDown = (date: Date) => {
      isLongPress.current = false;
      longPressTimer.current = setTimeout(() => {
          if (!isAfter(startOfDay(date), startOfDay(new Date()))) {
              isLongPress.current = true;
              onDayClick(date);
              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
          }
      }, 300); // Reduced to 300ms for faster response
  };

  const handlePointerUp = (date: Date, e: React.PointerEvent) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      
      if (!isLongPress.current) {
          onCycleStatus(date, e as any);
      }
  };

  const handlePointerCancel = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  };

  return (
    <div className="flex flex-col mb-8 select-none" data-month={format(monthDate, 'yyyy-MM')}>
      {/* Month Name Header (Sticky) - iOS Style Large Title */}
      <div className="px-4 py-2 sticky top-0 bg-black/95 backdrop-blur-sm z-30 select-none">
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
                            className="relative w-full h-full flex flex-col items-center justify-center"
                          >
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onPointerDown={() => handlePointerDown(date)}
                              onPointerUp={(e) => handlePointerUp(date, e as any)}
                              onPointerLeave={handlePointerCancel}
                              onPointerCancel={handlePointerCancel}
                              className="w-full h-full flex items-center justify-center relative z-10 touch-manipulation"
                            >
                                <div className={cn(
                                    "w-8 h-8 flex items-center justify-center rounded-full text-[17px] font-normal transition-all duration-200 pointer-events-none",
                                    status === 'neutral' && isTodayDate && "border border-white text-white font-semibold", 
                                    status === 'neutral' && !isTodayDate && "text-white",
                                    status === 'good' && "bg-white text-black font-semibold", 
                                    status === 'bad' && "bg-red-500 text-white font-semibold", 
                                )}>
                                    {format(date, 'd')}
                                </div>
                                
                                {hasNote && (
                                    <div className="absolute bottom-1 w-1 h-1 bg-zinc-500 rounded-full pointer-events-none" />
                                )}
                            </motion.button>
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
  
  // New Block State
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  
  const [editingMonthNote, setEditingMonthNote] = useState(false);
  const [monthNoteTarget, setMonthNoteTarget] = useState<Date | null>(null);
  const [expandedYearNotes, setExpandedYearNotes] = useState<Record<string, boolean>>({});
  
  const [focusId, setFocusId] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const blockRefs = useRef<Record<string, HTMLTextAreaElement | HTMLInputElement | null>>({});

  // Store
  const { days, setDayStatus, setDayNote, setDayBlocks, monthNotes, setMonthNote, setMonthBlocks } = useStore();

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

  // Load Data Helper
  const loadData = (date: Date, isMonth: boolean) => {
    let initialBlocks: ContentBlock[] = [];
    let note = '';
    let todos: TodoItem[] = [];

    if (isMonth) {
      const key = format(date, 'yyyy-MM');
      const data = monthNotes[key];
      if (typeof data === 'string') {
        note = data;
      } else if (data) {
        if (data.blocks && data.blocks.length > 0) {
          setBlocks(data.blocks);
          return;
        }
        note = data.note || '';
        todos = data.todos || [];
      }
    } else {
      const key = format(date, 'yyyy-MM-dd');
      const data = days[key];
      if (data) {
        if (data.blocks && data.blocks.length > 0) {
          setBlocks(data.blocks);
          return;
        }
        note = data.note || '';
        todos = data.todos || [];
      }
    }

    // Migration logic
    if (note) {
      initialBlocks.push({ id: uuidv4(), type: 'text', content: note });
    }
    if (todos.length > 0) {
      todos.forEach(t => {
        initialBlocks.push({ id: t.id, type: 'todo', content: t.text, completed: t.completed });
      });
    }
    
    // Ensure at least one empty block if nothing exists
    if (initialBlocks.length === 0) {
      initialBlocks.push({ id: uuidv4(), type: 'text', content: '' });
    }
    
    setBlocks(initialBlocks);
  };

  // Handlers
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    loadData(date, false);
    setIsNoteOpen(true);
  };

  const cycleStatus = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAfter(startOfDay(date), startOfDay(new Date()))) return;

    const dateKey = format(date, 'yyyy-MM-dd');
    const currentStatus = days[dateKey]?.status || 'neutral';
    const nextStatus: DayStatus = currentStatus === 'neutral' ? 'good' : currentStatus === 'good' ? 'bad' : 'neutral';
    setDayStatus(dateKey, nextStatus);
  };

  const openMonthNote = (monthDate: Date) => {
      setMonthNoteTarget(monthDate);
      loadData(monthDate, true);
      setEditingMonthNote(true);
  };

  const saveAndClose = () => {
      // Generate preview text
      const previewText = blocks
        .map(b => b.type === 'todo' ? (b.completed ? '[x] ' : '[ ] ') + b.content : b.content)
        .join('\n');

      if (editingMonthNote) {
          const target = monthNoteTarget || currentDate;
          const key = format(target, 'yyyy-MM');
          setMonthBlocks(key, blocks);
          setMonthNote(key, previewText, []); // Update legacy note
          setEditingMonthNote(false);
          setMonthNoteTarget(null);
      } else {
          if (selectedDate) {
              const dateKey = format(selectedDate, 'yyyy-MM-dd');
              setDayBlocks(dateKey, blocks);
              setDayNote(dateKey, previewText, []); // Update legacy note
              setIsNoteOpen(false);
          }
      }
  };

  const handleBlockChange = (id: string, content: string) => {
    // Check for todo conversion pattern
    if (content.startsWith('[] ') || content.startsWith('[ ] ')) {
        const cleanContent = content.replace(/^\[\s?\]\s/, '');
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, type: 'todo', content: cleanContent, completed: false } : b));
        return;
    }
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const handleToggleTodo = (id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, completed: !b.completed } : b));
  };

  const handleBlockKeyDown = (e: React.KeyboardEvent, id: string, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentBlock = blocks[index];
      const newId = uuidv4();
      const newBlock: ContentBlock = { 
        id: newId, 
        type: currentBlock.type, 
        content: '', 
        completed: false 
      };

      setBlocks(prev => {
        const newBlocks = [...prev];
        newBlocks.splice(index + 1, 0, newBlock);
        return newBlocks;
      });
      setFocusId(newId);
      setActiveBlockId(newId);
    } else if (e.key === 'Backspace') {
      const element = e.currentTarget as HTMLTextAreaElement;
      if (blocks[index].type === 'todo' && element.selectionStart === 0 && element.selectionEnd === 0) {
          e.preventDefault();
          setBlocks(prev => prev.map(b => b.id === id ? { ...b, type: 'text' } : b));
          return;
      }

      if (blocks[index].content === '') {
        if (blocks.length > 1) {
            e.preventDefault();
            setBlocks(prev => prev.filter(b => b.id !== id));
            if (index > 0) {
                setFocusId(blocks[index - 1].id);
                setActiveBlockId(blocks[index - 1].id);
            }
        }
      }
    }
  };

  const handleAddBlock = () => {
      const newId = uuidv4();
      const newBlock: ContentBlock = { id: newId, type: 'todo', content: '', completed: false };
      
      setBlocks(prev => {
          if (activeBlockId) {
              const index = prev.findIndex(b => b.id === activeBlockId);
              if (index !== -1) {
                  const newBlocks = [...prev];
                  newBlocks.splice(index + 1, 0, newBlock);
                  return newBlocks;
              }
          }
          return [...prev, newBlock];
      });
      setFocusId(newId);
      setActiveBlockId(newId);
  };

  useEffect(() => {
    if (focusId && blockRefs.current[focusId]) {
      blockRefs.current[focusId]?.focus();
      setFocusId(null);
    }
  }, [focusId, blocks]);

  // Render Month View
  const renderMonth = () => {
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
                    const noteData = monthNotes[monthKey];
                    const noteText = typeof noteData === 'string' ? noteData : noteData?.note;
                    const hasNote = !!noteText || (typeof noteData !== 'string' && (noteData?.todos?.length || 0) > 0);

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
                                                 {noteText || (hasNote ? "Задачи..." : "...")}
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
        <div className="flex-1 flex justify-start min-w-0">
        </div>

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

        <div className="flex-1 flex justify-end items-center gap-4 min-w-0">
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
        </div>
      </div>

      <div className="border-b border-zinc-900 bg-black z-10">
          <StatsWidget 
            stats={currentStats} 
            mode={statsModes[view]} 
            onToggle={() => setStatsModes(prev => ({
                ...prev,
                [view]: prev[view] === 'count' ? 'percent' : 'count'
            }))} 
          />
          
          {view === 'month' && (
             <div className="grid grid-cols-7 py-2 border-b border-zinc-800 bg-black">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 uppercase">{d}</div>
                ))}
             </div>
          )}
      </div>

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

      <AnimatePresence>
        {(isNoteOpen || editingMonthNote) && (
            <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-0 bg-black z-50 flex flex-col"
            >
                <div className="flex justify-between items-center px-4 pt-safe pb-2 min-h-[50px] relative pr-14">
                    <button 
                        onClick={saveAndClose}
                        className="flex items-center gap-1 text-[#FFD60A] active:opacity-60 transition-opacity z-10"
                    >
                        <ChevronLeft size={24} strokeWidth={2.5} />
                        <span className="text-[17px] font-medium leading-none mb-0.5">Назад</span>
                    </button>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-safe pointer-events-none">
                        <span className="text-zinc-500 text-[12px] font-medium">
                            {editingMonthNote 
                                ? (monthNoteTarget ? format(monthNoteTarget, 'd MMMM yyyy', { locale: ru }) : 'Итоги месяца') 
                                : (selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: ru }) : 'Заметка')
                            }
                        </span>
                        <span className="text-zinc-600 text-[10px]">
                            {(() => {
                                let ts: number | undefined;
                                if (editingMonthNote) {
                                    const data = monthNotes[format(monthNoteTarget || currentDate, 'yyyy-MM')];
                                    if (typeof data !== 'string') ts = data?.lastModified;
                                } else if (selectedDate) {
                                    ts = days[format(selectedDate, 'yyyy-MM-dd')]?.lastModified;
                                }
                                return ts ? format(ts, 'HH:mm', { locale: ru }) : format(new Date(), 'HH:mm');
                            })()}
                        </span>
                    </div>

                    <button 
                        onClick={handleAddBlock}
                        className="text-[#FFD60A] active:opacity-60 transition-opacity z-10"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex-1 px-5 pt-2 pb-safe overflow-y-auto">
                    <div className="flex flex-col gap-3 pb-20">
                        {blocks.map((block, index) => (
                            <div key={block.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {block.type === 'text' ? (
                                    <div className="flex items-start gap-2">
                                         <AutoResizeTextarea
                                            inputRef={(el: HTMLTextAreaElement | null) => { blockRefs.current[block.id] = el }}
                                            value={block.content}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleBlockChange(block.id, e.target.value)}
                                            onKeyDown={(e: React.KeyboardEvent) => handleBlockKeyDown(e, block.id, index)}
                                            onFocus={() => setActiveBlockId(block.id)}
                                            className="w-full bg-transparent text-white text-[19px] leading-relaxed resize-none focus:outline-none placeholder:text-zinc-600/70 font-normal"
                                            placeholder="Начните писать..."
                                         />
                                         <button 
                                            onClick={() => {
                                                if (blocks.length > 1) {
                                                    setBlocks(prev => prev.filter(b => b.id !== block.id));
                                                }
                                            }}
                                            className="mt-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-zinc-600 hover:text-red-500 p-1 shrink-0"
                                         >
                                            <X size={18} />
                                         </button>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3">
                                        <button 
                                            onClick={() => handleToggleTodo(block.id)}
                                            className="mt-1 text-zinc-400 hover:text-[#FFD60A] transition-colors shrink-0"
                                        >
                                            {block.completed ? <CheckCircle2 size={22} className="text-[#FFD60A]" /> : <Circle size={22} />}
                                        </button>
                                        <AutoResizeTextarea
                                            inputRef={(el: HTMLTextAreaElement | null) => { blockRefs.current[block.id] = el }}
                                            value={block.content} 
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleBlockChange(block.id, e.target.value)}
                                            onKeyDown={(e: React.KeyboardEvent) => handleBlockKeyDown(e, block.id, index)}
                                            onFocus={() => setActiveBlockId(block.id)}
                                            className={cn(
                                                "flex-1 bg-transparent border-none p-0 text-[19px] focus:ring-0 leading-relaxed font-normal focus:outline-none placeholder:text-zinc-600/50", 
                                                block.completed && "text-zinc-500 line-through decoration-zinc-600"
                                            )}
                                            placeholder="Новая задача"
                                        />
                                        <button 
                                            onClick={() => setBlocks(prev => prev.filter(b => b.id !== block.id))} 
                                            className="mt-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-zinc-600 hover:text-red-500 p-1 shrink-0"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
