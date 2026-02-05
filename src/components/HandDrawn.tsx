import { motion } from 'framer-motion';

export const StrikeThrough = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    preserveAspectRatio="none"
  >
    <motion.path
      d="M5 85 Q 30 70, 50 80 T 95 75"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.8 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    />
  </svg>
);

export const Cross = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className}
    style={{ overflow: 'visible' }}
  >
    <motion.path
      d="M20 20 L80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.8 }}
      transition={{ duration: 0.3 }}
    />
    <motion.path
      d="M80 20 L20 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.8 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    />
  </svg>
);

export const Underline = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 200 20" 
    className={className} 
    preserveAspectRatio="none"
  >
    <motion.path
      d="M5 10 Q 50 15, 100 5 T 195 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  </svg>
);
