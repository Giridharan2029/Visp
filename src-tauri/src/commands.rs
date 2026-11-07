use crate::context::{get_foreground_window_info, ActiveWindowInfo};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Manager, PhysicalSize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub success: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
}

#[tauri::command]
pub fn get_active_window() -> Option<ActiveWindowInfo> {
    get_foreground_window_info()
}

#[tauri::command]
pub fn execute_system_command(
    command: String,
    cwd: Option<String>,
) -> Result<CommandResult, String> {
    // Windows command execution
    let working_dir = cwd.unwrap_or_else(|| ".".to_string());
    
    let output = if cfg!(target_os = "windows") {
        Command::new("powershell")
            .args(["-NoProfile", "-Command", &command])
            .current_dir(&working_dir)
            .output()
    } else {
        Command::new("sh")
            .args(["-c", &command])
            .current_dir(&working_dir)
            .output()
    };

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let exit_code = out.status.code().unwrap_or(-1);
            Ok(CommandResult {
                stdout,
                stderr,
                exit_code,
                success: out.status.success(),
            })
        }
        Err(err) => Err(format!("Command execution failed: {}", err)),
    }
}

#[tauri::command]
pub fn read_file_text(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file '{}': {}", path, e))
}

#[tauri::command]
pub fn write_file_text(path: String, content: String) -> Result<bool, String> {
    if let Some(parent) = Path::new(&path).parent() {
        let _ = fs::create_dir_all(parent);
    }
    fs::write(&path, content)
        .map(|_| true)
        .map_err(|e| format!("Failed to write to file '{}': {}", path, e))
}

#[tauri::command]
pub fn list_dir(path: String) -> Result<Vec<FileEntry>, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("Directory '{}' does not exist", path));
    }
    let read_dir = fs::read_dir(p).map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut entries = Vec::new();
    for entry in read_dir.flatten() {
        let meta = entry.metadata().ok();
        let is_dir = meta.as_ref().map(|m| m.is_dir()).unwrap_or(false);
        let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
        let name = entry.file_name().to_string_lossy().to_string();
        let full_path = entry.path().to_string_lossy().to_string();

        entries.push(FileEntry {
            name,
            path: full_path,
            is_dir,
            size,
        });
    }

    Ok(entries)
}

#[tauri::command]
pub fn get_autostart_status() -> Result<bool, String> {
    #[cfg(windows)]
    {
        use winreg::enums::{HKEY_CURRENT_USER, KEY_READ};
        use winreg::RegKey;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        match hkcu.open_subkey_with_flags(r"Software\Microsoft\Windows\CurrentVersion\Run", KEY_READ) {
            Ok(run_key) => {
                let val: Result<String, _> = run_key.get_value("VISP");
                Ok(val.is_ok())
            }
            Err(_) => Ok(false),
        }
    }
    #[cfg(not(windows))]
    {
        Ok(false)
    }
}

#[tauri::command]
pub fn set_autostart(enable: bool) -> Result<bool, String> {
    #[cfg(windows)]
    {
        use winreg::enums::HKEY_CURRENT_USER;
        use winreg::RegKey;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (run_key, _) = hkcu
            .create_subkey(r"Software\Microsoft\Windows\CurrentVersion\Run")
            .map_err(|e| format!("Failed to access run registry key: {}", e))?;

        if enable {
            let exe_path = std::env::current_exe()
                .map_err(|e| format!("Could not get current executable path: {}", e))?;
            let exe_str = exe_path.to_string_lossy().to_string();
            run_key
                .set_value("VISP", &exe_str)
                .map_err(|e| format!("Failed to set registry value: {}", e))?;
            Ok(true)
        } else {
            let _ = run_key.delete_value("VISP");
            Ok(false)
        }
    }
    #[cfg(not(windows))]
    {
        Ok(false)
    }
}

#[tauri::command]
pub fn set_window_mode(app: AppHandle, mode: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        match mode.as_str() {
            "orb" => {
                let _ = window.set_size(PhysicalSize::new(140, 140));
                let _ = window.set_always_on_top(true);
                let _ = window.set_resizable(false);
            }
            "conversation" => {
                let _ = window.set_size(PhysicalSize::new(480, 680));
                let _ = window.set_always_on_top(true);
                let _ = window.set_resizable(true);
            }
            "workspace" => {
                let _ = window.set_size(PhysicalSize::new(1150, 780));
                let _ = window.set_always_on_top(false);
                let _ = window.set_resizable(true);
                let _ = window.center();
            }
            _ => return Err("Invalid window mode".to_string()),
        }
        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}

