export const calculateLevel = (points: number): number => {
  return Math.floor(Math.sqrt(points / 100)) + 1;
};

export const calculateTaskReward = (level: number): number => {
  return level * 10;
};
