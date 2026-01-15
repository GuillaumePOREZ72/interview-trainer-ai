#!/bin/bash

# Simple script to view logs without Node.js dependencies

# Get current date
TODAY=$(date +%Y-%m-%d)
LOG_FILE="/home2/kuwa6817/interview-trainer-ai/backend/logs/app-$TODAY.log"

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found: $LOG_FILE"
    echo "📁 Creating logs directory..."
    mkdir -p /home2/kuwa6817/interview-trainer-ai/backend/logs
    echo "✅ Directory created. Restart the server to generate logs."
    exit 1
fi

# Parse arguments
FILTER=""
TAIL=100

while [[ $# -gt 0 ]]; do
    case $1 in
        --upload)
            FILTER="upload|Upload|multer|Multer|📤|📦|📁|📝|🔍"
            shift
            ;;
        --error)
            FILTER="error|Error|ERROR|❌|failed|Failed|FAIL"
            shift
            ;;
        --tail)
            TAIL="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

echo ""
echo "📊 Viewing logs from: $LOG_FILE"
echo "   Filter: ${FILTER:-all}"
echo "   Showing last $TAIL lines"
echo ""

# Show logs
if [ -z "$FILTER" ]; then
    tail -n "$TAIL" "$LOG_FILE"
else
    tail -n 1000 "$LOG_FILE" | grep -iE "$FILTER" | tail -n "$TAIL"
fi

echo ""
echo "✅ Done"
