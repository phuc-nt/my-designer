#!/bin/bash
# Ask the local VoiceStudio app whether every voice file still carries its synthetic-voice mark.
# Run it before mixing; a file without the mark must not go into a video. Exit 1 if any lacks it.
#   bash scripts/check-watermark.sh
cd "$(dirname "$0")/.." || exit 2
bad=0
for f in assets/voice/*.wav; do
  [ -f "$f" ] || { echo "no voice files in assets/voice"; exit 2; }
  out=$(curl -s -m 60 -F "file=@$f" http://127.0.0.1:3900/watermark/detect)
  echo "$f $out"
  echo "$out" | grep -q '"is_watermarked": *true' || bad=1
done
[ "$bad" = 0 ] && echo "watermark OK" || echo "FAILED: a voice file does not report is_watermarked: true"
exit "$bad"
