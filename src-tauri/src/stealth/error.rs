use thiserror::Error;

#[derive(Error, Debug)]
pub enum StealthError {
    #[error("Failed to initialize Graphics Capture: {0}")]
    CaptureInitFailed(String),
    
    #[error("Failed to create Direct3D11 device: {0}")]
    D3D11Error(String),
    
    #[error("Failed to enumerate windows: {0}")]
    WindowEnumError(String),
    
    #[error("Failed to create fake window: {0}")]
    FakeWindowError(String),
    
    #[error("Windows API error: {0}")]
    WindowsApiError(#[from] windows::core::Error),
    
    #[error("Stealth mode not supported on this Windows version")]
    NotSupported,
}

pub type Result<T> = std::result::Result<T, StealthError>;
