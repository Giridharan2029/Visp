import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService, DEFAULT_SETTINGS } from '../services/storage';
import { AIProviderService } from '../services/aiProvider';

describe('StorageService (Persistence & Backup)', () => {
  beforeEach(() => {
    StorageService.clearAllData();
  });

  it('saves and retrieves user settings and provider configs', () => {
    const defaultSettings = StorageService.getSettings();
    expect(defaultSettings.activeProvider).toBe('gemini');

    const updated = {
      ...defaultSettings,
      activeProvider: 'openai' as any,
      activeModel: 'gpt-4o',
    };
    StorageService.saveSettings(updated);

    const reloaded = StorageService.getSettings();
    expect(reloaded.activeProvider).toBe('openai');
    expect(reloaded.activeModel).toBe('gpt-4o');
  });

  it('exports and imports complete application backup JSON', () => {
    StorageService.saveMemories([
      {
        id: 'mem_test',
        layer: 'semantic',
        category: 'preference',
        content: 'Prefers Rust over C++',
        importance: 8,
        confidence: 0.9,
        accessCount: 1,
        lastAccessedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    StorageService.saveProjects([
      {
        id: 'proj_test',
        name: 'VISP Companion',
        description: 'Next-gen desktop assistant',
        goals: ['Finish build'],
        technologies: ['Tauri 2', 'React'],
        status: 'active',
        openProblems: [],
        nextSteps: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const backupJson = StorageService.exportAllData();
    expect(backupJson).toContain('VISP Companion');
    expect(backupJson).toContain('Prefers Rust over C++');

    // Clear and restore
    StorageService.clearAllData();
    expect(StorageService.getMemories().length).toBe(0);

    const restored = StorageService.importData(backupJson);
    expect(restored).toBe(true);
    expect(StorageService.getMemories().length).toBe(1);
    expect(StorageService.getProjects().length).toBe(1);
  });
});

describe('AIProviderService (Intelligence & Stream Fallback)', () => {
  it('provides helpful onboarding instructions when API key is missing', async () => {
    const config = {
      provider: 'openai' as any,
      name: 'OpenAI GPT-4o',
      apiKey: '',
      model: 'gpt-4o',
      isActive: true,
      contextWindow: 128000,
      supportsStreaming: true,
      supportsToolCalling: true,
    };

    let fullOutput = '';
    const tokensReceived: string[] = [];

    await AIProviderService.streamCompletion(
      config,
      {
        messages: [{ role: 'user', content: 'Hello VISP!' }],
      },
      {
        onToken: (tok) => tokensReceived.push(tok),
        onComplete: (full) => {
          fullOutput = full;
        },
        onError: () => {},
      },
      DEFAULT_SETTINGS
    );

    expect(tokensReceived.length).toBeGreaterThan(0);
    expect(fullOutput).toContain('Settings');
    expect(fullOutput).toContain('API key');
  });
});

