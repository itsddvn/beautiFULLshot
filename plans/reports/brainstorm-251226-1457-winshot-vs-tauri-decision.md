# Brainstorm: Winshot Fork vs Tauri Mới

**Ngày**: 2025-12-26
**Câu hỏi**: Phát triển tiếp từ Winshot hay tạo app Tauri mới?
**Quyết định**: Tauri mới + port frontend từ Winshot

---

## Bối Cảnh

- Bạn có quan hệ thân thiết với owner Winshot, có quyền contribute
- Mục tiêu: Sản phẩm cross-platform hoàn chỉnh (Windows, macOS, Linux)
- Winshot hiện tại: Wails v2 + Go + React/Konva, chỉ Windows

---

## Các Phương Án Đã Đánh Giá

### Phương án A: Fork Winshot (Wails)

| Khía cạnh | Đánh giá |
|-----------|----------|
| Frontend reuse | 80-90% |
| Backend rewrite | ~100% (lib không cross-platform) |
| Screenshot lib Go | ❌ Không có mature |
| Hotkeys/Tray | ❌ Wails v2 kém, v3 unstable |
| Rủi ro | CAO |

**Vấn đề chính**: `kbinani/screenshot` chỉ Windows, Wails v2 thiếu global hotkeys/tray support đúng nghĩa, v3 vẫn alpha.

### Phương án B: Tauri Mới ✅ Đã chọn

| Khía cạnh | Đánh giá |
|-----------|----------|
| Frontend reuse | 80-90% (copy trực tiếp) |
| Backend | Rust minimal (~100-200 LOC) |
| Screenshot lib | ✅ xcap (proven) |
| Hotkeys/Tray | ✅ Tauri plugins stable |
| Rủi ro | TRUNG BÌNH |

### Phương án C: Contribute vào Winshot gốc

Không khả thi vì vẫn đối mặt vấn đề Wails + có thể làm phức tạp codebase gốc.

---

## Lý Do Chọn Tauri

1. **Effort backend tương đương**: Dù fork hay làm mới, phải thay hết code Go platform-specific
2. **Ecosystem tốt hơn**: Tauri có xcap, plugins hotkey/tray mature
3. **Frontend portable**: React/Konva code từ Winshot copy được 80-90%
4. **Bundle nhỏ**: ~5-10MB vs 100MB+ Electron
5. **Learning curve chấp nhận được**: Chỉ cần ~100-200 dòng Rust

---

## Kế Hoạch Thực Hiện

1. Khởi tạo Tauri v2 project với React template
2. Copy frontend components từ Winshot (canvas, annotations, UI)
3. Rewire IPC calls từ Wails sang Tauri invoke
4. Viết Rust backend minimal (screenshot với xcap)
5. Thêm tray, hotkeys qua Tauri plugins
6. Test và polish theo từng platform

---

## Chỉ Số Thành Công

- Bundle size: < 15MB
- Startup time: < 1s
- RAM idle: < 100MB
- Feature parity với Winshot

---

## Câu Hỏi Chưa Giải Quyết

1. Tên project: "BeautyShot"?
2. Có cần hoạt động không quyền admin?
3. Priority Linux distros ngoài Ubuntu?
4. Phân phối qua app stores?

---

## Kết Luận

**Tauri mới + port frontend** là lựa chọn tối ưu. Fork Winshot không mang lại lợi thế vì phải rewrite backend anyway do thiếu cross-platform libraries trong Go ecosystem. Tauri có ecosystem và tooling tốt hơn cho desktop cross-platform apps.
