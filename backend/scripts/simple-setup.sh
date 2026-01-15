#!/bin/bash

# Simple setup script for O2Switch

echo "🚀 Setup Interview Trainer AI Backend"
echo ""

PROJECT_DIR="/home2/kuwa6817/interview-trainer-ai"
BACKEND_DIR="$PROJECT_DIR/backend"

cd "$PROJECT_DIR" || exit 1

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p "$BACKEND_DIR/logs"
mkdir -p "$BACKEND_DIR/uploads"

# Set permissions
echo "🔒 Setting permissions..."
chmod 755 "$BACKEND_DIR/logs"
chmod 755 "$BACKEND_DIR/uploads"

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x "$BACKEND_DIR/scripts/simple-view-logs.sh"

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Check git status: git status"
echo "   2. Pull latest changes: git pull origin main"
echo "   3. Check if backend build is needed (npm run build in backend/)"
echo "   4. Restart your server using your current method"
echo "   5. Test image upload on: https://gpdev.org"
echo "   6. View logs with: cd $BACKEND_DIR && ./scripts/simple-view-logs.sh --upload"
