import { useStore, type XpResetFrequency } from '../store/useStore';
import { Settings, RefreshCw, Moon, Sun, Bell, Volume2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { settings, setSettings, resetXP } = useStore();

  const handleFrequencyChange = (freq: XpResetFrequency) => {
    setSettings({ xpResetFrequency: freq });
  };

  const frequencies: { value: XpResetFrequency; label: string }[] = [
    { value: 'daily', label: 'Ежедневно' },
    { value: 'weekly', label: 'Еженедельно' },
    { value: 'monthly', label: 'Ежемесячно' },
    { value: 'yearly', label: 'Ежегодно' },
    { value: 'never', label: 'Никогда' },
  ];

  return (
    <div className="pb-24 pt-6 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-zinc-400" size={24} />
        <h1 className="text-2xl font-bold text-white">Настройки</h1>
      </div>

      <div className="space-y-8">
        {/* XP Reset Section */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="text-blue-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Сброс Прогресса</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-3">Как часто сбрасывать уровень?</label>
              <div className="grid grid-cols-2 gap-2">
                {frequencies.map((freq) => (
                  <button
                    key={freq.value}
                    onClick={() => handleFrequencyChange(freq.value)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      settings.xpResetFrequency === freq.value
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                    if (window.confirm('Ты уверен? Это действие сбросит весь текущий уровень и опыт до 0.')) {
                        resetXP();
                    }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/20"
              >
                <ShieldAlert size={18} />
                <span>Сбросить уровень сейчас</span>
              </button>
              <p className="text-xs text-zinc-500 mt-2 text-center">
                Используй это, если возник баг или ты хочешь начать заново.
              </p>
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
