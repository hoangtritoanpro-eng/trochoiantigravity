# Changelog

Tất cả những thay đổi nổi bật của dự án này sẽ được ghi lại trong file này theo định dạng quy chuẩn của **Solo Builder**.

Định dạng mẫu:
- **Added** cho các tính năng mới được triển khai.
- **Changed** cho các thay đổi trong logic hiện tại.
- **Deprecated** cho các tính năng cũ sắp bị xóa.
- **Removed** cho các tính năng đã bị xóa.
- **Fixed** cho các lỗi lập trình đã được sửa.
- **Security** trong trường hợp có lỗi bảo mật hoặc vá lỗi bảo mật.

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
