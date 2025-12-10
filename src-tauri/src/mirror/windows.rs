// src-tauri/src/mirror/windows.rs

use windows::{
    core::{Interface, Result, HSTRING, ComInterface},
    Graphics::Capture::{Direct3D11CaptureFramePool, GraphicsCaptureItem, GraphicsCaptureSession},
    Graphics::DirectX::DirectXPixelFormat,
    Win32::{
        Graphics::{
            Direct3D11::{
                D3D11CreateDevice, ID3D11Device, ID3D11DeviceContext, ID3D11Texture2D,
                D3D11_BIND_FLAG, D3D11_bind_render_target, D3D11_CPU_ACCESS_READ,
                D3D11_CREATE_DEVICE_BGRA_SUPPORT, D3D11_MAPPED_SUBRESOURCE, D3D11_MAP_READ,
                D3D11_SDK_VERSION, D3D11_TEXTURE2D_DESC, D3D11_USAGE_STAGING,
                D3D_DRIVER_TYPE_HARDWARE, D3D_FEATURE_LEVEL, D3D_FEATURE_LEVEL_11_1,
            },
            Dxgi::{IDXGISurface},
            Gdi::{GetMonitorInfoW, MonitorFromWindow, HMONITOR, MONITORINFO, MONITORINFOEXW, MONITOR_DEFAULTTOPRIMARY},
        },
        System::WinRT::{
            Direct3D11::{CreateDirect3D11DeviceFromDxgiDevice, IDirect3DDxgiInterfaceAccess},
            Graphics::Capture::IGraphicsCaptureItemInterop,
        },
        Foundation::{HWND, RECT},
    },
};

use tauri::Window;
use std::sync::{Arc, Mutex};
use super::CaptureFrame;

pub struct CaptureManager {
    d3d_device: ID3D11Device,
    d3d_context: ID3D11DeviceContext,
}

impl CaptureManager {
    pub fn new() -> Result<Self> {
        let mut d3d_device: Option<ID3D11Device> = None;
        let mut d3d_context: Option<ID3D11DeviceContext> = None;
        let mut feature_level = D3D_FEATURE_LEVEL_11_1;

        unsafe {
            D3D11CreateDevice(
                None,
                D3D_DRIVER_TYPE_HARDWARE,
                None,
                D3D11_CREATE_DEVICE_BGRA_SUPPORT,
                Some(&[D3D_FEATURE_LEVEL_11_1]),
                D3D11_SDK_VERSION,
                Some(&mut d3d_device),
                Some(&mut feature_level),
                Some(&mut d3d_context),
            )?;
        }

        Ok(Self {
            d3d_device: d3d_device.unwrap(),
            d3d_context: d3d_context.unwrap(),
        })
    }

    pub fn start_capture(
        &self,
        target_item: GraphicsCaptureItem,
        on_frame_received: Box<dyn Fn(CaptureFrame) + Send + Sync + 'static>,
    ) -> Result<GraphicsCaptureSession> {
        // Create WinRT Device from D3D Device
        let dxgi_device = self.d3d_device.cast::<windows::Win32::Graphics::Dxgi::IDXGIDevice>()?;
        let direct3d_device = unsafe { CreateDirect3D11DeviceFromDxgiDevice(&dxgi_device)? };

        let frame_pool = Direct3D11CaptureFramePool::CreateFreeThreaded(
            &direct3d_device,
            DirectXPixelFormat::B8G8R8A8UIntNormalized,
            2,
            target_item.Size()?,
        )?;

        let session = frame_pool.CreateCaptureSession(&target_item)?;
        
        let d3d_device = self.d3d_device.clone();
        let d3d_context = self.d3d_context.clone();

        frame_pool.FrameArrived(
            &windows::Foundation::TypedEventHandler::new(move |sender, _| {
                let frame_pool = sender.as_ref().unwrap();
                let frame = frame_pool.TryGetNextFrame()?;
                
                let surface = frame.Surface()?;
                let interop = surface.cast::<IDirect3DDxgiInterfaceAccess>()?;
                let d3d_surface: IDXGISurface = unsafe { interop.GetInterface()? };
                let source_texture: ID3D11Texture2D = d3d_surface.cast()?;

                let mut desc = D3D11_TEXTURE2D_DESC::default();
                unsafe { source_texture.GetDesc(&mut desc) };

                desc.Usage = D3D11_USAGE_STAGING;
                desc.BindFlags = 0;
                desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
                desc.MiscFlags = 0;

                let mut staging_texture: Option<ID3D11Texture2D> = None;
                unsafe {
                    d3d_device.CreateTexture2D(&desc, None, Some(&mut staging_texture))?;
                }
                let staging_texture = staging_texture.unwrap();

                unsafe {
                    d3d_context.CopyResource(&staging_texture, &source_texture);
                }

                let mut mapped_resource = D3D11_MAPPED_SUBRESOURCE::default();
                unsafe {
                    d3d_context.Map(
                        &staging_texture,
                        0,
                        D3D11_MAP_READ,
                        0,
                        Some(&mut mapped_resource),
                    )?;
                }

                // Copy data
                let width = desc.Width as usize;
                let height = desc.Height as usize;
                let row_pitch = mapped_resource.RowPitch as usize;
                // We only want 4 bytes per pixel * width
                let row_size = width * 4;
                
                let mut pixels = Vec::with_capacity(width * height * 4);
                let src_ptr = mapped_resource.pData as *const u8;

                for y in 0..height {
                    let row_start = unsafe { src_ptr.add(y * row_pitch) };
                    let row_slice = unsafe { std::slice::from_raw_parts(row_start, row_size) };
                    pixels.extend_from_slice(row_slice);
                }

                unsafe {
                    d3d_context.Unmap(&staging_texture, 0);
                }

                on_frame_received(CaptureFrame {
                    width: desc.Width,
                    height: desc.Height,
                    data: pixels,
                });

                Ok(())
            }),
        )?;

        session.StartCapture()?;
        Ok(session)
    }

    pub fn capture_primary_monitor_item() -> Result<GraphicsCaptureItem> {
        let monitor_handle = unsafe { MonitorFromWindow(HWND(0), MONITOR_DEFAULTTOPRIMARY) };
        
        let interop = windows::core::factory::<GraphicsCaptureItem, IGraphicsCaptureItemInterop>()?;
        unsafe { interop.CreateForMonitor(monitor_handle) }
    }
}