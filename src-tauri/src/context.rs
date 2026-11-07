use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct ActiveWindowInfo {
    pub title: String,
    pub process_name: String,
    pub pid: u32,
}

#[cfg(windows)]
pub fn get_foreground_window_info() -> Option<ActiveWindowInfo> {
    use windows::Win32::Foundation::{CloseHandle, HWND};
    use windows::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_FORMAT, PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
    };
    use windows::core::PWSTR;

    unsafe {
        let hwnd: HWND = GetForegroundWindow();
        if hwnd.0.is_null() {
            return None;
        }

        // Get window title
        let text_len = GetWindowTextLengthW(hwnd);
        let title = if text_len > 0 {
            let mut title_buf: Vec<u16> = vec![0; (text_len + 1) as usize];
            let copied = GetWindowTextW(hwnd, &mut title_buf);
            if copied > 0 {
                String::from_utf16_lossy(&title_buf[..copied as usize])
            } else {
                String::new()
            }
        } else {
            String::new()
        };

        // Get PID
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));

        let mut process_name = String::new();
        if pid > 0 {
            if let Ok(process_handle) = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
                let mut path_buf: Vec<u16> = vec![0; 1024];
                let mut size = path_buf.len() as u32;
                let pwstr = PWSTR(path_buf.as_mut_ptr());

                if QueryFullProcessImageNameW(
                    process_handle,
                    PROCESS_NAME_FORMAT(0),
                    pwstr,
                    &mut size,
                )
                .is_ok()
                {
                    let full_path = String::from_utf16_lossy(&path_buf[..size as usize]);
                    if let Some(filename) = std::path::Path::new(&full_path).file_name() {
                        process_name = filename.to_string_lossy().to_string();
                    } else {
                        process_name = full_path;
                    }
                }
                let _ = CloseHandle(process_handle);
            }
        }

        Some(ActiveWindowInfo {
            title,
            process_name,
            pid,
        })
    }
}

#[cfg(not(windows))]
pub fn get_foreground_window_info() -> Option<ActiveWindowInfo> {
    None
}
