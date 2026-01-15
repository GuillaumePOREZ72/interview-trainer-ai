#!/bin/bash

# Ultra-simple log viewer for O2Switch
# No dependencies, just basic Unix commands

PROJECT_DIR="/home2/kuwa6817/interview-trainer-ai"
LOGS_DIR="$PROJECT_DIR/backend/logs"

# Find the most recent log file
if [ -d "$LOGS_DIR" ]; then
    LOG_FILE=$(ls -t "$LOGS_DIR"/*.log 2>/dev/null | head -n 1)
else
    echo "❌ Logs directory not found: $LOGS_DIR"
    exit 1
fi

if [ -z "$LOG_FILE" ]; then
    echo "❌ No log files found in: $LOGS_DIR"
    exit 1
fi

echo "📊 Viewing: $LOG_FILE"
echo ""

# Parse arguments
FILTER=""
TAIL=100

for arg in "$@"; do
    case "$arg" in
        --upload)
            FILTER="upload|Upload|multer|Multer|📤|📦|📁|📝|🔍"
            ;;
        --error)
            FILTER="error|Error|ERROR|❌|failed|Failed|FAIL"
            ;;
        --tail=*)
            TAIL="${arg#--tail=}"
            ;;
    esac
done

# Show logs
if [ -z "$FILTER" ]; then
    tail -n "$TAIL" "$LOG_FILE"
else
    tail -n 1000 "$LOG_FILE" | grep -iE "$FILTER" | tail -n "$TAIL"
fi
