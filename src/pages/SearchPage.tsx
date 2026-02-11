import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Smartphone, Hash, History, Shield, Lock, ExternalLink, Users, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
    username: string;
    id: string;
    phone?: string;
    names: string[];
    chats: string[];
    bio?: string;
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [useMockData, setUseMockData] = useState(false);
    const [searchedQuery, setSearchedQuery] = useState('');
    const [history, setHistory] = useState<string[]>(() => {
        const saved = localStorage.getItem('osint_history');
        return saved ? JSON.parse(saved) : [];
    });
    const [showSuggestions, setShowSuggestions] = useState(false);

    const addToHistory = (q: string) => {
        const cleanQ = q.trim().replace('@', '');
        if (!cleanQ) return;
        
        setHistory(prev => {
            const newHistory = [cleanQ, ...prev.filter(h => h !== cleanQ)].slice(0, 3);
            localStorage.setItem('osint_history', JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const handleSearch = async (overrideQuery?: string) => {
        const searchQuery = typeof overrideQuery === 'string' ? overrideQuery : query;
        if (!searchQuery.trim()) return;
        
        setShowSuggestions(false);
        setIsLoading(true);
        setResult(null);
        setSearchedQuery(searchQuery.replace('@', '')); // Clean username
        addToHistory(searchQuery);

        // Simulate network request
        setTimeout(() => {
            setIsLoading(false);
            
            if (useMockData) {
                setResult({
                    username: query.replace('@', ''),
                    id: '129405821',
                    phone: '+7 9** *** 45 12',
                    names: ['Alex Crypto', 'Alexey Ivanov', 'A.I.'],
                    chats: ['Crypto Signals 2024', 'React Developers', 'WorkLife Chat', 'Binance CIS'],
                    bio: 'Crypto enthusiast. DM for collaboration.'
                });
            }
        }, 800);
    };

    const openDork = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <div className="p-4 pb-32 space-y-6 min-h-full">
            {/* Header */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Shield className="text-blue-500" />
                    OSINT Search
                </h2>
                <p className="text-xs text-zinc-500">
                    Поиск по открытым источникам и базам данных.
                </p>
            </div>

            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="text-zinc-500" size={20} />
                </div>
                <input 
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="@username"
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:border-blue-500/50 outline-none transition-colors font-mono"
                />
                <button 
                    onClick={() => handleSearch()}
                    disabled={isLoading || !query}
                    className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Найти'}
                </button>

                {/* Suggestions */}
                <AnimatePresence>
                    {showSuggestions && query && history.some(h => h.toLowerCase().includes(query.toLowerCase().replace('@', ''))) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden z-20 shadow-xl"
                        >
                            {history
                                .filter(h => h.toLowerCase().includes(query.toLowerCase().replace('@', '')))
                                .map((h, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setQuery(h);
                                        handleSearch(h);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 text-sm text-zinc-300 transition-colors"
                                >
                                    <History size={14} className="text-zinc-500" />
                                    <span>{h}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Demo Toggle */}
            <div className="flex items-center gap-2 text-xs text-zinc-600 px-2">
                <button 
                    onClick={() => setUseMockData(!useMockData)}
                    className={cn(
                        "w-8 h-4 rounded-full relative transition-colors",
                        useMockData ? "bg-blue-500/20" : "bg-zinc-800"
                    )}
                >
                    <div className={cn(
                        "absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-all",
                        useMockData ? "bg-blue-500 translate-x-4" : "bg-zinc-600 translate-x-0"
                    )} />
                </button>
                <span>Demo Mode (Fake Data)</span>
            </div>

            {/* Web Intelligence (Always visible after search) */}
            <AnimatePresence>
                {searchedQuery && !result && !isLoading && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-lg shrink-0">
                                <Users className="text-blue-400" size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-blue-400">Как найти чаты пользователя?</h3>
                                <p className="text-xs text-blue-300/80 leading-relaxed">
                                    Telegram скрывает список чатов пользователя. Единственный способ их найти — использовать базы данных, которые индексируют участников публичных групп.
                                    <br/><br/>
                                    <strong>👇 Лучшие инструменты для этой задачи:</strong>
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            {/* Primary Chat Finders */}
                            <button 
                                onClick={() => openDork(`https://t.me/tgscan_another_robot?start=${searchedQuery}`)}
                                className="bg-zinc-900 border border-blue-500/30 p-4 rounded-2xl flex items-center justify-between hover:bg-zinc-800 transition-colors group relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                <div className="flex flex-col items-start pl-2">
                                    <span className="text-sm font-bold text-white flex items-center gap-2">
                                        TgScan (Updated)
                                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded">Working</span>
                                    </span>
                                    <span className="text-[10px] text-zinc-500 mt-1">Самый полный поиск групп (Бот)</span>
                                </div>
                                <ExternalLink size={16} className="text-blue-500" />
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => openDork(`https://lyzem.com/search?q=${searchedQuery}`)}
                                    className="bg-zinc-900 border border-white/5 p-3 rounded-2xl flex flex-col items-start justify-between hover:bg-zinc-800 transition-colors gap-2"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xs font-bold text-white">Lyzem</span>
                                        <ExternalLink size={12} className="text-zinc-600" />
                                    </div>
                                    <span className="text-[10px] text-zinc-500 leading-tight">Поиск сообщений юзера в чатах</span>
                                </button>

                                <button 
                                    onClick={() => openDork(`https://yandex.ru/search/?text=site%3At.me+%22${searchedQuery}%22`)}
                                    className="bg-zinc-900 border border-white/5 p-3 rounded-2xl flex flex-col items-start justify-between hover:bg-zinc-800 transition-colors gap-2"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xs font-bold text-white">Yandex</span>
                                        <ExternalLink size={12} className="text-zinc-600" />
                                    </div>
                                    <span className="text-[10px] text-zinc-500 leading-tight">Ищет лучше чем Google</span>
                                </button>
                            </div>

                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-4 ml-1">
                                Дополнительная разведка
                            </h3>

                            <button 
                                onClick={() => openDork(`https://cse.google.com/cse?cx=006368593537057042503:efxu7xprihg&q=${searchedQuery}`)}
                                className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-zinc-800 transition-colors group"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-white">Telegago</span>
                                    <span className="text-[10px] text-zinc-500">Google специально настроенный на Telegram</span>
                                </div>
                                <ExternalLink size={16} className="text-zinc-600 group-hover:text-white" />
                            </button>

                            <button 
                                onClick={() => openDork(`https://tgstat.ru/search?q=@${searchedQuery}`)}
                                className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-zinc-800 transition-colors group"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-white">TgStat</span>
                                    <span className="text-[10px] text-zinc-500">Где упоминался этот юзернейм</span>
                                </div>
                                <ExternalLink size={16} className="text-zinc-600 group-hover:text-white" />
                            </button>

                            <button 
                                onClick={() => openDork(`https://whatsmyname.app/?q=${searchedQuery}`)}
                                className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-zinc-800 transition-colors group"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-white">Sherlock (WhatsMyName)</span>
                                    <span className="text-[10px] text-zinc-500">Поиск этого ника в других соцсетях</span>
                                </div>
                                <ExternalLink size={16} className="text-zinc-600 group-hover:text-white" />
                            </button>

                            {/* Sherlock Mode Button */}
                            <button 
                                onClick={() => {
                                    openDork(`https://t.me/tgscan_another_robot?start=${searchedQuery}`);
                                    setTimeout(() => openDork(`https://lyzem.com/search?q=${searchedQuery}`), 500);
                                    setTimeout(() => openDork(`https://yandex.ru/search/?text=site%3At.me+%22${searchedQuery}%22`), 1000);
                                }}
                                className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-blue-900/20 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                                <Search size={18} className="text-white" />
                                <span className="text-sm font-bold text-white">Sherlock Mode (Открыть ВСЁ)</span>
                            </button>
                            <p className="text-[10px] text-center text-zinc-500">
                                * Если открылась только 1 вкладка — разрешите всплывающие окна
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mock Result (Existing Code) */}
            <AnimatePresence mode="wait">
                {result && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="space-y-4"
                    >
                        {/* Main Profile Card */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
                            
                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">@{result.username}</h3>
                                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
                                        <Hash size={12} />
                                        ID: {result.id}
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
                                    <Search size={24} />
                                </div>
                            </div>

                            {/* Phone Section */}
                            <div className="bg-black/20 rounded-xl p-3 mb-3 border border-white/5">
                                <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1 uppercase tracking-wider font-bold">
                                    <Smartphone size={12} />
                                    Телефон
                                </div>
                                <div className="text-lg font-mono text-blue-400 tracking-wide flex items-center gap-2">
                                    {result.phone || 'Не найден'}
                                    {result.phone && <Lock size={12} className="text-zinc-600" />}
                                </div>
                            </div>

                            {/* Bio */}
                            {result.bio && (
                                <p className="text-sm text-zinc-400 italic border-l-2 border-zinc-700 pl-3 py-1">
                                    "{result.bio}"
                                </p>
                            )}
                        </div>

                        {/* Name History */}
                        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5">
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <History size={16} className="text-purple-500" />
                                История имен
                            </h4>
                            <div className="space-y-2">
                                {result.names.map((name, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                                        <span className="text-zinc-300">{name}</span>
                                        <span className="text-xs text-zinc-600 font-mono">202{3-i}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chats */}
                        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5">
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <MessageSquare size={16} className="text-green-500" />
                                Чаты ({result.chats.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {result.chats.map((chat, i) => (
                                    <div key={i} className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs text-zinc-300 border border-white/5">
                                        {chat}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-center text-[10px] text-zinc-600 mt-8 max-w-[200px] mx-auto">
                            Information provided for educational purposes only. 
                            Use responsibly.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}