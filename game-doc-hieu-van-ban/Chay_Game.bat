@echo off
title DOC HIEU CUNG AI - Game danh gia nang luc doc hieu
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================================
echo    ĐỌC HIỂU CÙNG AI - Game đánh giá năng lực đọc hiểu
echo ========================================================
echo.
echo Đang khởi động... Trình duyệt sẽ tự mở tại http://localhost:8899
echo (Đóng cửa sổ này để tắt trò chơi)
echo.
start "" "http://localhost:8899"
python -m http.server 8899 2>nul || (
    echo [Lưu ý] Máy chưa cài Python - mở trực tiếp file index.html.
    echo Khi mở trực tiếp, chức năng đọc file PDF có thể bị hạn chế.
    start "" "index.html"
    pause
)
