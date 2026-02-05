import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, eachMonthOfInterval, isBefore, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import { useStore, type DayStatus } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { StrikeThrough, Cross } from '@/components/HandDrawn';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingMonthNote, setEditingMonthNote] = useState(false);
  
  // Store
  const { days, setDayStatus, setDayNote, monthNotes, setMonthNote } = useStore();

  // Navigation
  const next = () => setCurrentDate(d => view === 'month' ? addMonths(d, 1) : addMonths(d, 12));
  const prev = () => setCurrentDate(d => view === 'month' ? subMonths(d, 1) : subMonths(d, 12));

  // Stats
  const stats = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start, end });
    
    // Filter days: past days + today
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
    // Open bottom sheet
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
    
    // Fill empty slots for grid
    const startDay = start.getDay(); // 0 is Sunday
    // Adjust for Monday start if needed (Russia/EU usually Mon). Let's assume Mon start for "worklife".
    // 0=Sun, 1=Mon. 
    // If Mon start: (day + 6) % 7. 
    const padding = (startDay + 6) % 7; 
    const blanks = Array(padding).fill(null);

    const ruWeekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
      <div className="flex flex-col h-full">
        {/* Stats Bar */}
        <div className="flex justify-between items-center px-4 py-2 text-sm text-muted-foreground border-b border-white/10">
          <div className="flex gap-4">
            <span className="text-white">✓ {stats.good}%</span>
            <span className="text-red-500">✗ {stats.bad}%</span>
            <span className="text-gray-500">— {stats.neutral}%</span>
          </div>
          <button onClick={() => setView('year')} className="text-primary hover:text-white">
            {format(currentDate, 'yyyy')}
          </button>
        </div>

        {/* Grid Header */}
        <div className="grid grid-cols-7 mb-2 mt-2 px-2">
          {ruWeekDays.map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 px-2 flex-1 auto-rows-fr">
          {blanks.map((_, i) => <div key={`blank-${i}`} />)}
          {daysInMonth.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayData = days[dateKey];
            const status = dayData?.status || 'neutral';
            const isPast = isBefore(date, new Date()) && !isToday(date);
            const isTodayDate = isToday(date);
            
            return (
              <div 
                key={dateKey} 
                onClick={() => handleDayClick(date)}
                className="relative flex flex-col items-center justify-start pt-2 min-h-[60px] cursor-pointer active:bg-white/5 rounded-md"
              >
                <div 
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors relative z-10",
                    status === 'good' && "bg-white text-black",
                    status === 'bad' && "bg-red-600 text-white",
                    status === 'neutral' && "text-foreground",
                    isTodayDate && status === 'neutral' && "bg-white/10" // highlight today if neutral
                  )}
                  onClick={(e) => cycleStatus(date, e)}
                >
                  {format(date, 'd')}
                  {/* Strike through for past days */}
                  {isPast && <StrikeThrough className="text-red-600 absolute inset-0 w-full h-full pointer-events-none" />}
                </div>
                {dayData?.note && <div className="w-1 h-1 bg-primary rounded-full mt-1" />}
              </div>
            );
          })}
        </div>

        {/* Month Note Button */}
        <div className="p-4 mt-auto">
             <button 
                onClick={() => {
                    setNoteContent(monthNotes[format(currentDate, 'yyyy-MM')] || '');
                    setEditingMonthNote(true);
                }}
                className="w-full py-3 bg-secondary rounded-lg text-sm font-medium flex items-center justify-center gap-2"
             >
                <FileText className="w-4 h-4" />
                Итог месяца
             </button>
        </div>
      </div>
    );
  };

  // Render Year View
  const renderYear = () => {
    const yearStart = startOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: endOfMonth(addMonths(yearStart, 11)) });

    return (
      <div className="grid grid-cols-3 gap-4 p-4">
         {months.map(month => {
            const isPastMonth = isBefore(endOfMonth(month), new Date());
            return (
                <div 
                    key={month.toISOString()} 
                    onClick={() => {
                        setCurrentDate(month);
                        setView('month');
                    }}
                    className="aspect-square bg-card rounded-xl flex flex-col items-center justify-center relative border border-border cursor-pointer hover:border-primary"
                >
                    <span className="text-lg font-bold">{format(month, 'MMM')}</span>
                    {isPastMonth && <Cross className="text-red-600 opacity-60" />}
                </div>
            );
         })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <button onClick={prev} className="p-2 hover:bg-white/10 rounded-full"><ChevronLeft /></button>
        <h1 className="text-xl font-bold capitalize" onClick={() => setView(view === 'month' ? 'year' : 'month')}>
            {view === 'month' ? format(currentDate, 'LLLL yyyy') : format(currentDate, 'yyyy')}
        </h1>
        <button onClick={next} className="p-2 hover:bg-white/10 rounded-full"><ChevronRight /></button>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'month' ? renderMonth() : renderYear()}
      </div>

      {/* Note Sheet / Modal */}
      {(isNoteOpen || editingMonthNote) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setIsNoteOpen(false); setEditingMonthNote(false); }}>
          <div className="bg-zinc-900 w-full rounded-t-2xl p-6 min-h-[300px] border-t border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingMonthNote ? `Итог ${format(currentDate, 'LLLL')}` : selectedDate && format(selectedDate, 'd MMMM')}
              </h3>
              <button onClick={() => { setIsNoteOpen(false); setEditingMonthNote(false); }}><X /></button>
            </div>
            <textarea
                className="w-full h-40 bg-zinc-800 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={editingMonthNote ? "Как прошел месяц?" : "Заметка к дню..."}
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
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
                className="w-full mt-4 bg-white text-black font-semibold py-3 rounded-lg"
            >
                Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
