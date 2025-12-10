use parking_lot::Mutex;
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use crate::stealth::error::*;
use super::{
    capture::GraphicsCapture,
    filter::WindowFilter,
    fake_window::FakeWindow,
    renderer::Renderer,
};
use windows::Win32::UI::WindowsAndMessaging::{SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE};
use windows::Win32::Foundation::HWND;

pub struct WindowsStealth {
    capture: Arc<Mutex<GraphicsCapture>>,
    filter: WindowFilter,
    fake_window: FakeWindow,
    renderer: Arc<Mutex<Renderer>>,
    active: Arc<Mutex<bool>>,
    render_thread: Option<thread::JoinHandle<()>>,
    target_hwnd: HWND,
}

impl WindowsStealth {
    pub fn new(our_hwnd: HWND) -> Result<Self> {
        let capture = GraphicsCapture::new()?;
        let filter = WindowFilter::new(our_hwnd);
        let fake_window = FakeWindow::new()?;
        let renderer = Renderer::new(capture.device.clone(), fake_window.get_hwnd())?;
        
        Ok(Self {
            capture: Arc::new(Mutex::new(capture)),
            filter,
            fake_window,
            renderer: Arc::new(Mutex::new(renderer)),
            active: Arc::new(Mutex::new(false)),
            render_thread: None,
            target_hwnd: our_hwnd,
        })
    }
    
    pub fn enable(&mut self) -> Result<()> {
        // 1. Hide our Real Window from Capture API (Essential!)
        unsafe {
            SetWindowDisplayAffinity(self.target_hwnd, WDA_EXCLUDEFROMCAPTURE).ok()?;
        }

        *self.active.lock() = true;
        self.fake_window.show()?;
        self.start_render_loop()?;
        Ok(())
    }
    
    pub fn disable(&mut self) -> Result<()> {
        // 1. Restore Real Window visibility to Capture
        unsafe {
            SetWindowDisplayAffinity(self.target_hwnd, windows::Win32::UI::WindowsAndMessaging::WDA_NONE).ok()?;
        }

        *self.active.lock() = false;
        self.fake_window.hide()?;
        self.stop_render_loop()?;
        Ok(())
    }
    
    fn start_render_loop(&mut self) -> Result<()> {
        let capture = Arc::clone(&self.capture);
        let renderer = Arc::clone(&self.renderer);
        let active = Arc::clone(&self.active);
        let filter = self.filter.clone(); // Clone structure if possible or wrap in Arc
        
        // WindowFilter doesn't impl Clone by default in the guide, I need to check
        // Assuming it's small (just a HWND).
        // If not, I'll need to wrap it.
        // Let's modify WindowFilter to derive Clone in filter.rs or just reimplement here.
        // Actually I'll just skip using filter in the loop for now as WDA_EXCLUDEFROMCAPTURE handles the filtering.
        
        let handle = thread::spawn(move || {
            while *active.lock() {
                // 60 FPS = 16.67ms per frame
                thread::sleep(Duration::from_millis(16));
                
                // Get next frame
                let capture = capture.lock();
                if let Ok(Some(frame)) = capture.try_get_next_frame() {
                    // Render
                    let mut renderer = renderer.lock();
                    // We pass empty list as WDA handles filtering
                    let _ = renderer.render_frame(&frame, &[]);
                }
            }
        });
        
        self.render_thread = Some(handle);
        Ok(())
    }
    
    fn stop_render_loop(&mut self) -> Result<()> {
        if let Some(handle) = self.render_thread.take() {
            *self.active.lock() = false;
            let _ = handle.join();
        }
        Ok(())
    }
}

// Ensure WindowFilter is Clone
impl Clone for WindowFilter {
    fn clone(&self) -> Self {
        Self { our_hwnd: self.our_hwnd }
    }
}
