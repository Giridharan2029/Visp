import { create } from 'zustand';
import {
  WindowMode,
  OrbState,
  Conversation,
  Message,
  MemoryItem,
  Project,
  Task,
  Note,
  SystemContext,
  AgentRun,
  AgentStep,
  AuditLogEntry,
  AppSettings,
} from '../types';
import { StorageService, DEFAULT_SETTINGS } from '../services/storage';
import { NativeBridge } from '../services/nativeBridge';
import { AIProviderService } from '../services/aiProvider';
import { MemoryEngine } from '../services/memoryEngine';
import { ContextEngine } from '../services/contextEngine';
import { AgentEngine } from '../services/agentEngine';
import { VoiceEngine } from '../services/voiceEngine';

interface AppState {
  windowMode: WindowMode;
  orbState: OrbState;
  audioLevel: number;
  conversations: Conversation[];
  activeConversationId: string | null;
  currentTranscript: string;
  isStreaming: boolean;
  memories: MemoryItem[];
  projects: Project[];
  activeProjectId: string | null;
  tasks: Task[];
  notes: Note[];
  systemContext: SystemContext;
  activeAgentRun: AgentRun | null;
  pendingConfirmation: { step: AgentStep; run: AgentRun } | null;
  auditLogs: AuditLogEntry[];
  settings: AppSettings;
  voiceEngine: VoiceEngine | null;
  abortController: AbortController | null;

  // Actions
  init: () => void;
  setWindowMode: (mode: WindowMode) => void;
  setOrbState: (state: OrbState) => void;
  setAudioLevel: (level: number) => void;
  createNewConversation: (mode?: 'voice' | 'text' | 'agent') => string;
  selectConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  interrupt: () => void;
  startVoiceListening: () => Promise<boolean>;
  stopVoiceListening: () => void;
  toggleMute: () => void;
  toggleHandsFree: () => void;
  addMemory: (memory: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessedAt'>) => void;
  updateMemory: (id: string, updates: Partial<MemoryItem>) => void;
  deleteMemory: (id: string) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTaskStatus: (id: string, status: Task['status']) => void;
  deleteTask: (id: string) => void;
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteNote: (id: string) => void;
  toggleContextPause: () => void;
  startAgentTask: (prompt: string) => Promise<void>;
  respondToConfirmation: (approved: boolean) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  exportData: () => string;
  importData: (jsonString: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  windowMode: 'workspace',
  orbState: 'idle',
  audioLevel: 0,
  conversations: [],
  activeConversationId: null,
  currentTranscript: '',
  isStreaming: false,
  memories: [],
  projects: [],
  activeProjectId: null,
  tasks: [],
  notes: [],
  systemContext: ContextEngine.getCurrentContext(),
  activeAgentRun: null,
  pendingConfirmation: null,
  auditLogs: [],
  settings: DEFAULT_SETTINGS,
  voiceEngine: null,
  abortController: null,

  init: () => {
    const settings = StorageService.getSettings();
    const conversations = StorageService.getConversations();
    const memories = StorageService.getMemories();
    const projects = StorageService.getProjects();
    const tasks = StorageService.getTasks();
    const notes = StorageService.getNotes();
    const auditLogs = StorageService.getAuditLogs();

    // Default conversation if none exists
    let activeId = conversations[0]?.id;
    if (!activeId) {
      const defaultConv: Conversation = {
        id: 'conv_' + Date.now(),
        title: 'Welcome to VISP',
        mode: 'text',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg_welcome',
            conversationId: 'conv_initial',
            role: 'assistant',
            content: `Hello! I'm **VISP**, your personal AI companion and second brain.
I live natively on your desktop, understand your active context, remember what matters, and help you get things done.

You can speak to me with voice, chat via text, or assign autonomous computer tasks. What are you working on today?`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      conversations.push(defaultConv);
      activeId = defaultConv.id;
      StorageService.saveConversations(conversations);
    }

    // Default seed memories if empty for rich initial experience
    if (memories.length === 0) {
      const seedMemories: MemoryItem[] = [
        {
          id: 'mem_1',
          layer: 'semantic',
          category: 'preference',
          content: 'User prefers concise, direct responses with actionable code examples.',
          importance: 8,
          confidence: 0.95,
          accessCount: 3,
          lastAccessedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['preference', 'communication'],
        },
        {
          id: 'mem_2',
          layer: 'procedural',
          category: 'workflow',
          content: 'Always double check file paths and run tests after modifying project code.',
          importance: 9,
          confidence: 0.9,
          accessCount: 2,
          lastAccessedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['workflow', 'best_practices'],
        },
      ];
      memories.push(...seedMemories);
      StorageService.saveMemories(memories);
    }

    // Initialize Voice Engine
    const voiceEngine = new VoiceEngine({
      onTranscript: (text, isFinal) => {
        set({ currentTranscript: text });
        if (isFinal && text.trim().length > 1) {
          get().sendMessage(text.trim());
          set({ currentTranscript: '' });
        }
      },
      onAudioLevel: (level) => {
        set({ audioLevel: level });
      },
      onSpeechStart: () => {
        set({ orbState: 'speaking' });
      },
      onSpeechEnd: () => {
        if (get().orbState === 'speaking') {
          set({ orbState: 'idle' });
        }
      },
      onStateChange: (state) => {
        if (state === 'listening') set({ orbState: 'listening' });
        else if (state === 'idle' && get().orbState !== 'thinking' && get().orbState !== 'executing') {
          set({ orbState: 'idle' });
        }
      },
      onError: (err) => {
        console.warn('Voice error:', err);
      },
    });

    // Initialize Context Engine
    ContextEngine.init();
    ContextEngine.subscribe((ctx) => {
      set({ systemContext: ctx });
    });

    set({
      settings,
      conversations,
      activeConversationId: activeId,
      memories,
      projects,
      tasks,
      notes,
      auditLogs,
      voiceEngine,
    });
  },

  setWindowMode: (mode: WindowMode) => {
    NativeBridge.setWindowMode(mode);
    set({ windowMode: mode });
  },

  setOrbState: (orbState: OrbState) => {
    set({ orbState });
  },

  setAudioLevel: (audioLevel: number) => {
    set({ audioLevel });
  },

  createNewConversation: (mode = 'text') => {
    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      title: 'New Conversation',
      mode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    const updated = [newConv, ...get().conversations];
    StorageService.saveConversations(updated);
    set({ conversations: updated, activeConversationId: newConv.id });
    return newConv.id;
  },

  selectConversation: (id: string) => {
    set({ activeConversationId: id });
  },

  sendMessage: async (content: string) => {
    const { conversations, activeConversationId, settings, voiceEngine } = get();
    let currentConv = conversations.find((c) => c.id === activeConversationId);

    if (!currentConv) {
      const newId = get().createNewConversation();
      currentConv = get().conversations.find((c) => c.id === newId)!;
    }

    // Abort any ongoing stream
    if (get().abortController) {
      get().abortController!.abort();
    }
    const abortController = new AbortController();
    set({ abortController, isStreaming: true, orbState: 'thinking' });

    // 1. Add User Message
    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      conversationId: currentConv.id,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...currentConv.messages, userMsg];
    currentConv.messages = updatedMessages;
    currentConv.updatedAt = new Date().toISOString();

    // Auto-update conversation title if it's the first message
    if (currentConv.messages.length <= 2 && currentConv.title === 'New Conversation') {
      currentConv.title = content.slice(0, 32) + (content.length > 32 ? '...' : '');
    }

    StorageService.saveConversations([...conversations]);
    set({ conversations: [...conversations] });

    // 2. Prepare Assistant Message container for streaming
    const assistantMsgId = 'msg_' + (Date.now() + 1);
    const assistantMsg: Message = {
      id: assistantMsgId,
      conversationId: currentConv.id,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    currentConv.messages = [...updatedMessages, assistantMsg];
    set({ conversations: [...conversations] });

    // 3. Retrieve relevant second-brain memories
    const relevantMemories = MemoryEngine.retrieve({ query: content, limit: 3 });
    let memoryContext = '';
    if (relevantMemories.length > 0) {
      memoryContext = `[RECALLED SECOND-BRAIN MEMORIES]:\n` +
        relevantMemories.map((m) => `- (${m.memory.layer.toUpperCase()} - ${m.memory.category}): ${m.memory.content}`).join('\n');
    }

    // 4. Retrieve Active Context
    const activeContext = ContextEngine.getFormattedContext();
    const combinedContext = [memoryContext, activeContext].filter(Boolean).join('\n\n');

    // Find active AI provider config
    const activeConfig =
      settings.providers.find((p) => p.provider === settings.activeProvider) ||
      settings.providers[0];

    try {
      await AIProviderService.streamCompletion(
        activeConfig,
        {
          messages: currentConv.messages.map((m) => ({ role: m.role as any, content: m.content })),
          contextSnippet: combinedContext,
          temperature: settings.personality.temperature,
        },
        {
          onToken: (token) => {
            assistantMsg.content += token;
            set({ conversations: [...get().conversations] });
          },
          onComplete: (fullText, tokens) => {
            assistantMsg.content = fullText;
            if (tokens) assistantMsg.tokens = tokens;
            StorageService.saveConversations([...get().conversations]);
            set({
              conversations: [...get().conversations],
              isStreaming: false,
              orbState: 'idle',
            });

            // If voice mode is active, speak the reply!
            if (
              (currentConv?.mode === 'voice' || settings.voice.handsFreeMode) &&
              !settings.voice.isMuted
            ) {
              set({ orbState: 'speaking' });
              voiceEngine?.speak(fullText, {
                pitch: settings.voice.pitch,
                rate: settings.voice.rate,
                onEnd: () => {
                  set({ orbState: 'idle' });
                },
              });
            }

            // Extract candidate memories in background
            const extracted = MemoryEngine.extractCandidateMemories(content, fullText);
            if (extracted.length > 0) {
              set({ memories: StorageService.getMemories() });
            }
          },
          onError: (err) => {
            console.error('LLM streaming error:', err);
            assistantMsg.content = `Error communicating with AI Provider (${activeConfig.name}): ${err.message}`;
            StorageService.saveConversations([...get().conversations]);
            set({
              conversations: [...get().conversations],
              isStreaming: false,
              orbState: 'error',
            });
          },
        },
        settings,
        abortController.signal
      );
    } catch (e: any) {
      set({ isStreaming: false, orbState: 'error' });
    }
  },

  interrupt: () => {
    const { abortController, voiceEngine } = get();
    if (abortController) {
      abortController.abort();
    }
    voiceEngine?.interrupt();
    set({ isStreaming: false, orbState: 'idle', audioLevel: 0 });
  },

  startVoiceListening: async () => {
    const { voiceEngine } = get();
    if (!voiceEngine) return false;
    const ok = await voiceEngine.startListening();
    if (ok) set({ orbState: 'listening' });
    return ok;
  },

  stopVoiceListening: () => {
    const { voiceEngine } = get();
    voiceEngine?.stopListening();
    set({ orbState: 'idle', audioLevel: 0 });
  },

  toggleMute: () => {
    const { settings, voiceEngine } = get();
    const isMuted = !settings.voice.isMuted;
    const updated = {
      ...settings,
      voice: { ...settings.voice, isMuted },
    };
    voiceEngine?.setMuted(isMuted);
    StorageService.saveSettings(updated);
    set({ settings: updated });
  },

  toggleHandsFree: () => {
    const { settings, startVoiceListening, stopVoiceListening } = get();
    const handsFreeMode = !settings.voice.handsFreeMode;
    const updated = {
      ...settings,
      voice: { ...settings.voice, handsFreeMode },
    };
    StorageService.saveSettings(updated);
    set({ settings: updated });

    if (handsFreeMode) {
      startVoiceListening();
    } else {
      stopVoiceListening();
    }
  },

  addMemory: (item) => {
    MemoryEngine.addMemory(item);
    set({ memories: StorageService.getMemories() });
  },

  updateMemory: (id, updates) => {
    MemoryEngine.updateMemory(id, updates);
    set({ memories: StorageService.getMemories() });
  },

  deleteMemory: (id) => {
    MemoryEngine.deleteMemory(id);
    set({ memories: StorageService.getMemories() });
  },

  createProject: (proj) => {
    const projects = StorageService.getProjects();
    const newProj: Project = {
      ...proj,
      id: 'proj_' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.unshift(newProj);
    StorageService.saveProjects(projects);
    set({ projects });
  },

  updateProject: (id, updates) => {
    const projects = StorageService.getProjects();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
      StorageService.saveProjects(projects);
      set({ projects });
    }
  },

  createTask: (task) => {
    const tasks = StorageService.getTasks();
    const newTask: Task = {
      ...task,
      id: 'task_' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    StorageService.saveTasks(tasks);
    set({ tasks });
  },

  updateTaskStatus: (id, status) => {
    const tasks = StorageService.getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tasks[idx].status = status;
      tasks[idx].updatedAt = new Date().toISOString();
      StorageService.saveTasks(tasks);
      set({ tasks });
    }
  },

  deleteTask: (id) => {
    const tasks = StorageService.getTasks().filter((t) => t.id !== id);
    StorageService.saveTasks(tasks);
    set({ tasks });
  },

  createNote: (note) => {
    const notes = StorageService.getNotes();
    const newNote: Note = {
      ...note,
      id: 'note_' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notes.unshift(newNote);
    StorageService.saveNotes(notes);
    set({ notes });
  },

  deleteNote: (id) => {
    const notes = StorageService.getNotes().filter((n) => n.id !== id);
    StorageService.saveNotes(notes);
    set({ notes });
  },

  toggleContextPause: () => {
    ContextEngine.togglePauseContext();
  },

  startAgentTask: async (prompt: string) => {
    set({ orbState: 'executing' });
    await AgentEngine.startTask(prompt, {
      onRunUpdated: (run) => {
        set({ activeAgentRun: { ...run } });
      },
      onConfirmationRequired: (step, run) => {
        set({ pendingConfirmation: { step, run } });
      },
      onStepCompleted: () => {
        set({ auditLogs: StorageService.getAuditLogs() });
      },
      onFinished: (run) => {
        set({
          activeAgentRun: { ...run },
          orbState: run.status === 'completed' ? 'completed' : 'error',
          auditLogs: StorageService.getAuditLogs(),
          tasks: StorageService.getTasks(),
          memories: StorageService.getMemories(),
        });
      },
    });
  },

  respondToConfirmation: (approved: boolean) => {
    const { pendingConfirmation } = get();
    if (!pendingConfirmation) return;

    AgentEngine.resumeStepWithApproval(
      pendingConfirmation.run.id,
      pendingConfirmation.step.id,
      approved,
      {
        onRunUpdated: (run) => set({ activeAgentRun: { ...run } }),
        onConfirmationRequired: (step, run) => set({ pendingConfirmation: { step, run } }),
        onStepCompleted: () => set({ auditLogs: StorageService.getAuditLogs() }),
        onFinished: (run) => {
          set({
            activeAgentRun: { ...run },
            pendingConfirmation: null,
            orbState: run.status === 'completed' ? 'completed' : 'error',
            auditLogs: StorageService.getAuditLogs(),
          });
        },
      }
    );

    set({ pendingConfirmation: null });
  },

  updateSettings: (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    StorageService.saveSettings(updated);
    set({ settings: updated });
  },

  exportData: () => {
    return StorageService.exportAllData();
  },

  importData: (json) => {
    const ok = StorageService.importData(json);
    if (ok) {
      get().init();
    }
    return ok;
  },
}));
