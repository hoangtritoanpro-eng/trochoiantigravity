# Changelog

Tất cả những thay đổi nổi bật của dự án này sẽ được ghi lại trong file này theo định dạng quy chuẩn của **Solo Builder**.

Định dạng mẫu:
- **Added** cho các tính năng mới được triển khai.
- **Changed** cho các thay đổi trong logic hiện tại.
- **Deprecated** cho các tính năng cũ sắp bị xóa.
- **Removed** cho các tính năng đã bị xóa.
- **Fixed** cho các lỗi lập trình đã được sửa.
- **Security** trong trường hợp có lỗi bảo mật hoặc vá lỗi bảo mật.

## [1.6.0] - 2026-06-23

### Added
- **Game Ai Là Triệu Phú:** Tích hợp giao diện DOM game Ai Là Triệu Phú (không dùng Canvas) với hiệu ứng animation nổi bật.
- **Âm thanh MP3 cục bộ:** Sử dụng file mp3 tĩnh (nhạc nền, nhạc đúng/sai, nhạc mở đầu) thay vì Web Audio API cho game Ai Là Triệu Phú.
- Tối ưu UI game Ai Là Triệu Phú: Xóa text thừa và điều chỉnh lại CSS.

---

## [1.5.1] - 2026-06-22

### Fixed
- **Câu hỏi không hiển thị trong 5 game Canvas:** Lỗi do `var(--bg-panel)` và `var(--border-glass)` (CSS Custom Properties) không được Canvas 2D API đọc. Khi Canvas nhận string này, nó fallback về màu đen, khiến logic `isDark` đổi chữ sang đen → chữ đen trên nền đen = vô hình.
  - Fix trong: `quiz-climb.js`, `flappy-math.js`, `archery-math.js`, `gold-miner.js`, `tug-of-war.js`, `memory-match.js`
  - Thay thế bằng màu thực: `rgba(255, 255, 255, 0.92)` (nền trắng mờ), `rgba(15, 23, 42, 0.15)` (viền xám nhẹ), `#0f172a` (chữ tối).

---

## [1.5.0] - 2026-06-22

### Changed
- **Giao Diện Tươi Sáng (Bright Theme):** Chuyển đổi toàn bộ giao diện từ tông màu tối cyberpunk sang tông màu sáng pastel thân thiện với học sinh.
- **Phông chữ mới:** Tích hợp phông chữ bo tròn **Fredoka** (tiêu đề) và **Quicksand** (nội dung) từ Google Fonts — dễ đọc, dễ thương và phù hợp lứa tuổi.
- **Canvas 8 Game:** Chuyển đổi tất cả 8 màn hình trò chơi:
  - **Kéo Co:** Sân cỏ xanh mướt, dây thừng nâu đất, bục đáp án kính sáng.
  - **Lật Mảnh Ghép:** Nền trời xanh gradient nhạt, ô phủ kính trắng mờ dễ nhìn.
  - **Ninja Toán Học AI:** HUD trắng mờ, bục A/B xanh biển nổi bật camera.
  - **Đỉnh Cao Olympia:** Trời xanh ban ngày, núi xanh lá mát mẻ.
  - **Đào Vàng Tri Thức:** Vùng hầm cát vàng ấm áp, cục vàng sáng chói.
  - **Bắn Cung Toán Học:** Bầu trời ngày trong sáng, cung nâu gỗ tự nhiên.
  - **Ghép Đôi Thẻ Bài:** Nền oải hương pastel, mặt sau thẻ gradient xanh biển–tím.
  - **Rùa Bay Toán Học:** Nền trời xanh ngọc, cổng kính trắng chữ tối rõ nét.
- **Helper UI:** Cập nhật hàm `drawGlassCard` tự động thích ứng màu chữ/viền theo nền sáng/tối.

---

## [1.4.0] - 2026-06-22

### Added
- Tạo script **Chay_Local.bat** tự động chạy HTTP Server và mở trình duyệt để giáo viên chơi offline tại lớp học dễ dàng.
- Thiết lập tệp cấu hình **vercel.json** quy định các header bảo mật và rút gọn URL.
- Biên soạn bộ tài liệu **Huong_Dan_Su_Dung.md** hướng dẫn chi tiết luật chơi, quản lý câu hỏi, và xuất điểm CSV.
- Hoàn thành Audit bảo mật & tối ưu SEO (meta tags, headings, offline-mode fallbacks).

---

## [1.3.0] - 2026-06-22

### Added
- Tính năng **Quản Lý Câu Hỏi Tùy Chỉnh** (Custom Question Creator) cho phép giáo viên tự soạn câu hỏi, lưu trữ qua `localStorage` và trộn ngẫu nhiên vào 8 game tương tác.
- Tích hợp tính năng **Xuất Bảng Điểm ra CSV** chuẩn Excel tiếng Việt (UTF-8 BOM).
- Cấu hình **PWA (Progressive Web App)** với `manifest.json` cho phép cài đặt trực tiếp lên PC/Mobile.
- Viết Service Worker (`sw.js`) để **Cache Assets tĩnh & CDN động**, hỗ trợ chạy ngoại tuyến (Offline) toàn diện.
- Tối ưu hóa hiệu năng vẽ canvas và dọn dẹp bộ nhớ router.

---

## [1.2.0] - 2026-06-22

### Added
- Tính năng **Bảng Xếp Hạng** (Leaderboard) lưu trữ thành tích học sinh thông qua `localStorage`.
- Bổ sung trường nhập **Tên học sinh / Đội nhóm** tại Sidebar cấu hình.
- Tối ưu hóa **Responsive UI** trên thiết bị di động (mobile/tablet layout tự động chuyển dọc và co giãn lưới game mượt mà).
- Chuẩn hóa **SEO & Cấu trúc trang** (bổ sung thẻ meta description, keywords, thẻ `<h1>` chính).
- Đồng bộ cơ chế tính điểm chuẩn hóa (thang điểm 100) cho toàn bộ 8 game.

---

## [1.1.0] - 2026-06-22

### Added
- Hoàn thành bộ 8 game dạy học tương tác mang dấu ấn Thầy Toàn A.I:
  - **Game 1: Kéo Co Kiến Thức** (`tug-of-war.js`): Trò chơi kéo co đối kháng/lớp học.
  - **Game 2: Lật Mảnh Ghép Trí Uẩn** (`flip-puzzle.js`): Trò chơi đoán từ khóa và lật mở tranh ẩn.
  - **Game 3: Ninja Toán Học AI** (`ninja-toan.js`): Game tương tác webcam sử dụng thư viện MediaPipe Hands chỉ ngón trỏ.
  - **Game 4: Đỉnh Cao Olympia** (`quiz-climb.js`): Trò chơi leo núi tính điểm và Ngôi sao hy vọng.
  - **Game 5: Đào Vàng Tri Thức** (`gold-miner.js`): Trò chơi móc câu dao động gắp vàng.
  - **Game 6: Bắn Cung Toán Học** (`archery-math.js`): Trò chơi nhắm bắn cung tên vật lý.
  - **Game 7: Ghép Đôi Thẻ Bài** (`memory-match.js`): Trò chơi trí nhớ ghép hằng đẳng thức.
  - **Game 8: Rùa Bay Toán Học** (`flappy-math.js`): Trò chơi phản xạ bay vượt cổng đáp án.
- Tích hợp **Ngân hàng câu hỏi Toán học khối lớp 6-9** phân loại chi tiết theo chủ đề Đại số/Hình học và mức độ.
- Hệ thống âm thanh tổng hợp **AudioEngine** qua Web Audio API không phụ thuộc file tĩnh.
- Sinh ảnh nền AI bí ẩn chất lượng cao `bg_secret.png` cho game Lật Mảnh Ghép.
- Giao diện Dashboard Cyber Classroom mượt mà, hỗ trợ Responsive và Glassmorphism.

## [1.0.0] - 2026-06-22

### Added
- Khởi tạo dự án và thiết lập môi trường Solo Builder thành công.
- Cấu trúc thư mục tài liệu `docs/` tiêu chuẩn và file quy tắc `AGENTS.md`.
- File theo dõi trạng thái `CHANGELOG.md`.
