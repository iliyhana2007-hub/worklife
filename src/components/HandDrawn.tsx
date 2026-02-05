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

export const RowStrikeThrough = ({ className, variant = 0 }: { className?: string; variant?: number }) => {
  // Variations based on the screenshot style (messy, wavy, looping red lines)
  const variants = [
    // Variant 1: Gentle wave with a dip (Top-ish style)
    {
      d: "M5 20 C 50 15, 80 35, 120 30 S 200 10, 250 25 S 350 35, 395 15",
      width: 2.5
    },
    // Variant 2: Loop/knot in the middle
    {
      d: "M5 25 C 40 35, 70 15, 100 25 C 115 28, 105 38, 125 35 C 160 25, 240 28, 290 25 C 340 22, 370 28, 395 25",
      width: 2.8
    },
    // Variant 3: Flat with sharp deviations
    {
      d: "M5 28 C 45 28, 65 18, 85 32 C 105 38, 145 28, 195 30 C 275 32, 345 28, 395 22",
      width: 2.4
    },
    // Variant 4: Messy scribbly wave
    {
      d: "M5 32 C 55 28, 75 38, 95 32 C 105 28, 100 42, 115 38 C 175 28, 215 32, 245 30 C 275 26, 315 38, 345 32 C 365 30, 375 28, 395 25",
      width: 2.6
    }
  ];

  const currentVariant = variants[variant % variants.length];

  return (
    <svg 
      viewBox="0 0 400 50" 
      className={className} 
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      <motion.path
        d={currentVariant.d}
        fill="none"
        stroke="currentColor"
        strokeWidth={currentVariant.width}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.9 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      {/* Optional subtle duplicate for marker feel */}
      <motion.path
        d={currentVariant.d}
        fill="none"
        stroke="currentColor"
        strokeWidth={currentVariant.width * 0.5}
        strokeLinecap="round"
        opacity="0.3"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.3 }}
        transition={{ duration: 0.5, delay: 0.05, ease: "easeInOut" }}
        style={{ transform: 'translateY(1px)' }}
      />
    </svg>
  );
};

export const BigMonthCross = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className}
    style={{ overflow: 'visible' }}
    preserveAspectRatio="none"
  >
    <motion.path
      d="M10 10 Q 50 50, 90 90"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.8 }}
      transition={{ duration: 0.4 }}
    />
    <motion.path
      d="M90 10 Q 50 50, 10 90"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.8 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    />
  </svg>
);
