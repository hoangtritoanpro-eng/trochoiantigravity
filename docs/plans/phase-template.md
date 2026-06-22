# Chi Tiết Kế Hoạch - Phase {{PHASE_NUMBER}}: {{PHASE_TITLE}}

Tài liệu này định nghĩa chi tiết các đầu việc, kết quả đầu ra và phương thức kiểm thử cho **Phase {{PHASE_NUMBER}}**. AI Agent cần bám sát checklist này và đánh dấu `[x]` sau khi hoàn thành mỗi task.

---

## 1. Danh Sách Công Việc (Task Checklist)

- [ ] **Task 1: [Tên Task 1]**
  - *Mô tả chi tiết:* Thực hiện viết file X, chỉnh sửa file Y để đạt được tính năng Z.
  - *File cần tác động:* `src/components/X.tsx`, `src/store/Y.ts`
- [ ] **Task 2: [Tên Task 2]**
  - *Mô tả chi tiết:* ...
  - *File cần tác động:* ...
- [ ] **Task 3: [Tên Task 3]**
  - *Mô tả chi tiết:* ...
  - *File cần tác động:* ...

---

## 2. Kết Quả Đầu Ra Kỳ Vọng (Expected Outcomes)

- [ ] **Sản phẩm chạy được:** Không phát sinh lỗi biên dịch (Typescript/Vite build).
- [ ] **Đầu ra cụ thể:**
  - File/chức năng X hoạt động đúng logic.
  - UI của chức năng Y hiển thị đẹp mắt, mượt mà trên mobile và desktop.
- [ ] **Tài liệu & Trạng thái:**
  - Cập nhật `CHANGELOG.md` ghi nhận các tính năng của Phase {{PHASE_NUMBER}}.

---

## 3. Kế Hoạch Kiểm Thử (Testing & Quality Assurance)

### Kiểm thử tự động (Automation/Script Test - Nếu có)
*Mô tả cách chạy các script test tự động nếu dự án có viết unit test.*
`npm run test` hoặc `npm run test:e2e`

### Hướng dẫn kiểm thử thủ công (Manual Test Guide dành cho User)
Hãy kiểm tra theo các bước sau để nghiệm thu Phase này:

1. **Bước 1:** Truy cập vào trang...
2. **Bước 2:** Click vào nút... và quan sát...
3. **Bước 3:** Thử nhập dữ liệu sai... để kiểm tra cơ chế validate lỗi của ứng dụng.
4. **Bước 4:** Xoay dọc/ngang màn hình hoặc thu nhỏ cửa sổ trình duyệt để kiểm tra responsive UI.
