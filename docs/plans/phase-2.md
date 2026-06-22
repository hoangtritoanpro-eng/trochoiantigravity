# Chi Tiết Kế Hoạch - Phase 2: UI/UX & Tính năng chính (Bảng Xếp Hạng & Tối Ưu)

Tài liệu này định nghĩa chi tiết các đầu việc, kết quả đầu ra và phương thức kiểm thử cho **Phase 2**. AI Agent cần bám sát checklist này và đánh dấu `[x]` sau khi hoàn thành mỗi task.

---

## 1. Danh Sách Công Việc (Task Checklist)

- [x] **Task 1: Cấu hình SEO và Cải thiện cấu trúc HTML**
  - *Mô tả chi tiết:* Thêm thẻ meta description, keywords cho SEO, thay thế cấu trúc logo/header bằng `<h1>` chuẩn SEO và đảm bảo các thẻ ngữ nghĩa HTML5 đầy đủ.
  - *File cần tác động:* `index.html`
- [x] **Task 2: Thiết kế giao diện Bảng xếp hạng và Ô nhập tên**
  - *Mô tả chi tiết:* Thêm nút "Bảng Xếp Hạng" trên Nav bar. Thêm ô nhập tên người chơi tại Sidebar. Thêm phần hiển thị View Bảng xếp hạng với cấu trúc Glassmorphic Table.
  - *File cần tác động:* `index.html`
- [x] **Task 3: CSS Styling cho Bảng xếp hạng & Tối ưu Responsive**
  - *Mô tả chi tiết:* Định nghĩa phong cách cho bảng xếp hạng, huy hiệu xếp hạng Top 1-2-3 (glowing gradients, emojis). Cải thiện tính năng responsive cho màn hình điện thoại di động và máy tính bảng nhỏ.
  - *File cần tác động:* `index.css`
- [x] **Task 4: Logic quản lý Bảng xếp hạng qua LocalStorage**
  - *Mô tả chi tiết:* Viết logic lưu trữ điểm số, sắp xếp xếp hạng, tải dữ liệu bảng xếp hạng từ `localStorage`, liên kết sự kiện tab chuyển màn hình và nút xóa lịch sử điểm số.
  - *File cần tác động:* `app.js`
- [x] **Task 5: Tích hợp hệ thống lưu điểm vào 8 Game**
  - *Mô tả chi tiết:* Sửa đổi logic của tất cả 8 game để gọi hàm `AppRouter.saveScore` một lần duy nhất khi kết thúc game.
  - *File cần tác động:* `tug-of-war.js`, `flip-puzzle.js`, `ninja-toan.js`, `quiz-climb.js`, `gold-miner.js`, `archery-math.js`, `memory-match.js`, `flappy-math.js`

---

## 2. Kết Quả Đầu Ra Kỳ Vọng (Expected Outcomes)

- [x] **Sản phẩm chạy được:** Không phát sinh lỗi biên dịch hoặc runtime.
- [x] **Đầu ra cụ thể:**
  - Học sinh có thể lưu lại tên/đội của mình trước hoặc trong khi chơi.
  - Điểm số sau mỗi lượt chơi được tự động chuẩn hóa về thang điểm 100 và ghi nhận vào bảng xếp hạng.
  - Bảng xếp hạng sắp xếp chính xác từ cao xuống thấp và hiển thị đẹp mắt, trực quan.
  - Giao diện đáp ứng (responsive) tốt trên cả màn hình di động nhỏ.
- [x] **Tài liệu & Trạng thái:**
  - Cập nhật `CHANGELOG.md` ghi nhận các tính năng của Phase 2.

---

## 3. Kế Hoạch Kiểm Thử (Testing & Quality Assurance)

### Hướng dẫn kiểm thử thủ công (Manual Test Guide dành cho User)

Hãy kiểm tra theo các bước sau để nghiệm thu Phase này:

1. **Bước 1:** Truy cập ứng dụng qua trình duyệt.
2. **Bước 2:** Nhập tên người chơi "Thầy Toàn A.I Test" vào Sidebar.
3. **Bước 3:** Click chọn game **Đường Lên Đỉnh Olympia** (Quiz Climb), chơi hoàn thành 5 câu hỏi để game kết thúc.
4. **Bước 4:** Bấm tab "Bảng Xếp Hạng", xác minh có dòng ghi nhận: "Thầy Toàn A.I Test", game "Đường Lên Đỉnh Olympia", Điểm số chính xác.
5. **Bước 5:** Thay đổi kích thước màn hình sang dạng di động (khoảng 375px chiều rộng) để xác nhận Sidebar ẩn/hiển thị hợp lý hoặc tự động co giãn lưới game không bị vỡ.
6. **Bước 6:** Bấm nút "Xóa Lịch Sử", bảng xếp hạng lập tức được làm trống.
