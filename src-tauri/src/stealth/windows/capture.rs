use windows::Graphics::Capture::*;
use windows::Graphics::DirectX::Direct3D11::*;
use windows::Win32::Graphics::Direct3D11::*;
use windows::Foundation::*;
use crate::stealth::error::*;

pub struct GraphicsCapture {
    pub session: GraphicsCaptureSession,
    pub frame_pool: Direct3D11CaptureFramePool,
    pub device: ID3D11Device,
}

impl GraphicsCapture {
    pub fn new() -> Result<Self> {
        // 1. Criar Direct3D11 Device
        let device = Self::create_d3d11_device()?;
        
        // 2. Obter monitor primário
        let item = Self::get_primary_monitor_item()?;
        
        // 3. Criar frame pool
        let direct3d_device = Self::create_direct3d_device(&device)?;
        let size = item.Size()?;
        
        let frame_pool = Direct3D11CaptureFramePool::CreateFreeThreaded(
            &direct3d_device,
            windows::Graphics::DirectX::DirectXPixelFormat::B8G8R8A8UIntNormalized,
            2, // 2 buffers
            size,
        )?;
        
        // 4. Criar sessão de captura
        let session = frame_pool.CreateCaptureSession(&item)?;
        session.StartCapture()?;
        
        Ok(Self {
            session,
            frame_pool,
            device,
        })
    }
    
    pub fn try_get_next_frame(&self) -> Result<Option<Direct3D11CaptureFrame>> {
        match self.frame_pool.TryGetNextFrame() {
            Ok(frame) => Ok(Some(frame)),
            Err(_) => Ok(None), // Nenhum frame disponível ainda
        }
    }
    
    fn create_d3d11_device() -> Result<ID3D11Device> {
        use windows::Win32::Graphics::Direct3D::*;
        use windows::Win32::Graphics::Direct3D11::*;
        
        let mut device = None;
        let mut context = None;
        
        unsafe {
            D3D11CreateDevice(
                None,
                D3D_DRIVER_TYPE_HARDWARE,
                None,
                D3D11_CREATE_DEVICE_BGRA_SUPPORT,
                None,
                D3D11_SDK_VERSION,
                Some(&mut device),
                None,
                Some(&mut context),
            )?;
        }
        
        device.ok_or_else(|| StealthError::D3D11Error("Failed to create device".into()))
    }
    
    fn get_primary_monitor_item() -> Result<GraphicsCaptureItem> {
        use windows::Graphics::Capture::GraphicsCaptureItem;
        use windows::Win32::Graphics::Gdi::*;
        use windows::Win32::Foundation::POINT;
        
        unsafe {
            // Obter handle do monitor primário
            let monitor = MonitorFromPoint(
                POINT { x: 0, y: 0 },
                MONITOR_DEFAULTTOPRIMARY,
            );
            
            // Criar GraphicsCaptureItem do monitor
            // Note: GraphicsCaptureItem::CreateForMonitor requires an interop interface.
            // Using a helper function often provided by windows crate or specialized interop
            
            let interop = windows::Graphics::Capture::GraphicsCaptureItem::interop()?;
            interop.CreateForMonitor(monitor)
                .map_err(|e| StealthError::CaptureInitFailed(e.to_string()))
        }
    }
    
    fn create_direct3d_device(d3d_device: &ID3D11Device) -> Result<IDirect3DDevice> {
        use windows::Graphics::DirectX::Direct3D11::IDirect3DDxgiInterfaceAccess;
        use windows::Win32::System::WinRT::Direct3D11::CreateDirect3D11DeviceFromDXGIDevice;
        use windows::Win32::Graphics::Dxgi::IDXGIDevice;
        use windows::core::Interface;

        unsafe {
            let dxgi_device: IDXGIDevice = d3d_device.cast()?;
            let inspectable = CreateDirect3D11DeviceFromDXGIDevice(&dxgi_device)?;
            inspectable.cast().map_err(|e| e.into())
        }
    }
}

impl Drop for GraphicsCapture {
    fn drop(&mut self) {
        let _ = self.session.Close();
        let _ = self.frame_pool.Close();
    }
}
