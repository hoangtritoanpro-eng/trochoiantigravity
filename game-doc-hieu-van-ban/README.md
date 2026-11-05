# 📖 ĐỌC HIỂU CÙNG AI

Game đánh giá **năng lực đọc hiểu văn bản** cho học sinh THCS (lớp 6–9). Giáo viên đưa một bài văn vào, **Gemini AI** phân tích và tạo bộ câu hỏi gồm 6 vòng chơi. Kết thúc trò chơi là một **Infographic chốt kiến thức** và **bảng thống kê câu đúng/sai** (xuất được ra Excel).

🌐 **Dùng trực tuyến:** https://hoangtritoanpro-eng.github.io/doc-hieu-cung-ai/
📦 **Mã nguồn GitHub:** https://github.com/hoangtritoanpro-eng/doc-hieu-cung-ai

---

## 🔌 Kết nối Gemini API

1. Lấy API Key miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Dán key vào ô **API Key** → bấm **🔌 Kết nối**.
3. Ứng dụng tự tải **danh sách model mà key được dùng**, chọn sẵn model Flash mới nhất và gửi thử một yêu cầu. Trạng thái hiện ở góc trên: 🟢 *AI: tên-model* là đã sẵn sàng.
4. Lần sau mở lại, ứng dụng tự kết nối bằng key đã lưu. Nếu model đã chọn bị ngừng hỗ trợ, ứng dụng tự chuyển sang model khả dụng khác.

---

## 🚀 Cách chạy

1. Nhấp đúp `Chay_Game.bat` → trình duyệt tự mở `http://localhost:8899` (cần cài Python).
2. Không có Python: mở trực tiếp `index.html` (khi đó chức năng đọc file PDF có thể bị hạn chế, nhưng vẫn dán văn bản được).
3. Bấm **"📚 Dùng bài mẫu"** để chơi thử ngay mà không cần API Key.

## 🧭 Quy trình sử dụng

| Bước | Màn hình | Việc giáo viên làm |
| :--- | :--- | :--- |
| 1 | **Nạp bài văn** | Dán văn bản hoặc kéo thả file `.pdf` / `.docx` / `.txt`; chọn khối lớp, số câu, các vòng chơi; dán Gemini API Key |
| 2 | **AI phân tích** | Bấm "✨ Phân tích bằng AI" (khoảng 10–30 giây) |
| 3 | **Xem trước & duyệt** | Đọc lướt, bấm 🗑 xóa câu chưa phù hợp |
| 4 | **Chơi 6 vòng** | Chiếu lên màn hình, cả lớp thảo luận rồi giáo viên bấm chọn đáp án |
| 5 | **Infographic + Thống kê** | Chốt kiến thức; xem bảng thống kê đúng/sai theo vòng, theo mức độ và từng câu; bấm "⬇ Tải thống kê (Excel)" hoặc "🖨 In / Xuất PDF" |

## 🎮 Sáu vòng chơi

| Vòng | Dạng | Điểm |
| :--- | :--- | :--- |
| 🅰️ Trắc nghiệm | 4 phương án A–D, gắn mức độ Nhận biết / Thông hiểu / Vận dụng | 10 điểm/câu |
| ⚖️ Đúng hay Sai? | Nhận định đúng/sai so với văn bản | 10 điểm/câu |
| ✍️ Điền từ | Chọn thẻ từ điền vào chỗ trống | 10 điểm/câu |
| 🔗 Nối cặp | Nối chi tiết với ý nghĩa | 5 điểm/cặp |
| 🔢 Sắp xếp | Kéo thả hoặc dùng ▲▼ sắp xếp trình tự sự việc / mạch ý | 4 điểm/mục |
| 💬 Tự luận ngắn | AI chấm theo tiêu chí (có API Key) hoặc giáo viên tự chấm | tối đa 20 điểm |

Mỗi câu đều có **giải thích kèm dẫn chứng** từ văn bản. Bấm **📄 Văn bản** (hoặc phím `T`) để mở lại bài đọc bất kỳ lúc nào.

## ⌨️ Phím tắt

`1–4` / `A–D`: chọn đáp án · `Enter`: chốt đáp án / tiếp tục · `T`: xem văn bản · `Esc`: đóng văn bản

## 🛡️ An toàn dữ liệu

- API Key chỉ lưu trong trình duyệt của máy giáo viên (localStorage).
- Học sinh không cần tài khoản; không có dữ liệu cá nhân học sinh nào được gửi lên AI.
- Giáo viên luôn duyệt câu hỏi trước khi chơi (Human-in-the-loop).

## 📁 Cấu trúc

```
index.html       Giao diện 5 màn hình
style.css        Giao diện (tối ưu máy chiếu) + chế độ in infographic
app.js           Đọc file, gọi Gemini, chuẩn hóa dữ liệu, engine 6 vòng, infographic
sample-data.js   Bài mẫu "Thánh Gióng" (truyền thuyết kể lại) + bộ câu hỏi dựng sẵn
assets/          PDF.js offline, âm thanh
```

