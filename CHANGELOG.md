# Changelog

Tất cả những thay đổi nổi bật của dự án này sẽ được ghi lại trong file này theo định dạng quy chuẩn của **Solo Builder**.

Định dạng mẫu:
- **Added** cho các tính năng mới được triển khai.
- **Changed** cho các thay đổi trong logic hiện tại.
- **Deprecated** cho các tính năng cũ sắp bị xóa.
- **Removed** cho các tính năng đã bị xóa.
- **Fixed** cho các lỗi lập trình đã được sửa.
- **Security** trong trường hợp có lỗi bảo mật hoặc vá lỗi bảo mật.

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
