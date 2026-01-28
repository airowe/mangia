#!/bin/bash
# Check if codebase-context.md needs regeneration

SNAPSHOT_FILE=".claude/codebase-context.snapshot"
CONTEXT_FILE=".claude/codebase-context.md"

# If no context file exists, it's stale
if [ ! -f "$CONTEXT_FILE" ]; then
    echo "STALE: No context file found"
    exit 1
fi

# If no snapshot exists, assume stale
if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo "STALE: No snapshot file found"
    exit 1
fi

# Get current directory structure hash (top 3 levels, dirs only)
CURRENT_TREE=$(find . -maxdepth 3 -type d -not -path '*/\.*' -not -path './node_modules*' -not -path './dist*' -not -path './build*' -not -path './.next*' 2>/dev/null | sort | md5 -q)

# Get stored tree hash
STORED_TREE=$(grep "^tree:" "$SNAPSHOT_FILE" 2>/dev/null | cut -d' ' -f2)

if [ "$CURRENT_TREE" != "$STORED_TREE" ]; then
    echo "STALE: Directory structure changed"
    exit 1
fi

# Check key config files
for CONFIG in package.json tsconfig.json app.json; do
    if [ -f "$CONFIG" ]; then
        CURRENT_HASH=$(md5 -q "$CONFIG" 2>/dev/null)
        STORED_HASH=$(grep "^$CONFIG:" "$SNAPSHOT_FILE" 2>/dev/null | cut -d' ' -f2)
        if [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
            echo "STALE: $CONFIG changed"
            exit 1
        fi
    fi
done

# Check age (warn if older than 7 days)
GENERATED=$(grep "^generated:" "$SNAPSHOT_FILE" 2>/dev/null | cut -d' ' -f2)
if [ -n "$GENERATED" ]; then
    NOW=$(date +%s)
    AGE=$((NOW - GENERATED))
    DAYS=$((AGE / 86400))
    if [ $DAYS -gt 7 ]; then
        echo "STALE: Context is $DAYS days old (recommend regenerating weekly)"
        exit 1
    fi
fi

echo "FRESH: Context is up to date"
exit 0
