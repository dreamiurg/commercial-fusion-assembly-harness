#!/bin/sh
# POSIX counterpart of render_manual.ps1: print an HTML manual to PDF with headless Chrome, Edge, or Chromium.
# Usage: render_manual.sh [html] [output.pdf] [profile-dir]   (set CHROME_PATH to pick a browser)
set -eu

html=${1:-tmp/pdfs/assembly_manual.html}
pdf=${2:-output/pdf/Assembly_Manual_RENDERED.pdf}
profile=${3:-tmp/pdfs/browser_profile_manual}

browser=${CHROME_PATH:-}
if [ -z "$browser" ]; then
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    google-chrome google-chrome-stable chromium chromium-browser microsoft-edge; do
    if command -v "$candidate" >/dev/null 2>&1; then browser=$candidate; break; fi
  done
fi
[ -n "$browser" ] || { echo "No Chrome, Edge, or Chromium found; set CHROME_PATH." >&2; exit 1; }
[ -f "$html" ] || { echo "HTML source not found: $html" >&2; exit 1; }

mkdir -p "$(dirname "$pdf")" "$profile"
abs() { echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; }
html_abs=$(abs "$html")
pdf_abs=$(abs "$pdf")
profile_abs=$(cd "$profile" && pwd)
rm -f "$pdf_abs"

"$browser" --headless --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw \
  "--user-data-dir=$profile_abs" "--print-to-pdf=$pdf_abs" "file://$html_abs" &
pid=$!
# Headless Chrome on macOS can write the PDF and then not exit, so wait for the file, not the process.
timeout=${RENDER_TIMEOUT:-60}
while [ ! -s "$pdf_abs" ] && kill -0 "$pid" 2>/dev/null && [ "$timeout" -gt 0 ]; do
  sleep 1
  timeout=$((timeout - 1))
done
sleep 1
kill "$pid" 2>/dev/null || true
wait "$pid" 2>/dev/null || true
[ -s "$pdf_abs" ] || { echo "Browser did not create $pdf_abs" >&2; exit 1; }
ls -l "$pdf_abs"
