# Chi Tiết Kế Hoạch - Phase 8: Hệ Thống Game Đọc Hiểu Văn Bản Bằng AI

Phase này xây dựng một trò chơi **riêng biệt** (thư mục `game-doc-hieu-van-ban/`, chạy offline bằng `.bat`): giáo viên đưa vào một bài văn → Gemini AI phân tích → sinh nhiều vòng chơi đánh giá năng lực đọc hiểu → kết thúc bằng **Infographic chốt kiến thức**.

- **Đối tượng:** Học sinh THCS lớp 6–9 (Ngữ văn – CT GDPT 2018).
- **Cách chơi:** Giáo viên chiếu màn hình, cả lớp cùng chơi.
- **Công cụ AI:** Google Gemini (mặc định `gemini-3.8-flash`), API Key lưu cục bộ trên máy giáo viên.

---

## 1. Danh Sách Công Việc (Task Checklist)

- [x] **Task 1: Màn hình Nạp văn bản (giáo viên)**
  - Dán văn bản trực tiếp hoặc tải file `.pdf` (PDF.js offline), `.docx` (Mammoth – CDN), `.txt`.
  - Chọn khối lớp, số câu mỗi vòng, bật/tắt từng vòng chơi.
  - Cấu hình Gemini API Key + model, nút kiểm tra kết nối.
  - Nút "Dùng bài mẫu" chạy được ngay không cần API Key (chế độ demo offline).
- [x] **Task 2: Dịch vụ phân tích AI (`AIService`)**
  - Prompt sư phạm Ngữ văn trả về JSON: thông tin tác phẩm, tóm tắt, chủ đề, nhân vật, trình tự sự việc, biện pháp nghệ thuật, thông điệp, từ ngữ khó + câu hỏi 6 dạng, gắn mức độ Nhận biết / Thông hiểu / Vận dụng.
  - Chuẩn hóa & kiểm tra dữ liệu AI trả về, trộn vị trí đáp án đúng.
  - Chấm câu tự luận ngắn bằng AI theo rubric.
- [x] **Task 3: Màn hình Xem trước & duyệt (Human-in-the-loop)**
  - Hiển thị kết quả phân tích, danh sách câu hỏi từng vòng; giáo viên xóa câu chưa phù hợp trước khi chơi.
- [x] **Task 4: Engine game nhiều vòng**
  - Vòng 1: Trắc nghiệm A/B/C/D · Vòng 2: Đúng/Sai · Vòng 3: Điền từ (chọn thẻ từ) · Vòng 4: Nối cặp · Vòng 5: Sắp xếp trình tự sự việc · Vòng 6: Tự luận ngắn (AI chấm, hoặc giáo viên tự chấm khi offline).
  - Màn giới thiệu vòng, thanh tiến độ, điểm, giải thích sau mỗi câu, nút "Xem văn bản" bất kỳ lúc nào, âm thanh đúng/sai.
- [x] **Task 5: Infographic chốt kiến thức**
  - Tóm tắt, chủ đề, nhân vật, dòng thời gian sự việc, nghệ thuật, thông điệp, từ ngữ, kết quả theo vòng & theo mức độ nhận thức, các câu cần ôn lại.
  - In / Xuất PDF khổ ngang.
- [x] **Task 6: Đóng gói** `Chay_Game.bat`, `README.md`, `vercel.json`.

*File tác động:* `game-doc-hieu-van-ban/index.html`, `style.css`, `app.js`, `sample-data.js`, `assets/`.

---

## 2. Kết Quả Đầu Ra Kỳ Vọng (Expected Outcomes)

- Mở `index.html` không lỗi console; chế độ bài mẫu chơi trọn 6 vòng và ra infographic.
- Có API Key: dán bài văn bất kỳ → AI sinh đủ các vòng trong ~10–30 giây.
- Mọi nội dung AI trả về được escape HTML (an toàn), giao diện đọc rõ khi chiếu máy chiếu.
- Cập nhật `CHANGELOG.md`, `master-plan.md`, commit & push.

---

## 3. Kế Hoạch Kiểm Thử

### Kiểm thử tự động (Chrome DevTools)
- Nạp bài mẫu → duyệt qua từng vòng bằng script, kiểm tra điểm cộng đúng, infographic render đủ các khối.

### Hướng dẫn kiểm thử thủ công
1. Chạy `Chay_Game.bat` → bấm **"Dùng bài mẫu"** → **"Bắt đầu chơi"**.
2. Trả lời đúng/sai xen kẽ, quan sát âm thanh, giải thích, điểm số.
3. Vòng Nối cặp và Sắp xếp: thử thao tác chuột/chạm.
4. Kết thúc → kiểm tra Infographic, bấm **In / Xuất PDF**.
5. Nhập API Key thật → dán một bài văn khác → **"Phân tích bằng AI"** → xóa bớt 1 câu ở màn xem trước → chơi.
