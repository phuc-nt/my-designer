// Shared helpers: compare a script with what whisper heard, and put script words on the
// heard timings. No npm dependencies.

// Lowercase, NFC, punctuation stripped; tokens that are only punctuation disappear.
export const norm = (t) => t.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
export const tokens = (text) => text.split(/\s+/).filter((t) => norm(t));
// norm without tone and vowel marks: whisper gets Vietnamese tones wrong far more often
// than a voice drops a word, so words are compared on their bare letters.
export const fold = (t) => norm(t).normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");

// Longest-common-subsequence table of two token lists.
function lcsTable(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  return dp;
}

// 2·LCS / (|a| + |b|): 1 means the same word sequence.
export function ratio(a, b) {
  if (!a.length && !b.length) return 1;
  return (2 * lcsTable(a, b)[0][0]) / (a.length + b.length);
}

// Spans [i1, i2, j1, j2, equal]: runs of matching tokens and the gaps between them.
export function opcodes(a, b) {
  const dp = lcsTable(a, b);
  const pairs = [];
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] === b[j]) (pairs.push([i, j]), i++, j++);
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const out = [];
  let i = 0;
  let j = 0;
  for (const [pi, pj] of [...pairs, [a.length, b.length]]) {
    if (pi > i || pj > j) out.push([i, pi, j, pj, false]);
    if (pi < a.length) {
      const last = out[out.length - 1];
      if (last && last[4] && last[1] === pi && last[3] === pj) (last[1]++, last[3]++);
      else out.push([pi, pi + 1, pj, pj + 1, true]);
    }
    i = pi + 1;
    j = pj + 1;
  }
  return out;
}

// Whisper sometimes squeezes a run of words into a few hundredths of a second.
export function degenerate(heard) {
  for (let i = 0; i + 4 < heard.length; i++)
    if (heard[i + 4].start - heard[i].start < 0.15) return true;
  return false;
}

// Script words [{text,start,end}] on the timings of the heard words [{text,start,end}].
// `span` = [from, to] seconds of speech, used when the heard timings cannot be trusted.
export function alignWords(scriptText, heard, span) {
  const toks = tokens(scriptText);
  const weight = (t) => t.length + 2;
  const spread = (list, s, e) => {
    const total = list.reduce((n, t) => n + weight(t), 0);
    let at = s;
    return list.map((t) => {
      const d = ((e - s) * weight(t)) / total;
      const w = { text: t, start: at, end: at + d };
      at += d;
      return w;
    });
  };
  if (!heard.length || degenerate(heard)) return spread(toks, span[0], span[1]);
  const a = toks.map(fold);
  const b = heard.map((w) => fold(w.text));
  const out = [];
  for (const [i1, i2, j1, j2, equal] of opcodes(a, b)) {
    if (i2 === i1) continue; // whisper heard extra words
    if (equal) {
      for (let k = 0; k < i2 - i1; k++)
        out.push({ text: toks[i1 + k], start: heard[j1 + k].start, end: heard[j1 + k].end });
    } else if (j2 > j1) {
      out.push(...spread(toks.slice(i1, i2), heard[j1].start, heard[j2 - 1].end));
    } else {
      const s = j1 > 0 ? heard[j1 - 1].end : span[0];
      const e = j1 < heard.length ? heard[j1].start : span[1];
      out.push(...spread(toks.slice(i1, i2), s, Math.max(e, s + 0.05 * (i2 - i1))));
    }
  }
  // starts never go backwards, every word has some length
  for (let k = 0; k < out.length; k++) {
    if (k && out[k].start < out[k - 1].start) out[k].start = out[k - 1].start;
    if (out[k].end <= out[k].start) out[k].end = out[k].start + 0.02;
  }
  return out;
}

// Spoken lines of SCRIPT.md by two-digit frame id: the 4-space-indented lines under
// each "## Line … (Frame N)" heading, joined with a space.
export function scriptLines(md) {
  const out = {};
  let id = null;
  for (const line of md.split("\n")) {
    const h = line.match(/^##\s.*\(Frame\s+(\d+)\)/);
    if (h) (id = h[1].padStart(2, "0")), (out[id] = []);
    else if (id && /^ {4}\S/.test(line)) out[id].push(line.trim());
  }
  for (const k of Object.keys(out)) out[k] = out[k].join(" ");
  return out;
}
