@echo off
REM One-command VPS setup for Komplexaci Retro Gaming
REM Run this from your local machine

set VPS=root@komplexaci.cz

echo === Setting up VPS for Komplexaci Retro Gaming ===
echo.

echo [1/4] Creating directories on VPS...
ssh %VPS% "mkdir -p /root/r2-uploads/{roms,bios,covers} /root/r2-uploads/roms/{nes,snes,n64,gb,gbc,gba,psx}"

echo [2/4] Copying scripts to VPS...
scp scripts/vps-r2-upload.sh %VPS%:/root/r2-uploads/
scp scripts/vps-myrient-download.sh %VPS%:/root/r2-uploads/

echo [3/4] Making scripts executable...
ssh %VPS% "chmod +x /root/r2-uploads/*.sh"

echo [4/4] Installing rclone on VPS...
ssh %VPS% "which rclone || curl https://rclone.org/install.sh | bash"

echo.
echo === Setup Complete! ===
echo.
echo Next steps:
echo   1. SSH to VPS:  ssh %VPS%
echo   2. Configure R2: rclone config
echo   3. Download ROMs: ./r2-uploads/vps-myrient-download.sh menu
echo   4. Upload to R2:  ./r2-uploads/vps-r2-upload.sh roms
echo.
pause
