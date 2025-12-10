use windows::Win32::Foundation::*;
use windows::Win32::UI::WindowsAndMessaging::*;
use windows::Win32::Graphics::Gdi::*;
use crate::stealth::error::*;

#[derive(Debug, Clone)]
pub struct WindowInfo {
    pub hwnd: HWND,
    pub rect: RECT,
    pub title: String,
    pub is_visible: bool,
}

pub struct WindowFilter {
    our_hwnd: HWND,
}

impl WindowFilter {
    pub fn new(our_hwnd: HWND) -> Self {
        Self { our_hwnd }
    }
    
    pub fn get_visible_windows(&self) -> Result<Vec<WindowInfo>> {
        let mut windows = Vec::new();
        
        unsafe {
            EnumWindows(
                Some(Self::enum_callback),
                LPARAM(&mut windows as *mut _ as isize)
            )?;
        }
        
        Ok(windows)
    }
    
    pub fn filter_our_window(&self, windows: Vec<WindowInfo>) -> Vec<WindowInfo> {
        windows
            .into_iter()
            .filter(|w| w.hwnd != self.our_hwnd)
            .collect()
    }
    
    unsafe extern "system" fn enum_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let windows = &mut *(lparam.0 as *mut Vec<WindowInfo>);
        
        // Verificar se é visível
        if !IsWindowVisible(hwnd).as_bool() {
            return BOOL(1);
        }
        
        // Obter rect
        let mut rect = RECT::default();
        if GetWindowRect(hwnd, &mut rect).is_err() {
            return BOOL(1);
        }
        
        // Verificar se tem área válida
        if rect.right <= rect.left || rect.bottom <= rect.top {
            return BOOL(1);
        }
        
        // Obter título
        let mut title_buffer = [0u16; 512];
        let len = GetWindowTextW(hwnd, &mut title_buffer);
        let title = String::from_utf16_lossy(&title_buffer[..len as usize]);
        
        windows.push(WindowInfo {
            hwnd,
            rect,
            title,
            is_visible: true,
        });
        
        BOOL(1) // Continuar enumeração
    }
}
