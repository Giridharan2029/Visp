import { describe, it, expect, beforeEach } from 'vitest';
import { ContextEngine } from '../services/contextEngine';

describe('ContextEngine (Digital Context Awareness)', () => {
  beforeEach(() => {
    ContextEngine.init();
  });

  it('provides formatted context string', () => {
    const formatted = ContextEngine.getFormattedContext();
    expect(typeof formatted).toBe('string');
  });

  it('supports pause and resume of context sharing', () => {
    // Current state
    const initialPaused = ContextEngine.getCurrentContext().contextPaused;

    // Toggle pause
    const toggled = ContextEngine.togglePauseContext();
    expect(toggled).toBe(!initialPaused);

    // Formatted context should indicate paused state
    if (toggled) {
      expect(ContextEngine.getFormattedContext()).toContain('paused');
    }

    // Toggle back
    ContextEngine.togglePauseContext();
  });
});

