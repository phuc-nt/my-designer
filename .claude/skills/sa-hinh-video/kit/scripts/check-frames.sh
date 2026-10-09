#!/bin/bash
# Static checks on the built overlay frames. Prints the files that break a rule; exit 1 if any does.
#   bash scripts/check-frames.sh
cd "$(dirname "$0")/.." || exit 2
F=(compositions/frames/*.html)
[ -f "${F[0]}" ] || { echo "no frames in compositions/frames"; exit 2; }
bad=0
rule() { # rule <what is wrong> <output of the grep>
  if [ -n "$2" ]; then bad=1; echo "$1:"; echo "$2" | sed 's/^/  /'; fi
}
rule "does not start with a bare <template>" "$(grep -L '^<template' "${F[@]}")"
rule "audio tag, randomness, clock, yoyo, keyframes or repeat" "$(grep -l '<audio\|Math\.random\|Date\.now\|yoyo\|@keyframes\|repeat: *-\?[0-9]' "${F[@]}")"
rule "no Vietnamese font (assets/fonts/*-VN.woff2)" "$(grep -L 'assets/fonts/[A-Za-z]*-VN\.woff2' "${F[@]}")"
rule "path outside the project root, or an id selector starting with a digit" "$(grep -l "\.\./assets\|querySelector[A-Za-z]*(['\"\`]#[0-9]" "${F[@]}")"
rule 'visibility: "visible" (use "inherit")' "$(grep -l "visibility: *['\"]visible" "${F[@]}")"
rule "NaN, undefined or an unstamped prefix mark" "$(grep -c 'NaN\|undefined\|§' "${F[@]}" | grep -v ':0$')"
rule "a tween placed before the start of the frame" "$(grep -n ', -[0-9.]*);$' "${F[@]}" | head -20)"
[ "$bad" = 0 ] && echo "frames OK: ${#F[@]} files"
exit "$bad"
