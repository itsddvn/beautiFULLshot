# Phase 03: Backend Reliability

**Status**: pending | **Effort**: 3h | **Priority**: High

## Objective

Fix silent error handling, optimize performance, add structured errors.

## Issues Addressed

| ID | Severity | Description |
|----|----------|-------------|
| H1 | High | Silent error handling masks failures |
| H2 | High | Repeated expensive syscalls |
| H3 | High | PNG encoding reallocations |
| H4 | High | Late validation in capture_region |
| M1 | Medium | No structured error types |
| M3 | Medium | Unused greet command |

## Implementation

### 1. Structured Error Types

**src-tauri/src/error.rs:**
```rust
use serde::Serialize;

#[derive(Debug, Serialize)]
pub enum ScreenshotError {
    NoMonitorFound,
    WindowNotFound(u32),
    CaptureError(String),
    EncodingError(String),
    InvalidRegion { width: u32, height: u32 },
    PermissionDenied,
}

impl std::fmt::Display for ScreenshotError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NoMonitorFound => write!(f, "No primary monitor found"),
            Self::WindowNotFound(id) => write!(f, "Window {} not found", id),
            Self::CaptureError(e) => write!(f, "Capture failed: {}", e),
            Self::EncodingError(e) => write!(f, "PNG encoding failed: {}", e),
            Self::InvalidRegion { width, height } =>
                write!(f, "Invalid region: {}x{}", width, height),
            Self::PermissionDenied => write!(f, "Screen capture permission denied"),
        }
    }
}

impl std::error::Error for ScreenshotError {}
```

### 2. Fix Silent Error Handling

Replace `unwrap_or(0)` with proper error propagation:

```rust
// Before:
id: w.id().unwrap_or(0),

// After:
let id = match w.id() {
    Some(id) if id > 0 => id,
    _ => continue, // Skip invalid windows
};
```

### 3. Pre-allocate PNG Buffer

```rust
fn image_to_png_bytes(img: &image::RgbaImage) -> Result<Vec<u8>, ScreenshotError> {
    // Estimate: RGBA = 4 bytes/pixel, PNG ~50% compression
    let estimated_size = (img.width() * img.height() * 2) as usize;
    let mut bytes: Vec<u8> = Vec::with_capacity(estimated_size);

    let encoder = image::codecs::png::PngEncoder::new(&mut bytes);
    encoder
        .write_image(
            img.as_raw(),
            img.width(),
            img.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| ScreenshotError::EncodingError(e.to_string()))?;
    Ok(bytes)
}
```

### 4. Early Validation

```rust
#[tauri::command]
pub fn capture_region(x: i32, y: i32, width: u32, height: u32) -> Result<Vec<u8>, ScreenshotError> {
    // Validate BEFORE expensive operations
    if width == 0 || height == 0 {
        return Err(ScreenshotError::InvalidRegion { width, height });
    }

    // Now proceed with capture...
}
```

### 5. Remove Unused greet Command

Delete from lib.rs:
```rust
// Remove:
// #[tauri::command]
// fn greet(name: &str) -> String { ... }

// Remove from generate_handler:
// greet,
```

## Files to Create/Modify

| File | Action |
|------|--------|
| src-tauri/src/error.rs | Create |
| src-tauri/src/screenshot.rs | Modify |
| src-tauri/src/lib.rs | Modify |

## Success Criteria

- [ ] No unwrap_or(0) for IDs
- [ ] Structured error types
- [ ] PNG buffer pre-allocated
- [ ] Early validation before capture
- [ ] greet command removed
