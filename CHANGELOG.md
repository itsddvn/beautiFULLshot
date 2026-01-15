# Changelog / Nhật ký thay đổi

All notable changes to BeautyFullShot will be documented in this file.
Tất cả các thay đổi đáng chú ý của BeautyFullShot sẽ được ghi lại trong file này.

---

## [1.0.1] - 2026-01-16

### Added / Tính năng mới
- **Border Feature / Viền ảnh**: Add customizable border with color picker, width (1-100px), and opacity control / Thêm viền tùy chỉnh với bộ chọn màu, độ rộng (1-100px) và độ mờ
- **Drag & Drop / Kéo thả**: Drop images directly into the app to edit / Kéo thả ảnh trực tiếp vào app để chỉnh sửa
- **Paste from Clipboard / Dán từ clipboard**: Paste images with Cmd/Ctrl+V / Dán ảnh bằng Cmd/Ctrl+V
- **Wallpaper Expansion / Mở rộng hình nền**: 50+ wallpaper backgrounds (12 per category) / 50+ hình nền (12 mỗi danh mục)
- **Draw Tool Dropdown / Menu công cụ vẽ**: Consolidated annotation tools in dropdown menu / Gom các công cụ chú thích vào menu dropdown
- **Capture Button Labels / Nhãn nút chụp**: Added text labels (Full/Region/Window) / Thêm nhãn (Toàn màn hình/Vùng chọn/Cửa sổ)

### Changed / Thay đổi
- **UI Theme / Giao diện**: Unified orange accent color throughout / Thống nhất màu cam xuyên suốt ứng dụng
- **Tool Settings / Cài đặt công cụ**: Color presets in 2-row grid, width slider (1-100px) / Màu sắc dạng lưới 2 hàng, thanh trượt độ rộng (1-100px)
- **Crop Panel / Bảng cắt ảnh**: More compact responsive design / Thiết kế gọn gàng hơn
- **Shadow Effect / Hiệu ứng đổ bóng**: Simplified implementation using drop shadow filter / Đơn giản hóa bằng bộ lọc đổ bóng
- **Copy Hotkey / Phím tắt sao chép**: Default changed to Cmd/Ctrl+C / Mặc định đổi thành Cmd/Ctrl+C
- **Toolbar Icons / Biểu tượng thanh công cụ**: Unified annotation tool icons with consistent SVG style / Thống nhất biểu tượng SVG

### Fixed / Sửa lỗi
- **Windows Ghost Image / Ảnh ma trên Windows**: Fixed ghost/transparent window rendering issue / Sửa lỗi cửa sổ trong suốt/ảnh ma
- **Output Ratio UX**: Relocated output aspect ratio control for better discoverability / Di chuyển điều khiển tỷ lệ xuất để dễ tìm hơn

### Technical / Kỹ thuật
- Removed unused imports and cleaned up code / Xóa import không dùng và dọn dẹp code
- Updated documentation and README / Cập nhật tài liệu và README

---

## [1.0.0] - 2026-01-13

### Added / Tính năng mới
- Initial release / Phiên bản đầu tiên
- Screenshot capture (fullscreen, region, window) / Chụp màn hình (toàn bộ, vùng chọn, cửa sổ)
- Annotation tools (shapes, arrows, text, freehand, spotlight) / Công cụ chú thích (hình, mũi tên, chữ, vẽ tay, spotlight)
- Background beautification (gradients, solid colors, wallpapers) / Làm đẹp nền (gradient, màu đơn, hình nền)
- Crop tool with aspect ratio presets / Công cụ cắt với tỷ lệ có sẵn
- Export to PNG/JPEG with quality and resolution options / Xuất PNG/JPEG với tùy chọn chất lượng và độ phân giải
- Copy to clipboard / Sao chép vào clipboard
- Global hotkeys / Phím tắt toàn cục
- System tray integration / Tích hợp khay hệ thống
- Cross-platform support (macOS, Windows, Linux) / Hỗ trợ đa nền tảng (macOS, Windows, Linux)
