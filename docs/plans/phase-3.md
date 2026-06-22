# Chi Tiết Kế Hoạch - Phase 3: Tính Năng Nâng Cao & Tối Ưu (Cài Đặt Tùy Biến & PWA)

Tài liệu này định nghĩa chi tiết các đầu việc, kết quả đầu ra và phương thức kiểm thử cho **Phase 3**. AI Agent cần bám sát checklist này và đánh dấu `[x]` sau khi hoàn thành mỗi task.

---

## 1. Danh Sách Công Việc (Task Checklist)

- [x] **Task 1: Tạo Giao diện Quản lý Câu hỏi và Nút Xuất CSV**
  - *Mô tả chi tiết:* Thêm tab "Quản Lý Câu Hỏi" ở thanh điều hướng. Tạo form cho phép nhập câu hỏi tùy chỉnh (Lớp, chủ đề, độ khó, nội dung, 4 tùy chọn đáp án, index đáp án đúng). Thêm nút "Xuất Bảng Điểm (CSV)" vào view Bảng xếp hạng.
  - *File cần tác động:* `index.html`
- [x] **Task 2: Lập trình Logic Thêm câu hỏi tùy biến**
  - *Mô tả chi tiết:* Viết logic lưu câu hỏi tự tạo vào `localStorage`, gộp câu hỏi từ `localStorage` vào `QuestionBank` mỗi khi tải câu hỏi, đồng thời hiển thị danh sách câu hỏi tự tạo trên giao diện kèm nút Xóa.
  - *File cần tác động:* `app.js`
- [x] **Task 3: Lập trình chức năng Xuất Bảng điểm ra Excel/CSV**
  - *Mô tả chi tiết:* Viết phương thức `exportLeaderboardToCSV` thu thập dữ liệu bảng xếp hạng từ `localStorage`, nối các dòng ngăn cách bằng dấu phẩy và mã hóa UTF-8 BOM, sau đó tạo thẻ tải xuống tự động.
  - *File cần tác động:* `app.js`
- [x] **Task 4: Cấu hình PWA (manifest.json và sw.js)**
  - *Mô tả chi tiết:* Viết file cấu hình Manifest cho phép cài đặt app. Viết Service Worker xử lý sự kiện `install` và `fetch` nhằm cache toàn bộ file HTML/CSS/JS và ảnh cục bộ để khởi chạy Offline hoàn toàn.
  - *File cần tác động:* [NEW] `manifest.json`, [NEW] `sw.js`, [MODIFY] `index.html` (thêm link manifest và code đăng ký Service Worker).
- [x] **Task 5: Refactor mã nguồn và Làm sạch tài nguyên**
  - *Mô tả chi tiết:* Kiểm tra tính đồng bộ của biến âm thanh, dọn dẹp các lắng nghe sự kiện dư thừa khi đổi game, tối ưu hóa các nét vẽ canvas.

---

## 2. Kết Quả Đầu Ra Kỳ Vọng (Expected Outcomes)

- [x] **Sản phẩm chạy được:** Không phát sinh lỗi biên dịch hay runtime, đặc biệt là khi khởi động Offline.
- [x] **Đầu ra cụ thể:**
  - Giáo viên có thể tự xây dựng ngân hàng đề riêng cho lớp học trực tiếp trên máy của mình.
  - Có thể tải về bảng điểm của lớp học dễ dàng bằng Excel.
  - Ứng dụng hoạt động mượt mà không cần mạng.
- [x] **Tài liệu & Trạng thái:**
  - Cập nhật `CHANGELOG.md` ghi nhận các tính năng của Phase 3.

---

## 3. Kế Hoạch Kiểm Thử (Testing & Quality Assurance)

### Hướng dẫn kiểm thử thủ công (Manual Test Guide dành cho User)

Hãy kiểm tra theo các bước sau để nghiệm thu Phase này:

1. **Bước 1:** Bật trình duyệt, truy cập tab **Quản Lý Câu Hỏi**. Nhập thử câu hỏi: "Toán lớp 8: Khai triển (a+b)² = ?", nhập 4 đáp án và chọn đáp án chính xác là "a² + 2ab + b²". Nhấn lưu.
2. **Bước 2:** Sang tab **Ngân Hàng Câu Hỏi**, bật bộ lọc khối lớp 8 để kiểm chứng câu hỏi mới tạo có xuất hiện.
3. **Bước 3:** Click chơi thử game **Leo Núi Olympia** (Quiz Climb), xem câu hỏi đó có được trộn ngẫu nhiên xuất hiện hay không.
4. **Bước 4:** Bấm chọn tab **Bảng Xếp Hạng**, nhấn nút **Xuất Bảng Điểm (CSV)**. Mở file bằng Excel kiểm tra font chữ Việt.
5. **Bước 5:** Bật F12 DevTools -> Application -> Service Workers để kiểm chứng trạng thái Service Worker đang kích hoạt (Active). Thử tắt Wifi/mạng mạng trên máy tính và bấm F5 tải lại trang xem game center có mở được bình thường không.
