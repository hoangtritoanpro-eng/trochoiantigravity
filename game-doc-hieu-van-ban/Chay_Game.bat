@echo off
title DOC HIEU CUNG AI (THPT) + Google NotebookLM Bridge
chcp 65001 >nul
cd /d "%~dp0"
echo ====================================================================
echo    ĐỌC HIỂU CÙNG AI (THPT) - Tích hợp Google NotebookLM Studio
echo ====================================================================
echo.
echo Đang khởi động máy chủ & cầu nối NotebookLM tại http://localhost:8899
echo (Đóng cửa sổ này để tắt trò chơi)
echo.
start "" "http://localhost:8899"
python notebooklm_bridge.py 2>nul || python -m http.server 8899 2>nul || (
    echo [Lưu ý] Máy chưa cài Python - mở trực tiếp file index.html.
    start "" "index.html"
    pause
)
