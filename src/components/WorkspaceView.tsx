import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Orb } from './Orb';
import {
  MessageSquare,
  Brain,
  FolderGit2,
  CheckSquare,
  Search,
  Bot,
  Settings,
  Send,
  Plus,
  Trash2,
  Mic,
  Radio,
  Minimize2,
  Volume2,
  VolumeX,
  Shield,
  Square,
  Download,
  Check,
  Terminal,
  Activity,
} from 'lucide-react';

type Tab = 'chat' | 'memory' | 'projects' | 'tasks' | 'search' | 'agent' | 'settings';

export const WorkspaceView: React.FC = () => {
  const {
    orbState,
    audioLevel,
    conversations,
    activeConversationId,
    currentTranscript,
    isStreaming,
    memories,
    projects,
    tasks,
    auditLogs,
    settings,
    systemContext,
    activeAgentRun,
    setWindowMode,
    selectConversation,
    createNewConversation,
    sendMessage,
    interrupt,
    toggleMute,
    toggleHandsFree,
    addMemory,
    deleteMemory,
    createProject,
    createTask,
    updateTaskStatus,
    deleteTask,
    startAgentTask,
    updateSettings,
    exportData,
    toggleContextPause,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [chatInput, setChatInput] = useState('');
  const [agentInput, setAgentInput] = useState('');

  // Memory Explorer filters
  const [memoryLayerFilter, setMemoryLayerFilter] = useState<string>('all');
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [newMemoryModal, setNewMemoryModal] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryLayer, setNewMemoryLayer] = useState<any>('semantic');
  const [newMemoryImportance, setNewMemoryImportance] = useState(7);

  // Universal Search
  const [universalQuery, setUniversalQuery] = useState('');

  // Project Modal
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Task Modal
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<any>('medium');

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isStreaming) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleStartAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim()) return;
    startAgentTask(agentInput.trim());
    setAgentInput('');
  };

  const filteredMemories = memories.filter((m) => {
    if (memoryLayerFilter !== 'all' && m.layer !== memoryLayerFilter) return false;
    if (memorySearchQuery) {
      const q = memorySearchQuery.toLowerCase();
      return (
        m.content.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        (m.tags && m.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-900/80 border-r border-slate-800/80 flex flex-col justify-between p-3 select-none">
        <div className="space-y-4">
          {/* Header Brand & Orb */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              <Orb state={orbState} audioLevel={audioLevel} size={36} />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm tracking-wide text-slate-100">
                  <span>VISP</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono border border-cyan-500/30">
                    2.0
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Desktop Companion</div>
              </div>
            </div>

            {/* Minimize to Orb button */}
            <button
              onClick={() => setWindowMode('orb')}
              title="Minimize to Floating Orb"
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'chat'
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Conversation & Voice</span>
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'memory'
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>Second Brain</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {memories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'projects'
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderGit2 className="w-4 h-4 text-indigo-400" />
                <span>Projects</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'tasks'
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Productivity & Tasks</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {tasks.filter((t) => t.status !== 'completed').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'search'
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>Universal Search</span>
            </button>

            <button
              onClick={() => setActiveTab('agent')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'agent'
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-4 h-4 text-rose-400" />
              <span>Autonomous Agent</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'settings'
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings & Privacy</span>
            </button>
          </nav>
        </div>

        {/* Bottom Context Pill & Audio Status */}
        <div className="space-y-2 pt-3 border-t border-slate-800/80">
          {/* Active Context Card */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <Activity className="w-3 h-3 text-cyan-400" />
                Active Context
              </span>
              <button
                onClick={toggleContextPause}
                className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                  systemContext.contextPaused
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {systemContext.contextPaused ? 'Paused' : 'Live'}
              </button>
            </div>
            <div className="text-slate-200 font-mono text-[10px] truncate">
              {systemContext.activeWindow
                ? `${systemContext.activeWindow.processName}`
                : 'No foreground app'}
            </div>
          </div>

          {/* Quick Audio Controls */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={toggleMute}
              className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition ${
                settings.voice.isMuted
                  ? 'text-rose-400 bg-rose-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {settings.voice.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{settings.voice.isMuted ? 'Muted' : 'Sound On'}</span>
            </button>

            <button
              onClick={toggleHandsFree}
              className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition ${
                settings.voice.handsFreeMode
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Hands-free</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {/* ================= CHAT TAB ================= */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-300">
                  {activeConv?.title || 'Active Conversation'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {settings.activeProvider} ({settings.activeModel})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => createNewConversation('text')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Chat
                </button>
                <button
                  onClick={() => setWindowMode('conversation')}
                  title="Switch to Compact Floating Bar"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeConv?.messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl mx-auto`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400 font-medium">
                      <span>{isUser ? 'You' : 'VISP'}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-cyan-600 text-white rounded-tr-xs shadow-md shadow-cyan-950/40'
                          : 'bg-slate-900 text-slate-200 border border-slate-800/80 rounded-tl-xs shadow-lg'
                      }`}
                    >
                      <div className="whitespace-pre-wrap select-text">{msg.content}</div>
                      {msg.tokens && (
                        <div className="mt-2 text-[10px] text-slate-400/80 text-right">
                          {msg.tokens.total} tokens used
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {currentTranscript && (
                <div className="max-w-3xl mx-auto flex flex-col items-end">
                  <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs text-cyan-200 animate-pulse">
                    {currentTranscript}...
                  </div>
                </div>
              )}
            </div>

            {/* Interrupt Bar */}
            {(isStreaming || orbState === 'speaking') && (
              <div className="px-6 py-2 bg-rose-950/30 border-t border-rose-500/20 flex items-center justify-between">
                <span className="text-xs text-rose-300 font-medium">VISP is streaming response...</span>
                <button
                  onClick={interrupt}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 transition"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Interrupt (Barge-in)
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-4 bg-slate-900/40 border-t border-slate-800/80">
              <form onSubmit={handleSendChat} className="max-w-3xl mx-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleHandsFree}
                  className={`p-3 rounded-xl transition ${
                    settings.voice.handsFreeMode
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  title="Toggle hands-free listening"
                >
                  <Mic className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything, talk about your project, or type instructions..."
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                />

                <button
                  type="submit"
                  disabled={!chatInput.trim() || isStreaming}
                  className="p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white transition shadow-lg shadow-cyan-950/40"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= SECOND BRAIN / MEMORY TAB ================= */}
        {activeTab === 'memory' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-5">
            {/* Memory Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-400" />
                  Second Brain — Persistent Memory
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-layered persistent knowledge that VISP retains across conversations and sessions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewMemoryModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-950/40"
                >
                  <Plus className="w-4 h-4" />
                  Add Memory
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {['all', 'semantic', 'episodic', 'procedural', 'working', 'project'].map((layer) => (
                  <button
                    key={layer}
                    onClick={() => setMemoryLayerFilter(layer)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                      memoryLayerFilter === layer
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>

              <div className="relative w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={memorySearchQuery}
                  onChange={(e) => setMemorySearchQuery(e.target.value)}
                  placeholder="Filter memories..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500/60 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 outline-none"
                />
              </div>
            </div>

            {/* Memory Cards Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-1">
              {filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="bg-slate-900/70 border border-slate-800/80 hover:border-purple-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition duration-150 backdrop-blur-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {mem.layer} • {mem.category}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                        <span>★ {mem.importance}/10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-normal">
                      {mem.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                    <span>Recalled {mem.accessCount}x</span>
                    <button
                      onClick={() => deleteMemory(mem.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredMemories.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                  No memories found matching your filter.
                </div>
              )}
            </div>

            {/* Modal for New Memory */}
            {newMemoryModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
                  <h3 className="text-base font-bold text-slate-100">Add Memory to Second Brain</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400">Memory Layer</label>
                      <select
                        value={newMemoryLayer}
                        onChange={(e) => setNewMemoryLayer(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none mt-1"
                      >
                        <option value="semantic">Semantic (Fact / Preference / Skill)</option>
                        <option value="episodic">Episodic (Event / Milestone / Decision)</option>
                        <option value="procedural">Procedural (Workflow / Preferred Style)</option>
                        <option value="project">Project (Specific to Active Project)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Memory Content</label>
                      <textarea
                        value={newMemoryContent}
                        onChange={(e) => setNewMemoryContent(e.target.value)}
                        placeholder="e.g. User prefers functional programming patterns in TypeScript"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none h-24 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 flex justify-between">
                        <span>Importance (1 to 10)</span>
                        <span className="text-purple-400 font-mono">{newMemoryImportance}</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={newMemoryImportance}
                        onChange={(e) => setNewMemoryImportance(Number(e.target.value))}
                        className="w-full mt-1 accent-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setNewMemoryModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!newMemoryContent.trim()) return;
                        addMemory({
                          layer: newMemoryLayer,
                          category: 'manual_entry',
                          content: newMemoryContent.trim(),
                          importance: newMemoryImportance,
                          confidence: 1.0,
                          tags: ['manual'],
                        });
                        setNewMemoryContent('');
                        setNewMemoryModal(false);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white"
                    >
                      Save Memory
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PROJECTS TAB ================= */}
        {activeTab === 'projects' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <FolderGit2 className="w-6 h-6 text-indigo-400" />
                  Project Knowledge Bases
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Independent context, goals, open problems, and technical architectures for your projects.
                </p>
              </div>

              <button
                onClick={() => setNewProjectModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-950/40"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">{proj.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{proj.description}</p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {proj.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-300">Goals & Next Steps</div>
                    <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
                      {proj.goals?.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                      {(!proj.goals || proj.goals.length === 0) && (
                        <li>Initial architecture and implementation</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                    {proj.technologies?.map((tech, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/50 text-indigo-300 border border-indigo-500/20"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                  No projects configured yet. Click "New Project" to create your first project knowledge base.
                </div>
              )}
            </div>

            {/* Modal for New Project */}
            {newProjectModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
                  <h3 className="text-base font-bold text-slate-100">Create New Project</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400">Project Name</label>
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="e.g. Visp AI Desktop Companion"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Description</label>
                      <textarea
                        value={newProjectDesc}
                        onChange={(e) => setNewProjectDesc(e.target.value)}
                        placeholder="Brief overview of goals and architecture..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none h-20 mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setNewProjectModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!newProjectName.trim()) return;
                        createProject({
                          name: newProjectName.trim(),
                          description: newProjectDesc.trim(),
                          goals: ['Initial feature deployment', 'Production verification'],
                          technologies: ['Tauri 2', 'Rust', 'React', 'TypeScript', 'SQLite'],
                          status: 'active',
                          openProblems: [],
                          nextSteps: ['Run integration tests'],
                        });
                        setNewProjectName('');
                        setNewProjectDesc('');
                        setNewProjectModal(false);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      Create Project
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PRODUCTIVITY / TASKS TAB ================= */}
        {activeTab === 'tasks' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <CheckSquare className="w-6 h-6 text-emerald-400" />
                  Personal Productivity & Tasks
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track ongoing objectives, AI assigned jobs, and quick scratchpad notes.
                </p>
              </div>
            </div>

            {/* Quick Add Task Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTaskTitle.trim()) return;
                createTask({
                  title: newTaskTitle.trim(),
                  description: '',
                  status: 'todo',
                  priority: newTaskPriority,
                });
                setNewTaskTitle('');
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a new task or follow-up item..."
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-950/40"
              >
                Add Task
              </button>
            </form>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {tasks.map((task) => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                      isDone
                        ? 'bg-slate-900/30 border-slate-800/40 opacity-60'
                        : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateTaskStatus(task.id, isDone ? 'todo' : 'completed')}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <span className={`text-xs ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          task.priority === 'urgent'
                            ? 'bg-rose-500/20 text-rose-400'
                            : task.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {tasks.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No active tasks. Add one above!
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= UNIVERSAL SEARCH TAB ================= */}
        {activeTab === 'search' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Search className="w-6 h-6 text-amber-400" />
                Universal Knowledge Search
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Hybrid lexical (FTS) & semantic vector search across conversations, second brain memories, and notes.
              </p>
            </div>

            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
              <input
                type="text"
                value={universalQuery}
                onChange={(e) => setUniversalQuery(e.target.value)}
                placeholder="Search across all your knowledge, memories, past decisions, and chats..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-100 outline-none shadow-lg"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {universalQuery.trim() ? (
                <>
                  {/* Results from memories */}
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Recalled Memories ({memories.filter((m) => m.content.toLowerCase().includes(universalQuery.toLowerCase())).length})
                  </div>
                  {memories
                    .filter((m) => m.content.toLowerCase().includes(universalQuery.toLowerCase()))
                    .map((m) => (
                      <div key={m.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-purple-400">
                          <span>Second Brain • {m.layer}</span>
                          <span>Importance {m.importance}/10</span>
                        </div>
                        <div className="text-xs text-slate-200">{m.content}</div>
                      </div>
                    ))}

                  {/* Results from conversations */}
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-3">
                    Matching Conversations
                  </div>
                  {conversations
                    .filter((c) =>
                      c.title.toLowerCase().includes(universalQuery.toLowerCase()) ||
                      c.messages.some((m) => m.content.toLowerCase().includes(universalQuery.toLowerCase()))
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          selectConversation(c.id);
                          setActiveTab('chat');
                        }}
                        className="bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 cursor-pointer rounded-xl p-3.5 space-y-1 transition"
                      >
                        <div className="text-xs font-semibold text-cyan-400">{c.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {c.messages[c.messages.length - 1]?.content || 'Empty conversation'}
                        </div>
                      </div>
                    ))}
                </>
              ) : (
                <div className="py-20 text-center text-slate-500 text-xs">
                  Type a search keyword or query above to trigger hybrid retrieval.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= AUTONOMOUS AGENT TAB ================= */}
        {activeTab === 'agent' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Bot className="w-6 h-6 text-rose-400" />
                Autonomous Computer-Use Agent
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Observe → Understand → Plan → Validate → Execute → Observe → Verify → Report loop with permission guards.
              </p>
            </div>

            {/* Run Task Form */}
            <form onSubmit={handleStartAgent} className="flex items-center gap-3">
              <input
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                placeholder="Assign multi-step task, e.g.: 'Inspect workspace files and generate a new summary component'"
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-rose-500/60 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none"
              />
              <button
                type="submit"
                disabled={!agentInput.trim() || orbState === 'executing'}
                className="px-5 py-3 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white transition shadow-lg shadow-rose-950/40"
              >
                Start Agent Task
              </button>
            </form>

            {/* Active Run Monitor */}
            {activeAgentRun && (
              <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Task: {activeAgentRun.status}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-100 mt-1">
                      "{activeAgentRun.prompt}"
                    </h4>
                  </div>
                  {activeAgentRun.completedAt && (
                    <span className="text-xs text-emerald-400 font-medium">Verified & Complete</span>
                  )}
                </div>

                {/* Steps Timeline */}
                <div className="space-y-2">
                  {activeAgentRun.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px] bg-slate-800 text-slate-300">
                        {step.stepNumber}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{step.action}</span>
                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                              step.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : step.status === 'running'
                                ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                                : step.status === 'needs_confirmation'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                        {step.output && (
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-xl">
                            Output: {JSON.stringify(step.output).slice(0, 100)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Trail */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Security Audit Log ({auditLogs.length} events)
              </div>

              {auditLogs.slice(0, 20).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="text-slate-200 font-medium">{log.action}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.timestamp}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                      log.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SETTINGS TAB ================= */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Settings className="w-6 h-6 text-slate-400" />
                Settings & Customization
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your AI models, speech synthesis, context collection guards, and local privacy controls.
              </p>
            </div>

            {/* AI Providers Section */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                AI Model Providers
              </h3>

              <div className="space-y-3">
                {settings.providers.map((prov) => (
                  <div
                    key={prov.provider}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">{prov.name}</span>
                        {settings.activeProvider === prov.provider && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            Active
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => updateSettings({ activeProvider: prov.provider, activeModel: prov.model })}
                        className={`text-xs px-3 py-1 rounded-lg transition font-medium ${
                          settings.activeProvider === prov.provider
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {settings.activeProvider === prov.provider ? 'Selected' : 'Use this'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-400">API Key / Token</label>
                        <input
                          type="password"
                          value={prov.apiKey}
                          onChange={(e) => {
                            const newProviders = settings.providers.map((p) =>
                              p.provider === prov.provider ? { ...p, apiKey: e.target.value } : p
                            );
                            updateSettings({ providers: newProviders });
                          }}
                          placeholder={prov.provider === 'ollama' ? 'Local (no key required)' : 'sk-...'}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 outline-none mt-1 font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400">Model Name</label>
                        <input
                          type="text"
                          value={prov.model}
                          onChange={(e) => {
                            const newProviders = settings.providers.map((p) =>
                              p.provider === prov.provider ? { ...p, model: e.target.value } : p
                            );
                            updateSettings({ providers: newProviders });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 outline-none mt-1 font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice & Speech Section */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                Voice & Audio Pipeline
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400">Speech Rate</label>
                  <input
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.05"
                    value={settings.voice.rate}
                    onChange={(e) =>
                      updateSettings({ voice: { ...settings.voice, rate: parseFloat(e.target.value) } })
                    }
                    className="w-full mt-2 accent-cyan-500"
                  />
                  <div className="text-[10px] text-slate-500 text-right">{settings.voice.rate}x</div>
                </div>

                <div>
                  <label className="text-slate-400">Voice Pitch</label>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={settings.voice.pitch}
                    onChange={(e) =>
                      updateSettings({ voice: { ...settings.voice, pitch: parseFloat(e.target.value) } })
                    }
                    className="w-full mt-2 accent-cyan-500"
                  />
                  <div className="text-[10px] text-slate-500 text-right">{settings.voice.pitch}</div>
                </div>
              </div>
            </div>

            {/* Privacy & Context Controls */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Privacy & Context Awareness
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span>Track foreground application & window title</span>
                  <input
                    type="checkbox"
                    checked={settings.context.enableWindowTracking}
                    onChange={(e) =>
                      updateSettings({
                        context: { ...settings.context, enableWindowTracking: e.target.checked },
                      })
                    }
                    className="accent-cyan-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span>Authorize clipboard snippet context (with password filtering)</span>
                  <input
                    type="checkbox"
                    checked={settings.context.enableClipboardCapture}
                    onChange={(e) =>
                      updateSettings({
                        context: { ...settings.context, enableClipboardCapture: e.target.checked },
                      })
                    }
                    className="accent-cyan-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span>Require user confirmation for all terminal commands</span>
                  <input
                    type="checkbox"
                    checked={settings.security.requireConfirmationCommands}
                    onChange={(e) =>
                      updateSettings({
                        security: { ...settings.security, requireConfirmationCommands: e.target.checked },
                      })
                    }
                    className="accent-cyan-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>

            {/* Backup & Export */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Data Backup & Export</h3>
              <p className="text-xs text-slate-400">
                Export all conversations, memories, projects, and productivity items into an open JSON file.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const json = exportData();
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `visp_backup_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  <Download className="w-4 h-4" />
                  Export Second Brain Backup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
