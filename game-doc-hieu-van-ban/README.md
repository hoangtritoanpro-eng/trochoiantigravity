# 📖 ĐỌC HIỂU CÙNG AI (CHƯƠNG TRÌNH THPT)

Hệ thống đánh giá **năng lực đọc hiểu văn bản Ngữ văn THPT** (Lớp 10, 11, 12 & Ôn thi Tốt nghiệp THPT theo Chương trình GDPT 2018). Giáo viên có thể **copy/dán kí tự**, **đẩy file PDF** (cả PDF chữ và PDF scan), hoặc **gửi ảnh bài văn vào** để **Gemini AI** phân tích và tạo bộ câu hỏi gồm 6 vòng chơi. Kết thúc trò chơi là **Infographic chốt kiến thức** và **bảng thống kê câu đúng/sai** (xuất được ra Excel).

🌐 **Dùng trực tuyến:** https://hoangtritoanpro-eng.github.io/doc-hieu-cung-ai/
📦 **Mã nguồn GitHub:** https://github.com/hoangtritoanpro-eng/doc-hieu-cung-ai

---

## 📥 3 Cách nạp ngữ liệu đọc hiểu
1. **✍️ Copy & Dán kí tự:**
   - Gõ hoặc dán trực tiếp văn bản vào ô ngữ liệu.
   - Hỗ trợ nút **📋 Dán kí tự**, **📑 Copy kí tự** (sao chép lại toàn bộ văn bản bất kỳ lúc nào), **✨ Chuẩn hóa dòng PDF** (gộp các dòng bị ngắt vụn khi copy từ PDF) và thanh **chèn nhanh kí tự đặc biệt** (`“ ”`, `‘ ’`, `…`, `[…]`, `—`).
2. **📄 Đẩy file PDF / Word / TXT:**
   - **PDF có lớp chữ:** Trích xuất văn bản tức thì bằng thư viện PDF.js offline.
   - **PDF dạng ảnh scan:** Tự động chuyển các trang PDF thành ảnh chất lượng cao để AI đọc OCR hoặc phân tích trực tiếp.
3. **🖼️ Gửi ảnh vào (.png, .jpg, .webp):**
   - Chọn nhiều ảnh chụp trang sách / đề thi, kéo thả ảnh, hoặc nhấn **`Ctrl` + `V`** để dán trực tiếp ảnh chụp màn hình.
   - Bấm **"🔍 Trích xuất kí tự từ ảnh (AI OCR)"** để lấy nguyên văn chữ ra ô văn bản, hoặc bấm thẳng **"✨ Phân tích ngữ liệu bằng AI"**.

---

## 🔌 Kết nối Gemini API

1. Lấy API Key miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Dán key vào ô **API Key** → bấm **🔌 Kết nối**.
3. Ứng dụng tự tải **danh sách model mà key được dùng**, chọn sẵn model Flash mới nhất và gửi thử một yêu cầu. Trạng thái hiện ở góc trên: 🟢 *AI: tên-model* là đã sẵn sàng.

---

## 🚀 Cách chạy

1. Nhấp đúp `Chay_Game.bat` → trình duyệt tự mở `http://localhost:8899` (cần cài Python).
2. Không có Python: mở trực tiếp `index.html`.
3. Bấm **"📚 Dùng ngữ liệu mẫu THPT"** (*"Đây thôn Vĩ Dạ" – Hàn Mặc Tử*, Ngữ văn 11) để chơi thử ngay mà không cần API Key.

## 🎮 Sáu vòng chơi chuẩn Đọc hiểu THPT

| Vòng | Dạng | Điểm |
| :--- | :--- | :--- |
| 🅰️ Trắc nghiệm đọc hiểu | 4 phương án A–D, gắn mức độ Nhận biết / Thông hiểu / Vận dụng | 10 điểm/câu |
| ⚖️ Đúng hay Sai? | Xác định nhận định đúng/sai so với ngữ liệu | 10 điểm/câu |
| ✍️ Điền từ / Thuật ngữ | Chọn từ ngữ, hình ảnh hoặc khái niệm điền vào chỗ trống | 10 điểm/câu |
| 🔗 Nối cặp nghệ thuật – ý nghĩa | Nối chi tiết, hình ảnh, luận điểm với ý nghĩa biểu đạt | 5 điểm/cặp |
| 🔢 Sắp xếp mạch văn bản | Kéo thả hoặc dùng ▲▼ sắp xếp mạch cảm xúc / sự việc / luận điểm | 4 điểm/mục |
| 💬 Tự luận & Vận dụng THPT | AI chấm theo Rubric Đọc hiểu THPT (có API Key) hoặc giáo viên tự chấm | tối đa 20 điểm |

## ⌨️ Phím tắt

`1–4` / `A–D`: chọn đáp án · `Enter`: chốt đáp án / tiếp tục · `T`: xem văn bản · `Esc`: đóng văn bản / đóng ảnh phóng to
