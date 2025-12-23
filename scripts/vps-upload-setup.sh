#!/bin/bash
# VPS Setup Script for R2 Uploads
# Run this ON the VPS: ssh root@komplexaci.cz 'bash -s' < scripts/vps-upload-setup.sh

set -e

echo "=== Komplexáci R2 Upload Setup ==="

# Install rclone (works great with R2's S3-compatible API)
if ! command -v rclone &> /dev/null; then
    echo "Installing rclone..."
    curl https://rclone.org/install.sh | bash
else
    echo "rclone already installed"
fi

# Create upload directory
mkdir -p /root/r2-uploads/{roms,bios,covers}

echo ""
echo "=== Next Steps ==="
echo "1. Configure rclone with your R2 credentials:"
echo "   rclone config"
echo ""
echo "   Choose: n (new remote)"
echo "   Name: r2"
echo "   Storage: s3"
echo "   Provider: Cloudflare"
echo "   Access Key ID: <your R2 access key>"
echo "   Secret Access Key: <your R2 secret key>"
echo "   Endpoint: https://<account_id>.r2.cloudflarestorage.com"
echo ""
echo "2. Test connection:"
echo "   rclone lsd r2:"
echo ""
echo "Setup complete!"
