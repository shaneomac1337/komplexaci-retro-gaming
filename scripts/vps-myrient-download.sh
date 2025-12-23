#!/bin/bash
# Download from Myrient directly on VPS
# Usage: ./vps-myrient-download.sh

set -e

DOWNLOAD_DIR="/root/r2-uploads/roms"
BIOS_DIR="/root/r2-uploads/bios"

# Myrient base URLs (No-Intro verified sets)
MYRIENT_BASE="https://myrient.erista.me/files/No-Intro"

# Console download functions
download_nes() {
    echo "=== Downloading NES (Nintendo Entertainment System) ==="
    mkdir -p "$DOWNLOAD_DIR/nes"
    cd "$DOWNLOAD_DIR/nes"
    wget -r -np -nH --cut-dirs=4 -R "index.html*" -e robots=off \
        "$MYRIENT_BASE/Nintendo%20-%20Nintendo%20Entertainment%20System%20%28Headered%29/" \
        --progress=bar:force 2>&1
}

download_snes() {
    echo "=== Downloading SNES (Super Nintendo) ==="
    mkdir -p "$DOWNLOAD_DIR/snes"
    cd "$DOWNLOAD_DIR/snes"
    wget -r -np -nH --cut-dirs=4 -R "index.html*" -e robots=off \
        "$MYRIENT_BASE/Nintendo%20-%20Super%20Nintendo%20Entertainment%20System/" \
        --progress=bar:force 2>&1
}

download_n64() {
    echo "=== Downloading N64 (Nintendo 64) ==="
    mkdir -p "$DOWNLOAD_DIR/n64"
    cd "$DOWNLOAD_DIR/n64"
    wget -r -np -nH --cut-dirs=4 -R "index.html*" -e robots=off \
        "$MYRIENT_BASE/Nintendo%20-%20Nintendo%2064%20%28ByteSwapped%29/" \
        --progress=bar:force 2>&1
}

download_gb() {
    echo "=== Downloading Game Boy ==="
    mkdir -p "$DOWNLOAD_DIR/gb"
    cd "$DOWNLOAD_DIR/gb"
    wget -r -np -nH --cut-dirs=4 -R "index.html*" -e robots=off \
        "$MYRIENT_BASE/Nintendo%20-%20Game%20Boy/" \
        --progress=bar:force 2>&1
}

download_gbc() {
    echo "=== Downloading Game Boy Color ==="
    mkdir -p "$DOWNLOAD_DIR/gbc"
    cd "$DOWNLOAD_DIR/gbc"
    wget -r -np -nH --cut-dirs=4 -R "index.html*" -e robots=off \
        "$MYRIENT_BASE/Nintendo%20-%20Game%20Boy%20Color/" \
        --progress=bar:force 2>&1
}

download_gba() {
    echo "=== Downloading Game Boy Advance ==="
    mkdir -p "$DOWNLOAD_DIR/gba"
    cd "$DOWNLOAD_DIR/gba"
    wget -r -np -nH --cut-dirs=4 -R "index.html*" -e robots=off \
        "$MYRIENT_BASE/Nintendo%20-%20Game%20Boy%20Advance/" \
        --progress=bar:force 2>&1
}

download_psx() {
    echo "=== Downloading PlayStation (Redump) ==="
    mkdir -p "$DOWNLOAD_DIR/psx"
    cd "$DOWNLOAD_DIR/psx"
    # PSX uses Redump, not No-Intro
    wget -r -np -nH --cut-dirs=3 -R "index.html*" -e robots=off \
        "https://myrient.erista.me/files/Redump/Sony%20-%20PlayStation/" \
        --progress=bar:force 2>&1
}

download_bios() {
    echo "=== Downloading BIOS files ==="
    mkdir -p "$BIOS_DIR"
    cd "$BIOS_DIR"

    # Note: You may need to source BIOS from other locations
    # PSX BIOS files needed: scph5500.bin, scph5501.bin, scph5502.bin
    echo "BIOS files need to be sourced separately."
    echo "Required for PSX: scph5500.bin, scph5501.bin, scph5502.bin"
}

show_menu() {
    echo "=== Myrient ROM Downloader ==="
    echo "Downloads will go to: $DOWNLOAD_DIR"
    echo ""
    echo "Select console to download:"
    echo "  1) NES"
    echo "  2) SNES"
    echo "  3) N64"
    echo "  4) Game Boy"
    echo "  5) Game Boy Color"
    echo "  6) Game Boy Advance"
    echo "  7) PlayStation"
    echo "  8) ALL Nintendo (1-6)"
    echo "  9) Download BIOS info"
    echo "  0) Exit"
    echo ""
    read -p "Choice: " choice

    case $choice in
        1) download_nes ;;
        2) download_snes ;;
        3) download_n64 ;;
        4) download_gb ;;
        5) download_gbc ;;
        6) download_gba ;;
        7) download_psx ;;
        8)
            download_nes
            download_snes
            download_n64
            download_gb
            download_gbc
            download_gba
            ;;
        9) download_bios ;;
        0) exit 0 ;;
        *) echo "Invalid choice" ;;
    esac
}

# Direct command line usage
case "${1:-menu}" in
    nes) download_nes ;;
    snes) download_snes ;;
    n64) download_n64 ;;
    gb) download_gb ;;
    gbc) download_gbc ;;
    gba) download_gba ;;
    psx) download_psx ;;
    all-nintendo)
        download_nes
        download_snes
        download_n64
        download_gb
        download_gbc
        download_gba
        ;;
    menu) show_menu ;;
    *)
        echo "Usage: $0 [nes|snes|n64|gb|gbc|gba|psx|all-nintendo|menu]"
        exit 1
        ;;
esac

echo ""
echo "=== Download Complete ==="
echo "Files are in: $DOWNLOAD_DIR"
echo ""
echo "Next: Upload to R2 with:"
echo "  ./vps-r2-upload.sh roms"
