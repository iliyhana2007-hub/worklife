import { motion } from 'framer-motion';
import { User, Briefcase } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SmokeBreaker } from './SmokeBreaker';
import { calculateLevel } from '../utils/xpUtils';

export function LevelUpHeader() {
  const { xp } = useStore();

  const getProgress = (points: number) => {
    const level = calculateLevel(points);
    const currentLevelBase = (level - 1) * (level - 1) * 100;
    const nextLevelBase = level * level * 100;
    return ((points - currentLevelBase) / (nextLevelBase - currentLevelBase)) * 100;
  };

  const charLevel = calculateLevel(xp.character);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-bold text-white">Твой прогресс</h2>
        <SmokeBreaker />
      </div>

      <div className="space-y-4">
        {/* Character Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-zinc-400">
            <span className="flex items-center gap-1.5">
              <User size={12} className="text-purple-400" /> Уровень {charLevel}
            </span>
            <span>{Math.round(getProgress(xp.character))}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${getProgress(xp.character)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
