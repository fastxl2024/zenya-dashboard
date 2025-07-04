#!/bin/bash

# 📁 Instellingen
#ZENYA_DIR="/opt/zenya"
ZENYA_DIR="/Users/stephan/Documents/GitHub/zenya-dashboard" 
OUTPUT_DIR="$HOME/zenya-releases"
VERSION="$1"
RELEASE_DATE=$(date +%F)

if [ -z "$VERSION" ]; then
  echo "❌ Gebruik: ./build_release.sh 1.3.0"
  exit 1
fi

# 🔤 Changelog invoer (meerregelig, afsluiten met CTRL+D)
echo "📋 Typ je changelog (meerdere regels). Druk op CTRL+D als je klaar bent:"
CHANGELOG_INPUT=$(cat)

# 📁 Outputmap aanmaken
mkdir -p "$OUTPUT_DIR"

# 🧹 Tijdelijke map om bestanden te kopiëren
TMP_DIR=$(mktemp -d)
cp -r "$ZENYA_DIR" "$TMP_DIR/zenya"

# 🧽 Ongewenste bestanden verwijderen
cd "$TMP_DIR/zenya"
rm -rf .git .github node_modules docker-compose.yml Dockerfile README.md *.md

# 📦 Archief maken
cd "$TMP_DIR"
tar -czf "$OUTPUT_DIR/zenya-$VERSION.tar.gz" zenya

# 📄 version.json genereren
cat <<EOF > "$OUTPUT_DIR/version.json"
{
  "version": "$VERSION",
  "release_date": "$RELEASE_DATE",
  "download_url": "https://github.com/fastxl2024/zenya-dashboard/releases/download/$VERSION/zenya-$VERSION.tar.gz",
  "changelog": "https://github.com/fastxl2024/zenya-dashboard/releases/download/$VERSION/changelog.md"
}
EOF

# 📄 changelog.md genereren
echo -e "## Wijzigingen in versie $VERSION\n\n$CHANGELOG_INPUT" > "$OUTPUT_DIR/changelog.md"

# ✅ Klaar
echo ""
echo "✅ Release-bestanden aangemaakt in: $OUTPUT_DIR"
echo " - zenya-$VERSION.tar.gz"
echo " - version.json"
echo " - changelog.md"

# 🧹 Opschonen
rm -rf "$TMP_DIR"