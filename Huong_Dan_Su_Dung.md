# HƯỚNG DẪN SỬ DỤNG - THẦY TOÀN A.I GAME CENTER

Chào mừng các thầy cô và các em học sinh đến với **Hệ thống Game Trí Tuệ Dạy Học của Thầy Toàn A.I**. Đây là bộ sản phẩm game học tập tương tác cao, thiết kế theo xu hướng giáo dục đổi mới nhằm tăng cường hứng thú học tập môn Toán THCS (lớp 6-9).

---

## 🚀 1. Hướng Dẫn Khởi Chạy Ứng Dụng

Ứng dụng có thể chạy linh hoạt theo 3 hình thức:

### Cách 1: Chạy Ngoại Tuyến (Offline Lớp Học) - KHUYÊN DÙNG
1. Tải thư mục dự án về máy tính Windows của giáo viên.
2. Click đúp vào file `Chay_Local.bat` ở thư mục gốc.
3. Trình duyệt mặc định sẽ tự động mở trang chủ tại địa chỉ: `http://localhost:8000`.
4. Giáo viên có thể giảng dạy hoàn toàn không cần kết nối mạng Internet.

### Cách 2: Triển Khai Lên Mạng (Vercel)
Nếu thầy cô muốn đưa lên Web để học sinh truy cập tự học tại nhà:
1. Mở cửa sổ dòng lệnh (Terminal/Command Prompt) tại thư mục dự án.
2. Nhập lệnh `vercel login` để đăng nhập tài khoản Vercel của thầy cô.
3. Nhập lệnh `vercel --prod` và nhấn Enter để deploy lên server toàn cầu. Vercel sẽ cung cấp một đường link truy cập công khai miễn phí.

### Cách 3: Cài Đặt Dưới Dạng PWA App (Máy Tính & Điện Thoại)
Vì ứng dụng hỗ trợ PWA (Progressive Web App):
- **Trên máy tính (Chrome/Edge):** Nhấp vào biểu tượng **"Cài đặt App"** (hình màn hình máy tính có mũi tên tải xuống) xuất hiện ở góc phải thanh địa chỉ (URL). Game Center sẽ được cài đặt và tạo lối tắt (Shortcut) ngoài màn hình desktop như ứng dụng chuyên nghiệp.
- **Trên điện thoại (iOS/Android):** Truy cập bằng Safari hoặc Chrome, chọn **"Thêm vào màn hình chính" (Add to Home Screen)**.

---

## 🎮 2. Luật Chơi Chi Tiết Của 8 Trò Chơi

### Game 1: Kéo Co Kiến Thức (Tug-of-War)
- **Luật chơi:** Hai đội (hoặc Player đấu với Máy) thi đấu kéo co. Lần lượt trả lời câu hỏi trắc nghiệm dưới áp lực thời gian (12 giây).
- **Cách chơi:** Trả lời đúng, đội của bạn sẽ kéo dây thừng về phía mình 1 nấc. Trả lời sai hoặc hết giờ, đối thủ kéo về phía họ. Đội nào kéo dây thừng vượt qua vạch biên giới hạn trước sẽ giành chiến thắng tuyệt đối.
- **Phù hợp:** Thi đấu tập thể trên bảng tương tác của lớp học.

### Game 2: Lật Mảnh Ghép Trí Uẩn (Flip Puzzle)
- **Luật chơi:** Có 9 ô mảnh ghép che giấu bức tranh bí ẩn (được sinh bằng A.I).
- **Cách chơi:** Chọn một mảnh ghép và trả lời câu hỏi tương ứng để lật mở ô đó. Đồng thời ở dưới cùng có ô chữ nhập từ khóa đoán tên bức tranh. Nếu bạn đoán đúng từ khóa bất kỳ lúc nào, bạn sẽ chiến thắng ngay lập tức và mở khóa toàn bộ bức tranh mà không cần giải hết 9 ô.

### Game 3: Ninja Toán Học AI (AI Gesture Camera)
- **Luật chơi:** Tương tác trực tiếp bằng cử chỉ cơ thể thông qua Camera máy tính.
- **Cách chơi:** Đứng trước Camera và đưa ngón tay trỏ ra. Di chuyển ngón tay trỏ trên màn hình để điều khiển con trỏ laser phát sáng cắt (chém) vào ô đáp án A hoặc B được treo ở 2 góc. 
- *Mẹo:* Nếu thiết bị không có camera, hệ thống tự động kích hoạt chế độ di chuột giả lập.

### Game 4: Đỉnh Cao Olympia (Quiz Climb)
- **Luật chơi:** Vượt qua 5 câu hỏi để leo lên đỉnh núi Olympia nhận cờ chiến thắng.
- **Cách chơi:** Mỗi câu trả lời đúng đưa nhân vật leo lên 1 bậc, trả lời sai bị lùi 1 bậc. Đặc biệt trước khi trả lời, bạn có thể kích hoạt **"Ngôi Sao Hy Vọng"** để nhân đôi điểm số nếu đúng (nhưng cũng bị phạt gấp đôi nếu chọn sai).

### Game 5: Đào Vàng Tri Thức (Gold Miner)
- **Luật chơi:** Móc cẩu gắp vàng dao động liên tục ở phía trên.
- **Cách chơi:** Chờ móc cẩu quay đến góc thích hợp hướng về phía cục vàng mang câu trả lời đúng nhất, click chuột để phóng móc. Móc gắp trúng vàng sẽ thu về và tính điểm. Né tránh các câu trả lời sai.

### Game 6: Bắn Cung Toán Học (Archery Math)
- **Luật chơi:** Trò chơi tích hợp vật lý quỹ đạo cung tên bay.
- **Cách chơi:** Nhấp giữ chuột vào cánh cung ở phía bên trái, kéo ngược về sau để lấy lực bắn và hướng góc cung, thả ra để bắn mũi tên bay trúng bia mang đáp án đúng ở bên phải. Chú ý tính toán độ rơi của mũi tên do trọng lực kéo xuống.

### Game 7: Ghép Đôi Thẻ Bài (Memory Match)
- **Luật chơi:** Bảng bài gồm 12 thẻ bài lật úp.
- **Cách chơi:** Nhấp chọn thẻ bài để lật mở. Nhiệm vụ của bạn là ghi nhớ vị trí và ghép cặp biểu thức Đại số ở cột trái với biểu thức Phân tích nhân tử tương ứng ở cột phải (Ví dụ: ghép `x² - 4` với `(x-2)(x+2)`).

### Game 8: Rùa Bay Toán Học (Flappy Math)
- **Luật chơi:** Chú rùa bay liên tục chịu sức hút của trọng lực.
- **Cách chơi:** Click chuột liên tục hoặc nhấn phím Space để rùa đập cánh bay lên cao, thả ra để rùa hạ xuống. Điều khiển rùa lách qua khe hẹp của cổng đáp án đúng để tiếp tục chặng bay. Tránh va chạm vào các bức tường đá.

---

## ⚙️ 3. Quản Lý & Tùy Biến Ứng Dụng (Dành Cho Giáo Viên)

### Cấu Hình Phòng Học (Sidebar bên trái)
- **Khối lớp:** Lựa chọn câu hỏi tương thích theo chuẩn bộ GD&ĐT các lớp 6, 7, 8 và 9.
- **Chủ đề:** Bộ lọc nhanh chuyển đổi giữa các chuyên đề Đại số & Số học hoặc Hình học.
- **Độ khó:** Điều chỉnh 3 cấp độ: Dễ (Nhận biết), Vừa (Thông hiểu), Khó (Vận dụng).
- **Âm thanh:** Công tắc bật/tắt toàn bộ hiệu ứng tiếng nhạc synthesizer trong game.

### Tự Biên Soạn & Quản Lý Câu Hỏi Tùy Chỉnh
1. Nhấp vào tab **Quản Lý Câu Hỏi** trên thanh Menu chính.
2. Ở bên trái, điền nội dung câu hỏi và 4 đáp án trắc nghiệm A, B, C, D của bài học hôm nay. Chọn đáp án chính xác nhất ở hộp thoại dưới cùng.
3. Nhấp **Lưu Câu Hỏi**. Câu hỏi tự thiết kế của thầy cô sẽ được lưu trực tiếp vào cơ sở dữ liệu trình duyệt và tự động trộn lẫn vào ngân hàng câu hỏi khi học sinh chơi game.
4. Ở bên phải là danh sách các câu hỏi tự tạo hiện có, thầy cô có thể click nút **Xóa** bất kỳ lúc nào nếu câu hỏi không dùng nữa.

### Xuất Bảng Điểm Học Sinh
1. Nhấp chọn tab **Bảng Xếp Hạng** ở Menu chính.
2. Thầy cô có thể theo dõi bảng điểm xếp hạng Top cao thủ học sinh chơi game.
3. Click nút **📥 Xuất Điểm (CSV)** để tải về bảng điểm của lớp.
4. File CSV tải về tương thích hoàn toàn với Microsoft Excel, hiển thị rõ nét chữ tiếng Việt có dấu hỗ trợ thầy cô nhập điểm vào sổ dễ dàng.
5. Click **Xóa Lịch Sử** để reset bảng điểm phục vụ cho buổi học hoặc lớp học tiếp theo.
