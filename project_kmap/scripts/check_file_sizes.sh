#!/usr/bin/env bash
# Liệt kê các file nguồn vượt ngưỡng số dòng (mặc định 300).
set -euo pipefail
ROOT="${1:-.}"
LIMIT="${2:-300}"

found=0
while IFS= read -r f; do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt "$LIMIT" ]; then
    printf '%6d  %s\n' "$lines" "$f"
    found=1
  fi
done < <(find "$ROOT" \
  -path '*/node_modules' -prune -o \
  -path '*/dist' -prune -o \
  -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) -print)

if [ "$found" -eq 0 ]; then
  echo "OK — không có file nào vượt $LIMIT dòng."
else
  exit 1
fi
