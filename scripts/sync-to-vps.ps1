# Sync files to VPS and upload to R2
# Usage: .\sync-to-vps.ps1 -Type roms -LocalPath "D:\ROMs\NES"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("roms", "bios", "covers")]
    [string]$Type,

    [Parameter(Mandatory=$true)]
    [string]$LocalPath,

    [string]$VPS = "root@komplexaci.cz",

    [switch]$UploadAfterSync
)

$RemotePath = "/root/r2-uploads/$Type"

Write-Host "=== Komplexaci VPS Sync ===" -ForegroundColor Cyan
Write-Host "Type: $Type"
Write-Host "Local: $LocalPath"
Write-Host "Remote: ${VPS}:${RemotePath}"
Write-Host ""

# Check if local path exists
if (-not (Test-Path $LocalPath)) {
    Write-Host "Error: Local path does not exist: $LocalPath" -ForegroundColor Red
    exit 1
}

# Sync using rsync (requires WSL or Git Bash)
Write-Host "Syncing files to VPS..." -ForegroundColor Yellow

# Convert Windows path to Unix-style for rsync
$UnixPath = $LocalPath -replace '\\', '/' -replace '^([A-Z]):', '/mnt/$1'.ToLower()

# Try rsync first (faster, requires WSL)
$rsyncAvailable = Get-Command rsync -ErrorAction SilentlyContinue

if ($rsyncAvailable) {
    rsync -avz --progress "$LocalPath/" "${VPS}:${RemotePath}/"
} else {
    # Fallback to scp
    Write-Host "rsync not found, using scp..." -ForegroundColor Yellow
    scp -r "$LocalPath\*" "${VPS}:${RemotePath}/"
}

Write-Host ""
Write-Host "Sync complete!" -ForegroundColor Green

if ($UploadAfterSync) {
    Write-Host ""
    Write-Host "Starting R2 upload on VPS..." -ForegroundColor Yellow
    ssh $VPS "bash /root/r2-uploads/vps-r2-upload.sh $Type"
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
Write-Host "Files are now on VPS at: ${RemotePath}"
Write-Host ""
Write-Host "To upload to R2, run on VPS:"
Write-Host "  ssh $VPS"
Write-Host "  ./r2-uploads/vps-r2-upload.sh $Type"
