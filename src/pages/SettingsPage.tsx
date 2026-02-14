import { useStore } from '../store/useStore';
import { 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  Volume2, 
  Zap,
  Plus,
  Trash,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function SettingsPage() {
  const { settings, setSettings, habits, addHabit, deleteHabit } = useStore();
  const [newHabitName, setNewHabitName] = useState('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'habits'>('tasks');

  const xpSettings = settings.xpSettings || {
    tasks: { low: 5, medium: 10, high: 20 },
    habits: { low: 10, medium: 15, high: 25 }
  };

  const updateReward = (type: 'tasks' | 'habits', key: 'low' | 'medium' | 'high', value: number) => {
    setSettings({
      xpSettings: {
        ...xpSettings,
        [type]: {
          ...xpSettings[type],
          [key]: value
        }
      }
    });
  };

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      addHabit({
        name: newHabitName.trim(),
        frequency: 'daily',
        color: '#FFD60A',
        icon: 'zap'
      });
      setNewHabitName('');
    }
  };

  return (
    <div className="pb-24 pt-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-zinc-400" size={24} />
        <h1 className="text-2xl font-bold text-white">Настройки</h1>
      </div>

      <div className="space-y-8">
        {/* Habit Management Section */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-yellow-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Мои Привычки</h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                placeholder="Название привычки..."
                className="flex-1 bg-zinc-800 border-zinc-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
              />
              <button 
                onClick={handleAddHabit}
                className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-black active:scale-95 transition-transform"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar pr-1">
              <AnimatePresence>
                {habits.map((habit) => (
                  <motion.div 
                    key={habit.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl border border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-yellow-500">
                        <Zap size={16} fill="currentColor" />
                      </div>
                      <span className="text-sm font-medium text-white">{habit.name}</span>
                    </div>
                    <button 
                      onClick={() => deleteHabit(habit.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {habits.length === 0 && (
                <div className="text-center py-6 text-zinc-600 text-sm italic">
                  Нет активных привычек. Добавь первую!
                </div>
              )}
            </div>
          </div>
        </section>

        {/* XP Rewards Section */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Award className="text-emerald-400" size="20" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Награды XP</h2>
              <p className="text-xs text-zinc-500">Настрой фиксированные награды за активность</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-zinc-800 p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'tasks' ? "bg-emerald-500 text-black" : "text-zinc-500"
              }`}
            >
              Задачи
            </button>
            <button
              onClick={() => setActiveTab('habits')}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'habits' ? "bg-emerald-500 text-black" : "text-zinc-500"
              }`}
            >
              Привычки
            </button>
          </div>

          <div className="space-y-6">
            {(['low', 'medium', 'high'] as const).map((key) => (
              <div key={key} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      key === 'high' ? 'bg-red-500' : key === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-sm font-medium text-zinc-300 capitalize">
                      {key === 'high' ? 'Высокая' : key === 'medium' ? 'Средняя' : 'Низкая'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                    {xpSettings[activeTab][key]} XP
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={xpSettings[activeTab][key]}
                  onChange={(e) => updateReward(activeTab, key, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            ))}
            
            <div className="pt-2">
              <div className="p-3 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
                <div className="flex gap-2 items-start">
                  <TrendingUp size={14} className="text-zinc-500 mt-0.5" />
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {activeTab === 'tasks' 
                      ? "За задачи награда умножается на уровень задачи. Например, при 10 XP за среднюю сложность и 2 уровне задачи вы получите 20 XP." 
                      : "За выполнение привычки вы получите фиксированное количество опыта в зависимости от выбранной сложности."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Moon className="text-purple-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Внешний вид</h2>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-zinc-300">Тема приложения</span>
            <div className="flex bg-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setSettings({ theme: 'light' })}
                className={`p-2 rounded-md transition-all ${
                  settings.theme === 'light' ? 'bg-zinc-600 text-white' : 'text-zinc-500'
                }`}
              >
                <Sun size={16} />
              </button>
              <button
                onClick={() => setSettings({ theme: 'dark' })}
                className={`p-2 rounded-md transition-all ${
                  settings.theme === 'dark' ? 'bg-zinc-600 text-white' : 'text-zinc-500'
                }`}
              >
                <Moon size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Notifications & Sound */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-yellow-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Уведомления и Звук</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-zinc-400" />
                <span className="text-zinc-300">Уведомления</span>
              </div>
              <button
                onClick={() => setSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.notificationsEnabled ? 'bg-green-500' : 'bg-zinc-700'
                }`}
              >
                <motion.div
                  initial={false}
                  animate={{ x: settings.notificationsEnabled ? 24 : 2 }}
                  className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-zinc-400" />
                <span className="text-zinc-300">Звуковые эффекты</span>
              </div>
              <button
                onClick={() => setSettings({ soundEnabled: !settings.soundEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.soundEnabled ? 'bg-green-500' : 'bg-zinc-700'
                }`}
              >
                <motion.div
                  initial={false}
                  animate={{ x: settings.soundEnabled ? 24 : 2 }}
                  className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
