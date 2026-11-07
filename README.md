# VISP — Intelligent Desktop AI Companion & Second Brain

> **"An intelligent companion that is always there, understands your context, remembers what matters, and helps you move forward."**

VISP is a persistent, context-aware personal desktop AI companion built natively for Windows 10/11 using **Tauri 2 (Rust) + React 19 + TypeScript + Vite + Tailwind CSS + SQLite**.

Unlike web-based chatbots, VISP lives directly on your desktop, maintains persistent multi-layered memory across sessions, monitors authorized foreground window and application context, communicates naturally via low-latency voice with barge-in interruption, and executes multi-step computer tasks with strict security confirmation boundaries.

---

## 🌟 Key Capabilities

### 1. Always-Available Tri-State Desktop Experience
- **Mode A: Compact Floating Orb**: Minimalist, draggable, transparent glassmorphic orb with responsive animations matching AI states (`idle`, `listening`, `thinking`, `speaking`, `executing`, `completed`, `error`).
- **Mode B: Conversation Bar**: Low-latency voice waveform visualizer, live speech transcription bubble, quick message history, text input, push-to-talk, and instant interrupt button.
- **Mode C: Workspace Dashboard**: Full second-brain dashboard featuring memory layer explorer, project knowledge bases, productivity tasks, universal hybrid search, autonomous agent planner, and security audit log.
- **Global Hotkey**: Press `Ctrl+Space` anytime to seamlessly switch between Orb, Conversation bar, and Workspace.
- **System Tray**: Runs in the background with tray icon controls (Show, Hide to Tray, Quit).

### 2. Real-Time Voice Intelligence & Barge-In
- **WebAudio VAD & Frequency Meter**: Live audio level visualization reacting in real-time.
- **Barge-In / Interruption**: Interrupt VISP instantly by speaking or pressing `Interrupt` while it is answering.
- **Hands-Free & Push-to-Talk**: Toggle hands-free listening or hold the microphone button to speak.
- **Natural Voice Output**: Configurable speech rate, pitch, and voice synthesis models.

### 3. The Second Brain — Multi-Layer Persistent Memory
VISP structures long-term memory across 5 distinct cognitive layers:
- **Working Memory**: Context relevant to the active discussion.
- **Episodic Memory**: Milestones, completed tasks, meaningful decisions, and past discussions.
- **Semantic Memory**: Stable facts, skills, user preferences, and technology expertise.
- **Procedural Memory**: Preferred coding style, workflow rules, and explanation formatting.
- **Project Memory**: Dedicated knowledge bases per project with goals, architecture, files, and open problems.
- **Hybrid Retrieval**: Combines token lexical matching (FTS style), 64-dimensional vector cosine similarity embeddings, importance weighting (1–10), and exponential recency decay.

### 4. Real-Time Digital Context Awareness
- **Foreground Window & Process Tracking**: Uses native Windows APIs (`GetForegroundWindow`, `QueryFullProcessImageNameW`) to understand what application or document you are actively working in.
- **Privacy First**: Sensitive windows containing passwords, keychains, or banking keywords are automatically masked.
- **Instant Pause/Resume**: One-click toggle to pause all context monitoring whenever desired.
- **Local-First Storage**: Memories, conversations, and settings remain on your local disk.

### 5. Autonomous Computer-Use Agent & Security Boundaries
- **Structured Action-Planning Loop**: Observe → Understand → Plan → Validate → Execute → Observe → Verify → Report.
- **Built-in Safe Tools**:
  - `file_list`: List directories and inspect project structures.
  - `file_read`: Read code and configuration files.
  - `file_write`: Generate and save components or documents.
  - `shell_execute`: Execute authorized terminal commands.
  - `search_knowledge`: Hybrid retrieval across memory and notes.
  - `manage_memory`: Record milestones and learn preferences.
  - `manage_task`: Track and update objectives on the productivity board.
- **Interactive Security Confirmation**: High-risk actions (terminal commands, file deletions) require explicit user authorization before execution.
- **Audit Log**: Every tool invocation is logged with timestamp, action, target, risk level, and user approval status.

### 6. Provider-Independent Intelligence Engine
Configurable through the visual Settings panel:
- **Google Gemini** (`gemini-2.5-flash`, `gemini-1.5-pro`)
- **OpenAI** (`gpt-4o`, `gpt-4o-mini`)
- **Anthropic Claude** (`claude-3-7-sonnet`, `claude-3-5-haiku`)
- **Groq** (`llama-3.3-70b-versatile`)
- **Ollama / Local LLM** (OpenAI-compatible local server without external internet requirements)

---

## 🏗️ Architecture & Project Structure

```
Visp/
├── src-tauri/                     # Native Rust Desktop Core (Tauri 2)
│   ├── src/
│   │   ├── main.rs                # Windows entry point
│   │   ├── lib.rs                 # Tauri app builder, tray icon & commands registration
│   │   ├── context.rs             # Windows API foreground window & process monitor
│   │   ├── db.rs                  # SQLite engine with FTS5 virtual tables
│   │   └── commands.rs            # Native system commands (execution, files, window modes)
│   ├── Cargo.toml                 # Rust dependencies (rusqlite, windows, chrono, serde)
│   └── tauri.conf.json            # Tauri v2 multi-mode window configuration
├── src/                           # Frontend (React 19 + TypeScript + Tailwind CSS)
│   ├── components/
│   │   ├── Orb.tsx                # Stateful physical animated glass orb
│   │   ├── Waveform.tsx           # Audio reactive waveform spectrum
│   │   ├── ConversationView.tsx   # Mode B: Voice & conversation floating bar
│   │   ├── WorkspaceView.tsx      # Mode C: Full second-brain dashboard & settings
│   │   └── ConfirmationModal.tsx  # Security authorization dialog for autonomous actions
│   ├── services/
│   │   ├── aiProvider.ts          # Multi-provider streaming AI engine (Gemini, OpenAI, Anthropic, Groq, Ollama)
│   │   ├── memoryEngine.ts        # 5-layer second brain, vector embeddings, hybrid retrieval
│   │   ├── voiceEngine.ts         # STT, TTS, WebAudio VAD & barge-in interruption
│   │   ├── contextEngine.ts       # Digital context monitor & sensitive data sanitizer
│   │   ├── agentEngine.ts         # Autonomous action planner, tool runner & audit recorder
│   │   ├── storage.ts             # Local database & open backup export/import
│   │   └── nativeBridge.ts        # IPC bridge between webview and Rust backend
│   ├── store/
│   │   └── useAppStore.ts         # Central Zustand reactive state store
│   ├── types/
│   │   └── index.ts               # Core type contracts
│   ├── __tests__/                 # Automated test suites (Vitest)
│   ├── App.tsx                    # Tri-mode container & hotkey manager
│   ├── App.css                    # Tailwind v4 glassmorphic & glow styles
│   └── main.tsx                   # React root entry
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (Node v24 tested)
- pnpm v9+
- Rust & Cargo (1.80+ / 1.93 tested with MSVC build tools)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Automated Tests
```bash
pnpm test
```

### 3. Build Web Bundle
```bash
pnpm build
```

### 4. Run Development Desktop App
```bash
# Starts Vite frontend dev server and launches Tauri native desktop window
pnpm tauri dev
```

### 5. Build Native Windows Installer / Binary
```bash
pnpm tauri build
```

---

## 🔒 Security & Privacy Commitments
1. **No Silent Recording**: Hands-free voice listening requires explicit activation, indicated by a glowing audio waveform and a microphone status indicator.
2. **Context Masking**: Sensitive application titles (passwords, credential managers, banking) are masked before ingestion.
3. **Execution Guardrails**: Destructive terminal actions and file removals require interactive confirmation.
4. **Local Backup**: Complete export of all memories, conversations, and projects in a standard JSON format.
