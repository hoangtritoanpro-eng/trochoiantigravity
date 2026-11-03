# Chi Tiết Kế Hoạch - Phase 7: Đóng Gói Game Ai Là Triệu Phú Thành 1 Tệp Riêng

Tài liệu này định nghĩa chi tiết các đầu việc cho việc phát triển và đóng gói game "Ai Là Triệu Phú Toán Học" thành một tệp standalone độc lập (`ai-la-trieu-phu.html`).

## 1. Danh Sách Công Việc (Task Checklist)

- [x] **Task 1: Cập nhật giao diện chính trong index.html**
  - Đã tích hợp `millionaireView` vào `index.html` và card mở game tại `dashboardView`.
  - Bổ sung nút liên kết trực tiếp mở tệp riêng `ai-la-trieu-phu.html`.

- [x] **Task 2: Thêm CSS và Styling chuẩn Dark Blue & Gold**
  - Chỉnh sửa `index.css` với layout Grid 3 cột và styling chi tiết (Dark Blue & Gold).

- [x] **Task 3: Viết Logic `millionaire.js`**
  - Lấy 22 câu hỏi từ `QuestionBank`.
  - Xử lý click đáp án, tính điểm, âm thanh MP3.

- [x] **Task 4: Tích hợp `app.js`**
  - Đóng mở view từ router trong app chính.

- [x] **Task 5: Đóng gói toàn bộ thành 1 tệp riêng `ai-la-trieu-phu.html`**
  - Đóng gói toàn bộ cấu trúc DOM, CSS hiện đại (Dark Blue & Gold), hệ thống câu hỏi phong phú (Toán 6, 7, 8, 9).
  - Tích hợp hệ thống âm thanh kép: MP3 tĩnh + Web Audio API synthesizer fallback (đảm bảo chạy 100% không bao giờ lỗi kể cả khi mở offline bằng `file:///`).
  - Hỗ trợ phím tắt A/B/C/D, 1/2/3/4, Space, Enter, Mũi tên trái/phải cho giáo viên trình chiếu.
  - Hỗ trợ bộ lọc Lớp (6, 7, 8, 9, Tổng hợp), Bộ lọc Chủ đề (Tất cả, Đại số, Hình học).
  - Tích hợp chế độ Toàn màn hình (Fullscreen) và hộp thoại nhập câu hỏi tùy chỉnh nhanh.
  - Bổ sung tháp giải thưởng 22 bậc mô phỏng gameshow Ai Là Triệu Phú thực thụ.

## 2. Kế Hoạch Kiểm Thử
- Mở trực tiếp file `ai-la-trieu-phu.html` trong trình duyệt.
- Kiểm tra giao diện 3 cột, độ co giãn responsive trên màn hình nhỏ.
- Kiểm tra 22 câu hỏi được sinh ngẫu nhiên, chuyển câu, chọn đáp án, kiểm tra đúng/sai, âm thanh và hiện đáp án.
- Kiểm tra tính năng toàn màn hình và bật/tắt âm thanh.
