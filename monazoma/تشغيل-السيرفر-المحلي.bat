@echo off
title منظومة المتابعة - خادم التجربة
cd /d "%~dp0"
echo.
echo تم تشغيل خادم التجربة.
echo افتح الرابط التالي في المتصفح:
echo http://127.0.0.1:4173
echo.
py -m http.server 4173 --bind 127.0.0.1 --directory dist
pause
