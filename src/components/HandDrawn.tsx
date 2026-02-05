export const StrikeThrough = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    preserveAspectRatio="none"
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
  >
    <path
      d="M 10,80 Q 50,20 90,30"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      className="opacity-80"
    />
  </svg>
);

export const Cross = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    style={{ position: 'absolute', top: '10%', left: '10%', width: '80%', height: '80%', pointerEvents: 'none' }}
  >
    <path
      d="M 10,10 L 90,90 M 90,10 L 10,90"
      fill="none"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
      className="opacity-80"
    />
  </svg>
);
