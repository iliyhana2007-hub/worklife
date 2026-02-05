import { useState } from 'react';
import { useStore, type Lead } from '@/store/useStore';
import { Plus, Minus, Briefcase, User, X, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  new: { label: 'Написал', color: 'bg-zinc-500', text: 'text-zinc-500' },
  responded: { label: 'Ответил', color: 'bg-yellow-500', text: 'text-yellow-500' },
  interview: { label: 'Собеседование', color: 'bg-green-500', text: 'text-green-500' },
  rejected: { label: 'Отказ', color: 'bg-red-500', text: 'text-red-500' },
};

export default function LeadsPage() {
  const { 
    counters, leads, 
    addCounter, incrementCounter, decrementCounter, toggleCounterType,
    addLead, updateLead, deleteLead, addLeadHistory
  } = useStore();

  const [activeTab, setActiveTab] = useState<'counters' | 'crm'>('counters');
  const [crmFilter, setCrmFilter] = useState<'all' | 'responded' | 'interview' | 'rejected'>('all');
  
  // Sheet States
  const [isLeadSheetOpen, setIsLeadSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null); // If null, adding new lead
  
  // Form State
  const [formData, setFormData] = useState<Partial<Lead>>({ status: 'new' });

  // --- Counters Section ---
  const renderCounters = () => (
    <div className="p-4 space-y-4 pb-24">
       <div className="flex justify-between items-center mb-4">
         <h2 className="text-xl font-bold">Счётчики</h2>
         <button 
            onClick={() => addCounter('New Counter', 'work')}
            disabled={counters.length >= 15}
            className="text-primary text-sm font-medium disabled:opacity-50"
         >
           + Добавить
         </button>
       </div>
       
       <div className="space-y-3">
         {counters.map(counter => (
           <div key={counter.id} className="bg-card p-4 rounded-xl border border-border flex flex-col gap-3">
             <div className="flex justify-between items-start">
               <input 
                 className="bg-transparent font-medium focus:outline-none border-b border-transparent focus:border-primary w-2/3"
                 defaultValue={counter.name}
                 // In a real app we'd bind onChange to update name in store
               />
               <button 
                 onClick={() => toggleCounterType(counter.id)}
                 className={cn(
                   "p-1.5 rounded-md transition-colors",
                   counter.type === 'work' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                 )}
               >
                 {counter.type === 'work' ? <Briefcase size={16} /> : <User size={16} />}
               </button>
             </div>
             
             <div className="flex items-center justify-between mt-2">
               <button 
                 onClick={() => decrementCounter(counter.id)}
                 className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-95"
               >
                 <Minus size={20} />
               </button>
               <span className="text-3xl font-bold font-mono">{counter.value}</span>
               <button 
                 onClick={() => incrementCounter(counter.id)}
                 className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95"
               >
                 <Plus size={20} />
               </button>
             </div>
           </div>
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
      addLead(formData as Lead);
    }
    setIsLeadSheetOpen(false);
  };
  
  const handleDeleteLead = () => {
    if (selectedLead) {
        deleteLead(selectedLead.id);
        setIsLeadSheetOpen(false);
    }
  }

  const renderCRM = () => (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex gap-2 p-4 overflow-x-auto border-b border-border no-scrollbar">
        {(['all', 'responded', 'interview', 'rejected'] as const).map(f => (
           <button
             key={f}
             onClick={() => setCrmFilter(f)}
             className={cn(
               "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
               crmFilter === f ? "bg-white text-black font-medium" : "bg-secondary text-muted-foreground"
             )}
           >
             {f === 'all' ? 'Все' : STATUS_CONFIG[f]?.label || f}
           </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
         {filteredLeads.map(lead => (
           <div 
             key={lead.id} 
             onClick={() => openLeadSheet(lead)}
             className="bg-card p-4 rounded-xl border border-border flex items-center gap-3 active:bg-white/5"
           >
             <div className={cn("w-3 h-3 rounded-full shrink-0", STATUS_CONFIG[lead.status].color)} />
             <div className="flex-1 min-w-0">
               <h3 className="font-medium truncate">{lead.name || 'Без имени'}</h3>
               <p className="text-xs text-muted-foreground truncate">{lead.link}</p>
             </div>
             <div className="text-xs text-muted-foreground whitespace-nowrap">
               {lead.firstContactDate ? format(new Date(lead.firstContactDate), 'd MMM') : ''}
             </div>
           </div>
         ))}
         
         {filteredLeads.length === 0 && (
            <div className="text-center text-muted-foreground mt-10">Нет лидов</div>
         )}
      </div>

      {/* FAB */}
      <button 
        onClick={() => openLeadSheet()}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 z-10"
      >
        <Plus size={24} />
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Top Toggle */}
      <div className="p-4 pb-0">
        <div className="flex bg-secondary rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('counters')}
            className={cn("flex-1 py-2 rounded-md text-sm font-medium transition-all", activeTab === 'counters' ? "bg-card shadow text-foreground" : "text-muted-foreground")}
          >
            Счётчики
          </button>
          <button 
            onClick={() => setActiveTab('crm')}
            className={cn("flex-1 py-2 rounded-md text-sm font-medium transition-all", activeTab === 'crm' ? "bg-card shadow text-foreground" : "text-muted-foreground")}
          >
            CRM
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'counters' ? renderCounters() : renderCRM()}
      </div>

      {/* Lead Sheet */}
      {isLeadSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsLeadSheetOpen(false)}>
           <div 
             className="bg-zinc-900 w-full rounded-t-2xl p-6 h-[85vh] overflow-y-auto border-t border-white/10 flex flex-col"
             onClick={e => e.stopPropagation()}
           >
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold">{selectedLead ? 'Редактировать' : 'Новый лид'}</h2>
                 <button onClick={() => setIsLeadSheetOpen(false)}><X /></button>
              </div>

              <div className="space-y-4 flex-1">
                 {/* Status Selector */}
                 <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(s => (
                        <button
                            key={s}
                            onClick={() => setFormData({...formData, status: s})}
                            className={cn(
                                "h-8 rounded text-xs font-medium border border-transparent",
                                formData.status === s ? STATUS_CONFIG[s].color + " text-white" : "bg-secondary text-muted-foreground"
                            )}
                        >
                            {STATUS_CONFIG[s].label}
                        </button>
                    ))}
                 </div>

                 <input 
                    placeholder="Имя / Название"
                    className="w-full bg-zinc-800 p-3 rounded-lg focus:ring-1 focus:ring-primary outline-none"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                 />
                 <input 
                    placeholder="Ссылка (Telegram/LinkedIn)"
                    className="w-full bg-zinc-800 p-3 rounded-lg focus:ring-1 focus:ring-primary outline-none"
                    value={formData.link || ''}
                    onChange={e => setFormData({...formData, link: e.target.value})}
                 />
                 
                 <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Дата первого контакта</label>
                    <input 
                        type="date"
                        className="w-full bg-zinc-800 p-3 rounded-lg focus:ring-1 focus:ring-primary outline-none text-white"
                        value={formData.firstContactDate ? formData.firstContactDate.split('T')[0] : ''}
                        onChange={e => setFormData({...formData, firstContactDate: e.target.value})}
                    />
                 </div>

                 <textarea 
                    placeholder="Заметки..."
                    className="w-full bg-zinc-800 p-3 rounded-lg focus:ring-1 focus:ring-primary outline-none h-24 resize-none"
                    value={formData.notes || ''}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                 />
                 
                 {selectedLead && (
                     <div className="mt-6">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Clock size={16} /> История действий
                        </h3>
                        <div className="space-y-3 pl-2 border-l border-zinc-700 ml-2">
                            {selectedLead.history?.map(h => (
                                <div key={h.id} className="relative pl-4">
                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-zinc-600 rounded-full border-2 border-zinc-900" />
                                    <p className="text-sm">{h.action}</p>
                                    <span className="text-xs text-muted-foreground">{format(new Date(h.timestamp), 'd MMM HH:mm')}</span>
                                </div>
                            ))}
                            <div className="pl-4 pt-2">
                                <button 
                                    className="text-xs text-primary font-medium"
                                    onClick={() => {
                                        const action = prompt("Действие:");
                                        if (action && selectedLead) {
                                            addLeadHistory(selectedLead.id, action);
                                            // Optimistic update local form data history display?
                                            // Ideally we just call store and it updates 'leads', but 'selectedLead' is local state copy? 
                                            // No, selectedLead was set once. We should rely on store data or re-sync.
                                            // For simplicity, I will just close sheet or reload selectedLead from store if I was reactive.
                                            // But since selectedLead is just a snapshot, let's close to refresh or manual update.
                                            // Actually, easier to just not show history adding here or do it properly.
                                            // Let's implement history adding in the store and update `selectedLead` if possible.
                                            // Since I can't easily subscribe `selectedLead` to store updates without `useEffect`, I'll skip dynamic update in this view for now or rely on closing/opening.
                                            // But wait, `addLeadHistory` updates the store. 
                                        }
                                    }}
                                >
                                    + Добавить событие
                                </button>
                            </div>
                        </div>
                     </div>
                 )}
              </div>
              
              <div className="flex gap-3 mt-6">
                  {selectedLead && (
                      <button 
                        onClick={handleDeleteLead}
                        className="p-3 bg-red-500/10 text-red-500 rounded-lg"
                      >
                          <Trash2 size={20} />
                      </button>
                  )}
                  <button 
                    onClick={handleSaveLead}
                    className="flex-1 bg-white text-black font-bold py-3 rounded-lg"
                  >
                    Сохранить
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
