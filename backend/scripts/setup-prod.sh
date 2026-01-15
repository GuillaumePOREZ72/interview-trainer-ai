#!/bin/bash

# Setup script for production deployment on O2Switch

echo "🚀 Setting up Interview Trainer AI Backend"
echo ""

PROJECT_DIR="/home2/kuwa6817/interview-trainer-ai"
BACKEND_DIR="$PROJECT_DIR/backend"

cd "$PROJECT_DIR" || exit 1

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p "$BACKEND_DIR/logs"
mkdir -p "$BACKEND_DIR/uploads"
echo "✅ Directories created"

# Set permissions
echo ""
echo "🔒 Setting permissions..."
chmod 755 "$BACKEND_DIR/logs"
chmod 755 "$BACKEND_DIR/uploads"
echo "✅ Permissions set"

# Make scripts executable
echo ""
echo "🔧 Making scripts executable..."
chmod +x "$BACKEND_DIR/scripts/view-logs.sh"
echo "✅ Scripts executable"

# Build the backend
echo ""
echo "🔨 Building backend..."
cd "$BACKEND_DIR"
npm install
npm run build
echo "✅ Build complete"

# Check if server is running
echo ""
echo "🔍 Checking server status..."
if pm2 list | grep -q "interview-trainer-ai"; then
    echo "✅ Server is running with PM2"
    echo "   Restarting..."
    pm2 restart interview-trainer-ai || pm2 restart all
else
    echo "⚠️  Server not found in PM2"
    echo "   Please start your server manually"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Test the image upload on: https://gpdev.org"
echo "   2. View logs with: cd backend && ./scripts/view-logs.sh --upload"
echo "   3. Or use: cd backend && ./scripts/view-logs.sh --error"
