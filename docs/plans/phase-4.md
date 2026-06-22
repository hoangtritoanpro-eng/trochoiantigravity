# Chi Tiết Kế Hoạch - Phase 4: Deploy & Bàn giao (May đo hạ tầng & Tài liệu bàn giao)

Tài liệu này định nghĩa chi tiết các đầu việc, kết quả đầu ra và phương thức kiểm thử cho **Phase 4**. AI Agent cần bám sát checklist này và đánh dấu `[x]` sau khi hoàn thành mỗi task.

---

## 1. Danh Sách Công Việc (Task Checklist)

- [x] **Task 1: Thiết lập cấu hình triển khai Vercel**
  - *Mô tả chi tiết:* Tạo file cấu hình `vercel.json` thiết lập bảo mật và đường dẫn tĩnh rút gọn.
  - *File cần tác động:* [NEW] `vercel.json`
- [x] **Task 2: Viết script chạy Local Offline tại lớp học**
  - *Mô tả chi tiết:* Tạo file batch script `Chay_Local.bat` khởi chạy máy chủ HTTP thông qua Python cài sẵn trên Windows, tự động mở trình duyệt ở localhost.
  - *File cần tác động:* [NEW] `Chay_Local.bat`
- [x] **Task 3: Biên soạn Hướng dẫn Sử dụng (HDSD) chi tiết**
  - *Mô tả chi tiết:* Viết file `Huong_Dan_Su_Dung.md` hướng dẫn luật chơi 8 game, hướng dẫn cài PWA Offline, quản lý câu hỏi và cách giáo viên xuất file CSV bảng điểm.
  - *File cần tác động:* [NEW] `Huong_Dan_Su_Dung.md`
- [x] **Task 4: Audit bảo mật, SEO và Tối ưu hóa trước bàn giao**
  - *Mô tả chi tiết:* Kiểm tra heading `<h1>`, xác nhận thẻ meta đầy đủ, kiểm tra logic lưu điểm an toàn không bị lộ thông tin nhạy cảm.
  - *File cần tác động:* `index.html`, `app.js`

---

## 2. Kết Quả Đầu Ra Kỳ Vọng (Expected Outcomes)

- [x] **Sản phẩm chạy được:** File batch khởi động máy chủ thành công, giao diện web mở mượt mà.
- [x] **Đầu ra cụ thể:**
  - File cấu hình `vercel.json` và `Chay_Local.bat` nằm ở thư mục gốc.
  - Tài liệu hướng dẫn sử dụng tiếng Việt chi tiết và trực quan.
- [x] **Tài liệu & Trạng thái:**
  - Cập nhật `CHANGELOG.md` ghi nhận các tính năng của Phase 4.
  - Cập nhật trạng thái checklist `docs/plans/master-plan.md`.

---

## 3. Kế Hoạch Kiểm Thử (Testing & Quality Assurance)

### Hướng dẫn kiểm thử thủ công (Manual Test Guide dành cho User)

Hãy kiểm tra theo các bước sau để nghiệm thu Phase này:

1. **Bước 1:** Click đúp chạy file `Chay_Local.bat`, xác nhận màn hình command line màu đen hiện thông báo khởi chạy máy chủ thành công.
2. **Bước 2:** Mở trình duyệt web, truy cập `http://localhost:8000`. Hãy thử chơi 1 game để xem mọi hình ảnh, âm thanh có tải đầy đủ không.
3. **Bước 3:** Đọc nội dung file [Huong_Dan_Su_Dung.md](file:///c:/Users/hoang/Downloads/TOAN/duantoan/Huong_Dan_Su_Dung.md).
