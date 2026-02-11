import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, X } from 'lucide-react';

export function SmokeBreaker() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = () => {
    setIsOpen(true);
    setIsActive(true);
    setTimeLeft(120);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <button 
        onClick={handleStart}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-full transition-colors group"
      >
        <Wind size={14} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200">Таймер</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm flex flex-col items-center"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-zinc-300"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold text-white mb-8 text-center">
                {timeLeft > 0 ? "Подожди 2 минуты..." : "Ты управляешь собой."}
              </h2>
              
              <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                {/* Breathing Animation Circle */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    borderWidth: ["1px", "4px", "1px"]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  className="w-48 h-48 rounded-full border border-blue-500/50 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm relative z-10"
                >
                  <span className="text-4xl font-mono font-bold text-blue-100 tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                </motion.div>
              </div>

              <p className="text-zinc-400 text-center text-sm max-w-[250px] leading-relaxed">
                {timeLeft > 60 
                  ? "Сделай глубокий вдох. Медленно вдохни... Выдохни..." 
                  : timeLeft > 0 
                    ? "Заметь желание. Это просто чувство. Оно пройдет."
                    : "Если все еще хочешь курить — можешь. Но ты выбрал подождать. Это победа."
                }
              </p>

              {timeLeft === 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
                >
                  Закрыть
                </motion.button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
