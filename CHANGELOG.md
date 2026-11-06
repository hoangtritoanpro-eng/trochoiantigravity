# Changelog

Tất cả những thay đổi nổi bật của dự án này sẽ được ghi lại trong file này theo định dạng quy chuẩn của **Solo Builder**.

Định dạng mẫu:
- **Added** cho các tính năng mới được triển khai.
- **Changed** cho các thay đổi trong logic hiện tại.
- **Deprecated** cho các tính năng cũ sắp bị xóa.
- **Removed** cho các tính năng đã bị xóa.
- **Fixed** cho các lỗi lập trình đã được sửa.
- **Security** trong trường hợp có lỗi bảo mật hoặc vá lỗi bảo mật.

## [2.4.0] - 2026-11-06

### Added
- **Bản Sơ Đồ Tư Duy (Interactive SVG Mind Map) & Đấu nối trực tiếp Google NotebookLM (`gemini-notebook-mcp-cli`):**
  - Tích hợp thư viện `notebooklm-mcp-cli` (`v0.16.0`) và xây dựng server cầu nối [`game-doc-hieu-van-ban/notebooklm_bridge.py`](file:///c:/Users/hoang/Downloads/TOAN/duantoan/game-doc-hieu-van-ban/notebooklm_bridge.py) (tự động chạy qua `Chay_Game.bat` ở cổng `8899`).
  - Tự động vẽ **Bản Sơ Đồ Tư Duy Chốt Kiến Thức (SVG)** gồm 6 nhánh (Chủ đề & Cảm hứng, Bố cục/Mạch ý, Hình tượng/Nhân vật, Đặc sắc nghệ thuật, Thông điệp tư tưởng, Từ khóa/Khái niệm), hỗ trợ tải file `.svg` và nhảy tới ngay từ màn Xem trước (`🧠 Xem Sơ đồ tư duy & NotebookLM`).
  - **Đấu nối 1 chạm với Google NotebookLM (Đầy đủ 9 tính năng Studio như giao diện gốc của Google NotebookLM):** Đẩy tự động 2 gói nguồn dữ liệu (*Ngữ liệu + Phân tích học thuật THPT* và *Sơ đồ tư duy + Ngân hàng câu hỏi + Thống kê lỗi sai của lớp*) lên tài khoản Google NotebookLM của giáo viên và yêu cầu khởi tạo tự động **9 học liệu tiếng Việt**:
    1. 🎙️ **Tổng quan bằng âm thanh (`audio`)**
    2. 📊 **Bản trình bày (`slide_deck`)**
    3. 🎬 **Tổng quan bằng video (`video`)**
    4. 🧠 **Bản đồ tư duy (`mind_map`)**
    5. 📄 **Báo cáo `Mới!` (`report`)**
    6. 🗂️ **Thẻ ghi nhớ (`flashcards`)**
    7. ❓ **Bài kiểm tra (`quiz`)**
    8. 📊 **Bản đồ hoạ thông tin (`infographic`)**
    9. 📋 **Bảng dữ liệu (`data_table`)**
  - **Tự động đấu nối, chuyển dữ liệu & hiển thị kết quả trực tiếp ngay trên App khi chọn mục Studio (`execute-one` & `fetch-artifact`):**
    - Khi giáo viên bấm chọn bất kỳ mục nào trong **9 tính năng Studio** (hoặc bấm **🚀 Tự động đấu nối, thực hiện & Hiện kết quả lên App**), ứng dụng tự động khởi tạo Notebook, đẩy gói dữ liệu nguồn sang Google NotebookLM (hoặc thực thi trực tiếp qua Gemini AI Studio trên bản Web), tự động theo dõi tiến trình (`startArtifactPoller`) và tải kết quả thực tế về hiển thị trực tiếp trong khung `#studioOutput` ngay trên App:
      - 🎙️ **Âm thanh (`.m4a`)**: Phát trực tiếp bằng trình nghe `<audio controls>` kèm nút tải file `.m4a` hoặc nghe đọc giọng nói trực tiếp.
      - 🎬 **Video (`.mp4`)**: Xem trực tiếp bằng trình phát `<video controls>` kèm kịch bản phân cảnh.
      - 📊 **Bản trình bày (`.pdf`)**: Nhúng xem trực tiếp Slide PDF trong `<iframe src="...">` kèm dàn ý chi tiết.
      - 📊 **Bản đồ hoạ thông tin (`.png`)**: Hiển thị trực tiếp ảnh Infographic kết xuất từ NotebookLM kèm nút tải ảnh.
      - 🧠 **Bản đồ tư duy (`mind_map`)**: Vẽ cây phân nhánh trực tiếp từ dữ liệu JSON của NotebookLM (`renderNlmMindMapTree`).
      - 📄 **Báo cáo (`report`)**: Hiển thị toàn văn bản Báo cáo Markdown từ NotebookLM ngay trên App.
      - 🗂️ **Thẻ ghi nhớ (`flashcards`) & ❓ Bài kiểm tra (`quiz`)**: Trích xuất dữ liệu tương tác (`get_interactive_app_data`) từ NotebookLM để lật thẻ và làm bài trắc nghiệm chấm điểm trực tiếp trên App.
      - 📋 **Bảng dữ liệu (`data_table`)**: Hiển thị bảng dữ liệu trực tiếp từ file `.csv` của NotebookLM kèm nút xuất Excel/CSV.
  - **Khung Xem & Tương tác ngay tại chỗ cả 9 tính năng Studio:** Cho phép giáo viên bấm vào từng thẻ pill để xem, tương tác và trình chiếu ngay trên lớp cả 9 định dạng, đồng thời hỗ trợ nút **📤 Copy Nguồn & Mở NotebookLM Web** và **📥 Tải file Nguồn (.md)**.

### Removed
- **Xóa toàn bộ các file nhạc nền/mở đầu/kết thúc của trò chơi Ai Là Triệu Phú trên GitHub:** Chỉ giữ lại 2 file âm thanh **Đúng (`amthanhdung.mp3`)** và **Sai (`amthanhsai.mp3`)** trên toàn bộ hệ thống (`game-doc-hieu-van-ban`, `game-ai-la-trieu-phu` và thư mục gốc) và cấu hình `.gitignore` chặn đẩy các file `.mp3` khác lên GitHub.

### Fixed
- **Sửa lỗi co hẹp nút bấm trong khung kết quả Studio (`.studio-head-row` trong [style.css](file:///c:/Users/hoang/Downloads/TOAN/duantoan/game-doc-hieu-van-ban/style.css#L573-L577)):** Bổ sung `flex-wrap: wrap` và `flex-shrink: 0; white-space: nowrap` cho các nút thao tác (`🔍 Xem Sơ đồ SVG lớn`, `📥 Tải Bảng dữ liệu (.csv)`, `🔊 Nghe đọc Podcast`, `⚡ Thực hiện mục này`) để nút luôn hiển thị cân đối trên mọi kích thước màn hình.
- **Khắc phục triệt để lỗi `"Dữ liệu AI trả về bị lỗi định dạng. Hãy bấm phân tích lại."` khi phân tích văn bản bằng Gemini 2.5 / 3.x (`AIService` trong [app.js](file:///c:/Users/hoang/Downloads/TOAN/duantoan/game-doc-hieu-van-ban/app.js#L314-L485)):**
  - Lọc bỏ các phần suy nghĩ nội bộ (`thought: true`) của Gemini 2.5 / 3.x trước khi giải mã JSON và nâng `maxOutputTokens` lên `32768` để tránh đứt gãy JSON.
  - Xây dựng bộ **Auto-Repair JSON (`AIService.repairJSON`)** tự động sửa dấu ngoặc kép thẳng (`"..."`) chưa escape khi AI trích dẫn thơ/văn tiếng Việt, ký tự xuống dòng trực tiếp trong chuỗi, dấu phẩy thừa cuối mảng/object và tự động đóng ngoặc nếu phản hồi bị ngắt.
  - Tách bước OCR văn bản thuần (`extractTextFromImages`) trước khi phân tích JSON đối với ngữ liệu ảnh/PDF scan và tự động thử lại (`retry`) nếu phản hồi lỗi định dạng.

---

## [2.3.1] - 2026-11-06

### Added
- **Chỉnh sửa trực tiếp câu hỏi đọc hiểu trên màn hình Xem trước & Duyệt (`Preview`):**
  - Bấm trực tiếp vào bất kỳ câu hỏi nào hoặc bấm nút **`✏️ Sửa`** để mở khung chỉnh sửa tại chỗ cho cả 6 vòng chơi (Trắc nghiệm 4 phương án A–D & chọn đáp án đúng, Đúng/Sai, Điền từ, Nối cặp, Sắp xếp trình tự có nút `▲/▼`, Tự luận kèm Rubric & Gợi ý đáp án).
  - Thêm nút **`➕ Thêm câu / cặp / mục`** ở đầu mỗi vòng để giáo viên tự bổ sung câu hỏi mới.
  - Thêm nút **`✏️ Sửa tổng quan`** để chỉnh sửa trực tiếp tên văn bản, tác giả, thể loại, tóm tắt và chủ đề trước khi chơi.

---

## [2.3.0] - 2026-11-06

### Added
- **Nâng cấp toàn diện "Đọc Hiểu Cùng AI" lên Chương trình Ngữ văn THPT (CT GDPT 2018):**
  - Bổ sung lựa chọn khối lớp THPT (`Lớp 10 – THPT`, `Lớp 11 – THPT`, `Lớp 12 – THPT`, `Ôn thi Tốt nghiệp THPT`) làm mặc định.
  - Nâng cấp Prompt AI chuẩn khảo thí Ngữ văn THPT: phân tích chuyên sâu 3 loại văn bản (văn học, nghị luận, thông tin) theo thi pháp, chủ thể trữ tình, điểm nhìn trần thuật, mạch lập luận và câu hỏi 3 mức độ (Nhận biết / Thông hiểu / Vận dụng).
  - Thay bộ ngữ liệu mẫu thành tác phẩm **"Đây thôn Vĩ Dạ" – Hàn Mặc Tử** (Ngữ văn 11 THPT) với đầy đủ 6 vòng chơi và đáp án học thuật.
- **Nạp ngữ liệu đa phương thức (Copy kí tự · Đẩy file PDF · Gửi ảnh vào):**
  - **Copy & Dán kí tự:** Thêm nút `📋 Dán kí tự`, `📑 Copy kí tự` (ở màn nạp bài, màn xem trước và ngăn xem văn bản), nút `✨ Chuẩn hóa dòng PDF` (gộp các dòng bị ngắt vụn khi copy từ PDF) và thanh chèn nhanh kí tự đặc biệt (`“ ”`, `‘ ’`, `…`, `[…]`, `—`, `–`, `•`, `➜`, `§`).
  - **Đẩy file PDF (cả PDF chữ và PDF scan):** Trích xuất văn bản chuẩn dòng bằng PDF.js; tự động kết xuất các trang PDF scan thành ảnh chất lượng cao để AI đọc OCR hoặc phân tích trực tiếp.
  - **Gửi ảnh vào (`.png`, `.jpg`, `.webp`):** Hỗ trợ chọn nhiều ảnh, kéo thả ảnh, hoặc nhấn `Ctrl+V` để dán trực tiếp ảnh chụp màn hình/trang sách. Có khung xem ảnh thu nhỏ, phóng to Lightbox, nút **"🔍 Trích xuất kí tự từ ảnh (AI OCR)"** và hỗ trợ gửi thẳng ảnh vào Gemini Vision.

---

## [2.2.1] - 2026-11-05

### Added
- **Tách và triển khai game "Đọc Hiểu Cùng AI" sang GitHub Repository mới độc lập:**
  - Repository mới: https://github.com/hoangtritoanpro-eng/doc-hieu-cung-ai
  - GitHub Pages trực tuyến: https://hoangtritoanpro-eng.github.io/doc-hieu-cung-ai/
  - Đã kiểm tra trên trang thật: tải đủ tài nguyên (PDF.js, âm thanh), chơi được bài mẫu, thống kê đúng/sai, xuất CSV và kết nối tới Gemini API thông suốt.

---

## [2.2.0] - 2026-11-05

### Added
- **Thống kê câu đúng / sai (game Đọc Hiểu Cùng AI):**
  - Bộ đếm `✓ đúng / ✗ sai` trực tiếp trên thanh trạng thái trong lúc chơi.
  - Bảng thống kê sau trò chơi: tổng số câu, số câu đúng, số câu sai, tỉ lệ đúng; thống kê theo từng vòng và theo mức độ Nhận biết / Thông hiểu / Vận dụng.
  - Bảng chi tiết từng câu (câu hỏi, lớp trả lời, đáp án đúng, kết quả) có bộ lọc Tất cả / Câu đúng / Câu sai.
  - Nút **"⬇ Tải thống kê (Excel)"** xuất file CSV giữ nguyên tiếng Việt; bảng thống kê được in kèm infographic (trang riêng).

### Changed
- **Kết nối Gemini API:** nút "🔌 Kết nối" tự tải danh sách model mà API Key được dùng, chọn sẵn model Flash mới nhất và gửi thử yêu cầu; hiển thị trạng thái kết nối ở góc trên và cạnh ô API Key; tự kết nối lại khi mở ứng dụng; tự chuyển sang model khả dụng khác nếu model đã chọn không tồn tại (lỗi 404).
- Gửi API Key qua header `x-goog-api-key` thay vì đặt trên URL; thông báo lỗi rõ ràng hơn (key sai, hết hạn mức, máy chủ bận, nội dung bị chặn, câu trả lời bị cắt do quá dài).
- Bỏ thông tin tác giả khỏi README của game.

---

## [2.1.0] - 2026-11-05

### Added
- **Game mới "Đọc Hiểu Cùng AI" (`game-doc-hieu-van-ban/`)** – hệ thống đánh giá năng lực đọc hiểu văn bản cho học sinh THCS:
  - **Nạp văn bản:** dán trực tiếp hoặc kéo thả file `.pdf` (PDF.js offline), `.docx`, `.txt`; chọn khối lớp 6–9, số câu mỗi vòng (3/5/7), bật/tắt từng vòng.
  - **Gemini AI phân tích:** thể loại, tóm tắt, chủ đề, ý chính, nhân vật, trình tự sự việc, đặc sắc nghệ thuật, thông điệp, từ ngữ khó; sinh câu hỏi gắn mức độ Nhận biết / Thông hiểu / Vận dụng, kèm giải thích dẫn chứng từ văn bản.
  - **Chuẩn hóa dữ liệu AI:** kiểm tra và loại câu lỗi, trộn vị trí đáp án đúng, escape toàn bộ nội dung (chống chèn mã HTML).
  - **Giáo viên duyệt trước khi chơi:** màn xem trước, xóa từng câu / cặp / mục chưa phù hợp.
  - **6 vòng chơi:** Trắc nghiệm A–D, Đúng/Sai, Điền từ (thẻ từ), Nối cặp (tô màu theo cặp), Sắp xếp trình tự (kéo thả + ▲▼), Tự luận ngắn (AI chấm theo tiêu chí hoặc giáo viên tự chấm).
  - **Trải nghiệm lớp học:** giao diện chữ lớn tối ưu máy chiếu, nút "📄 Văn bản" xem lại bài đọc bất kỳ lúc nào, phím tắt, âm thanh đúng/sai/kết thúc, tổng kết sau mỗi vòng.
  - **Infographic chốt kiến thức:** tóm tắt, chủ đề, dòng thời gian, nhân vật, nghệ thuật, ý chính, thông điệp, từ ngữ, kết quả theo vòng và theo mức độ nhận thức, danh sách nội dung cần ôn lại; in / xuất PDF khổ A4 ngang.
  - **Chế độ bài mẫu offline** ("Thánh Gióng") chơi được ngay không cần API Key; tự lưu bộ câu hỏi gần nhất.
  - Đóng gói `Chay_Game.bat`, `README.md`, `vercel.json`.

---

## [2.0.0] - 2026-11-03

### Added
- **Đóng Gói Độc Lập Trò Chơi "AI LÀ TRIỆU PHÚ" (Standalone Game Package):**
  - **Thư mục riêng biệt `game-ai-la-trieu-phu/`:** Tách trọn vẹn toàn bộ trò chơi Ai Là Triệu Phú thành một gói game độc lập hoàn chỉnh với trang chính `index.html`.
  - **Tài nguyên tích hợp cục bộ:** Chứa đầy đủ bộ âm thanh MP3 (nhạc dạo đầu 15.8s, nhạc nền, đúng/sai, kết thúc), ảnh nền studio 3D, logo, thư viện KaTeX offline và bộ đọc PDF.js offline.
  - **Khởi động 1-click `Chay_Game.bat`:** Tự động mở mini server cục bộ và khởi chạy trình duyệt chơi ngay mà không cần cài đặt phức tạp.
  - **Tệp nén lưu trữ `tro-choi-ai-la-trieu-phu.zip` (6.8 MB):** Gói nén trọn vẹn sẵn sàng tải về, sao chép sang máy tính khác hoặc gửi cho học sinh/giáo viên.
  - **Sẵn sàng Deploy độc lập lên Vercel:** Tích hợp sẵn `vercel.json` và `package.json` độc lập cho phép triển khai riêng trò chơi lên Vercel chỉ trong vài giây.

---

## [1.9.9] - 2026-11-03

### Added & Changed
- **Hiển Thị Chuẩn Xác Công Thức Toán Học (KaTeX Math Engine & Fallback):**
  - **Tích hợp KaTeX hoàn chỉnh:** Hỗ trợ offline đầy đủ tại `assets/vendor/` (`katex.min.css`, `katex.min.js`, `auto-render.min.js`) và cơ chế fallback trực tuyến qua CDN jsDelivr.
  - **Tự động nhận diện & chuẩn hóa công thức:** Tự động parse và render các định dạng toán học LaTeX chuẩn (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`), đồng thời tự động chuẩn hóa phân số `\frac`, căn bậc hai `\sqrt`, số mũ `x^2`, chỉ số dưới `x_1`, v.v.
  - **Styling tương phản chuyên biệt:** Màu chữ công thức trong khung câu hỏi màu tối rõ nét, trong các ô đáp án màu trắng sáng nổi bật trên nền gradient tối.
  - **Fallback không lỗi:** Tích hợp bộ render HTML thuần (`span.math-frac`, `span.math-sqrt`, `sup`, `sub`) đảm bảo công thức toán luôn hiển thị trọn vẹn ngay cả khi không tải được script KaTeX.
  - **Áp dụng toàn diện:** Render trên cả khung câu hỏi chính, 4 nút lựa chọn A, B, C, D, và bảng xem trước của Modal Nạp Đề.

- **Hiển Thị Chuẩn Xác Hình Vẽ Minh Họa Trắc Nghiệm (Math Geometry & Image Viewer):**
  - **Khung hình vẽ thông minh `#milQImageWrap`:** Tự động hiển thị khi câu hỏi có trường `image` (URL ảnh, SVG vector data URL, hoặc Base64 data URL).
  - **Modal Lightbox Phóng To `#modalImageZoom`:** Nhấp vào hình vẽ để xem phóng to sắc nét toàn màn hình với hiệu ứng viền vàng phát sáng, hỗ trợ phím `Escape` và nút đóng tiện lợi.
  - **Bộ hình vẽ mẫu SVG sắc nét (`MathGeometrySVGs`):** Tích hợp sẵn các hình vẽ hình học THCS chuẩn mực (Tam giác vuông 3-4-5, Hình thoi hai đường chéo, Đường trung bình tam giác, Tam giác vuông đường cao AH, Hình vuông, Đường tròn góc nội tiếp).
  - **Trích xuất ảnh tự động từ file PDF (`PdfExtractor`):** Tự động duyệt toán tử vẽ ảnh trong PDF (`paintImageXObject`) và gán ảnh vào các câu hỏi hình học tương ứng.
  - **Quản lý ảnh trực quan trong Modal Nạp Đề:** Cho phép giáo viên đính kèm hình vẽ riêng từ máy tính, xem thumbnail và xóa ảnh từng câu trước khi áp dụng vào game.
  - **Tối ưu bố cục responsive:** Điều chỉnh tỉ lệ chiều cao khung ảnh và khoảng cách `gap: 10px;` giúp giao diện không bao giờ bị đè lấn trên mọi độ phân giải màn hình.

---

## [1.9.8] - 2026-11-03

### Changed & Fixed
- **Hỗ Trợ Động Số Lượng Câu Hỏi Tùy Chỉnh (Dynamic Question Count Support):**
  - **Giữ nguyên chính xác số lượng đề nạp:** Khắc phục triệt để lỗi tự động nhân bản ép về 22 câu khi tải đề riêng. Tải lên file PDF hoặc mã văn bản có bao nhiêu câu (ví dụ 6 câu) thì trò chơi sẽ hiển thị và vận hành đúng bấy nhiêu câu.
  - **Đồng bộ toàn diện giao diện theo số câu thực tế:**
    - Lưới câu hỏi tự động hiển thị đúng số nút tương ứng (ví dụ nạp 6 câu -> hiển thị đúng 6 nút từ 1 đến 6).
    - Cập nhật tiêu đề bảng điều khiển: `DANH SÁCH N CÂU HỎI:` và bộ đếm `0/N`.
    - Cập nhật thẻ hiển thị câu hỏi: `Câu X/N` và `Câu N/N - CÂU CUỐI CÙNG 👑`.
    - Cập nhật tiến độ điểm số: `0 / N` và tỷ lệ phần trăm thanh trạng thái.
  - **Tháp Danh Hiệu Thích Ứng Động (Adaptive Ladder):**
    - Tự động sinh các bậc thang phù hợp theo tổng số câu hỏi (ví dụ với 6 câu: Câu 6 là `👑 TRIỆU PHÚ TOÁN HỌC`, Câu 3 là `⭐ BẬC THẦY`, Câu 1 là `Bắt Đầu Hành Trình`).
    - Tính toán mốc danh hiệu tỷ lệ phần trăm khi hoàn thành game dựa trên tổng số câu thực tế.
  - **Đồng bộ hóa:** Áp dụng trên cả file độc lập `ai-la-trieu-phu.html` và module `millionaire.js`.

---

## [1.9.7] - 2026-11-03

### Added & Changed
- **Tích Hợp Trọn Vẹn Đoạn Nhạc Mở Đầu Chương Trình (Ai Là Triệu Phú Intro Theme):**
  - **Tải file âm thanh đa nguồn an toàn:** Hỗ trợ load chính xác file `mở đầu chương trình.mp3` (và bản copy chống lỗi UTF-8/URL encoding `nhacmodau.mp3`, `assets/millionaire/nhacmodau.mp3`).
  - **Phát trọn vẹn 15.8 giây bản dạo đầu:** Loại bỏ giới hạn ngắt sớm 5.5s cũ, cho phép người dùng thưởng thức toàn bộ giai điệu hào hùng kinh điển của gameshow Ai Là Triệu Phú.
  - **Chuyển tiếp tự động và thông minh:** Tự động lắng nghe sự kiện `onended` để chuyển sang nhạc nền căng thẳng (`nhacnenlientuc.mp3`), đồng thời tích hợp `fadeIntroToBg()` khi người chơi tương tác trả lời câu hỏi để âm thanh chuyển êm dịu không bị cắt gắt.
  - **Nút tiện ích "🎵 Mở đầu":** Bổ sung nút bấm riêng trên bảng điều khiển để giáo viên/MC có thể bấm phát lại nhạc dạo đầu bất cứ lúc nào trong tiết học hoặc sự kiện.
  - **Đồng bộ song song:** Cập nhật cả file độc lập `ai-la-trieu-phu.html` và module `millionaire.js`.

---

## [1.9.6] - 2026-11-03

### Changed
- **Chuẩn Hóa & Cập Nhật Model Google Gemini Mới Nhất:**
  - Thiết lập model `gemini-3.8-flash` (Thế hệ mới nhất - Siêu nhanh & Thông minh) làm model mặc định đứng đầu danh sách lựa chọn trong hộp Nạp đề AI.
  - Cập nhật danh sách model ưu tiên: `Gemini 3.8 Flash`, `Gemini 3.5 Flash Lite`, `Gemini 2.5 Flash`, `Gemini 2.0 Flash`, `Gemini 1.5 Flash` cùng tùy chọn Custom Model.
  - Đồng bộ logic JavaScript `GeminiQuizService` và `CustomQuestionManager.loadGeminiSettings()` ưu tiên model `gemini-3.8-flash`.

### Added & Changed
- **Đồng Bộ Thương Hiệu Tên Trò Chơi "AI LÀ TRIỆU PHÚ":**
  - Cập nhật tiêu đề trang web chính thức: `AI LÀ TRIỆU PHÚ - Thầy Sơn SKL`.
  - Cập nhật Header chính của trò chơi thành phong cách vàng kim 3D: `AI LÀ TRIỆU PHÚ`.
  - Cập nhật tiêu đề Modal nạp đề: `📄 NẠP ĐỀ TỰ ĐỘNG - TRÒ CHƠI: AI LÀ TRIỆU PHÚ`.
  - Chuẩn hóa nút kích hoạt nạp đề thành: `▷ ÁP DỤNG VÀO TRÒ CHƠI: AI LÀ TRIỆU PHÚ`.
  - Đồng bộ toàn diện trên cả file độc lập `ai-la-trieu-phu.html` và tài liệu dự án.

---

## [1.9.5] - 2026-11-03

### Added
- **Tích Hợp Google Gemini Flash AI Chuẩn Hóa & Tự Giải Đề Thi (AI Quiz Standardization):**
  - **Kết nối trực tiếp Gemini API:** Hỗ trợ model `gemini-1.5-flash`, `gemini-2.0-flash` và model tùy chỉnh (`gemini-3.8-flash`...).
  - **Chế độ ép kiểu JSON chuẩn (`responseMimeType: "application/json"`):** Đảm bảo phản hồi từ AI luôn tuân thủ 100% cấu trúc dữ liệu câu hỏi của app.
  - **Khả năng tự giải toán & phân tích sâu:** Tự động sửa lỗi OCR/ký tự lạ toán học khi scan PDF, nhận diện câu hỏi và 4 phương án A, B, C, D, đồng thời tự động giải bài toán để xác định đáp án đúng tuyệt đối kể cả khi đề thi gốc không có sẵn đáp án.
  - **Bảo mật & Tiện ích:** Hỗ trợ lưu API Key an toàn trong LocalStorage trình duyệt, nút ẩn/hiện key và nút `Test Key` kiểm tra kết nối API tức thì.
  - **Cơ chế hoạt động kép linh hoạt (Dual Engine):** Cho phép bật/tắt Gemini AI bằng công tắc chuyển đổi; khi tắt AI hoặc không có mạng, hệ thống tự động chạy bộ bóc tách Regex Offline siêu tốc.

---

## [1.9.4] - 2026-11-03

### Added
- **Giao Diện & Tính Năng Nạp Đề Tự Động Từ File PDF (PDF Quiz Importer):**
  - **Giao diện kéo thả PDF hiện đại:** Nâng cấp toàn diện Modal Nạp Đề với khu vực kéo thả (Dropzone) chuyên nghiệp viền vàng hổ phách, icon PDF và nút tải file.
  - **Trích xuất & Giải mã PDF thuần Client (100% Offline):** Tích hợp công nghệ `pdf.js` giải mã cấu trúc trang PDF đa luồng, sắp xếp tự nhiên theo tọa độ (x, y) để giữ đúng trật tự câu hỏi mà không cần server backend.
  - **Bộ Parser Phân Tích Đề Trắc Nghiệm Thông Minh (Smart Quiz Parser):**
    - Tự động nhận diện mọi định dạng câu hỏi trắc nghiệm phổ biến (`Câu 1`, `Bài 1`, `Question 1`).
    - Tự động phân tách 4 phương án A, B, C, D kể cả khi nằm trên cùng dòng hay cách dòng.
    - Tự động bóc tách và khớp đáp án đúng từ Bảng đáp án cuối đề thi (`BẢNG ĐÁP ÁN: 1.A 2.B 3.C...`), từ dòng `Đáp án: [A-D]` hoặc ký hiệu tiền tố `#A`, `*A`.
    - Tự động chuẩn hóa về đúng mã cấu trúc dữ liệu JSON của ứng dụng.
  - **Bảng Xem Trước Trực Quan & Tương Tác 1-Click:**
    - Hiển thị danh sách câu hỏi dạng thẻ, phương án đúng được viền xanh lá và gắn huy hiệu `✓ ĐÚNG`.
    - Cho phép giáo viên nhấp chuột trực tiếp vào A/B/C/D để chuyển đổi đáp án đúng tức thì hoặc bấm `🗑 Xóa câu` thừa.
    - Tab chuyển đổi linh hoạt giữa "Xem trước trực quan" và "Mã đề văn bản (Code/Text)".
  - **Tích hợp vào Game Ngay Lập Tức:** Nút `▷ ÁP DỤNG VÀO GAME NGAY` nạp bộ câu hỏi vừa bóc tách vào trò chơi Ai Là Triệu Phú để bắt đầu thử thách ngay.
  - Đồng bộ tính năng nạp PDF vào cả tệp độc lập (`ai-la-trieu-phu.html`) và tab "Quản Lý Câu Hỏi" của ứng dụng chính (`index.html`, `app.js`).

---

## [1.9.3] - 2026-11-03

### Changed
- **Thay đổi thương hiệu tác giả:** Chuyển đổi toàn diện thông tin "Phát triển bởi Thầy Toàn A.I" thành "Thầy Sơn SKL" trên toàn bộ ứng dụng (Title, Header Logo, Sidebar Credit, Panel Tác giả game Ai Là Triệu Phú, PWA Manifest và tài liệu Hướng Dẫn Sử Dụng).

### Added
- **Nâng cấp Hệ thống Âm Thanh Hợp Lý & Chuyên Nghiệp:**
  - **Tối ưu thứ tự & hòa âm (Audio Mixing):** Tạm dừng nhạc nền hồi hộp khi phát âm thanh Đúng/Sai để âm thanh chiến thắng vang lên trọn vẹn, không bị phát chồng đè hỗn loạn.
  - **Chuyển tiếp mượt mà cho Nhạc Mở Đầu (Intro):** Nhạc dạo đầu phát 5.5 giây trọn vẹn rồi tự động fade-out sang nhạc nền hồi hộp, không còn bị ngắt đột ngột sau 2 giây.
  - **Âm thanh Chốt Đáp Án (Final Answer Lock):** Tích hợp hiệu ứng hợp âm kịch tính đa âm (Tritone suspense chord) mỗi khi người chơi nhấp chọn 1 trong 4 phương án A, B, C, D.
  - **Âm thanh Vượt Mốc & Khán Giả Vỗ Tay (Applause FX):** Tích hợp tiếng vỗ tay ròn rã của khán giả trường quay khi người chơi vượt qua các mốc quan trọng (Câu 5, 10, 15, 20) và khi hoàn thành chiến thắng.
  - **Âm thanh Hé Lộ Đáp Án & Lật Thẻ:** Bổ sung âm chuông arpeggio nhẹ nhàng khi bấm "Hiện đáp án" và âm thanh chuyển câu hỏi mượt mà.
  - Cập nhật đồng bộ trên cả tệp độc lập (`ai-la-trieu-phu.html`), game `millionaire.js` và hệ thống chung `app.js`.

---

## [1.9.2] - 2026-11-03

### Added
- **Tích Hợp Đoạn Nhạc Kết Thúc Chương Trình (Ai Là Triệu Phú Outro):**
  - Tích hợp tệp âm thanh outro truyền hình kinh điển (`kết thúc chương trình.mp3` / `nhacketthuc.mp3`) với độ dài 31 giây, mang lại không khí chiến thắng hoành tráng và trọn vẹn nhất của gameshow VTV3.
  - Tự động phát hiện khi người chơi bước vào câu hỏi cuối cùng (Câu 22/22) với nhãn nổi bật `CÂU CUỐI CÙNG 👑`.
  - Dừng nhạc nền hồi hộp căng thẳng (`nhacnenlientuc.mp3`), lập tức phát giai điệu kết thúc chương trình hào hùng khi người chơi chốt câu trả lời cuối cùng hoặc kết thúc trận đấu.
  - Đồng bộ và kiểm thử hoàn hảo trên cả ứng dụng chính (`millionaire.js`) và tệp độc lập (`ai-la-trieu-phu.html`).

---

## [1.9.1] - 2026-11-03

### Changed
- **Thiết Kế Lại Toàn Diện Nền Game Ai Là Triệu Phú (Theo Mẫu PowerPoint Studio):**
  - Trích xuất và tích hợp hình nền 3D trường quay studio truyền hình kinh điển (ghế nóng trung tâm, bậc thang phát sáng màu hổ phách, sàn kính phản chiếu và hệ thống đèn spotlight xanh dương đa chiều).
  - Tích hợp hiệu ứng kính mờ Glassmorphism (`backdrop-filter: blur(10px)`) kết hợp viền vàng Gold sang trọng cho hai bảng điều khiển và tiến độ.
  - Tinh chỉnh vùng trung tâm câu hỏi với radial gradient ánh sáng sân khấu, giúp trường quay hiển thị lung linh nhưng nội dung câu hỏi và 4 đáp án A, B, C, D vẫn rõ ràng, sắc nét.
  - Bổ sung huy hiệu Logo chính thức của "Ai Là Triệu Phú" tại header và biểu trưng chiến thắng "Bạn Là Triệu Phú !!!" tại modal kết thúc.
  - Cập nhật đồng bộ cho cả ứng dụng chính (`index.html`, `index.css`) và tệp độc lập (`ai-la-trieu-phu.html`).

---

## [1.9.0] - 2026-11-03

### Added
- **Đóng gói game Ai Là Triệu Phú thành tệp riêng (`ai-la-trieu-phu.html`):** 
  - Toàn bộ trò chơi được đóng gói thành một tệp HTML độc lập duy nhất (All-in-One: HTML5, CSS nhúng, Logic JS, ngân hàng đề 55+ câu Toán THCS).
  - Hoạt động trơn tru 100% offline không cần cài đặt hoặc kết nối server; có thể copy vào USB hoặc mở trực tiếp trên mọi trình duyệt máy tính/di động.
  - **Hệ thống âm thanh kép (Dual Audio):** Kết hợp các file MP3 tĩnh và cơ chế fallback tự động bằng Web Audio API Synthesizer (không bao giờ bị ném lỗi chặn âm thanh của trình duyệt).
  - **Phím tắt trình chiếu cho giáo viên:** Hỗ trợ phím số `1, 2, 3, 4` hoặc chữ cái `A, B, C, D`, phím `Space/Enter` để kiểm tra kết quả ngay lập tức trên bảng tương tác.
  - **Tiện ích mở rộng:** Hỗ trợ lọc theo Khối lớp (Lớp 6, 7, 8, 9, Tổng hợp) & Chủ đề (Đại số, Hình học); chế độ Toàn màn hình (Fullscreen); và hộp thoại nạp bộ đề riêng tùy chỉnh.
  - **Tháp danh hiệu 22 bậc:** Tái hiện chân thực không khí kịch tính của gameshow truyền hình.
- Bổ sung nút liên kết mở nhanh tệp riêng `ai-la-trieu-phu.html` ngay trên Dashboard và trong màn hình game của `index.html`.

---

## [1.8.0] - 2026-06-24

### Added
- **Quản lý Nguồn Câu Hỏi (Bulk Upload):** Thay thế giao diện nhập tay từng câu bằng giao diện tải lên hàng loạt qua `.docx` hoặc nhập Text lớn.
- **Tích hợp `mammoth.js`:** Hỗ trợ đọc trực tiếp nội dung từ file Word để tự động parse câu hỏi trắc nghiệm ngay trên trình duyệt mà không cần Backend.
- **Realtime Parsing Regex:** Thuật toán nhận diện câu hỏi theo định dạng chuẩn `Câu 1... A... #B...` và đếm số lượng câu hợp lệ trực tiếp khi người dùng thao tác.

---

## [1.7.0] - 2026-06-24

### Changed
- **Giao Diện Tươi Sáng Toàn Diện (Phase 5 & 6):** Cập nhật hệ thống phông chữ (Fredoka và Quicksand) thân thiện với trẻ em. Chuyển đổi toàn diện giao diện sang tông màu Bright Theme. 
- **Refactor Canvas Games:** Chỉnh sửa màu sắc của tất cả các game (Kéo co, Đào vàng, Lật mảnh ghép, Ninja Toán học, v.v.) sang tông màu sáng pastel.
- **Game Mới:** Hoàn thiện và cập nhật giao diện Bright Theme cho 2 game mới: Bảo Vệ Trái Đất (Space Math) và Đua Xe Toán Học (Math Racing).
- **Phòng Pomodoro:** Đảm bảo phòng học Pomodoro hoạt động trơn tru trong cấu trúc hệ thống.

---

## [1.6.0] - 2026-06-23

### Added
- **Phòng Pomodoro:** Bổ sung 6 thể loại nhạc Lofi (Hip Hop, Jazz, Ambient, House, Vaporwave, Acoustic) kèm gợi ý mục đích sử dụng.
- **Game Ai Là Triệu Phú:** Tích hợp giao diện DOM game Ai Là Triệu Phú (không dùng Canvas) với hiệu ứng animation nổi bật.
- **Âm thanh MP3 cục bộ:** Sử dụng file mp3 tĩnh (nhạc nền, nhạc đúng/sai, nhạc mở đầu) thay vì Web Audio API cho game Ai Là Triệu Phú.
- Tối ưu UI game Ai Là Triệu Phú: Xóa text thừa và điều chỉnh lại CSS.

---

## [1.5.1] - 2026-06-22

### Fixed
- **Câu hỏi không hiển thị trong 5 game Canvas:** Lỗi do `var(--bg-panel)` và `var(--border-glass)` (CSS Custom Properties) không được Canvas 2D API đọc. Khi Canvas nhận string này, nó fallback về màu đen, khiến logic `isDark` đổi chữ sang đen → chữ đen trên nền đen = vô hình.
  - Fix trong: `quiz-climb.js`, `flappy-math.js`, `archery-math.js`, `gold-miner.js`, `tug-of-war.js`, `memory-match.js`
  - Thay thế bằng màu thực: `rgba(255, 255, 255, 0.92)` (nền trắng mờ), `rgba(15, 23, 42, 0.15)` (viền xám nhẹ), `#0f172a` (chữ tối).

---

## [1.5.0] - 2026-06-22

### Changed
- **Giao Diện Tươi Sáng (Bright Theme):** Chuyển đổi toàn bộ giao diện từ tông màu tối cyberpunk sang tông màu sáng pastel thân thiện với học sinh.
- **Phông chữ mới:** Tích hợp phông chữ bo tròn **Fredoka** (tiêu đề) và **Quicksand** (nội dung) từ Google Fonts — dễ đọc, dễ thương và phù hợp lứa tuổi.
- **Canvas 8 Game:** Chuyển đổi tất cả 8 màn hình trò chơi:
  - **Kéo Co:** Sân cỏ xanh mướt, dây thừng nâu đất, bục đáp án kính sáng.
  - **Lật Mảnh Ghép:** Nền trời xanh gradient nhạt, ô phủ kính trắng mờ dễ nhìn.
  - **Ninja Toán Học AI:** HUD trắng mờ, bục A/B xanh biển nổi bật camera.
  - **Đỉnh Cao Olympia:** Trời xanh ban ngày, núi xanh lá mát mẻ.
  - **Đào Vàng Tri Thức:** Vùng hầm cát vàng ấm áp, cục vàng sáng chói.
  - **Bắn Cung Toán Học:** Bầu trời ngày trong sáng, cung nâu gỗ tự nhiên.
  - **Ghép Đôi Thẻ Bài:** Nền oải hương pastel, mặt sau thẻ gradient xanh biển–tím.
  - **Rùa Bay Toán Học:** Nền trời xanh ngọc, cổng kính trắng chữ tối rõ nét.
- **Helper UI:** Cập nhật hàm `drawGlassCard` tự động thích ứng màu chữ/viền theo nền sáng/tối.

---

## [1.4.0] - 2026-06-22

### Added
- Tạo script **Chay_Local.bat** tự động chạy HTTP Server và mở trình duyệt để giáo viên chơi offline tại lớp học dễ dàng.
- Thiết lập tệp cấu hình **vercel.json** quy định các header bảo mật và rút gọn URL.
- Biên soạn bộ tài liệu **Huong_Dan_Su_Dung.md** hướng dẫn chi tiết luật chơi, quản lý câu hỏi, và xuất điểm CSV.
- Hoàn thành Audit bảo mật & tối ưu SEO (meta tags, headings, offline-mode fallbacks).

---

## [1.3.0] - 2026-06-22

### Added
- Tính năng **Quản Lý Câu Hỏi Tùy Chỉnh** (Custom Question Creator) cho phép giáo viên tự soạn câu hỏi, lưu trữ qua `localStorage` và trộn ngẫu nhiên vào 8 game tương tác.
- Tích hợp tính năng **Xuất Bảng Điểm ra CSV** chuẩn Excel tiếng Việt (UTF-8 BOM).
- Cấu hình **PWA (Progressive Web App)** với `manifest.json` cho phép cài đặt trực tiếp lên PC/Mobile.
- Viết Service Worker (`sw.js`) để **Cache Assets tĩnh & CDN động**, hỗ trợ chạy ngoại tuyến (Offline) toàn diện.
- Tối ưu hóa hiệu năng vẽ canvas và dọn dẹp bộ nhớ router.

---

## [1.2.0] - 2026-06-22

### Added
- Tính năng **Bảng Xếp Hạng** (Leaderboard) lưu trữ thành tích học sinh thông qua `localStorage`.
- Bổ sung trường nhập **Tên học sinh / Đội nhóm** tại Sidebar cấu hình.
- Tối ưu hóa **Responsive UI** trên thiết bị di động (mobile/tablet layout tự động chuyển dọc và co giãn lưới game mượt mà).
- Chuẩn hóa **SEO & Cấu trúc trang** (bổ sung thẻ meta description, keywords, thẻ `<h1>` chính).
- Đồng bộ cơ chế tính điểm chuẩn hóa (thang điểm 100) cho toàn bộ 8 game.

---

## [1.1.0] - 2026-06-22

### Added
- Hoàn thành bộ 8 game dạy học tương tác mang dấu ấn Thầy Toàn A.I:
  - **Game 1: Kéo Co Kiến Thức** (`tug-of-war.js`): Trò chơi kéo co đối kháng/lớp học.
  - **Game 2: Lật Mảnh Ghép Trí Uẩn** (`flip-puzzle.js`): Trò chơi đoán từ khóa và lật mở tranh ẩn.
  - **Game 3: Ninja Toán Học AI** (`ninja-toan.js`): Game tương tác webcam sử dụng thư viện MediaPipe Hands chỉ ngón trỏ.
  - **Game 4: Đỉnh Cao Olympia** (`quiz-climb.js`): Trò chơi leo núi tính điểm và Ngôi sao hy vọng.
  - **Game 5: Đào Vàng Tri Thức** (`gold-miner.js`): Trò chơi móc câu dao động gắp vàng.
  - **Game 6: Bắn Cung Toán Học** (`archery-math.js`): Trò chơi nhắm bắn cung tên vật lý.
  - **Game 7: Ghép Đôi Thẻ Bài** (`memory-match.js`): Trò chơi trí nhớ ghép hằng đẳng thức.
  - **Game 8: Rùa Bay Toán Học** (`flappy-math.js`): Trò chơi phản xạ bay vượt cổng đáp án.
- Tích hợp **Ngân hàng câu hỏi Toán học khối lớp 6-9** phân loại chi tiết theo chủ đề Đại số/Hình học và mức độ.
- Hệ thống âm thanh tổng hợp **AudioEngine** qua Web Audio API không phụ thuộc file tĩnh.
- Sinh ảnh nền AI bí ẩn chất lượng cao `bg_secret.png` cho game Lật Mảnh Ghép.
- Giao diện Dashboard Cyber Classroom mượt mà, hỗ trợ Responsive và Glassmorphism.

## [1.0.0] - 2026-06-22

### Added
- Khởi tạo dự án và thiết lập môi trường Solo Builder thành công.
- Cấu trúc thư mục tài liệu `docs/` tiêu chuẩn và file quy tắc `AGENTS.md`.
- File theo dõi trạng thái `CHANGELOG.md`.
