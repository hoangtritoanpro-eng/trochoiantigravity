# Chi Tiết Kế Hoạch - Phase 5: Giao Diện Tươi Sáng & Phông Chữ Trẻ Em (Bright Theme)

Tài liệu này định nghĩa chi tiết các đầu việc, kết quả đầu ra và phương thức kiểm thử cho **Phase 5**. AI Agent cần bám sát checklist này và đánh dấu `[x]` sau khi hoàn thành mỗi task.

---

## 1. Danh Sách Công Việc (Task Checklist)

- [ ] **Task 1: Tích hợp Phông chữ mới & Cấu hình CSS CSS Bright Theme**
  - *Mô tả chi tiết:*
    - Cập nhật [index.html](file:///c:/Users/hoang/Downloads/TOAN/duantoan/index.html) để tải phông chữ `Fredoka` và `Quicksand` từ Google Fonts.
    - Cập nhật [index.css](file:///c:/Users/hoang/Downloads/TOAN/duantoan/index.css):
      - Cấu hình lại hệ thống biến màu sắc sang tông tươi sáng (pastel light mode).
      - Thiết lập `--font-display: 'Fredoka', sans-serif` và `--font-body: 'Quicksand', sans-serif`.
      - Chuyển đổi thiết kế Glassmorphism từ nền tối sang nền sáng mờ mịn (`rgba(255, 255, 255, 0.7)`).
      - Đảm bảo độ tương phản cao với chữ màu tối (`#1e293b`, `#475569`).
  - *File cần tác động:* [index.html](file:///c:/Users/hoang/Downloads/TOAN/duantoan/index.html), [index.css](file:///c:/Users/hoang/Downloads/TOAN/duantoan/index.css)

- [ ] **Task 2: Cập nhật hàm vẽ UI Card phụ trợ trong App Core**
  - *Mô tả chi tiết:* Cập nhật hàm `drawGlassCard` trong [app.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/app.js) để sử dụng phông chữ mới (`Fredoka`/`Quicksand`), hỗ trợ vẽ viền mượt mà và bóng đổ mềm dịu của Bright Theme.
  - *File cần tác động:* [app.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/app.js)

- [ ] **Task 3: Refactor Giao diện Game Canvas trong 8 Trò chơi**
  - *Mô tả chi tiết:* Thay đổi màu nền, màu sắc bục đáp án, thẻ bài và các nét vẽ canvas trong các game sang tông màu tươi sáng tương thích với học sinh:
    - **Game 1: Kéo Co Kiến Thức** ([tug-of-war.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/tug-of-war.js)): Màu sân cỏ xanh sáng, dây kéo nâu đất ấm áp, bục đáp án kính sáng chữ tối.
    - **Game 2: Lật Mảnh Ghép Trí Uẩn** ([flip-puzzle.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/flip-puzzle.js)): Nền tranh phủ kính mờ sáng, các nét vẽ tươi vui.
    - **Game 3: Ninja Toán Học AI** ([ninja-toan.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/ninja-toan.js)): Bục đáp án nổi bật sáng rõ để dễ quan sát trên webcam.
    - **Game 4: Đỉnh Cao Olympia** ([quiz-climb.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/quiz-climb.js)): Nền trời ngày xanh nhạt, núi phủ tuyết/xanh lá mát mẻ.
    - **Game 5: Đào Vàng Tri Thức** ([gold-miner.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/gold-miner.js)): Nền hang mỏ cát vàng sáng ấm áp, các cục vàng rực rỡ chữ tối rõ nét.
    - **Game 6: Bắn Cung Toán Học** ([archery-math.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/archery-math.js)): Bầu trời ngày xanh mây trắng trong lành.
    - **Game 7: Ghép Đôi Thẻ Bài** ([memory-match.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/memory-match.js)): Nền màu tím oải hương/hồng pastel nhẹ nhàng, thẻ bài thiết kế gradient tươi tắn.
    - **Game 8: Rùa Bay Toán Học** ([flappy-math.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/flappy-math.js)): Nền trời xanh ngọc sáng dịu, cổng gỗ hoặc kính sáng chữ tối.
  - *File cần tác động:*
    - [tug-of-war.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/tug-of-war.js)
    - [flip-puzzle.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/flip-puzzle.js)
    - [ninja-toan.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/ninja-toan.js)
    - [quiz-climb.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/quiz-climb.js)
    - [gold-miner.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/gold-miner.js)
    - [archery-math.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/archery-math.js)
    - [memory-match.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/memory-match.js)
    - [flappy-math.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/flappy-math.js)

---

## 2. Kết Quả Đầu Ra Kỳ Vọng (Expected Outcomes)

- [ ] **Sản phẩm chạy được:** Không phát sinh bất kỳ lỗi JavaScript nào. Ứng dụng PWA và Service Worker tiếp tục hoạt động chính xác.
- [ ] **Đầu ra giao diện:**
  - Toàn bộ trang Dashboard, Ngân hàng câu hỏi, Bảng xếp hạng và Sidebar cấu hình khoác lên mình giao diện Bright Theme (tông sáng pastel mượt mà).
  - Phông chữ hiển thị là `Fredoka` và phông chữ nội dung/điều khiển là `Quicksand`. Chữ có độ tương phản tốt, không bị nhạt nhòa, rất dễ đọc cho học sinh.
  - Cả 8 trò chơi đều có giao diện canvas tươi sáng (nền cỏ, hang cát, trời xanh mây trắng) thay thế cho không gian cyberpunk tối tăm ban đầu.
- [ ] **Tài liệu & Trạng thái:**
  - Cập nhật `CHANGELOG.md` ghi nhận các tính năng của Phase 5.
  - Cập nhật trạng thái checklist `docs/plans/master-plan.md`.

---

## 3. Kế Hoạch Kiểm Thử (Testing & Quality Assurance)

### Hướng dẫn kiểm thử thủ công (Manual Test Guide dành cho User)

Hãy kiểm tra theo các bước sau để nghiệm thu Phase này:

1. **Bước 1:** Click đúp chạy file `Chay_Local.bat`, mở trình duyệt web truy cập `http://localhost:8000`.
2. **Bước 2:** Xác nhận Dashboard, Sidebar, tiêu đề và phông chữ đã bo tròn thân thiện, dễ thương và có màu sáng dễ nhìn.
3. **Bước 3:** Vào chơi lần lượt từng game:
   - Đào Vàng: Hang cát vàng sáng ấm áp có dễ nhìn không? Chữ trên cục vàng có sắc nét không?
   - Đường Lên Đỉnh Olympia: Có nền trời xanh ngày dịu dàng không?
   - Kéo Co: Có sân cỏ xanh không?
   - Các game khác: Có đầy đủ màu sắc tươi sáng không?
4. **Bước 4:** Thử thu nhỏ màn hình hoặc chạy trên thiết bị di động để kiểm tra khả năng co giãn tự động của giao diện sáng mới.
