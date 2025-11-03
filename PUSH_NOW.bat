@echo off
echo ====================================
echo رفع المشروع إلى GitHub
echo ====================================
echo.

cd /d "%~dp0"

echo [1/2] التحقق من حالة Git...
git status

echo.
echo [2/2] رفع المشروع إلى GitHub...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✓ تم الرفع بنجاح!
    echo.
    echo الآن يمكنك:
    echo 1. الذهاب إلى https://app.netlify.com
    echo 2. اضغط "Add new site" ثم "Import an existing project"
    echo 3. اختر GitHub واربط repository: mohammedhayde/voice-chat-pwa
    echo 4. أضف المتغيرات البيئية المطلوبة
    echo 5. اضغط Deploy!
) else (
    echo × فشل الرفع!
    echo.
    echo جرب:
    echo 1. افتح VS Code في هذا المجلد
    echo 2. اضغط Ctrl+Shift+G
    echo 3. اضغط زر Push ↑
)

echo.
pause
