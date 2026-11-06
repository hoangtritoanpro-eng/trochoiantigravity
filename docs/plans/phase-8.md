# Chi Tiết Kế Hoạch - Phase 8: Hệ Thống Game Đọc Hiểu Văn Bản Bằng AI

Phase này xây dựng một trò chơi **riêng biệt** (thư mục `game-doc-hieu-van-ban/`, chạy offline bằng `.bat`): giáo viên đưa vào một bài văn → Gemini AI phân tích → sinh nhiều vòng chơi đánh giá năng lực đọc hiểu → kết thúc bằng **Infographic chốt kiến thức**.

- **Đối tượng:** Học sinh THPT lớp 10–12 & Ôn thi Tốt nghiệp THPT (Ngữ văn – CT GDPT 2018).
- **Cách chơi:** Giáo viên chiếu màn hình, cả lớp cùng chơi.
- **Công cụ AI:** Google Gemini Multimodal (mặc định `gemini-3.8-flash`), API Key lưu cục bộ trên máy giáo viên.

---

## 1. Danh Sách Công Việc (Task Checklist)

- [x] **Task 1: Màn hình Nạp ngữ liệu đa phương thức (giáo viên THPT)**
  - **Copy / Dán kí tự:** Ô nhập văn bản hỗ trợ dán trực tiếp, nút "📋 Dán nhanh" từ Clipboard, nút "📑 Copy kí tự" để sao chép văn bản chuẩn hóa (kể cả văn bản trích xuất từ PDF/ảnh).
  - **Đẩy file PDF / DOCX / TXT:** Đọc `.pdf` có lớp chữ bằng PDF.js offline; nếu là **PDF scan (ảnh)** thì tự động kết xuất các trang PDF thành ảnh để AI đọc OCR hoặc phân tích trực tiếp.
  - **Gửi ảnh vào:** Hỗ trợ chọn nhiều ảnh (`.png`, `.jpg`, `.jpeg`, `.webp`), kéo & thả ảnh, hoặc **dán ảnh trực tiếp bằng `Ctrl+V`** (ảnh chụp màn hình/điện thoại). Có nút **"🔍 Trích xuất chữ từ ảnh (AI)"** và hỗ trợ gửi thẳng ảnh vào Gemini Vision khi bấm phân tích.
  - Chọn khối lớp THPT (`Lớp 10`, `Lớp 11`, `Lớp 12`, `Ôn thi Tốt nghiệp THPT`), số câu mỗi vòng, bật/tắt từng vòng chơi.
  - Cấu hình Gemini API Key + model, nút kiểm tra kết nối.
  - Nút "Dùng bài mẫu THPT" chạy được ngay không cần API Key (chế độ demo offline).
- [x] **Task 2: Dịch vụ phân tích AI cấp THPT (`AIService`)**
  - Prompt sư phạm Ngữ văn THPT (CT GDPT 2018 & cấu trúc Đề thi TN THPT mới): trả về JSON gồm thông tin tác phẩm, tóm tắt, chủ đề/cảm hứng chủ đạo, hình tượng/nhân vật/chủ thể trữ tình, mạch kết cấu/luận điểm, đặc sắc nghệ thuật (thi pháp, điểm nhìn, giọng điệu, biện pháp tu từ), thông điệp triết lí, từ ngữ/khái niệm + câu hỏi 6 dạng theo 3 mức độ (Nhận biết / Thông hiểu / Vận dụng).
  - Hỗ trợ đầu vào đa phương thức (văn bản + nhiều ảnh / trang PDF scan qua `inlineData`), trả kèm `extractedText` nếu ngữ liệu đầu vào là ảnh/PDF scan.
  - Chuẩn hóa & kiểm tra dữ liệu AI trả về, trộn vị trí đáp án đúng.
  - Chấm câu tự luận ngắn theo chuẩn đọc hiểu THPT bằng AI theo rubric.
- [x] **Task 3: Màn hình Xem trước, Chỉnh sửa trực tiếp & Duyệt (Human-in-the-loop)**
  - Hiển thị kết quả phân tích, danh sách câu hỏi từng vòng.
  - Giáo viên có thể **chỉnh sửa trực tiếp** mọi câu hỏi đọc hiểu (nội dung câu hỏi, 4 phương án A/B/C/D, đổi đáp án đúng, mức độ nhận thức, lời giải thích, cặp nối, thứ tự sắp xếp, câu hỏi & rubric tự luận, thông tin tóm tắt/chủ đề).
  - Hỗ trợ **thêm câu hỏi mới** (`➕ Thêm câu`) hoặc **xóa câu chưa phù hợp** (`🗑`) trước khi bắt đầu chơi.
- [x] **Task 4: Engine game nhiều vòng**
  - Vòng 1: Trắc nghiệm A/B/C/D · Vòng 2: Đúng/Sai · Vòng 3: Điền từ (chọn thẻ từ) · Vòng 4: Nối cặp · Vòng 5: Sắp xếp trình tự sự việc · Vòng 6: Tự luận ngắn (AI chấm, hoặc giáo viên tự chấm khi offline).
  - Màn giới thiệu vòng, thanh tiến độ, điểm, giải thích sau mỗi câu, nút "Xem văn bản" bất kỳ lúc nào, âm thanh đúng/sai.
- [x] **Task 5: Infographic, Bản Sơ Đồ Tư Duy & Đấu nối Google NotebookLM**
  - Hiển thị **Infographic chốt kiến thức** và **Bản Sơ Đồ Tư Duy (Interactive Mind Map)** trực quan hóa toàn bộ tác phẩm (Chủ đề, Bố cục, Hình tượng, Nghệ thuật, Thông điệp, Từ khóa).
  - **Đấu nối trực tiếp với Google NotebookLM (`notebooklm_bridge.py` + `gemini-notebook-mcp-cli`):**
    - Kiểm tra trạng thái đăng nhập NotebookLM, hỗ trợ nút **🔑 Đăng nhập Google NotebookLM (`nlm login`)** ngay từ giao diện web.
    - Đẩy tự động gói dữ liệu (*Ngữ liệu gốc + Sơ đồ tư duy + Phân tích AI + Thống kê câu Đúng/Sai của lớp*) sang NotebookLM để tạo Notebook mới (hoặc thêm vào Notebook có sẵn).
    - Yêu cầu Google NotebookLM Studio tạo tự động 6 loại học liệu bằng tiếng Việt (`vi`): **Bài giảng (`report`)**, **Sơ đồ tư duy (`mind_map`)**, **Bản trình bày (`slide_deck`)**, **Thẻ ghi chú (`flashcards`)**, **Video (`video`)**, **Podcast (`audio`)** và theo dõi tiến độ trực tiếp.
    - Hỗ trợ thêm chế độ **Tạo & Xem nhanh 6 Học liệu Studio ngay trên ứng dụng** (Slide trình chiếu, Flashcards lật 2 mặt, Giáo án bài giảng, Kịch bản Video, Podcast hội thoại 2 người) và nút **Copy hồ sơ nguồn + Mở nhanh NotebookLM Web** khi dùng thuần trình duyệt.
  - In / Xuất PDF khổ ngang.
- [x] **Task 6: Đóng gói** `Chay_Game.bat` (chạy `notebooklm_bridge.py`), `README.md`, `vercel.json`.

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

