import React, { useMemo } from 'react';
import { OrbState } from '../types';

interface OrbProps {
  state: OrbState;
  audioLevel?: number; // 0.0 to 1.0
  size?: number; // in pixels
  onClick?: () => void;
  showStatusLabel?: boolean;
}

export const Orb: React.FC<OrbProps> = ({
  state,
  audioLevel = 0,
  size = 72,
  onClick,
  showStatusLabel = false,
}) => {
  // Determine state-based theme colors
  const colorConfig = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          glow: 'rgba(16, 185, 129, 0.65)',
          coreFrom: '#10b981',
          coreTo: '#06b6d4',
          ring: 'rgba(52, 211, 153, 0.4)',
          label: 'Listening...',
        };
      case 'thinking':
        return {
          glow: 'rgba(139, 92, 246, 0.65)',
          coreFrom: '#8b5cf6',
          coreTo: '#ec4899',
          ring: 'rgba(167, 139, 250, 0.4)',
          label: 'Thinking...',
        };
      case 'speaking':
        return {
          glow: 'rgba(6, 182, 212, 0.8)',
          coreFrom: '#06b6d4',
          coreTo: '#3b82f6',
          ring: 'rgba(103, 232, 249, 0.5)',
          label: 'Speaking...',
        };
      case 'executing':
        return {
          glow: 'rgba(245, 158, 11, 0.7)',
          coreFrom: '#f59e0b',
          coreTo: '#ef4444',
          ring: 'rgba(251, 191, 36, 0.4)',
          label: 'Executing Task...',
        };
      case 'completed':
        return {
          glow: 'rgba(16, 185, 129, 0.9)',
          coreFrom: '#10b981',
          coreTo: '#34d399',
          ring: 'rgba(16, 185, 129, 0.6)',
          label: 'Completed',
        };
      case 'error':
        return {
          glow: 'rgba(239, 68, 68, 0.8)',
          coreFrom: '#ef4444',
          coreTo: '#f43f5e',
          ring: 'rgba(248, 113, 113, 0.5)',
          label: 'Needs Attention',
        };
      case 'idle':
      default:
        return {
          glow: 'rgba(6, 182, 212, 0.45)',
          coreFrom: '#06b6d4',
          coreTo: '#6366f1',
          ring: 'rgba(148, 163, 184, 0.2)',
          label: 'VISP Ready',
        };
    }
  }, [state]);

  // Reactive scale based on audio input level
  const reactiveScale = 1 + Math.min(0.35, audioLevel * 0.45);

  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-center cursor-pointer select-none group"
      style={{ width: size, height: size }}
    >
      {/* Outer Glow Halo */}
      <div
        className="absolute rounded-full transition-all duration-300 pointer-events-none"
        style={{
          width: size * 1.5,
          height: size * 1.5,
          background: `radial-gradient(circle, ${colorConfig.glow} 0%, transparent 70%)`,
          transform: `scale(${reactiveScale})`,
          opacity: state === 'idle' ? 0.6 : 0.9,
          filter: 'blur(10px)',
        }}
      />

      {/* Orbiting / Rotating Ring for executing state */}
      {state === 'executing' && (
        <div
          className="absolute rounded-full border-2 border-dashed border-amber-400 animate-spin"
          style={{
            width: size * 1.25,
            height: size * 1.25,
            animationDuration: '3s',
          }}
        />
      )}

      {/* Ripple ring for speaking or listening */}
      {(state === 'speaking' || state === 'listening') && (
        <div
          className="absolute rounded-full border border-cyan-400/30 animate-ping pointer-events-none"
          style={{
            width: size * 1.2,
            height: size * 1.2,
            animationDuration: state === 'listening' ? '2s' : '1.2s',
          }}
        />
      )}

      {/* Central Glass Orb Body */}
      <div
        className="relative rounded-full transition-transform duration-150 flex items-center justify-center shadow-2xl"
        style={{
          width: size,
          height: size,
          transform: `scale(${reactiveScale})`,
          background: `linear-gradient(135deg, ${colorConfig.coreFrom} 0%, ${colorConfig.coreTo} 100%)`,
          boxShadow: `0 0 ${size * 0.4}px ${colorConfig.glow}, inset 0 2px 4px rgba(255, 255, 255, 0.6)`,
        }}
      >
        {/* Core highlight reflection (glass bubble effect) */}
        <div
          className="absolute top-1 left-2 rounded-full pointer-events-none"
          style={{
            width: size * 0.4,
            height: size * 0.25,
            background: 'radial-gradient(ellipse at top left, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 80%)',
            borderRadius: '50%',
            transform: 'rotate(-20deg)',
          }}
        />

        {/* Center state icon / dot */}
        <div
          className="rounded-full bg-white/90 shadow-md transition-all duration-300"
          style={{
            width: size * 0.22,
            height: size * 0.22,
            transform: state === 'thinking' ? 'scale(1.2)' : 'scale(1)',
          }}
        />
      </div>

      {showStatusLabel && (
        <div className="mt-2 text-xs font-medium text-slate-300 tracking-wide bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-700/50 backdrop-blur-md">
          {colorConfig.label}
        </div>
      )}
    </div>
  );
};

