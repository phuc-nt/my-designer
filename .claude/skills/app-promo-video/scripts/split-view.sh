#!/usr/bin/env bash
# Two videos side by side in one file, for looking at layout and rhythm together: final | wireframe, 16:9 | 9:16,
# reference | ours. Each side is scaled to the same height; the sound comes from the left video; the file ends
# with the shorter one.
#   bash split-view.sh <left.mp4> <right.mp4> <out.mp4> [height=540]
set -euo pipefail
if [ $# -lt 3 ]; then
  echo "usage: split-view.sh <left.mp4> <right.mp4> <out.mp4> [height=540]" >&2
  exit 1
fi
L=$1; R=$2; OUT=$3; H=${4:-540}
for f in "$L" "$R"; do [ -f "$f" ] || { echo "split-view: $f not found" >&2; exit 1; }; done
AUDIO=()
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$L" | grep -q .; then
  AUDIO=(-map 0:a -c:a aac -b:a 160k)
fi
ffmpeg -hide_banner -v error -y -i "$L" -i "$R" \
  -filter_complex "[0:v]scale=-2:${H},setsar=1,fps=30[l];[1:v]scale=-2:${H},setsar=1,fps=30[r];[l][r]hstack=inputs=2:shortest=1,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]" \
  -map "[v]" "${AUDIO[@]}" -shortest -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=width,height:format=duration -of csv=p=0 "$OUT" | tr '\n' ' '
echo "→ $OUT"
