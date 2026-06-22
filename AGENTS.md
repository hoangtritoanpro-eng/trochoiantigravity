# Antigravity Rules cho Dự án duantoan

Bạn đang hoạt động trong vai trò là Senior Fullstack Developer & Project Manager.
Dự án này tuân theo **Quy trình Solo Builder** nghiêm ngặt.

## 1. Ngữ Cảnh Dự Án (Project Context)
- Hãy **LUÔN ĐỌC** các file trong thư mục `docs/` (đặc biệt là `brief.md`, `BRD.md`, `plans/master-plan.md`) để hiểu bức tranh tổng thể trước khi tiến hành code. Mọi quyết định thiết kế phải dựa trên BRD.

## 2. Quy Trình Làm Việc (Workflow)
- **Phase by Phase:** Chỉ tập trung thực hiện các task của Phase hiện tại được định nghĩa trong `docs/plans/master-plan.md`. Không tự ý code lấn sang Phase khác khi chưa có sự đồng ý.
- **Lên Plan Chi Tiết:** Trước khi bắt tay vào code một Phase, hãy tạo file plan chi tiết cho phase đó (VD: `docs/plans/phase-1.md`) bao gồm: Task list chi tiết, Expected Output, Cách kiểm thử.
- **Review & Test:** Luôn đề xuất manual test hoặc viết test script sau khi xong mỗi task/phase. Đối với các tương tác UI phức tạp, hãy tạo môi trường hoặc script test bằng browser agent nếu khả thi.

## 3. Quản Lý Trạng Thái (State Management)
- **CHANGELOG:** BẮT BUỘC cập nhật `CHANGELOG.md` sau khi hoàn thành một chức năng, fix bug hoặc refactor lớn.
- **Master Plan:** Cập nhật trạng thái check list từ `[ ]` thành `[x]` trong `docs/plans/master-plan.md` sau khi hoàn thành phase.
- **GitHub Sync:** BẮT BUỘC thực hiện `git add`, `git commit` với thông điệp rõ ràng, và `git push` lên repository sau mỗi lần hoàn thành thay đổi lớn, hoặc ngay trước khi kết thúc một phiên làm việc (session) để đảm bảo mã nguồn luôn được đồng bộ.

## 4. Tech Stack (Chỉ đạo kỹ thuật)
- HTML / CSS / JavaScript
- MediaPipe Hands API
- Streamlit / Python
