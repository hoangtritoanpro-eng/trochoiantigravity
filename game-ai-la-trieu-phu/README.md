# 🏆 TRÒ CHƠI: AI LÀ TRIỆU PHÚ (TOÁN HỌC THCS)

Phát triển bởi: **Thầy Sơn SKL**

Trò chơi học tập tương tác trí tuệ mô phỏng gameshow truyền hình kinh điển **Ai Là Triệu Phú** dành cho học sinh THCS (Lớp 6, 7, 8, 9).

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Hiển thị chuẩn xác Công thức Toán học (KaTeX Math Engine):**
   - Hỗ trợ toàn diện công thức dạng LaTeX: phân số `\frac`, căn thức `\sqrt`, số mũ, chỉ số dưới, ký hiệu hình học song song, vuông góc, góc, độ.
   - Chạy offline 100% không cần kết nối internet.

2. **Hiển thị Hình vẽ Minh họa & Phóng to (Lightbox Zoom):**
   - Hỗ trợ đính kèm hình vẽ cho các câu hỏi hình học (SVG, Base64, PNG, JPG).
   - Nhấp vào ảnh để xem toàn màn hình sắc nét với viền vàng phát sáng sang trọng.

3. **Nạp Đề Tự Động Thông Minh (PDF & AI):**
   - Kéo thả file PDF đề thi trắc nghiệm để tự động đọc nội dung và trích xuất hình vẽ.
   - Kết nối Google Gemini AI (ưu tiên model **Gemini 3.8 Flash** mới nhất) để tự động sửa lỗi chính tả OCR, chuẩn hóa câu hỏi, tạo 4 đáp án và giải đề tự động.
   - Tùy biến số lượng câu hỏi động: Nạp bao nhiêu câu chơi đúng bấy nhiêu câu.

4. **Hệ Thống Âm Thanh Kép Sống Động:**
   - Bản nhạc dạo đầu chương trình 15.8 giây kinh điển.
   - Nhạc nền hồi hộp khi suy nghĩ.
   - Âm thanh chúc mừng trả lời đúng / sai.
   - Đoạn nhạc hào hùng khi hoàn thành câu hỏi cuối cùng.

---

## 🚀 CÁCH KHỞI CHẠY TRÒ CHƠI

### Cách 1: Chạy nhanh trên máy tính Windows
- Nhấp đúp vào file `Chay_Game.bat`.
- Trình duyệt sẽ tự động mở trang trò chơi tại địa chỉ `http://localhost:8888`.

### Cách 2: Mở trực tiếp bằng trình duyệt
- Nhấp chuột phải vào file `index.html` -> Chọn **Open with** -> **Google Chrome** hoặc **Microsoft Edge**.

### Cách 3: Triển khai trực tuyến lên Vercel
- Đẩy thư mục này lên GitHub cá nhân.
- Kết nối GitHub repo vào [Vercel](https://vercel.com/new) -> Bấm **Deploy**.
- Trò chơi sẽ có link web trực tuyến để học sinh và giáo viên truy cập từ xa!

---

## 🎮 PHÍM TẮT THAO TÁC

- `1`, `2`, `3`, `4` hoặc `A`, `B`, `C`, `D`: Chọn đáp án tương ứng.
- `Space` (Phím cách) hoặc `Enter`: Kiểm tra đáp án câu hiện tại.
- `Mũi tên Trái` (←): Quay lại câu trước.
- `Mũi tên Phải` (→): Chuyển sang câu tiếp theo.
- `Esc`: Đóng phóng to hình ảnh / Đóng cửa sổ nạp đề.
- `F11`: Bật / Tắt chế độ toàn màn hình.
