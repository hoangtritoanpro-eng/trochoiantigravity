@echo off
title Thay Toan A.I - Game Center
echo ==============================================================
echo       BO GAME TRI TUE THEO DOI MOI - THAY TOAN A.I
echo ==============================================================
echo.
echo Dang khoi dong may chu local...
echo Vui long mo trinh duyet o dia chi: http://localhost:8000
echo.
echo Nhan Ctrl + C (hoac close cua so nay) de dung may chu.
echo ==============================================================
echo.

:: Automatically open browser at localhost:8000
start http://localhost:8000

:: Start python web server
python -m http.server 8000

pause
