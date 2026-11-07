import { SystemContext } from '../types';
import { NativeBridge } from './nativeBridge';
import { StorageService } from './storage';

export class ContextEngine {
  private static pollTimer: any = null;
  private static listeners: Array<(context: SystemContext) => void> = [];
  private static currentContext: SystemContext = {
    activeWindow: null,
    clipboard: null,
    projectContext: 'Visp Desktop AI Companion Workspace',
    isTrackingActive: true,
    isClipboardAllowed: true,
    isScreenContextAllowed: false,
    contextPaused: false,
  };

  private static SENSITIVE_KEYWORDS = [
    'password',
    'passcode',
    'bitwarden',
    '1password',
    'lastpass',
    'keepass',
    'authenticator',
    'banking',
    'credit card',
    'security question',
  ];

  static init() {
    const settings = StorageService.getSettings();
    this.currentContext.isTrackingActive = settings.context.enableWindowTracking;
    this.currentContext.isClipboardAllowed = settings.context.enableClipboardCapture;

    if (this.currentContext.isTrackingActive && !this.pollTimer) {
      this.startPolling(settings.context.pollIntervalMs || 2500);
    }
  }

  static subscribe(listener: (context: SystemContext) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentContext);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notify() {
    for (const listener of this.listeners) {
      listener({ ...this.currentContext });
    }
  }

  static startPolling(intervalMs: number = 2500) {
    if (this.pollTimer) clearInterval(this.pollTimer);

    this.pollTimer = setInterval(async () => {
      if (this.currentContext.contextPaused || !this.currentContext.isTrackingActive) {
        return;
      }

      try {
        const windowInfo = await NativeBridge.getActiveWindow();
        if (windowInfo) {
          const titleLower = windowInfo.title.toLowerCase();
          const isSensitive = this.SENSITIVE_KEYWORDS.some((kw) => titleLower.includes(kw));

          if (isSensitive) {
            this.currentContext.activeWindow = {
              title: '[Protected Sensitive Window]',
              processName: windowInfo.process_name,
              process_name: windowInfo.process_name,
              pid: windowInfo.pid,
              timestamp: new Date().toISOString(),
            };
          } else {
            this.currentContext.activeWindow = {
              title: windowInfo.title,
              processName: windowInfo.process_name,
              process_name: windowInfo.process_name,
              pid: windowInfo.pid,
              timestamp: new Date().toISOString(),
            };
          }
          this.notify();
        }
      } catch {
        // Polling error non-fatal
      }
    }, intervalMs);
  }

  static async readClipboard(): Promise<string | null> {
    if (!this.currentContext.isClipboardAllowed || this.currentContext.contextPaused) {
      return null;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        // Check if text looks like a password or private key
        if (
          text.includes('BEGIN RSA PRIVATE KEY') ||
          text.includes('BEGIN OPENSSH PRIVATE KEY') ||
          text.length > 5000
        ) {
          return '[Sensitive/Oversized Clipboard Content Omitted]';
        }
        this.currentContext.clipboard = text;
        this.notify();
        return text;
      }
    } catch {
      // Permission might be denied
    }
    return null;
  }

  static togglePauseContext(): boolean {
    this.currentContext.contextPaused = !this.currentContext.contextPaused;
    this.notify();
    return this.currentContext.contextPaused;
  }

  static setTrackingActive(active: boolean) {
    this.currentContext.isTrackingActive = active;
    this.notify();
  }

  static setClipboardAllowed(allowed: boolean) {
    this.currentContext.isClipboardAllowed = allowed;
    this.notify();
  }

  static getFormattedContext(): string {
    if (this.currentContext.contextPaused) {
      return 'Context sharing is currently paused by the user.';
    }

    const parts: string[] = [];

    if (this.currentContext.activeWindow) {
      parts.push(
        `- Foreground App: ${this.currentContext.activeWindow.processName} ("${this.currentContext.activeWindow.title}")`
      );
    }

    if (this.currentContext.projectContext) {
      parts.push(`- Project Context: ${this.currentContext.projectContext}`);
    }

    if (this.currentContext.clipboard) {
      const snippet =
        this.currentContext.clipboard.length > 200
          ? this.currentContext.clipboard.substring(0, 200) + '...'
          : this.currentContext.clipboard;
      parts.push(`- Recent Clipboard Snippet: "${snippet}"`);
    }

    return parts.length > 0 ? parts.join('\n') : 'No active context collected.';
  }

  static getCurrentContext(): SystemContext {
    return { ...this.currentContext };
  }
}
