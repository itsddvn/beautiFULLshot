# BeautyFullShot

Cross-platform screenshot beautification app built with Tauri v2 + React + TypeScript.

## Features

- **Screenshot Capture**: Fullscreen, region, and window capture
- **Annotation Tools**: Shapes (rectangle, ellipse), arrows, lines, text, numbered annotations, spotlight effect
- **Beautification**: 24+ gradient backgrounds, aspect ratio cropping
- **Export Options**: PNG/JPEG with quality control, 1x/2x/3x resolution, clipboard copy
- **Native Integration**: System tray, global hotkeys, notifications
- **Cross-Platform**: Windows, macOS, Linux (X11)

## Installation

### Windows
Download `BeautyFullShot_x.x.x_x64-setup.exe` from [Releases](../../releases).

### macOS
Download `BeautyFullShot_x.x.x_x64.dmg` from [Releases](../../releases).
Drag to Applications folder.

> **Note**: First launch may require allowing the app in Security & Privacy settings.
> Screen recording permission is required for screenshot capture.

### Linux
Download `BeautyFullShot_x.x.x_amd64.AppImage` from [Releases](../../releases).

```bash
chmod +x BeautyFullShot_*.AppImage
./BeautyFullShot_*.AppImage
```

> **Note**: X11 is required. Wayland has limited support.

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Capture Screen | Cmd/Ctrl+Shift+C |
| Delete Selected | Delete/Backspace |
| Quick Save | Cmd/Ctrl+S |
| Copy to Clipboard | Cmd/Ctrl+Shift+V |
| Undo | Cmd/Ctrl+Z |
| Redo | Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y |

## Development

### Prerequisites

- Rust 1.70+
- Node.js 18+
- Platform-specific build tools:
  - **Windows**: Microsoft Visual Studio Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`

### Setup

```bash
# Clone repository
git clone https://github.com/your-username/beautyfullshot.git
cd beautyfullshot

# Install dependencies
npm install

# Run development server
npm run tauri dev

# Run tests
npm test

# Build for production
npm run tauri build
```

### Project Structure

```
beautyfullshot/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── stores/            # Zustand state management
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── src-tauri/             # Rust backend
│   ├── src/               # Tauri commands
│   └── icons/             # App icons
├── docs/                  # Documentation
└── plans/                 # Implementation plans
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Tauri v2 |
| Backend | Rust + xcap |
| Frontend | React 18 + TypeScript + Vite |
| Canvas | react-konva + Konva |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Testing | Vitest |

## Performance Targets

| Metric | Target |
|--------|--------|
| Bundle Size | < 15MB |
| Cold Start | < 1s |
| RAM (idle) | < 100MB |

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read the [docs/code-standards.md](docs/code-standards.md) before submitting PRs.
