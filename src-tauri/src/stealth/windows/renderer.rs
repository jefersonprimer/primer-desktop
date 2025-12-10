use windows::Graphics::Capture::*;
use windows::Win32::Graphics::Direct3D11::*;
use windows::Win32::Graphics::Dxgi::*;
use windows::Win32::Graphics::Dxgi::Common::*;
use windows::Foundation::*;
use windows::core::Interface;
use crate::stealth::error::*;
use super::filter::WindowInfo;
use windows::Win32::Foundation::HWND;

pub struct Renderer {
    device: ID3D11Device,
    context: ID3D11DeviceContext,
    swap_chain: Option<IDXGISwapChain1>,
}

impl Renderer {
    pub fn new(device: ID3D11Device, target_hwnd: HWND) -> Result<Self> {
        unsafe {
            let mut context = None;
            device.GetImmediateContext(&mut context);
            let context = context.unwrap();

            // Create Swap Chain
            let dxgi_device: IDXGIDevice = device.cast()?;
            let adapter: IDXGIAdapter = dxgi_device.GetAdapter()?;
            let factory: IDXGIFactory2 = adapter.GetParent()?;

            let description = DXGI_SWAP_CHAIN_DESC1 {
                Width: 0, // Use window size
                Height: 0,
                Format: DXGI_FORMAT_B8G8R8A8_UNORM,
                Stereo: false.into(),
                SampleDesc: DXGI_SAMPLE_DESC { Count: 1, Quality: 0 },
                BufferUsage: DXGI_USAGE_RENDER_TARGET_OUTPUT,
                BufferCount: 2,
                Scaling: DXGI_SCALING_STRETCH,
                SwapEffect: DXGI_SWAP_EFFECT_FLIP_SEQUENTIAL,
                AlphaMode: DXGI_ALPHA_MODE_UNSPECIFIED, 
                Flags: 0,
            };

            let swap_chain = factory.CreateSwapChainForHwnd(
                &device,
                target_hwnd,
                &description,
                None,
                None,
            )?;

            Ok(Self {
                device,
                context,
                swap_chain: Some(swap_chain),
            })
        }
    }
    
    pub fn render_frame(
        &mut self,
        frame: &Direct3D11CaptureFrame,
        _windows_to_hide: &[WindowInfo],
    ) -> Result<()> {
        unsafe {
            let swap_chain = self.swap_chain.as_ref().ok_or(StealthError::D3D11Error("No swap chain".into()))?;

            // 1. Obter surface do frame capturado
            let surface = frame.Surface()?;
            let source_texture: ID3D11Texture2D = self.get_texture_from_surface(surface)?;

            // 2. Get Back Buffer
            let back_buffer: ID3D11Texture2D = swap_chain.GetBuffer(0)?;

            // 3. Simple Copy (assuming size matches)
            // In a real mirror, sizes might differ slightly, but for now copy resource is fastest
            self.context.CopyResource(&back_buffer, &source_texture);

            // 4. Present
            swap_chain.Present(1, 0).ok()?;
        }
        Ok(())
    }
    
    fn get_texture_from_surface(
        &self,
        surface: windows::Graphics::DirectX::Direct3D11::IDirect3DSurface,
    ) -> Result<ID3D11Texture2D> {
        use windows::Graphics::DirectX::Direct3D11::IDirect3DDxgiInterfaceAccess;
        
        unsafe {
            let access: IDirect3DDxgiInterfaceAccess = surface.cast()?;
            let texture: ID3D11Texture2D = access.GetInterface()?;
            Ok(texture)
        }
    }
}
