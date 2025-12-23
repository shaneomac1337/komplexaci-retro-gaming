#!/bin/bash
# R2 Upload Script - Run on VPS
# Usage: ./vps-r2-upload.sh [roms|bios|covers|all]

set -e

R2_BUCKET="komplexaci-retro"  # Change to your bucket name
UPLOAD_DIR="/root/r2-uploads"

upload_folder() {
    local folder=$1
    local r2_path=$2

    if [ -d "$UPLOAD_DIR/$folder" ] && [ "$(ls -A $UPLOAD_DIR/$folder 2>/dev/null)" ]; then
        echo "Uploading $folder to R2..."
        rclone sync "$UPLOAD_DIR/$folder" "r2:$R2_BUCKET/$r2_path" \
            --progress \
            --transfers 8 \
            --checkers 16 \
            --s3-chunk-size 64M \
            --s3-upload-concurrency 4
        echo "$folder upload complete!"
    else
        echo "No files in $UPLOAD_DIR/$folder"
    fi
}

case "${1:-all}" in
    roms)
        upload_folder "roms" "roms"
        ;;
    bios)
        upload_folder "bios" "bios"
        ;;
    covers)
        upload_folder "covers" "covers"
        ;;
    all)
        upload_folder "roms" "roms"
        upload_folder "bios" "bios"
        upload_folder "covers" "covers"
        ;;
    *)
        echo "Usage: $0 [roms|bios|covers|all]"
        exit 1
        ;;
esac

echo ""
echo "=== Upload Summary ==="
rclone size "r2:$R2_BUCKET" 2>/dev/null || echo "Could not get bucket size"
