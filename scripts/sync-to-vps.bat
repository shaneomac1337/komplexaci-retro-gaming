@echo off
REM Quick sync to VPS
REM Usage: sync-to-vps.bat [roms|bios|covers] "local\path"

setlocal

set TYPE=%1
set LOCAL_PATH=%2
set VPS=root@komplexaci.cz
set REMOTE_PATH=/root/r2-uploads/%TYPE%

if "%TYPE%"=="" (
    echo Usage: sync-to-vps.bat [roms^|bios^|covers] "local\path"
    echo Example: sync-to-vps.bat roms "D:\Games\ROMs\NES"
    exit /b 1
)

if "%LOCAL_PATH%"=="" (
    echo Error: Please specify local path
    exit /b 1
)

echo === Komplexaci VPS Sync ===
echo Type: %TYPE%
echo Local: %LOCAL_PATH%
echo Remote: %VPS%:%REMOTE_PATH%
echo.

echo Syncing files to VPS...
scp -r "%LOCAL_PATH%\*" "%VPS%:%REMOTE_PATH%/"

echo.
echo Sync complete!
echo.
echo To upload to R2, connect to VPS and run:
echo   ssh %VPS%
echo   ./r2-uploads/vps-r2-upload.sh %TYPE%

endlocal
