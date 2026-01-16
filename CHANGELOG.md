# Changelog / Nhật ký thay đổi

All notable changes to BeautyFullShot will be documented in this file.
Tất cả các thay đổi đáng chú ý của BeautyFullShot sẽ được ghi lại trong file này.

---

## [1.0.3] - 2026-01-16

### Added / Tính năng mới
- **Text Formatting / Định dạng chữ**: Font family dropdown (10 fonts displayed in their typeface), size slider, bold/italic/underline/strikethrough buttons / Dropdown font (10 font hiển thị đúng kiểu chữ), thanh trượt cỡ chữ, nút B/I/U/S
- **Text Effects / Hiệu ứng chữ**: Normal and stroke (white outline) text effects / Hiệu ứng chữ thường và có viền trắng
- **Multiline Text / Chữ nhiều dòng**: Press Shift+Enter for new lines in text annotations / Nhấn Shift+Enter để xuống dòng
- **Duplicate Annotation / Nhân đôi**: Cmd/Ctrl+D to duplicate selected annotation (offset 1cm right) / Cmd/Ctrl+D để nhân đôi annotation đang chọn (lệch 1cm sang phải)

### Fixed / Sửa lỗi
- **Window Picker / Chọn cửa sổ**: Filter out small windows (icons, menu items) - only show real application windows / Lọc bỏ cửa sổ nhỏ (icon, menu) - chỉ hiển thị cửa sổ ứng dụng thực
- **Text Stroke Effect / Hiệu ứng viền chữ**: Fixed stroke covering text fill - now fill renders on top of stroke / Sửa lỗi viền che phủ chữ - giờ chữ hiển thị trên viền
- **Text Edit Overlay / Vùng soạn thảo**: Fixed edit box size to match displayed text dimensions / Sửa kích thước vùng soạn thảo khớp với kích thước chữ hiển thị

### Changed / Thay đổi
- **Color Picker / Chọn màu**: Simplified to single-row layout with 7 preset colors / Đơn giản hóa thành 1 hàng với 7 màu có sẵn
- **Region Capture Overlay / Lớp phủ chụp vùng**: Simplified dim effect implementation / Đơn giản hóa hiệu ứng làm mờ

---

## [1.0.2] - 2026-01-16

### Added / Tính năng mới
- **Auto-Update / Tự động cập nhật**: App checks for updates on startup and can update automatically / Ứng dụng kiểm tra cập nhật khi khởi động và tự động cập nhật
- **About Dialog / Hộp thoại Giới thiệu**: New About modal with app info, version, and social links / Hộp thoại Giới thiệu với thông tin app, phiên bản và liên kết mạng xã hội
- **App Icon / Biểu tượng ứng dụng**: Added app icon asset for About dialog / Thêm biểu tượng cho hộp thoại Giới thiệu

### Fixed / Sửa lỗi
- **Linux AppImage / Linux AppImage**: Fixed AppImage bundling on Ubuntu 24.04 (NO_STRIP for RELR compatibility) / Sửa lỗi đóng gói AppImage trên Ubuntu 24.04
- **Ghost Window / Cửa sổ ma**: Fixed transparent window rendering issue / Sửa lỗi hiển thị cửa sổ trong suốt

### Technical / Kỹ thuật
- Integrated tauri-plugin-updater for secure auto-updates / Tích hợp tauri-plugin-updater để tự động cập nhật an toàn
- Added updater signing public key / Thêm khóa công khai ký cập nhật
- CI/CD: Ubuntu 24.04, libfuse2, APPIMAGE_EXTRACT_AND_RUN, NO_STRIP / Cải thiện CI/CD cho Linux

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
