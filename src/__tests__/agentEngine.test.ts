import { describe, it, expect, beforeEach } from 'vitest';
import { AgentEngine } from '../services/agentEngine';
import { StorageService } from '../services/storage';

describe('AgentEngine (Autonomous Computer-Use)', () => {
  beforeEach(() => {
    StorageService.clearAllData();
  });

  it('decomposes requests into structured multi-step plans', async () => {
    let capturedRun: any = null;

    const run = await AgentEngine.startTask('Create a file named demo.ts with a helper function', {
      onRunUpdated: (r) => {
        capturedRun = r;
      },
      onConfirmationRequired: () => {},
      onStepCompleted: () => {},
      onFinished: () => {},
    });

    expect(capturedRun).toBeDefined();
    expect(run.plan.length).toBeGreaterThanOrEqual(3);
    expect(run.steps.length).toBeGreaterThanOrEqual(3);
    expect(run.steps.some((s) => s.tool === 'file_write')).toBe(true);
    expect(run.steps.some((s) => s.tool === 'manage_memory')).toBe(true);
  });
});
