// Native Bridge between Webview and Tauri Rust Backend

declare global {
  interface Window {
    __TAURI_INTERNALS__?: any;
  }
}

export interface NativeActiveWindow {
  title: string;
  process_name: string;
  pid: number;
}

export interface NativeCommandResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  success: boolean;
}

export interface NativeFileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: u64;
}

type u64 = number;

export class NativeBridge {
  static isTauri(): boolean {
    return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);
  }

  static async invoke<T>(command: string, args?: Record<string, any>): Promise<T> {
    if (this.isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<T>(command, args);
      } catch (e) {
        console.warn(`Tauri invoke '${command}' failed, falling back:`, e);
      }
    }
    return this.fallback(command, args);
  }

  /**
   * Safe fallback for browser / development preview
   */
  private static async fallback(command: string, args?: Record<string, any>): Promise<any> {
    switch (command) {
      case 'get_active_window':
        return {
          title: 'VISP Workspace — Visual Studio Code',
          process_name: 'Code.exe',
          pid: 14820,
        };
      case 'execute_system_command':
        return {
          stdout: `[Mock Execution of: ${args?.command}]\nOperation completed successfully.`,
          stderr: '',
          exit_code: 0,
          success: true,
        };
      case 'read_file_text':
        return `// Mock content for ${args?.path}\n{\n  "name": "visp",\n  "status": "ready"\n}`;
      case 'write_file_text':
        return true;
      case 'list_dir':
        return [
          { name: 'src', path: 'C:\\Users\\Giridharan\\Desktop\\PROJECT\\Visp\\src', is_dir: true, size: 0 },
          { name: 'src-tauri', path: 'C:\\Users\\Giridharan\\Desktop\\PROJECT\\Visp\\src-tauri', is_dir: true, size: 0 },
          { name: 'package.json', path: 'C:\\Users\\Giridharan\\Desktop\\PROJECT\\Visp\\package.json', is_dir: false, size: 593 },
          { name: 'README.md', path: 'C:\\Users\\Giridharan\\Desktop\\PROJECT\\Visp\\README.md', is_dir: false, size: 385 },
        ];
      case 'set_window_mode':
        return;
      default:
        return null;
    }
  }

  static async getActiveWindow(): Promise<NativeActiveWindow | null> {
    return await this.invoke<NativeActiveWindow | null>('get_active_window');
  }

  static async executeCommand(command: string, cwd?: string): Promise<NativeCommandResult> {
    return await this.invoke<NativeCommandResult>('execute_system_command', { command, cwd });
  }

  static async readFile(path: string): Promise<string> {
    return await this.invoke<string>('read_file_text', { path });
  }

  static async writeFile(path: string, content: string): Promise<boolean> {
    return await this.invoke<boolean>('write_file_text', { path, content });
  }

  static async listDir(path: string): Promise<NativeFileEntry[]> {
    return await this.invoke<NativeFileEntry[]>('list_dir', { path });
  }

  static async setWindowMode(mode: 'orb' | 'conversation' | 'workspace'): Promise<void> {
    await this.invoke<void>('set_window_mode', { mode });
  }
}
