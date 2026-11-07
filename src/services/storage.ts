import { Conversation, MemoryItem, Project, Task, Note, AuditLogEntry, AppSettings } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'visp_conversations',
  ACTIVE_CONV_ID: 'visp_active_conv_id',
  MEMORIES: 'visp_memories',
  PROJECTS: 'visp_projects',
  TASKS: 'visp_tasks',
  NOTES: 'visp_notes',
  AUDIT_LOGS: 'visp_audit_logs',
  SETTINGS: 'visp_settings',
};

export const DEFAULT_SETTINGS: AppSettings = {
  providers: [
    {
      provider: 'gemini',
      name: 'Google Gemini',
      apiKey: '',
      model: 'gemini-2.5-flash',
      isActive: true,
      contextWindow: 1000000,
      supportsStreaming: true,
      supportsToolCalling: true,
    },
    {
      provider: 'openai',
      name: 'OpenAI GPT-4o',
      apiKey: '',
      model: 'gpt-4o',
      isActive: false,
      contextWindow: 128000,
      supportsStreaming: true,
      supportsToolCalling: true,
    },
    {
      provider: 'anthropic',
      name: 'Anthropic Claude',
      apiKey: '',
      model: 'claude-3-7-sonnet-20250219',
      isActive: false,
      contextWindow: 200000,
      supportsStreaming: true,
      supportsToolCalling: true,
    },
    {
      provider: 'groq',
      name: 'Groq Llama 3.3',
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      isActive: false,
      contextWindow: 128000,
      supportsStreaming: true,
      supportsToolCalling: true,
    },
    {
      provider: 'ollama',
      name: 'Ollama Local',
      apiKey: 'ollama',
      baseUrl: 'http://localhost:11434/v1',
      model: 'llama3:latest',
      isActive: false,
      contextWindow: 8192,
      supportsStreaming: true,
      supportsToolCalling: true,
    }
  ],
  activeProvider: 'gemini',
  activeModel: 'gemini-2.5-flash',
  voice: {
    sttProvider: 'browser',
    ttsProvider: 'browser',
    voiceName: 'default',
    pitch: 1.0,
    rate: 1.05,
    vadSensitivity: 60,
    pushToTalkKey: 'Space',
    handsFreeMode: false,
    isMuted: false,
    bargeInEnabled: true,
  },
  context: {
    enableWindowTracking: true,
    enableClipboardCapture: true,
    filterSensitiveTitles: true,
    pollIntervalMs: 2000,
  },
  security: {
    requireConfirmationDestructive: true,
    requireConfirmationCommands: true,
    allowedDirectories: ['C:\\Users\\Giridharan\\Desktop\\PROJECT\\Visp'],
  },
  personality: {
    systemPrompt: `You are VISP, an intelligent, always-available personal AI companion and second brain living on the user's computer.
Your personality:
- Intelligent, curious, and thoughtful, but never arrogant or robotic.
- Friendly, casual, and natural in conversation.
- Honest when uncertain, concise when possible, detailed when necessary.
- Emotionally aware without pretending to possess human emotions.
- You remember user preferences, active projects, and past decisions.
- You think critically and can challenge incorrect assumptions politely.
- You speak naturally, like a brilliant collaborative partner.`,
    temperature: 0.7,
    conciseness: 'balanced',
  },
  appearance: {
    theme: 'glass',
    orbColor: '#06b6d4',
    glowIntensity: 0.8,
  },
};

const memoryStore: Record<string, string> = {};

const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return memoryStore[key] || null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    memoryStore[key] = value;
  },
  clear: (): void => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    for (const k in memoryStore) {
      delete memoryStore[k];
    }
  },
};

export const StorageService = {
  getSettings(): AppSettings {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to parse settings, using defaults', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings): void {
    safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getConversations(): Conversation[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveConversations(conversations: Conversation[]): void {
    safeStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  },

  getMemories(): MemoryItem[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.MEMORIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveMemories(memories: MemoryItem[]): void {
    safeStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  },

  getProjects(): Project[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveProjects(projects: Project[]): void {
    safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  getTasks(): Task[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveTasks(tasks: Task[]): void {
    safeStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getNotes(): Note[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.NOTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveNotes(notes: Note[]): void {
    safeStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  },

  getAuditLogs(): AuditLogEntry[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAuditLogs(logs: AuditLogEntry[]): void {
    // Keep last 500 audit logs
    const trimmed = logs.slice(0, 500);
    safeStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(trimmed));
  },

  exportAllData(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      conversations: this.getConversations(),
      memories: this.getMemories(),
      projects: this.getProjects(),
      tasks: this.getTasks(),
      notes: this.getNotes(),
      settings: this.getSettings(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.conversations) this.saveConversations(parsed.conversations);
      if (parsed.memories) this.saveMemories(parsed.memories);
      if (parsed.projects) this.saveProjects(parsed.projects);
      if (parsed.tasks) this.saveTasks(parsed.tasks);
      if (parsed.notes) this.saveNotes(parsed.notes);
      if (parsed.settings) this.saveSettings(parsed.settings);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  clearAllData(): void {
    safeStorage.clear();
  }
};
