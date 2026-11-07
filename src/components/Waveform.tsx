import React, { useMemo } from 'react';

interface WaveformProps {
  level: number; // 0.0 - 1.0
  active: boolean;
  color?: string;
  barsCount?: number;
}

export const Waveform: React.FC<WaveformProps> = ({
  level,
  active,
  color = '#06b6d4',
  barsCount = 20,
}) => {
  // Generate bar heights based on level and slight pseudo-random frequencies
  const bars = useMemo(() => {
    return Array.from({ length: barsCount }, (_, i) => {
      if (!active || level < 0.01) {
        return 4; // idle baseline
      }
      // Distribute heights across spectrum
      const factor = Math.sin((i / (barsCount - 1)) * Math.PI);
      const randomJitter = 0.7 + Math.random() * 0.6;
      const height = Math.max(4, Math.min(32, level * 36 * factor * randomJitter));
      return height;
    });
  }, [level, active, barsCount]);

  return (
    <div className="flex items-center justify-center gap-[3px] h-8 px-2">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-75"
          style={{
            height: `${h}px`,
            backgroundColor: color,
            opacity: active ? (h > 6 ? 0.9 : 0.4) : 0.25,
          }}
        />
      ))}
    </div>
  );
};

