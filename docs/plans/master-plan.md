# Master Plan: duantoan

Tài liệu này vạch ra lộ trình phát triển của dự án theo mô hình phân tách phase nghiêm ngặt của **Solo Builder**. 
*Chú ý: AI Agent BẮT BUỘC chỉ được làm việc trên Phase hiện tại, không được tự ý nhảy cóc.*

---

## Lộ Trình Phát Triển (Roadmap Overview)

| Phase | Tên Giai Đoạn | Trạng Thái | Mô Tả Tóm Tắt |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Khởi Tạo & Core Logic | `[x]` | Xây dựng khung nền móng và các logic cốt lõi. |
| **Phase 2** | UI/UX & Tính năng chính | `[x]` | Phát triển các giao diện người dùng chính và kết nối dữ liệu. |
| **Phase 3** | Tính năng Nâng cao & Tối ưu | `[x]` | Hoàn thiện các tính năng phụ trợ, tối ưu hóa trải nghiệm & hiệu năng. |
| **Phase 4** | Deploy & Bàn giao | `[x]` | Đóng gói sản phẩm, deploy môi trường production và viết tài liệu HDSD. |
| **Phase 5** | Giao Diện Tươi Sáng & Bright Theme | `[x]` | Chuyển đổi giao diện sang tông tươi sáng và phông chữ Fredoka & Quicksand cho trẻ em. |
| **Phase 6** | Thêm Game Mới và Phòng Pomodoro | `[x]` | Bổ sung Space Math, Math Racing và phòng học Pomodoro Lofi. |
| **Phase 7** | Game Ai Là Triệu Phú & Đóng Gói Tệp Riêng | `[x]` | Trò chơi Ai Là Triệu Phú 22 câu, layout Dark Blue & Gold, đóng gói tệp riêng biệt standalone. |
| **Phase 8** | Game Đọc Hiểu Văn Bản Bằng AI | `[x]` | Nạp bài văn → Gemini phân tích → 6 vòng chơi đánh giá đọc hiểu → Infographic chốt kiến thức. |

---

## Chi Tiết Các Giai Đoạn (Phase Breakdown)

### Phase 1: Khởi Tạo & Core Logic
- **Mục tiêu:** Xây dựng phần móng vững chắc cho dự án.
- **Các task chính:**
  - [x] Thiết lập dự án mới, cài đặt thư viện cần thiết.
  - [x] Khởi tạo cấu trúc store quản lý state chính.
  - [x] Viết các service kết nối API / Xử lý nghiệp vụ nền tảng.
- **Expected Output:** Dự án khởi chạy được không lỗi, core logic hoạt động chính xác qua unit test hoặc console log.

### Phase 2: UI/UX & Tính năng chính
- **Mục tiêu:** Hoàn thiện giao diện người dùng và kết nối các chức năng nghiệp vụ chính.
- **Các task chính:**
  - [x] Tạo layout chính của ứng dụng (Header, Sidebar, Footer, Responsive).
  - [x] Xây dựng các trang chính và kết nối với State Store.
  - [x] Áp dụng các hiệu ứng animation (như Framer Motion) để tăng độ mượt mà.
- **Expected Output:** Người dùng có thể thực hiện được toàn bộ luồng nghiệp vụ cơ bản qua giao diện trực quan.

### Phase 3: Tính năng Nâng cao & Tối ưu
- **Mục tiêu:** Bổ sung các tính năng phụ trợ và tối ưu hóa ứng dụng.
- **Các task chính:**
  - [x] Bổ sung các chức năng nâng cao (như Export data, Offline Mode, PWA, Cài đặt tùy chỉnh).
  - [x] Refactor mã nguồn, tối ưu hóa kích thước bundle và tốc độ tải trang.
- **Expected Output:** Ứng dụng chạy mượt mà, đầy đủ tính năng, sẵn sàng để bàn giao.

### Phase 4: Deploy & Bàn giao
- **Mục tiêu:** Đưa sản phẩm lên môi trường thực tế và hoàn tất bàn giao.
- **Các task chính:**
  - [x] Cấu hình deploy tự động (Vercel, Netlify, Docker...).
  - [x] Viết tài liệu Hướng Dẫn Sử Dụng (HDSD) chi tiết cho người dùng cuối.
  - [x] Chạy audit toàn diện về bảo mật và SEO.
- **Expected Output:** Link production hoạt động ổn định, tài liệu HDSD hoàn chỉnh.

### Phase 5: Giao Diện Tươi Sáng & Phông Chữ Trẻ Em (Bright Theme)
- **Mục tiêu:** Chuyển đổi toàn diện giao diện sang tông tươi sáng bắt mắt, sử dụng phông chữ bo tròn thân thiện với trẻ em.
- **Các task chính:**
  - [x] Tích hợp phông chữ mới (Fredoka & Quicksand) và cấu hình CSS Bright Theme.
  - [x] Cập nhật hàm vẽ helper UI Card để đồng bộ màu sắc/phông chữ sáng.
  - [x] Chuyển đổi màu sắc canvas của cả 8 game dạy học tương tác sang tông pastel sáng sủa.
- **Expected Output:** Giao diện toàn hệ thống mang màu sắc tươi sáng sinh động, phông chữ dễ thương dễ đọc, tất cả canvas vẽ game đẹp mắt, không lỗi JavaScript.

### Phase 6: Thêm Game Mới và Phòng Pomodoro
- **Mục tiêu:** Mở rộng kho game và thêm khu vực học tập tập trung Pomodoro.
- **Các task chính:**
  - [x] Bổ sung thẻ điều hướng và giao diện cho "Phòng Pomodoro".
  - [x] Khởi tạo và lập trình logic game "Bảo Vệ Trái Đất" (Space Math).
  - [x] Khởi tạo và lập trình logic game "Đua Xe Toán Học" (Math Racing).
  - [x] Cập nhật kết nối các game mới với kho câu hỏi và hệ thống điểm.
- **Expected Output:** Hai game mới và phòng Pomodoro có thể truy cập được từ giao diện và hoạt động trơn tru.

### Phase 7: Game Ai Là Triệu Phú Toán Học & Đóng Gói Tệp Riêng
- **Mục tiêu:** Xây dựng trò chơi mới dựa trên thiết kế giao diện DOM chi tiết và đóng gói thành 1 tệp HTML độc lập.
- **Các task chính:**
  - [x] Thiết kế layout 3 cột: Điều khiển, Câu hỏi, Tiến độ.
  - [x] Viết CSS cho màu nền Dark Blue và vàng Gold sang trọng.
  - [x] Lập trình logic game xử lý lưới 22 câu hỏi.
  - [x] Đóng gói thành 1 tệp HTML độc lập (`ai-la-trieu-phu.html`) tích hợp đầy đủ CSS, JS, âm thanh kép và ngân hàng câu hỏi THCS.
  - [x] Thiết kế nền studio 3D theo mẫu PowerPoint & tích hợp đoạn nhạc kết thúc chương trình kinh điển.
  - [x] Phát triển giao diện & bộ bóc tách đề trắc nghiệm tự động từ file PDF chuyển về đúng mã cấu trúc của app.
  - [x] Tích hợp kết nối Google Gemini Flash AI tự động phân tích ngữ nghĩa, giải toán và chuẩn hóa đề nạp về JSON.
  - [x] Nâng cấp model Google Gemini mới nhất (Gemini 3.8 Flash) làm mặc định và chuẩn hóa tên trò chơi thành "AI LÀ TRIỆU PHÚ".
  - [x] Tích hợp trọn vẹn bản nhạc mở đầu chương trình (15.8s), cơ chế chuyển nền tự động và nút "🎵 Mở đầu" tiện ích.
  - [x] Hỗ trợ động số lượng câu hỏi tùy chỉnh (tải bao nhiêu câu hiển thị bấy nhiêu câu, lưới và tháp danh hiệu tự thích ứng).
  - [x] Hiển thị chuẩn xác công thức toán học LaTeX (KaTeX offline + fallback) và hình vẽ minh họa toán học (SVG + Lightbox zoom toàn màn hình + trích xuất ảnh PDF).
  - [x] Đóng gói thành 1 trò chơi riêng biệt hoàn chỉnh (`game-ai-la-trieu-phu/` & `tro-choi-ai-la-trieu-phu.zip`) sẵn sàng triển khai độc lập hoặc chạy offline.
- **Expected Output:** Trò chơi hoạt động độc lập với giao diện y hệt ảnh mẫu, chạy mượt mà trên trình duyệt.

### Phase 8: Game Đọc Hiểu Văn Bản Bằng AI
- **Mục tiêu:** Giáo viên đưa một bài văn vào, AI phân tích và tạo các vòng chơi đánh giá năng lực đọc hiểu; kết thúc bằng infographic chốt kiến thức. Chi tiết: `docs/plans/phase-8.md`.
- **Các task chính:**
  - [x] Màn hình nạp văn bản (dán / PDF / DOCX / TXT), tùy chọn khối lớp, số câu, vòng chơi, cấu hình Gemini.
  - [x] Dịch vụ Gemini phân tích văn bản + chuẩn hóa dữ liệu + AI chấm tự luận.
  - [x] Màn hình xem trước để giáo viên duyệt/xóa câu hỏi.
  - [x] Engine 6 vòng: Trắc nghiệm, Đúng/Sai, Điền từ, Nối cặp, Sắp xếp, Tự luận ngắn.
  - [x] Infographic chốt kiến thức + kết quả theo vòng và mức độ nhận thức, in/xuất PDF.
  - [x] Đóng gói thư mục riêng `game-doc-hieu-van-ban/` (chạy offline bằng `Chay_Game.bat`, có bài mẫu không cần API Key).
- **Expected Output:** Chơi trọn 6 vòng với bài mẫu không lỗi; có API Key thì phân tích được bài văn bất kỳ.
