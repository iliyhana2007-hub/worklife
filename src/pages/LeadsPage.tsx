import { useState } from 'react';
import { useStore, type Lead } from '@/store/useStore';
import { Plus, Minus, Briefcase, User, Clock, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Underline } from '@/components/HandDrawn';

const STATUS_CONFIG = {
  new: { label: 'Написал', color: 'bg-zinc-500', text: 'text-zinc-500', border: 'border-zinc-500/20' },
  responded: { label: 'Ответил', color: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500/20' },
  interview: { label: 'Собес', color: 'bg-green-500', text: 'text-green-500', border: 'border-green-500/20' },
  rejected: { label: 'Отказ', color: 'bg-red-500', text: 'text-red-500', border: 'border-red-500/20' },
};

export default function LeadsPage() {
  const { 
    counters, leads, 
    addCounter, incrementCounter, decrementCounter, toggleCounterType, updateCounterName,
    addLead, updateLead, deleteLead
  } = useStore();

  const [activeTab, setActiveTab] = useState<'counters' | 'crm'>('counters');
  const [crmFilter, setCrmFilter] = useState<'all' | 'new' | 'responded' | 'interview' | 'rejected'>('all');
  
  // Sheet States
  const [isLeadSheetOpen, setIsLeadSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null); // If null, adding new lead
  
  // Form State
  const [formData, setFormData] = useState<Partial<Lead>>({ status: 'new' });

  // --- Counters Section ---
  const renderCounters = () => (
    <div className="p-4 space-y-4 pb-32">
       <div className="flex justify-between items-center mb-2">
         <div className="relative">
           <h2 className="text-2xl font-bold text-white relative z-10">Счётчики</h2>
           <Underline className="absolute -bottom-1 left-0 w-full h-3 text-blue-500/50" />
         </div>
         <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => addCounter('New Counter', 'work')}
            disabled={counters.length >= 15}
            className="px-4 py-2 bg-white text-black rounded-xl text-sm font-semibold disabled:opacity-50"
         >
           + Добавить
         </motion.button>
       </div>
       
       <div className="grid gap-4">
         {counters.map(counter => (
           <motion.div 
             layout
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             key={counter.id} 
             className="bg-card/50 backdrop-blur-sm p-5 rounded-3xl border border-white/5 flex flex-col gap-4 shadow-lg relative overflow-hidden"
           >
             {/* Background glow based on type */}
             <div className={cn(
               "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-2xl rounded-full -mr-10 -mt-10",
               counter.type === 'work' ? "from-blue-500 to-indigo-500" : "from-purple-500 to-pink-500"
             )} />

             <div className="flex justify-between items-start relative z-10">
               <input 
                 className="bg-transparent text-lg font-medium focus:outline-none border-b border-transparent focus:border-white/20 w-2/3 text-white placeholder:text-zinc-600"
                 value={counter.name}
                 onChange={(e) => updateCounterName(counter.id, e.target.value)}
                 placeholder="Название..."
               />
               <motion.button 
                 whileTap={{ scale: 0.9 }}
                 onClick={() => toggleCounterType(counter.id)}
                 className={cn(
                   "p-2 rounded-xl transition-colors flex items-center gap-2 text-xs font-semibold",
                   counter.type === 'work' ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                 )}
               >
                 {counter.type === 'work' ? <Briefcase size={14} /> : <User size={14} />}
                 {counter.type === 'work' ? 'Рабочий' : 'Личный'}
               </motion.button>
             </div>
             
             <div className="flex items-center justify-between mt-2 relative z-10">
               <motion.button 
                 whileTap={{ scale: 0.8 }}
                 onClick={() => decrementCounter(counter.id)}
                 className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/5 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
               >
                 <Minus size={24} />
               </motion.button>
               <span className="text-4xl font-bold font-mono text-white tabular-nums tracking-tighter">{counter.value}</span>
               <motion.button 
                 whileTap={{ scale: 0.8 }}
                 onClick={() => incrementCounter(counter.id)}
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
  const filteredLeads = leads.filter(l => {
    if (crmFilter === 'all') return true;
    return l.status === crmFilter;
  });

  const openLeadSheet = (lead?: Lead) => {
    setSelectedLead(lead || null);
    setFormData(lead || { status: 'new', history: [] });
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
                <h2 className="text-2xl font-bold text-white relative z-10">CRM</h2>
                <Underline className="absolute -bottom-1 left-0 w-full h-3 text-purple-500/50" />
            </div>
            <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => openLeadSheet()}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-lg"
            >
                <Plus size={24} />
            </motion.button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
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
                            ? "bg-white text-black border-white" 
                            : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700"
                    )}
                >
                    {f.label}
                </button>
            ))}
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
                        <span className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                            STATUS_CONFIG[lead.status]?.text,
                            STATUS_CONFIG[lead.status]?.border,
                            "bg-transparent"
                        )}>
                            {STATUS_CONFIG[lead.status]?.label}
                        </span>
                    </div>
                    {lead.link && (
                        <a href={lead.link} target="_blank" onClick={e => e.stopPropagation()} className="text-xs text-blue-400 hover:underline block mb-2 truncate">
                            {lead.link}
                        </a>
                    )}
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
    <div className="h-full flex flex-col bg-background pt-safe-top">
      {/* Top Tabs */}
      <div className="flex p-2 bg-card/30 backdrop-blur-md mx-4 mt-2 rounded-2xl border border-white/5">
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
            onClick={() => setActiveTab('crm')}
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
                            className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg active:scale-95 transition-transform mt-4"
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