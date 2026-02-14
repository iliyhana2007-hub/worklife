import { motion } from 'framer-motion';
import { Rocket, Sparkles, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SmokeBreaker } from './SmokeBreaker';
import { calculateLevel } from '../utils/xpUtils';

export function LevelUpHeader() {
  const { xp, marathons, activeMarathonId } = useStore();
  const activeMarathon = marathons.find(m => m.id === activeMarathonId);

  const getProgress = (points: number) => {
    const level = calculateLevel(points);
    const currentLevelBase = (level - 1) * (level - 1) * 100;
    const nextLevelBase = level * level * 100;
    return ((points - currentLevelBase) / (nextLevelBase - currentLevelBase)) * 100;
  };

  const globalLevel = calculateLevel(xp.total);

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-[2rem] p-5 mb-8 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 blur-[100px] rounded-full group-hover:bg-indigo-600/20 transition-colors duration-700" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-600/10 blur-[100px] rounded-full group-hover:bg-violet-600/20 transition-colors duration-700" />

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Shield size={20} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Твой прогресс</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Путь к следующему уровню</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {activeMarathon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl shadow-lg shadow-indigo-500/5"
            >
              <Rocket size={12} className="text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                x{activeMarathon.multiplier}
              </span>
            </motion.div>
          )}
          <SmokeBreaker />
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Global Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Текущий</span>
              <span className="flex items-center gap-2 text-lg font-black text-white tracking-tighter">
                LVL {globalLevel}
                <Sparkles size={14} className="text-indigo-400" />
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 block">Прогресс</span>
              <span className="text-lg font-black text-indigo-400 tracking-tighter">
                {Math.round(getProgress(xp.total))}%
              </span>
            </div>
          </div>
          
          <div className="h-3 bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/30 p-0.5 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${getProgress(xp.total)}%` }}
              transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="h-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 rounded-full relative group"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
