# Kế Hoạch Phase 1: Xây Dựng Bộ Game Trí Tuệ Thầy Toàn A.I (8 Games)

Phase này tập trung vào việc tạo dựng nền móng giao diện (Dashboard) và hoàn chỉnh logic của cả 8 game dạy học tương tác.

## Checklist Công Việc (Tasks)

- [x] **Giao Diện Chung (UI/UX - Dashboard):**
  - Tạo cấu trúc file `index.html` và thiết lập hệ thống CSS HSL, font chữ `Outfit` + `Inter`.
  - Thiết kế màn hình Dashboard Glassmorphism sang trọng với các hiệu ứng hover nhấp nháy neon.
- [x] **Bộ Câu Hỏi & Điều Phối (app.js):**
  - Nhập ngân hàng câu hỏi Toán học lớp 6-9 đa dạng chủ đề.
  - Viết logic chuyển đổi màn hình mượt mà không load lại trang (SPA).
- [x] **Game 1: Kéo Co Kiến Thức (tug-of-war.js):**
  - Xây dựng thanh kéo co động, nhân vật đại diện Thầy Toàn A.I vs Đối thủ AI.
  - Logic tính điểm lực kéo: kéo dây thừng khi trả lời đúng/sai hoặc hết giờ.
- [x] **Game 2: Lật Mảnh Ghép Trí Uẩn (flip-puzzle.js):**
  - Tạo lưới che ảnh nền và ô đoán từ khóa.
  - Viết hàm lật mở mảnh ghép khi trả lời đúng câu hỏi Toán tương ứng.
- [x] **Game 3: Ninja Toán Học AI (ninja-toan.js):**
  - Kết nối webcam và tích hợp bộ công cụ MediaPipe Hands qua CDN.
  - Xử lý va chạm ngón trỏ với 4 bục đáp án phát sáng.
- [x] **Game 4: Đường Lên Đỉnh Olympia (quiz-climb.js):**
  - Thanh leo núi hiển thị tiến trình, câu hỏi tính giờ, Ngôi sao hy vọng (x2 điểm/phạt).
- [x] **Game 5: Đào Vàng Tri Thức (gold-miner.js):**
  - Móc câu dao động liên tục, nhấn phím/click để phóng móc gắp các cục vàng mang câu trả lời đúng.
- [x] **Game 6: Bắn Cung Toán Học (archery-math.js):**
  - Kéo và thả cung tên để bắn trúng bia mang đáp án đúng, tích hợp hiệu ứng vật lý quỹ đạo bay đơn giản.
- [x] **Game 7: Ghép Đôi Thẻ Bài (memory-match.js):**
  - Tạo bảng các thẻ bài lật úp, yêu cầu ghép cặp biểu thức và đáp án phân tích thành nhân tử tương ứng.
- [x] **Game 8: Rùa Bay Toán Học (flappy-math.js):**
  - Điều khiển nhân vật rùa bay lách qua các khe cửa, chọn khe cửa chứa đáp án đúng để đi tiếp.
- [x] **Tạo Tài Nguyên:**
  - Sử dụng AI để sinh ảnh nền bí ẩn `bg_secret.png` lưu trong thư mục dự án.

## Kết Quả Kỳ Vọng (Expected Outcomes)

1. Giao diện chạy mượt mà, tốc độ phản hồi tức thời.
2. Cả 8 game chạy đúng logic nghiệp vụ, hiển thị câu hỏi Toán lớp 6-9 rõ nét.
3. Nhận diện camera nhạy bén, độ trễ cử chỉ ngón trỏ < 100ms.

## Phương Pháp Kiểm Thử (Testing Strategy)

- **Manual Test:** 
  1. Kiểm tra chuyển tab/game trên Dashboard.
  2. Chơi thử từng game để kiểm tra tính mượt mà của chuyển động, âm thanh và kết quả điểm số.
  3. Bật camera ở game Ninja Toán học, kiểm tra con trỏ phản hồi theo cử chỉ ngón trỏ.
