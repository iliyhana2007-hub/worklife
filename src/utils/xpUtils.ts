export const calculateLevel = (points: number): number => {
  return Math.floor(Math.sqrt(points / 100)) + 1;
};

export const calculateTaskReward = (
  level: number, 
  difficulty: 'low' | 'medium' | 'high' = 'medium',
  customSettings?: { low: number; medium: number; high: number }
): number => {
  const defaultSettings = {
    low: 5,
    medium: 10,
    high: 20
  };
  const rewards = customSettings || defaultSettings;
  return rewards[difficulty] * level;
};

export const calculateHabitReward = (
  difficulty: 'low' | 'medium' | 'high' = 'medium',
  customSettings?: { low: number; medium: number; high: number }
): number => {
  const defaultSettings = {
    low: 10,
    medium: 15,
    high: 25
  };
  const rewards = customSettings || defaultSettings;
  return rewards[difficulty];
};
