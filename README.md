# 🥷 Stealth Desktop App - Technical Specification

### SHORT CUTS
- Agora você pode usar tanto o botão na interface quanto o atalho Cmd+Shift+S (macOS) ou Ctrl+Shift+S (Windows/Linux) para alternar o modo furtivo completo.


## 📋 Overview

App desktop com Tauri 2 + Vite + TypeScript + Tailwind + Rust que implementa:
- ✅ **Stealth Mode**: Invisível para screen capture (Zoom, OBS, Teams)
- ✅ **Click-Through**: Janela transparente a cliques de mouse
- ✅ **Hide from Dock/Taskbar**: Não aparece em Alt-Tab nem barra de tarefas
- ✅ **Cross-platform**: macOS (nativo) + Windows/Linux (mirror)

---

## 🏗️ Architecture

### Strategy per OS:
- **macOS**: Native API (`NSWindow.sharingType`)
- **Windows/Linux**: Mirror com Screenshot Delta fallback (2ms latency target)

---

## 🛠️ Tech Stack

### Frontend:
- **Tauri 2**: Framework principal
- **Vite**: Build tool
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **React** (opcional): UI components

### Backend:
- **Rust**: Core logic
- **Platform-specific crates**: FFI para APIs nativas

---

## 📦 Dependencies Necessárias

### `Cargo.toml`

```toml
[dependencies]
tauri = { version = "2.0", features = ["..." ] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# macOS específico
[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.25"
objc = "0.2"
core-graphics = "0.23"
core-foundation = "0.9"

# Windows específico
[target.'cfg(target_os = "windows")'.dependencies]
windows = { version = "0.52", features = [
    "Win32_Foundation",
    "Win32_Graphics_Gdi",
    "Win32_Graphics_Direct3D11",
    "Win32_System_WinRT",
    "Win32_UI_WindowsAndMessaging",
    "Graphics_Capture",
] }

# Linux específico
[target.'cfg(target_os = "linux")'.dependencies]
x11 = { version = "2.21", features = ["xlib", "xrandr"] }
xcb = "1.2"
```

### `package.json`

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## 🎯 Features Core

### 1️⃣ Stealth Mode (Invisível para Screen Capture)

#### macOS Implementation
**O que precisamos:**
- Acesso à API `Cocoa` (NSWindow)
- FFI bridge Rust → Objective-C
- Manipular propriedades da janela Tauri

**APIs necessárias:**
```objective-c
// Objective-C (via Rust FFI)
NSWindow.sharingType = NSWindowSharingNone;
```

**Rust crates:**
- `cocoa`: Bindings para Cocoa framework
- `objc`: FFI para Objective-C
- `core-graphics`: Manipulação de janelas

**Passos:**
1. Obter handle da `NSWindow` da janela Tauri
2. Converter para pointer Objective-C
3. Chamar `setSharingType:` com `NSWindowSharingNone`
4. Janela fica invisível para screen capture

---

#### Windows Implementation (Mirror)
**O que precisamos:**
- Capturar desktop em tempo real (exceto nosso app)
- Renderizar em janela fake fullscreen
- GPU acceleration para 60fps

**APIs necessárias:**
```rust
// Windows Graphics Capture API
Windows::Graphics::Capture
- GraphicsCaptureSession
- Direct3D11CaptureFramePool

// Window manipulation
Win32::UI::WindowsAndMessaging
- EnumWindows
- GetWindowRect
- SetWindowPos
```

**Rust crates:**
- `windows`: Bindings oficiais Microsoft
- Direct3D11 para rendering

**Passos:**
1. Enumerar todas as janelas visíveis
2. Filtrar nossa própria janela (por HWND/PID)
3. Para cada janela:
   - Capturar conteúdo via Graphics Capture API
   - Obter posição/tamanho
4. Criar janela fake fullscreen
5. Renderizar todas as janelas capturadas (exceto a nossa)
6. Atualizar a 60fps

**Estrutura da captura:**
```
[Desktop] → [Filter nosso app] → [Render em fake window] → [Zoom captura fake]
```

---

#### Linux Implementation (X11: Mirror + Screenshot Delta Fallback)
**O que precisamos:**
- X11 Composite extension (para Mirror) ou `XGetImage` (para Screenshot)
- Fallback: Screenshots de alta frequência (Delta updates)
- Rendering com OpenGL/Vulkan

**APIs necessárias:**
```c
// X11
XCompositeRedirectWindow()
XGetWindowAttributes()
XQueryTree()
XGetImage() // Fallback Screenshot
```

**Rust crates:**
- `x11`: Bindings para X11
- `xcb`: Alternative bindings
- `xdg-desktop-portal`: Potencialmente para captura (via D-Bus)
- `image`: Para processamento de imagem/delta

**Passos:**
1. **Detectar ambiente:** X11.
2. **Para X11:**
   - **Estratégia A (Mirror):** Tentar usar `XComposite` para redirecionar rendering de janelas para offscreen buffers e compositar (excluindo nossa janela).
   - **Estratégia B (Fallback Screenshot Delta):** Se Mirror não for possível/ótimo, capturar screenshot da área atrás da janela (ou desktop inteiro) usando `XGetImage`.
   - Calcular delta (diferença) para otimizar transmissão/renderização.
   - Atualizar textura da janela fake.

**Desafios Linux:**
- Comportamento de X11 varia por Window Manager (Gnome, KDE, i3, etc).
- Implementações de `xdg-desktop-portal` e protocolos de captura podem variar.

---

### 2️⃣ Click-Through (Janela Transparente)

#### macOS
**API necessária:**
```objective-c
NSWindow.ignoresMouseEvents = YES;
```

**Rust implementation:**
```rust
use cocoa::appkit::NSWindow;
unsafe {
    window.setIgnoresMouseEvents_(true);
}
```

---

#### Windows
**API necessária:**
```rust
use windows::Win32::UI::WindowsAndMessaging::*;

SetWindowLongPtrW(
    hwnd,
    GWL_EXSTYLE,
    WS_EX_TRANSPARENT | WS_EX_LAYERED
);
```

**O que faz:**
- `WS_EX_TRANSPARENT`: Cliques passam através
- `WS_EX_LAYERED`: Permite transparência

---

#### Linux (X11)
**API necessária:**
```c
// Criar window com input-only class
XCreateWindow(..., InputOnly, ...)

// Ou setar propriedades
Atom atom = XInternAtom(display, "_NET_WM_WINDOW_TYPE_DOCK", False);
XChangeProperty(...);
```

**Rust implementation:**
```rust
use x11::xlib::*;
unsafe {
    XSetInputFocus(display, PointerRoot, RevertToParent, CurrentTime);
}
```

---

### 3️⃣ Hide from Dock/Taskbar/Alt-Tab

#### macOS (Hide from Dock)
**API necessária:**
```objective-c
NSApplication.setActivationPolicy(NSApplicationActivationPolicyAccessory);
// Ou
NSApplication.setActivationPolicy(NSApplicationActivationPolicyProhibited);
```

**Diferença:**
- `.accessory`: Esconde da Dock, mas pode ter janelas
- `.prohibited`: Completamente invisível (sem Dock, sem menu bar)

**Rust implementation:**
```rust
use cocoa::appkit::{NSApp, NSApplication, NSApplicationActivationPolicy};
unsafe {
    let app = NSApp();
    app.setActivationPolicy_(NSApplicationActivationPolicyAccessory);
}
```

---

#### Windows (Hide from Taskbar/Alt-Tab)
**APIs necessárias:**

1. **Taskbar:**
```rust
// No tauri.conf.json
{
  "tauri": {
    "windows": [{
      "skipTaskbar": true
    }]
  }
}
```

2. **Alt-Tab:**
```rust
use windows::Win32::UI::WindowsAndMessaging::*;

// Remove WS_EX_APPWINDOW, adiciona WS_EX_TOOLWINDOW
SetWindowLongPtrW(
    hwnd,
    GWL_EXSTYLE,
    GetWindowLongPtrW(hwnd, GWL_EXSTYLE) 
        & !WS_EX_APPWINDOW 
        | WS_EX_TOOLWINDOW
);
```

**Nota importante:**
- Apenas `WS_EX_TOOLWINDOW` não é suficiente
- Precisa remover `WS_EX_APPWINDOW` também
- Testar em diferentes versões do Windows

---

#### Linux (Hide from Taskbar/Alt-Tab)
**APIs necessárias:**

```c
// X11 Window Properties
_NET_WM_STATE_SKIP_TASKBAR
_NET_WM_STATE_SKIP_PAGER
_NET_WM_WINDOW_TYPE_DOCK
```

**Rust implementation:**
```rust
use x11::xlib::*;

unsafe {
    let display = XOpenDisplay(null());
    
    // Skip taskbar
    let skip_taskbar = XInternAtom(
        display, 
        b"_NET_WM_STATE_SKIP_TASKBAR\0".as_ptr() as *const i8,
        False
    );
    
    // Skip pager (Alt-Tab em alguns WMs)
    let skip_pager = XInternAtom(
        display,
        b"_NET_WM_STATE_SKIP_PAGER\0".as_ptr() as *const i8,
        False
    );
    
    // Aplicar propriedades
    XChangeProperty(display, window, ...);
}
```

**Desafio:**
- Comportamento varia por Window Manager (Gnome, KDE, i3, etc)
- Alguns WMs ignoram essas hints

---

## 🏗️ Estrutura do Projeto

```
src-tauri/
├── src/
│   ├── main.rs                    # Entry point
│   ├── lib.rs                     # Exports
│   ├── stealth/
│   │   ├── mod.rs                 # Módulo principal
│   │   ├── manager.rs             # Stealth manager (cross-platform)
│   │   ├── macos.rs               # macOS native implementation
│   │   ├── windows.rs             # Windows mirror implementation
│   │   └── linux.rs               # Linux mirror implementation
│   ├── clickthrough/
│   │   ├── mod.rs
│   │   ├── macos.rs
│   │   ├── windows.rs
│   │   └── linux.rs
│   ├── visibility/
│   │   ├── mod.rs                 # Hide from dock/taskbar
│   │   ├── macos.rs
│   │   ├── windows.rs
│   │   └── linux.rs
│   └── mirror/                    # Windows/Linux only
│       ├── mod.rs
│       ├── capture.rs             # Screen capture logic
│       ├── renderer.rs            # Fake window rendering
│       └── filter.rs              # Window filtering

src/
├── App.tsx                        # React app
├── components/
│   └── StealthControls.tsx        # UI para controles
├── lib/
│   └── tauri.ts                   # Tauri API wrappers
└── main.tsx
```

---

## 🔌 Tauri Commands (Rust → TypeScript)

### Commands necessários:

```rust
// src-tauri/src/main.rs

#[tauri::command]
async fn enable_stealth_mode() -> Result<StealthStatus, String>

#[tauri::command]
async fn disable_stealth_mode() -> Result<(), String>

#[tauri::command]
async fn enable_click_through() -> Result<(), String>

#[tauri::command]
async fn disable_click_through() -> Result<(), String>

#[tauri::command]
async fn hide_from_dock() -> Result<(), String>

#[tauri::command]
async fn show_in_dock() -> Result<(), String>

#[tauri::command]
async fn get_stealth_status() -> Result<StealthStatus, String>

// Tipos
#[derive(serde::Serialize, serde::Deserialize)]
struct StealthStatus {
    active: bool,
    method: StealthMethod,  // "native" ou "mirror"
    click_through: bool,
    hidden_from_dock: bool,
    os: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
enum StealthMethod {
    NativeAPI,      // macOS
    RealtimeMirror, // Windows/Linux
}
```

---

## 🎨 Frontend API (TypeScript)

### Wrapper para comandos Tauri:

```typescript
// src/lib/tauri.ts

export async function enableStealthMode(): Promise<StealthStatus> {
  return await invoke('enable_stealth_mode');
}

export async function disableStealthMode(): Promise<void> {
  return await invoke('disable_stealth_mode');
}

export async function enableClickThrough(): Promise<void> {
  return await invoke('enable_click_through');
}

export async function disableClickThrough(): Promise<void> {
  return await invoke('disable_click_through');
}

export async function hideFromDock(): Promise<void> {
  return await invoke('hide_from_dock');
}

export async function showInDock(): Promise<void> {
  return await invoke('show_in_dock');
}

export async function getStealthStatus(): Promise<StealthStatus> {
  return await invoke('get_stealth_status');
}

// Types
export interface StealthStatus {
  active: boolean;
  method: 'native' | 'mirror';
  click_through: boolean;
  hidden_from_dock: boolean;
  os: string;
}
```

---

## 🔑 Tauri Config (`tauri.conf.json`)

```json
{
  "tauri": {
    "windows": [
      {
        "title": "Stealth App",
        "width": 800,
        "height": 600,
        "transparent": true,
        "decorations": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "visible": true
      }
    ],
    "security": {
      "csp": null
    },
    "allowlist": {
      "all": false,
      "window": {
        "all": true,
        "create": true,
        "center": true,
        "requestUserAttention": true,
        "setResizable": true,
        "setTitle": true,
        "maximize": true,
        "unmaximize": true,
        "minimize": true,
        "unminimize": true,
        "show": true,
        "hide": true,
        "close": true,
        "setDecorations": true,
        "setAlwaysOnTop": true,
        "setSize": true,
        "setMinSize": true,
        "setMaxSize": true,
        "setPosition": true,
        "setFullscreen": true,
        "setFocus": true,
        "setIcon": true,
        "setSkipTaskbar": true,
        "startDragging": true
      }
    }
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Rust):
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stealth_activation_macos() {
        // Mock NSWindow
        // Testar setSharingType
    }

    #[test]
    fn test_window_filtering() {
        // Testar filtro de janelas no mirror
    }

    #[test]
    fn test_click_through_toggle() {
        // Testar ativação/desativação
    }
}
```

### Integration Tests:
- Testar em cada OS (VM ou CI/CD)
- Verificar com OBS/Zoom real
- Medir performance (FPS do mirror)

### Manual Testing Checklist:
- [ ] Stealth funciona no Zoom
- [ ] Stealth funciona no OBS
- [ ] Stealth funciona no Teams
- [ ] Click-through permite interação com apps atrás
- [ ] App não aparece no Alt-Tab
- [ ] App não aparece na Dock/Taskbar
- [ ] Mirror atualiza em tempo real (Windows/Linux)
- [ ] Performance aceitável (CPU < 10%, GPU < 30%)

---

## ⚠️ Desafios e Limitações

### macOS:
- ✅ API oficial, funciona perfeitamente
- ⚠️ Requer app assinado para distribuição
- ⚠️ Sandboxing pode bloquear (usar entitlements)

### Windows:
- ⚠️ Graphics Capture API requer Windows 10 1803+
- ⚠️ Pode requerer permissões elevadas
- ⚠️ Antivirus pode bloquear (falso positivo)
- ⚠️ Mirror consome GPU (~20-30%)

### Linux:
- ⚠️ Comportamento varia por DE/WM
- ⚠️ Pode não funcionar em todos os compositors

### Geral:
- Apps de captura podem evoluir e detectar técnicas
- Performance depende de hardware
- Possíveis conflitos com outros apps overlay

---

## 🚀 Build e Deploy

### Development:
```bash
npm install
npm run tauri dev
```

### Production Build:
```bash
# macOS
npm run tauri build -- --target universal-apple-darwin

# Windows
npm run tauri build -- --target x86_64-pc-windows-msvc

# Linux
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

### Code Signing:
- **macOS**: Requer Apple Developer Account
- **Windows**: Opcional mas recomendado (evita SmartScreen)
- **Linux**: Não necessário

---

## 📚 Recursos e Referências

### Documentation:
- [Tauri Docs](https://tauri.app/v1/guides/)
- [Windows Graphics Capture](https://docs.microsoft.com/en-us/windows/uwp/audio-video-camera/screen-capture)
- [macOS NSWindow](https://developer.apple.com/documentation/appkit/nswindow)
- [X11 Composite Extension](https://www.x.org/releases/X11R7.5/doc/compositeproto/compositeproto.txt)

### Rust Crates:
- [windows-rs](https://github.com/microsoft/windows-rs)
- [cocoa](https://crates.io/crates/cocoa)
- [x11](https://crates.io/crates/x11)

### Similar Projects:
- [Electron screen capture](https://www.electronjs.org/docs/latest/api/desktop-capturer)
- [OBS Virtual Camera](https://obsproject.com/kb/virtual-camera-guide)

---

## ✅ Checklist de Implementação

### Phase 1: Setup
- [ ] Criar projeto Tauri 2
- [ ] Configurar Vite + TypeScript + Tailwind
- [ ] Adicionar dependencies no Cargo.toml
- [ ] Estruturar módulos Rust

### Phase 2: Stealth Mode
- [ ] Implementar macOS native (NSWindow.sharingType)
- [ ] Implementar Windows mirror (Graphics Capture)
- [ ] Implementar Linux mirror (XComposite + Screenshot Fallback)
- [ ] Testar em cada plataforma

### Phase 3: Click-Through
- [ ] Implementar macOS (ignoresMouseEvents)
- [ ] Implementar Windows (WS_EX_TRANSPARENT)
- [ ] Implementar Linux (InputOnly window)
- [ ] Toggle on/off via hotkey

### Phase 4: Hide from Dock/Taskbar
- [ ] Implementar macOS (setActivationPolicy)
- [ ] Implementar Windows (skipTaskbar + WS_EX_TOOLWINDOW)
- [ ] Implementar Linux (_NET_WM_STATE hints)

### Phase 5: Frontend
- [ ] Criar UI de controles
- [ ] Implementar status indicator
- [ ] Adicionar hotkeys globais
- [ ] Persistir preferências

### Phase 6: Testing
- [ ] Testar com Zoom
- [ ] Testar com OBS
- [ ] Testar com Teams
- [ ] Performance profiling
- [ ] Cross-platform testing

### Phase 7: Polish
- [ ] Tratamento de erros
- [ ] Loading states
- [ ] Documentação de usuário
- [ ] Code signing
- [ ] Distribuição

---

## 🎯 MVP Scope

**Mínimo viável:**
- ✅ Stealth mode (macOS native + Windows/Linux mirror básico)
- ✅ Click-through toggle
- ✅ Hide from dock/taskbar
- ✅ UI básica de controles

**Nice to have:**
- ⭐ Hotkeys globais
- ⭐ Auto-start com sistema
- ⭐ Profiles/presets
- ⭐ Performance monitoring
- ⭐ Mirror optimization (adaptive FPS)

---

## 📝 Notas Finais

Este README cobre TUDO que você precisa saber para implementar o app:
- ✅ Arquitetura completa
- ✅ APIs necessárias por plataforma
- ✅ Estrutura de código
- ✅ Dependencies
- ✅ Testing strategy
- ✅ Desafios conhecidos

**Próximo passo:** Começar a implementação seguindo a checklist! 🚀
