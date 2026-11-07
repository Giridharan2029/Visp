// VISP Type Definitions

export type WindowMode = 'orb' | 'conversation' | 'workspace';

export type OrbState = 
  | 'idle' 
  | 'listening' 
  | 'thinking' 
  | 'speaking' 
  | 'executing' 
  | 'completed' 
  | 'error';

export type MemoryLayer = 'working' | 'episodic' | 'semantic' | 'procedural' | 'project';

export interface MemoryItem {
  id: string;
  layer: MemoryLayer;
  category: string;
  content: string;
  importance: number; // 1-10
  confidence: number; // 0.0 - 1.0
  accessCount: number;
  lastAccessedAt: string;
  projectId?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
    result?: any;
    status: 'pending' | 'executing' | 'completed' | 'failed' | 'denied';
  }>;
  audioUrl?: string;
  reasoning?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  mode: 'voice' | 'text' | 'agent';
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  goals: string[];
  technologies: string[];
  status: 'active' | 'planning' | 'paused' | 'completed';
  rootPath?: string;
  openProblems: string[];
  nextSteps: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  filePath?: string;
  docType: 'spec' | 'notes' | 'architecture' | 'summary' | 'code';
  summary: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemContext {
  activeWindow: {
    title: string;
    processName: string;
    process_name?: string;
    pid: number;
    timestamp: string;
  } | null;
  clipboard: string | null;
  projectContext: string | null;
  isTrackingActive: boolean;
  isClipboardAllowed: boolean;
  isScreenContextAllowed: boolean;
  contextPaused: boolean;
}

export interface AgentStep {
  id: string;
  stepNumber: number;
  action: string;
  tool: string;
  input: Record<string, any>;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'needs_confirmation';
  requiresConfirmation: boolean;
  confirmedByUser?: boolean;
  error?: string;
}

export interface AgentRun {
  id: string;
  taskId?: string;
  prompt: string;
  plan: string[];
  steps: AgentStep[];
  status: 'planning' | 'executing' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
  result?: string;
  createdAt: string;
  completedAt?: string;
}

export type RiskLevel = 'safe' | 'moderate' | 'destructive';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  toolName: string;
  action: string;
  input: Record<string, any>;
  result?: any;
  riskLevel: RiskLevel;
  approvedByUser: boolean;
  status: 'success' | 'failed' | 'blocked';
}

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama' | 'custom';

export interface AIProviderConfig {
  provider: AIProvider;
  name: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  isActive: boolean;
  contextWindow: number;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
}

export interface VoiceConfig {
  sttProvider: 'browser' | 'whisper' | 'groq';
  ttsProvider: 'browser' | 'openai' | 'elevenlabs';
  voiceName: string;
  pitch: number;
  rate: number;
  vadSensitivity: number; // 0 - 100
  pushToTalkKey: string;
  handsFreeMode: boolean;
  isMuted: boolean;
  bargeInEnabled: boolean;
}

export interface AppSettings {
  providers: AIProviderConfig[];
  activeProvider: AIProvider;
  activeModel: string;
  voice: VoiceConfig;
  context: {
    enableWindowTracking: boolean;
    enableClipboardCapture: boolean;
    filterSensitiveTitles: boolean;
    pollIntervalMs: number;
  };
  security: {
    requireConfirmationDestructive: boolean;
    requireConfirmationCommands: boolean;
    allowedDirectories: string[];
  };
  personality: {
    systemPrompt: string;
    temperature: number;
    conciseness: 'concise' | 'balanced' | 'detailed';
  };
  appearance: {
    theme: 'dark' | 'glass';
    orbColor: string;
    glowIntensity: number;
  };
}
