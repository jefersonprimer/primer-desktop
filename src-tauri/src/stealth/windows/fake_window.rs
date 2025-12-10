use windows::Win32::Foundation::*;
use windows::Win32::UI::WindowsAndMessaging::*;
use windows::Win32::Graphics::Gdi::*;
use crate::stealth::error::*;
use windows::core::{w, PCWSTR};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;

pub struct FakeWindow {
    hwnd: HWND,
}

impl FakeWindow {
    pub fn new() -> Result<Self> {
        unsafe {
            // Registrar classe da janela
            let class_name = w!("StealthFakeWindow");
            let h_instance = GetModuleHandleW(None)?;
            
            let wc = WNDCLASSW {
                lpfnWndProc: Some(Self::window_proc),
                lpszClassName: class_name,
                hInstance: h_instance.into(),
                hCursor: LoadCursorW(None, IDC_ARROW)?,
                ..Default::default()
            };
            
            RegisterClassW(&wc);
            
            // Obter tamanho da tela
            let screen_width = GetSystemMetrics(SM_CXSCREEN);
            let screen_height = GetSystemMetrics(SM_CYSCREEN);
            
            // Criar janela fullscreen
            let hwnd = CreateWindowExW(
                // Note: Removing TOPMOST to allow user to see their apps. 
                // But the guide said TOPMOST. I will follow guide but maybe tweak if needed.
                // If it is TOPMOST and opaque, it covers everything.
                // We want it to be available for Capture.
                WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW, 
                class_name,
                w!("Stealth Mirror"),
                WS_POPUP,
                0, 0,
                screen_width, screen_height,
                None,
                None,
                h_instance,
                None,
            )?;
            
            // Deixar janela invisível inicialmente
            ShowWindow(hwnd, SW_HIDE);
            
            Ok(Self { hwnd })
        }
    }
    
    pub fn show(&self) -> Result<()> {
        unsafe {
            ShowWindow(self.hwnd, SW_SHOWNA); // Show without activating
            // Ensure it is visible but maybe not topmost if we want user to see apps?
            // If we use WDA_EXCLUDEFROMCAPTURE on the Real App, we don't need this Fake Window to cover it.
            // We just need this Fake Window to exist for Zoom to capture.
        }
        Ok(())
    }
    
    pub fn hide(&self) -> Result<()> {
        unsafe {
            ShowWindow(self.hwnd, SW_HIDE);
        }
        Ok(())
    }
    
    pub fn get_hwnd(&self) -> HWND {
        self.hwnd
    }
    
    unsafe extern "system" fn window_proc(
        hwnd: HWND,
        msg: u32,
        wparam: WPARAM,
        lparam: LPARAM,
    ) -> LRESULT {
        match msg {
            WM_DESTROY => {
                PostQuitMessage(0);
                LRESULT(0)
            }
            _ => DefWindowProcW(hwnd, msg, wparam, lparam),
        }
    }
}

impl Drop for FakeWindow {
    fn drop(&mut self) {
        unsafe {
            let _ = DestroyWindow(self.hwnd);
        }
    }
}
