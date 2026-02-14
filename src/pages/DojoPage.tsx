import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Sword, Book, ChevronDown, X, Brain, RotateCcw, Check, Sparkles } from 'lucide-react';
import { useStore, type Objection, type Technique } from '../store/useStore';
import { cn } from '@/lib/utils';
import { LevelUpHeader } from '@/components/LevelUpHeader';

export default function DojoPage() {
  const [activeTab, setActiveTab] = useState<'objections' | 'techniques' | 'training'>('objections');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { objections, techniques, addObjection, addTechnique, deleteObjection, deleteTechnique } = useStore();

  const allTags = Array.from(new Set(objections.flatMap(o => o.tags)));
  
  const filteredObjections = objections.filter(o => {
    const matchesSearch = o.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? o.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const filteredTechniques = techniques.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full bg-black p-4 pb-24 text-zinc-100">
      <header className="mb-6 sticky top-0 z-10 bg-black/80 backdrop-blur-md pt-12 -mx-4 px-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
            <Sword className="text-red-500" /> Додзё
          </h1>
          {activeTab !== 'training' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
            >
              <Plus size={20} className="text-zinc-400" />
            </button>
          )}
        </div>

        <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab('objections')}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-md text-[13px] font-medium transition-all flex items-center justify-center gap-1.5",
              activeTab === 'objections' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Brain size={14} /> Возражения
          </button>
          <button
            onClick={() => setActiveTab('techniques')}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-md text-[13px] font-medium transition-all flex items-center justify-center gap-1.5",
              activeTab === 'techniques' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Book size={14} /> Техники
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-md text-[13px] font-medium transition-all flex items-center justify-center gap-1.5",
              activeTab === 'training' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Sparkles size={14} className="text-orange-400" /> Тренировка
          </button>
        </div>

        {activeTab !== 'training' && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-zinc-600"
            />
          </div>
        )}

        {activeTab === 'objections' && allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mt-3 no-scrollbar pb-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                selectedTag === null 
                  ? "bg-red-500/10 border-red-500/50 text-red-400" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              )}
            >
              Все
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                  selectedTag === tag
                    ? "bg-red-500/10 border-red-500/50 text-red-400" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="space-y-4">
        <LevelUpHeader />
        <AnimatePresence mode="wait">
          {activeTab === 'training' ? (
            <motion.div
              key="training"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <TrainingMode objections={objections} />
            </motion.div>
          ) : activeTab === 'objections' ? (
            <motion.div 
              key="objections"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {filteredObjections.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                  <p>Возражения не найдены.</p>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="mt-2 text-red-400 text-sm hover:underline"
                  >
                    Добавить первое
                  </button>
                </div>
              ) : (
                filteredObjections.map((obj) => (
                  <ObjectionCard key={obj.id} objection={obj} onDelete={deleteObjection} />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="techniques"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {filteredTechniques.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                  <p>Техники не сохранены.</p>
                </div>
              ) : (
                filteredTechniques.map((tech) => (
                  <TechniqueCard key={tech.id} technique={tech} onDelete={deleteTechnique} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddModal 
            type={activeTab === 'training' ? 'objections' : activeTab} 
            onClose={() => setShowAddModal(false)} 
            onAdd={(data) => {
              if (activeTab === 'objections' || activeTab === 'training') addObjection(data as any);
              else addTechnique(data as any);
              setShowAddModal(false);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TrainingMode({ objections }: { objections: Objection[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Objection[]>([]);

  useEffect(() => {
    setShuffledCards([...objections].sort(() => Math.random() - 0.5));
  }, [objections]);

  if (objections.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
        <Sparkles className="mx-auto text-zinc-600 mb-4" size={40} />
        <p className="text-zinc-400">Сначала добавь хотя бы одно возражение в Додзё</p>
      </div>
    );
  }

  const currentCard = shuffledCards[currentIndex];

  const handleNext = () => {
    setShowAnswer(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev < shuffledCards.length - 1 ? prev + 1 : 0));
    }, 200);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-xs text-zinc-500 font-medium px-1">
        <span>КАРТОЧКА {currentIndex + 1} ИЗ {shuffledCards.length}</span>
        <button 
          onClick={() => {
            setShuffledCards([...objections].sort(() => Math.random() - 0.5));
            setCurrentIndex(0);
            setShowAnswer(false);
          }}
          className="flex items-center gap-1 hover:text-zinc-300"
        >
          <RotateCcw size={12} /> ПЕРЕМЕШАТЬ
        </button>
      </div>

      <div 
        className="relative h-[300px] perspective-1000"
        onClick={() => setShowAnswer(!showAnswer)}
      >
        <motion.div
          animate={{ rotateY: showAnswer ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
          className="w-full h-full relative preserve-3d cursor-pointer"
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
            <span className="text-[10px] font-bold text-red-500/50 tracking-widest uppercase mb-4">Вопрос / Возражение</span>
            <h2 className="text-xl font-bold text-white leading-tight">
              {currentCard?.question}
            </h2>
            <p className="mt-8 text-xs text-zinc-500">Нажми, чтобы увидеть ответ</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-zinc-800 border border-zinc-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl [transform:rotateY(180deg)] overflow-y-auto">
            <span className="text-[10px] font-bold text-green-500/50 tracking-widest uppercase mb-4">Лучший ответ</span>
            <p className="text-zinc-200 leading-relaxed italic">
              «{currentCard?.answer}»
            </p>
            <div className="flex flex-wrap gap-1.5 mt-6 justify-center">
              {currentCard?.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 bg-zinc-900 rounded text-zinc-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleNext}
          className="flex-1 bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Check size={20} /> СЛЕДУЮЩЕЕ
        </button>
      </div>
      
      <p className="text-center text-xs text-zinc-500 px-4">
        Тренируйся каждый день, чтобы твои ответы стали автоматическими и уверенными.
      </p>
    </div>
  );
}

function ObjectionCard({ objection, onDelete }: { objection: Objection; onDelete: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      onClick={() => setIsExpanded(!isExpanded)}
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="p-4">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-zinc-200 leading-snug">{objection.question}</h3>
          <ChevronDown 
            size={16} 
            className={cn("text-zinc-500 transition-transform mt-1", isExpanded && "rotate-180")} 
          />
        </div>
        
        <div className="flex flex-wrap gap-1.5 mt-3">
          {objection.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-zinc-800/50 border-t border-zinc-800"
          >
            <div className="p-4 pt-3">
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{objection.answer}</p>
              <div className="flex justify-end mt-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(objection.id); }}
                  className="text-xs text-red-500/70 hover:text-red-500 px-2 py-1"
                >
                  Удалить
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TechniqueCard({ technique, onDelete }: { technique: Technique; onDelete: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      onClick={() => setIsExpanded(!isExpanded)}
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="p-4">
        <div className="flex justify-between items-center gap-2">
          <h3 className="font-medium text-zinc-200">{technique.title}</h3>
          <ChevronDown 
            size={16} 
            className={cn("text-zinc-500 transition-transform", isExpanded && "rotate-180")} 
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-zinc-800/50 border-t border-zinc-800"
          >
            <div className="p-4 pt-3">
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{technique.content}</p>
              <div className="flex justify-end mt-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(technique.id); }}
                  className="text-xs text-red-500/70 hover:text-red-500 px-2 py-1"
                >
                  Удалить
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AddModal({ type, onClose, onAdd }: { type: 'objections' | 'techniques', onClose: () => void, onAdd: (data: any) => void }) {
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'objections') {
      onAdd({
        question: q,
        answer: a,
        category: 'general',
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      });
    } else {
      onAdd({
        title: q,
        content: a,
        category: 'general'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">
            {type === 'objections' ? 'Добавить возражение' : 'Добавить технику'}
          </h2>
          <button onClick={onClose}><X size={20} className="text-zinc-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5 ml-1">
              {type === 'objections' ? 'Возражение / Вопрос' : 'Название'}
            </label>
            <input 
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50"
              placeholder={type === 'objections' ? "например: Дорого..." : "Название техники"}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5 ml-1">
              {type === 'objections' ? 'Ответ / Скрипт' : 'Описание'}
            </label>
            <textarea 
              value={a}
              onChange={e => setA(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 min-h-[100px]"
              placeholder="Напиши ответ здесь..."
              required
            />
          </div>

          {type === 'objections' && (
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 ml-1">
                Теги (через запятую)
              </label>
              <input 
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                placeholder="цена, сроки, доверие"
              />
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-white text-black font-medium py-3 rounded-xl mt-2 active:scale-[0.98] transition-transform"
          >
            Сохранить
          </button>
        </form>
      </motion.div>
    </div>
  );
}