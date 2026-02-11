import { useState, useMemo, useEffect } from 'react';
import { useStore, type Lead, type Counter } from '@/store/useStore';
import { useGoogleSync } from '@/hooks/useGoogleSync';
import { Plus, Minus, Briefcase, User, Clock, Trash2, Search, Settings, Check, Edit2, Copy, Clipboard, RefreshCw, X, Zap, Upload, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  new: { label: 'Написал', color: 'bg-zinc-500', text: 'text-zinc-500', border: 'border-zinc-500/20' },
  responded: { label: 'Ответил', color: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500/20' },
  interview: { label: 'Собес', color: 'bg-green-500', text: 'text-green-500', border: 'border-green-500/20' },
  rejected: { label: 'Отказ', color: 'bg-red-500', text: 'text-red-500', border: 'border-red-500/20' },
};

const OFFER_CONFIG = {
    model: { label: 'Модель', color: 'bg-green-500', text: 'text-green-500', border: 'border-green-500/20' },
    agent: { label: 'Агент', color: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500/20' },
    chatter: { label: 'Чаттер', color: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500/20' },
    operator: { label: 'Оператор', color: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500/20' },
};

const COUNTER_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#71717A', // Zinc
];

export default function LeadsPage() {
  const { 
    counters, leads,
    addCounter, incrementCounter, decrementCounter, toggleCounterType, updateCounterName, updateCounterColor,
    addLead, updateLead, deleteLead,
    googleSheetUrl, setGoogleSheetUrl
  } = useStore();

  const { syncStatus, importStatus, handleSync, handleImport, isAutoSyncEnabled, setIsAutoSyncEnabled } = useGoogleSync();
  const isSyncing = syncStatus === 'loading' || importStatus === 'loading';

  const [activeTab, setActiveTab] = useState<'counters' | 'crm'>('counters');
  
  // Sync State
  const [isSyncSettingsOpen, setIsSyncSettingsOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  useEffect(() => {
    if (isSyncSettingsOpen) {
        setTempUrl(googleSheetUrl || '');
    }
  }, [isSyncSettingsOpen, googleSheetUrl]);

  // CRM Filters
  const [crmFilter, setCrmFilter] = useState<'all' | 'new' | 'responded' | 'interview' | 'rejected'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [crmCounterFilter, setCrmCounterFilter] = useState<string | null>(null);
  
  // Sheet States
  const [isLeadSheetOpen, setIsLeadSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null); 
  
  const [isCounterSheetOpen, setIsCounterSheetOpen] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);

  // Forms
  const [formData, setFormData] = useState<Partial<Lead>>({ status: 'new' });
  const [counterForm, setCounterForm] = useState<{ name: string; type: 'work' | 'personal'; color: string }>({ 
    name: '', type: 'work', color: COUNTER_COLORS[0] 
  });

  // Link Edit State
  const [isLinkEditOpen, setIsLinkEditOpen] = useState(false);
  const [linkEditLeadId, setLinkEditLeadId] = useState<string | null>(null);
  const [linkEditValue, setLinkEditValue] = useState('');

  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);
  const [offerMenuOpenId, setOfferMenuOpenId] = useState<string | null>(null);

  // --- Helpers ---
  const totalStats = useMemo(() => {
      return counters.reduce((acc, c) => {
          acc.total += c.value;
          if (c.type === 'work') acc.work += c.value;
          else acc.personal += c.value;
          return acc;
      }, { total: 0, work: 0, personal: 0 });
  }, [counters]);

  // --- Handlers ---
  const handleLongPress = (id: string) => {
    setStatusMenuOpenId(id);
  };
  
  const handleOfferLongPress = (id: string) => {
    setOfferMenuOpenId(id);
  };

  // Custom Long Press Hook Logic inside component
  const useLongPress = (callback: () => void, ms = 500) => {
      const [startLongPress, setStartLongPress] = useState(false);

      useEffect(() => {
        let timerId: any;
        if (startLongPress) {
          timerId = setTimeout(callback, ms);
        } else {
          clearTimeout(timerId);
        }

        return () => {
          clearTimeout(timerId);
        };
      }, [callback, ms, startLongPress]);

      return {
        onMouseDown: () => setStartLongPress(true),
        onMouseUp: () => setStartLongPress(false),
        onMouseLeave: () => setStartLongPress(false),
        onTouchStart: () => setStartLongPress(true),
        onTouchEnd: () => setStartLongPress(false),
      };
  };
  
  const LongPressButton = ({ onClick, onLongPress, children, className, ...props }: any) => {
    const longPressEvent = useLongPress(onLongPress, 500);
    
    return (
        <button
            onClick={onClick}
            {...longPressEvent}
            className={className}
            {...props}
        >
            {children}
        </button>
    );
  };

  const openCounterSheet = (counter?: Counter) => {
      if (counter) {
          setSelectedCounter(counter);
          setCounterForm({ name: counter.name, type: counter.type, color: counter.color || COUNTER_COLORS[0] });
      } else {
          setSelectedCounter(null);
          setCounterForm({ name: '', type: 'work', color: COUNTER_COLORS[5] });
      }
      setIsCounterSheetOpen(true);
  };

  const handleSaveCounter = () => {
      if (selectedCounter) {
          updateCounterName(selectedCounter.id, counterForm.name);
          // Type toggle is separate in store, but we can handle it if we exposed an updateCounter method
          // For now, let's just assume name and color are main edits here. 
          // If type changed, we might need to toggle it if it differs.
          if (selectedCounter.type !== counterForm.type) {
              toggleCounterType(selectedCounter.id);
          }
          updateCounterColor(selectedCounter.id, counterForm.color);
      } else {
          addCounter(counterForm.name || 'New Counter', counterForm.type, counterForm.color);
      }
      setIsCounterSheetOpen(false);
  };

  const cycleLeadStatus = (lead: Lead, e: React.MouseEvent) => {
      e.stopPropagation();
      const statuses: Array<keyof typeof STATUS_CONFIG> = ['new', 'responded', 'interview', 'rejected'];
      const currentIndex = statuses.indexOf(lead.status);
      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
      updateLead(lead.id, { status: nextStatus });
  };

  const cycleOffer = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    const offers: Array<keyof typeof OFFER_CONFIG | undefined> = ['model', 'agent', 'chatter', 'operator', undefined];
    const currentOffer = lead.offer;
    const currentIndex = offers.indexOf(currentOffer);
    const nextOffer = offers[(currentIndex + 1) % offers.length];
    updateLead(lead.id, { offer: nextOffer });
  };

  const handleProfileClick = async (lead: Lead, e: React.MouseEvent) => {
      e.stopPropagation();
      if (lead.link) {
          try {
              await navigator.clipboard.writeText(lead.link);
              // Ideally show a toast here, but visual feedback on button might be enough or we can add a temp state
          } catch (err) {
              console.error('Failed to copy', err);
          }
      } else {
          setLinkEditLeadId(lead.id);
          setLinkEditValue('');
          setIsLinkEditOpen(true);
      }
  };

  const handleEditLinkClick = (lead: Lead, e: React.MouseEvent) => {
      e.stopPropagation();
      setLinkEditLeadId(lead.id);
      setLinkEditValue(lead.link || '');
      setIsLinkEditOpen(true);
  };

  const handleSaveLink = () => {
      if (linkEditLeadId) {
          updateLead(linkEditLeadId, { link: linkEditValue });
          setIsLinkEditOpen(false);
          setLinkEditLeadId(null);
          setLinkEditValue('');
      }
  };

  const handleDeleteLink = () => {
      if (linkEditLeadId) {
          updateLead(linkEditLeadId, { link: undefined });
          setIsLinkEditOpen(false);
          setLinkEditLeadId(null);
          setLinkEditValue('');
      }
  };

  const handlePasteFromClipboard = async () => {
      try {
          const text = await navigator.clipboard.readText();
          setLinkEditValue(text);
      } catch (err) {
          console.error('Failed to read clipboard', err);
      }
  };

  const saveSyncSettings = () => {
      if (tempUrl) {
          setGoogleSheetUrl(tempUrl);
          setIsSyncSettingsOpen(false);
          // Trigger sync immediately after save? No, let user click again to confirm.
      }
  };

  // --- Counters Section ---
  const renderCounters = () => (
    <div className="p-4 space-y-6 pb-32">
       {/* Header & Total */}
       <div className="space-y-4">
           <div className="flex justify-between items-center">
             <div className="relative">
               <h2 className="text-2xl font-bold text-white relative z-10">Счётчики</h2>
             </div>
             <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => openCounterSheet()}
                disabled={counters.length >= 15}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-lg disabled:opacity-50"
             >
               <Plus size={24} />
             </motion.button>
           </div>

           {/* Total Widget */}
           <div className="grid grid-cols-3 gap-3">
               <div className="bg-zinc-900/50 rounded-2xl p-3 border border-white/5 flex flex-col items-center justify-center">
                   <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Всего</span>
                   <span className="text-2xl font-mono font-bold text-white">{totalStats.total}</span>
               </div>
               <div className="bg-blue-500/10 rounded-2xl p-3 border border-blue-500/10 flex flex-col items-center justify-center">
                   <span className="text-blue-400 text-[10px] uppercase font-bold tracking-wider">Рабочие</span>
                   <span className="text-2xl font-mono font-bold text-blue-400">{totalStats.work}</span>
               </div>
               <div className="bg-purple-500/10 rounded-2xl p-3 border border-purple-500/10 flex flex-col items-center justify-center">
                   <span className="text-purple-400 text-[10px] uppercase font-bold tracking-wider">Личные</span>
                   <span className="text-2xl font-mono font-bold text-purple-400">{totalStats.personal}</span>
               </div>
           </div>
       </div>
       
       <div className="grid gap-4">
         {counters.map(counter => (
           <motion.div 
             layout
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             key={counter.id} 
             onClick={() => {
                if (counter.type === 'work') {
                    setCrmCounterFilter(counter.id);
                    setActiveTab('crm');
                }
             }}
             className={cn(
                "bg-card/50 backdrop-blur-sm p-5 rounded-3xl border border-white/5 flex flex-col gap-4 shadow-lg relative overflow-hidden group transition-transform",
                counter.type === 'work' && "cursor-pointer active:scale-[0.98]"
             )}
           >
             {/* Dynamic Glow */}
             <div 
                className="absolute top-0 right-0 w-48 h-48 blur-3xl rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"
                style={{ background: counter.color || '#EF4444', opacity: 0.15 }}
             />

             <div className="flex justify-between items-start relative z-10">
               <input 
                 className="bg-transparent text-lg font-medium focus:outline-none border-b border-transparent focus:border-white/20 w-2/3 text-white placeholder:text-zinc-600 truncate"
                 value={counter.name}
                 onChange={(e) => updateCounterName(counter.id, e.target.value)}
                 onClick={(e) => e.stopPropagation()}
                 placeholder="Название..."
               />
               <div className="flex gap-2">
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            openCounterSheet(counter);
                        }}
                        className="w-8 h-8 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                    >
                        <Settings size={14} />
                    </motion.button>
               </div>
             </div>
             
             <div className="flex items-center justify-between mt-2 relative z-10">
               <motion.button 
                 whileTap={{ scale: 0.8 }}
                 onClick={(e) => {
                    e.stopPropagation();
                    decrementCounter(counter.id);
                 }}
                 className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/5 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
               >
                 <Minus size={24} />
               </motion.button>
               
               <div className="flex flex-col items-center">
                   <span className="text-5xl font-bold font-mono text-white tabular-nums tracking-tighter" style={{ textShadow: `0 0 20px ${counter.color}40` }}>
                       {counter.value}
                   </span>
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: counter.color }}>
                       {counter.type === 'work' ? 'Work' : 'Personal'}
                   </span>
               </div>

               <motion.button 
                 whileTap={{ scale: 0.8 }}
                 onClick={(e) => {
                    e.stopPropagation();
                    incrementCounter(counter.id);
                 }}
                 className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
               >
                 <Plus size={24} />
               </motion.button>
             </div>
           </motion.div>
         ))}
       </div>
    </div>
  );

  // --- CRM Section ---
  const filteredLeads = useMemo(() => {
      return leads.filter(l => {
        // Counter Filter (NEW)
        if (crmCounterFilter && l.sourceCounterId !== crmCounterFilter) return false;

        // Status Filter
        if (crmFilter !== 'all' && l.status !== crmFilter) return false;
        
        // Date Filter
        if (dateFilter !== 'all') {
            const date = l.firstContactDate ? parseISO(l.firstContactDate) : new Date(l.createdAt);
            const now = new Date();
            
            if (dateFilter === 'today') {
                if (!isWithinInterval(date, { start: startOfDay(now), end: endOfDay(now) })) return false;
            } else if (dateFilter === 'week') {
                if (!isWithinInterval(date, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) })) return false;
            } else if (dateFilter === 'month') {
                if (!isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) })) return false;
            }
        }

        return true;
      }).sort((a, b) => (b.firstContactDate ? new Date(b.firstContactDate).getTime() : 0) - (a.firstContactDate ? new Date(a.firstContactDate).getTime() : 0));
  }, [leads, crmFilter, dateFilter, crmCounterFilter]);

  const openLeadSheet = (lead?: Lead) => {
    setSelectedLead(lead || null);
    setFormData(lead || { status: 'new', history: [], sourceCounterId: crmCounterFilter || undefined });
    setIsLeadSheetOpen(true);
  };

  const handleSaveLead = () => {
    if (selectedLead) {
      updateLead(selectedLead.id, formData);
    } else {
      addLead({
        name: formData.name || 'New Lead',
        link: formData.link,
        status: formData.status as any,
        notes: formData.notes,
        firstContactDate: formData.firstContactDate || new Date().toISOString(),
        isWork: !!formData.sourceCounterId, // Infer work type if linked to counter
        sourceCounterId: formData.sourceCounterId
      });
    }
    setIsLeadSheetOpen(false);
  };

  const handleDeleteLead = () => {
    if (selectedLead) {
      deleteLead(selectedLead.id);
      setIsLeadSheetOpen(false);
    }
  };

  const renderCRM = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 space-y-4">
        <div className="flex justify-between items-center">
            <div className="relative">
                <h2 className="text-2xl font-bold text-white relative z-10 flex items-center gap-2">
                    CRM
                    {crmCounterFilter && (
                        <span className="text-sm font-normal text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                            {counters.find(c => c.id === crmCounterFilter)?.name || '...'}
                            <button 
                                onClick={() => setCrmCounterFilter(null)}
                                className="ml-2 text-zinc-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </span>
                    )}
                </h2>
            </div>
            <div className="flex gap-2">
                {/* Auto Sync Indicator */}
                {isAutoSyncEnabled && (
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800/50 border border-zinc-700/30 text-green-500/50">
                        <Zap size={14} className={cn(isSyncing && "animate-pulse text-green-500")} />
                    </div>
                )}

                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsSyncSettingsOpen(true)}
                    className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white"
                >
                    <Settings size={20} />
                </motion.button>

                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openLeadSheet()}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-lg"
                >
                    <Plus size={24} />
                </motion.button>
            </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
            {/* Date Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[
                    { id: 'all', label: 'Все время' },
                    { id: 'today', label: 'Сегодня' },
                    { id: 'week', label: 'Неделя' },
                    { id: 'month', label: 'Месяц' },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setDateFilter(f.id as any)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                            dateFilter === f.id 
                                ? "bg-white text-black border-white" 
                                : "bg-zinc-900 text-zinc-500 border-zinc-800"
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                    { id: 'all', label: 'Все' },
                    { id: 'new', label: 'Написал' },
                    { id: 'responded', label: 'Ответил' },
                    { id: 'interview', label: 'Собес' },
                    { id: 'rejected', label: 'Отказ' },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setCrmFilter(f.id as any)}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                            crmFilter === f.id 
                                ? "bg-zinc-800 text-white border-zinc-700" 
                                : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700"
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-3">
        {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                <Search size={48} className="mb-4 opacity-20" />
                <p>Нет лидов</p>
            </div>
        ) : (
            filteredLeads.map(lead => (
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={lead.id}
                    onClick={() => openLeadSheet(lead)}
                    className="bg-card/50 backdrop-blur-sm p-4 rounded-2xl border border-white/5 active:scale-[0.98] transition-transform"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white text-lg">{lead.name}</h3>
                        <div className="flex flex-col gap-2 items-end">
                            <div className="relative">
                                <LongPressButton
                                    onClick={(e: any) => cycleLeadStatus(lead, e)}
                                    onLongPress={() => handleLongPress(lead.id)}
                                    className={cn(
                                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border active:scale-90 transition-transform",
                                        STATUS_CONFIG[lead.status]?.text,
                                        STATUS_CONFIG[lead.status]?.border,
                                        "bg-transparent hover:bg-white/5 relative z-10"
                                    )}
                                >
                                    {STATUS_CONFIG[lead.status]?.label}
                                </LongPressButton>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {statusMenuOpenId === lead.id && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-20" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setStatusMenuOpenId(null);
                                                }}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                                className="absolute right-0 top-full mt-2 w-32 bg-zinc-900 rounded-xl border border-white/10 shadow-2xl z-30 overflow-hidden"
                                            >
                                                {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateLead(lead.id, { status });
                                                            setStatusMenuOpenId(null);
                                                        }}
                                                        className={cn(
                                                            "w-full px-3 py-2 text-left text-xs font-medium hover:bg-white/5 transition-colors flex items-center gap-2",
                                                            lead.status === status ? "bg-white/5" : ""
                                                        )}
                                                    >
                                                        <div className={cn("w-2 h-2 rounded-full", STATUS_CONFIG[status].color)} />
                                                        <span className={STATUS_CONFIG[status].text}>
                                                            {STATUS_CONFIG[status].label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Offer Button */}
                            <div className="relative">
                                <LongPressButton
                                    onClick={(e: any) => cycleOffer(lead, e)}
                                    onLongPress={() => handleOfferLongPress(lead.id)}
                                    className={cn(
                                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border active:scale-90 transition-transform w-full text-center",
                                        lead.offer 
                                            ? cn(OFFER_CONFIG[lead.offer].text, OFFER_CONFIG[lead.offer].border)
                                            : "text-zinc-600 border-zinc-800",
                                        "bg-transparent hover:bg-white/5 relative z-10"
                                    )}
                                >
                                    {lead.offer ? OFFER_CONFIG[lead.offer].label : '+ Оффер'}
                                </LongPressButton>

                                <AnimatePresence>
                                    {offerMenuOpenId === lead.id && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-20" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOfferMenuOpenId(null);
                                                }}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                                className="absolute right-0 top-full mt-2 w-32 bg-zinc-900 rounded-xl border border-white/10 shadow-2xl z-30 overflow-hidden"
                                            >
                                                <button
                                                     onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateLead(lead.id, { offer: undefined });
                                                        setOfferMenuOpenId(null);
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-xs font-medium text-zinc-500 hover:bg-white/5 transition-colors"
                                                >
                                                    Без оффера
                                                </button>
                                                {(Object.keys(OFFER_CONFIG) as Array<keyof typeof OFFER_CONFIG>).map((offer) => (
                                                    <button
                                                        key={offer}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateLead(lead.id, { offer });
                                                            setOfferMenuOpenId(null);
                                                        }}
                                                        className={cn(
                                                            "w-full px-3 py-2 text-left text-xs font-medium hover:bg-white/5 transition-colors flex items-center gap-2",
                                                            lead.offer === offer ? "bg-white/5" : ""
                                                        )}
                                                    >
                                                        <div className={cn("w-2 h-2 rounded-full", OFFER_CONFIG[offer].color)} />
                                                        <span className={OFFER_CONFIG[offer].text}>
                                                            {OFFER_CONFIG[offer].label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => handleProfileClick(lead, e)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                                lead.link 
                                    ? "bg-white text-black border-white hover:bg-zinc-200" 
                                    : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-400"
                            )}
                        >
                            {lead.link ? <Copy size={12} /> : <Plus size={12} />}
                            Профиль
                        </motion.button>
                        
                        {lead.link && (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => handleEditLinkClick(lead, e)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-500 border border-zinc-700/50 hover:text-white hover:bg-zinc-800 transition-colors"
                            >
                                <Edit2 size={12} />
                            </motion.button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Clock size={12} />
                        <span>{lead.firstContactDate ? format(new Date(lead.firstContactDate), 'dd MMM yyyy') : 'No date'}</span>
                    </div>
                </motion.div>
            ))
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background pt-safe">
      {/* Top Tabs */}
      <div className="flex p-2 bg-card/30 backdrop-blur-md mx-4 mt-8 rounded-2xl border border-white/5 z-20">
        <button
            onClick={() => setActiveTab('counters')}
            className={cn(
                "flex-1 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === 'counters' ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-white"
            )}
        >
            Счётчики
        </button>
        <button
            onClick={() => {
                setActiveTab('crm');
                setCrmCounterFilter(null);
            }}
            className={cn(
                "flex-1 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === 'crm' ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-white"
            )}
        >
            CRM
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
            {activeTab === 'counters' ? (
                <motion.div 
                    key="counters"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="h-full overflow-y-auto"
                >
                    {renderCounters()}
                </motion.div>
            ) : (
                <motion.div 
                    key="crm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full overflow-hidden"
                >
                    {renderCRM()}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Counter Sheet (Creation / Edit) */}
      <AnimatePresence>
        {isCounterSheetOpen && (
             <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    onClick={() => setIsCounterSheetOpen(false)}
                />
                <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl border-t border-white/10 z-50 p-6 pb-safe overflow-y-auto"
                    style={{ maxHeight: '90vh' }}
                >
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-white mb-6">
                        {selectedCounter ? 'Настройки счётчика' : 'Новый счётчик'}
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-medium ml-1">Название</label>
                            <input 
                                className="w-full bg-zinc-950/50 p-4 rounded-xl border border-white/5 text-white focus:border-white/20 outline-none"
                                placeholder="Например: Отклики"
                                value={counterForm.name}
                                onChange={e => setCounterForm({...counterForm, name: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-medium ml-1">Тип</label>
                            <div className="flex bg-zinc-950/50 p-1 rounded-xl border border-white/5">
                                <button
                                    onClick={() => setCounterForm({...counterForm, type: 'work'})}
                                    className={cn(
                                        "flex-1 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                                        counterForm.type === 'work' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500"
                                    )}
                                >
                                    <Briefcase size={16} /> Рабочий
                                </button>
                                <button
                                    onClick={() => setCounterForm({...counterForm, type: 'personal'})}
                                    className={cn(
                                        "flex-1 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                                        counterForm.type === 'personal' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500"
                                    )}
                                >
                                    <User size={16} /> Личный
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-medium ml-1">Цвет</label>
                            <div className="grid grid-cols-5 gap-3">
                                {COUNTER_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setCounterForm({...counterForm, color})}
                                        className={cn(
                                            "aspect-square rounded-full transition-all relative flex items-center justify-center",
                                            counterForm.color === color ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : "hover:scale-105"
                                        )}
                                        style={{ background: color }}
                                    >
                                        {counterForm.color === color && <Check size={16} className="text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveCounter}
                            className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg active:scale-95 transition-transform mt-4 mb-6"
                        >
                            Сохранить
                        </button>
                    </div>
                </motion.div>
             </>
        )}
      </AnimatePresence>
      
      {/* Lead Bottom Sheet */}
      <AnimatePresence>

        {isLeadSheetOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    onClick={() => setIsLeadSheetOpen(false)}
                />
                <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl border-t border-white/10 z-50 p-6 pb-safe overflow-y-auto"
                    style={{ maxHeight: '90vh' }}
                >
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6" />
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">
                            {selectedLead ? 'Редактировать' : 'Новый лид'}
                        </h3>
                        {selectedLead && (
                            <button onClick={handleDeleteLead} className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-medium ml-1">Статус</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFormData({ ...formData, status })}
                                        className={cn(
                                            "py-2 rounded-xl text-[10px] font-bold uppercase border transition-all",
                                            formData.status === status
                                                ? cn(STATUS_CONFIG[status].color, "text-white border-transparent")
                                                : "bg-transparent border-zinc-800 text-zinc-500"
                                        )}
                                    >
                                        {STATUS_CONFIG[status].label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-medium ml-1">Имя</label>
                            <input 
                                className="w-full bg-zinc-950/50 p-4 rounded-xl border border-white/5 text-white focus:border-white/20 outline-none"
                                placeholder="Имя лида"
                                value={formData.name || ''}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-medium ml-1">Ссылка (TG/LinkedIn)</label>
                            <input 
                                className="w-full bg-zinc-950/50 p-4 rounded-xl border border-white/5 text-white focus:border-white/20 outline-none"
                                placeholder="https://..."
                                value={formData.link || ''}
                                onChange={e => setFormData({...formData, link: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-medium ml-1">Заметки</label>
                            <textarea 
                                className="w-full h-24 bg-zinc-950/50 p-4 rounded-xl border border-white/5 text-white focus:border-white/20 outline-none resize-none"
                                placeholder="Детали..."
                                value={formData.notes || ''}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>

                        <button 
                            onClick={handleSaveLead}
                            className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg active:scale-95 transition-transform mt-4 mb-6"
                        >
                            Сохранить
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* Link Edit Modal */}
      <AnimatePresence>
        {isLinkEditOpen && (
             <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    onClick={() => setIsLinkEditOpen(false)}
                />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-zinc-900 rounded-3xl border border-white/10 z-50 p-6 shadow-2xl"
                >
                    <h3 className="text-xl font-bold text-white mb-4 text-center">
                        {leads.find(l => l.id === linkEditLeadId)?.link ? 'Редактировать ссылку' : 'Добавить ссылку'}
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="relative">
                            <input 
                                className="w-full bg-zinc-950 p-4 pr-12 rounded-xl border border-white/10 text-white focus:border-white/20 outline-none"
                                placeholder="Вставьте ссылку..."
                                value={linkEditValue}
                                onChange={e => setLinkEditValue(e.target.value)}
                                autoFocus
                            />
                            <button 
                                onClick={handlePasteFromClipboard}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white transition-colors"
                            >
                                <Clipboard size={18} />
                            </button>
                        </div>

                        <div className="flex gap-3">
                            {leads.find(l => l.id === linkEditLeadId)?.link && (
                                <button 
                                    onClick={handleDeleteLink}
                                    className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold active:scale-95 transition-transform border border-red-500/20 hover:bg-red-500/20 flex items-center justify-center"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button 
                                onClick={handleSaveLink}
                                className="flex-[2] py-3 bg-white text-black rounded-xl font-bold active:scale-95 transition-transform"
                            >
                                Сохранить
                            </button>
                        </div>
                    </div>
                </motion.div>
             </>
        )}
      </AnimatePresence>

      {/* Sync Settings Modal */}
      <AnimatePresence>
        {isSyncSettingsOpen && (
             <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    onClick={() => setIsSyncSettingsOpen(false)}
                />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-zinc-900 rounded-3xl border border-white/10 z-50 p-6 shadow-2xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-white">Google Sheets Sync</h3>
                        <button onClick={() => setIsSyncSettingsOpen(false)} className="text-zinc-500 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            1. Создайте Google Таблицу<br/>
                            2. Расширения {'>'} Apps Script<br/>
                            3. Вставьте код скрипта (спросите у ассистента)<br/>
                            4. Начать развертывание {'>'} Веб-приложение<br/>
                            5. Доступ: "Все (Anyone)"<br/>
                            6. Скопируйте URL ниже:
                        </p>
                        
                        {/* Auto Sync Toggle */}
                        <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", isAutoSyncEnabled ? "bg-green-500/20 text-green-500" : "bg-zinc-800 text-zinc-500")}>
                                    <Zap size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">Авто-синхронизация</span>
                                    <span className="text-[10px] text-zinc-500">Каждые 15 сек</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                                className={cn(
                                    "w-10 h-6 rounded-full relative transition-colors",
                                    isAutoSyncEnabled ? "bg-green-500" : "bg-zinc-700"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                                    isAutoSyncEnabled ? "translate-x-4" : "translate-x-0"
                                )} />
                            </button>
                        </div>

                        {/* Manual Sync Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                             <button
                                onClick={handleSync}
                                className={cn(
                                    "p-3 rounded-xl border border-white/10 flex flex-col items-center gap-2 transition-all active:scale-95",
                                    syncStatus === 'success' ? "bg-green-500/20 text-green-500 border-green-500/50" : 
                                    syncStatus === 'error' ? "bg-red-500/20 text-red-500 border-red-500/50" :
                                    "bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                {syncStatus === 'success' ? <Check size={20} /> : 
                                 syncStatus === 'error' ? <X size={20} /> :
                                 isSyncing ? <RefreshCw size={20} className="animate-spin" /> :
                                 <Upload size={20} />}
                                <span className="text-xs font-medium">Отправить</span>
                            </button>

                            <button
                                onClick={handleImport}
                                className={cn(
                                    "p-3 rounded-xl border border-white/10 flex flex-col items-center gap-2 transition-all active:scale-95",
                                    importStatus === 'success' ? "bg-green-500/20 text-green-500 border-green-500/50" : 
                                    importStatus === 'error' ? "bg-red-500/20 text-red-500 border-red-500/50" :
                                    "bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                {importStatus === 'success' ? <Check size={20} /> : 
                                 importStatus === 'error' ? <X size={20} /> :
                                 isSyncing ? <RefreshCw size={20} className="animate-spin" /> :
                                 <Download size={20} />}
                                <span className="text-xs font-medium">Скачать</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-medium ml-1">Web App URL</label>
                            <input 
                                className="w-full bg-zinc-950 p-4 rounded-xl border border-white/10 text-white focus:border-white/20 outline-none text-xs"
                                placeholder="https://script.google.com/macros/s/..."
                                value={tempUrl}
                                onChange={e => setTempUrl(e.target.value)}
                            />
                        </div>

                        <button 
                            onClick={saveSyncSettings}
                            className="w-full py-3 bg-white text-black rounded-xl font-bold active:scale-95 transition-transform"
                        >
                            Сохранить
                        </button>
                    </div>
                </motion.div>
             </>
        )}
      </AnimatePresence>
    </div>
  );
}