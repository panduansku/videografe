@echo off
setlocal
cd /d "%~dp0"
title ShotFlow - Build Installer Windows
echo ============================================
echo   ShotFlow - membuat installer .exe
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [GAGAL] Node.js belum terpasang.
  echo Unduh versi LTS dari https://nodejs.org lalu jalankan file ini lagi.
  pause
  exit /b 1
)

echo [1/3] Memasang dependensi (butuh internet, hanya sekali)...
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail

echo.
echo [2/3] Mengecek tipe kode...
call npm run typecheck
if errorlevel 1 (
  echo [PERINGATAN] Ada peringatan tipe. Build tetap dilanjutkan.
)

echo.
echo [3/3] Membuat installer...
call npm run dist:win
if errorlevel 1 goto :fail

echo.
echo ============================================
echo   SELESAI! Installer ada di folder "release":
echo     ShotFlow Setup x.y.z.exe   (installer)
echo     ShotFlow x.y.z.exe         (portable, tanpa install)
echo ============================================
start "" "%~dp0release"
pause
exit /b 0

:fail
echo.
echo [GAGAL] Build berhenti karena error di atas. Kirim tangkapan layarnya agar bisa diperbaiki.
pause
exit /b 1
