@echo off
title TRO CHOI AI LA TRIEU PHU - THAY SON SKL
chcp 65001 >nul
echo ========================================================
echo    TRÒ CHƠI: AI LÀ TRIỆU PHÚ - PHÁT TRIỂN BỞI THẦY SƠN SKL
echo ========================================================
echo.
echo [1/2] Đang khởi động máy chủ Web cục bộ...
start "" "http://localhost:8888"
python -m http.server 8888 2>nul || (
    echo [Lưu ý] Python chưa cài, tự động mở trực tiếp bằng trình duyệt...
    start "" "index.html"
)
pause

