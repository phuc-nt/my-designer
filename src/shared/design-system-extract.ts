// Derive a portable design-system folder (manifest.json + DESIGN.md +
// tokens.css) from a codebase: CSS/SCSS custom properties, a Tailwind config
// (parsed with regexes, never evaluated) and an existing DESIGN.md. The result
// compiles through `compileFolderPackage` like a hand-written folder.
import { parseTokensCss, slugify, type FolderPackage } from './design-system-folder';

export interface ExtractSource { path: string; content: string }
export interface ExtractOptions { id?: string; name?: string }
export interface ExtractResult {
  folder: FolderPackage;
  /** Canonical tokens written to tokens.css (`--bg`, `--fg`, `--accent`, `--font-display`, …). */
  tokens: Record<string, string>;
  /** Every raw token found, keyed by its source name, before mapping. */
  discovered: Record<string, string>;
  /** Which files contributed. */
  sources: string[];
  /** Canonical tokens that no source provided; `compileFolderPackage` reports the required ones as errors. */
  missing: string[];
}

const CSS_FILE = /\.(css|scss|less|pcss)$/i;
const TAILWIND_FILE = /(^|\/)tailwind\.config\.(js|cjs|mjs|ts|cts|mts)$/i;
const DESIGN_FILE = /(^|\/)DESIGN\.md$/;
/** Files `extractDesignSystem` reads; walkers use it to skip everything else. */
export const isDesignSource = (path: string) => CSS_FILE.test(path) || TAILWIND_FILE.test(path) || DESIGN_FILE.test(path);

/** Parse a JS object literal region (`{ … }` after `key:`) into flat `prefix-sub` → string entries without evaluating code. */
function objectEntries(source: string, key: string): Record<string, string> {
  const out: Record<string, string> = {};
  const start = new RegExp(`(?:^|[\\s,{])${key}\\s*:\\s*\\{`, 'm').exec(source);
  if (!start) return out;
  let depth = 0, i = start.index + start[0].length - 1, end = -1;
  for (; i < source.length; i++) { const ch = source[i]; if (ch === '{') depth++; else if (ch === '}' && --depth === 0) { end = i; break; } }
  if (end < 0) return out;
  const body = source.slice(start.index + start[0].length, end);
  const walk = (text: string, prefix: string) => {
    const entry = /(?:^|[\s,{])(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_$-]+))\s*:\s*/g;
    let match: RegExpExecArray | null;
    while ((match = entry.exec(text))) {
      const name = match[1] ?? match[2] ?? match[3], rest = text.slice(entry.lastIndex);
      if (rest.startsWith('{')) {
        let d = 0, j = 0; for (; j < rest.length; j++) { if (rest[j] === '{') d++; else if (rest[j] === '}' && --d === 0) break; }
        walk(rest.slice(1, j), prefix ? `${prefix}-${name}` : name); entry.lastIndex += j + 1;
      } else {
        const value = /^(?:'([^']*)'|"([^"]*)"|`([^`]*)`|\[\s*(?:'([^']*)'|"([^"]*)")|(-?[\d.]+(?:px|rem|em|%)?))/.exec(rest);
        if (value) { const literal = value[1] ?? value[2] ?? value[3] ?? value[4] ?? value[5] ?? value[6]; if (literal !== undefined && !/^(extend|theme)$/.test(name)) out[prefix ? `${prefix}-${name}` : name] = literal; }
      }
    }
  };
  walk(body, '');
  return out;
}
/** Tailwind theme values → raw tokens named like CSS custom properties (`--tw-color-brand-500`, `--tw-font-sans`, `--tw-radius-lg`). */
export function tailwindTokens(config: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const [name, value] of Object.entries(objectEntries(config, 'colors'))) tokens[`--tw-color-${name.replace(/-DEFAULT$/, '')}`] = value;
  for (const [name, value] of Object.entries(objectEntries(config, 'fontFamily'))) tokens[`--tw-font-${name}`] = value;
  for (const [name, value] of Object.entries(objectEntries(config, 'borderRadius'))) tokens[`--tw-radius-${name}`] = value;
  for (const [name, value] of Object.entries(objectEntries(config, 'spacing'))) if (/^\d+$/.test(name)) tokens[`--tw-space-${name}`] = value;
  return tokens;
}

const SHADCN_HSL = /^-?[\d.]+\s+[\d.]+%\s+[\d.]+%$/;
/** Resolve `var(--x)` one level and wrap shadcn's bare `h s% l%` triplets so the value is a real CSS colour. */
function resolveValue(value: string, tokens: Record<string, string>, depth = 0): string {
  const ref = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]+))?\)$/.exec(value.trim());
  if (ref && depth < 4) return resolveValue(tokens[ref[1]] ?? ref[2] ?? '', tokens, depth + 1);
  const trimmed = value.trim();
  if (SHADCN_HSL.test(trimmed)) return `hsl(${trimmed})`;
  const hslVar = /^hsl\(\s*var\(\s*(--[A-Za-z0-9_-]+)\s*\)\s*\)$/.exec(trimmed);
  if (hslVar && depth < 4) return resolveValue(tokens[hslVar[1]] ?? '', tokens, depth + 1);
  return trimmed;
}
const CANONICAL: ReadonlyArray<{ token: string; candidates: string[] }> = [
  { token: '--bg', candidates: ['--bg', '--background', '--color-background', '--color-bg', '--surface-0', '--tw-color-background', '--tw-color-bg', '--tw-color-white'] },
  { token: '--fg', candidates: ['--fg', '--foreground', '--text', '--color-foreground', '--color-text', '--tw-color-foreground', '--tw-color-text', '--tw-color-black'] },
  { token: '--accent', candidates: ['--accent', '--color-accent', '--tw-color-accent', '--primary', '--color-primary', '--tw-color-primary', '--tw-color-primary-500', '--brand', '--color-brand', '--tw-color-brand', '--tw-color-brand-500'] },
  { token: '--primary', candidates: ['--primary', '--color-primary', '--tw-color-primary', '--tw-color-primary-500', '--brand', '--tw-color-brand', '--tw-color-brand-500'] },
  { token: '--secondary', candidates: ['--secondary', '--color-secondary', '--tw-color-secondary', '--tw-color-secondary-500'] },
  { token: '--surface', candidates: ['--surface', '--card', '--color-surface', '--color-card', '--tw-color-surface', '--tw-color-card'] },
  { token: '--muted', candidates: ['--muted', '--muted-foreground', '--color-muted', '--tw-color-muted', '--tw-color-gray-500', '--tw-color-neutral-500'] },
  { token: '--border', candidates: ['--border', '--color-border', '--tw-color-border', '--tw-color-gray-200', '--tw-color-neutral-200'] },
  { token: '--font-display', candidates: ['--font-display', '--font-heading', '--font-serif', '--tw-font-display', '--tw-font-heading', '--tw-font-serif', '--font-sans', '--tw-font-sans', '--font-family'] },
  { token: '--font-body', candidates: ['--font-body', '--font-sans', '--tw-font-body', '--tw-font-sans', '--font-family', '--font-display', '--tw-font-display'] },
  { token: '--radius', candidates: ['--radius', '--radius-md', '--border-radius', '--tw-radius-DEFAULT', '--tw-radius-md', '--tw-radius-lg'] },
];
const isColorValue = (value: string) => /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\(|[a-z]+$)/i.test(value) && !/^(inherit|initial|unset|currentcolor|transparent)$/i.test(value);

export function extractDesignSystem(sources: ExtractSource[], options: ExtractOptions = {}): ExtractResult {
  const discovered: Record<string, string> = {}, used: string[] = [];
  let designMd: string | undefined;
  for (const source of sources) {
    if (DESIGN_FILE.test(source.path)) { designMd ??= source.content; used.push(source.path); continue; }
    const found = TAILWIND_FILE.test(source.path) ? tailwindTokens(source.content) : CSS_FILE.test(source.path) ? parseTokensCss(source.content) : {};
    if (!Object.keys(found).length) continue;
    used.push(source.path);
    for (const [name, value] of Object.entries(found)) discovered[name] ??= value;
  }
  const tokens: Record<string, string> = {}, missing: string[] = [];
  for (const { token, candidates } of CANONICAL) {
    const hit = candidates.map(name => discovered[name] === undefined ? undefined : resolveValue(discovered[name], discovered)).find(value => value && (token.startsWith('--font') || token === '--radius' || isColorValue(value)));
    // Font stacks keep only the first family: the compiler reads one, and a stray quote from `"Inter", sans-serif` would leak into it.
    if (hit) tokens[token] = token.startsWith('--font') ? hit.split(',')[0].trim().replace(/^['"]|['"]$/g, '') : hit; else missing.push(token);
  }
  for (const [name, value] of Object.entries(discovered)) {
    const step = /^--(?:space|spacing|tw-space)-(\d+)$/.exec(name);
    if (step && /^[\d.]+(px|rem)?$/.test(value)) tokens[`--space-${step[1]}`] ??= value;
  }
  const name = options.name ?? (designMd?.match(/^#\s+(.+)$/m)?.[1].trim()) ?? 'Extracted design system';
  const id = options.id ?? slugify(name);
  const lines = [`:root {`, ...Object.entries(tokens).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })).map(([token, value]) => `  ${token}: ${value};`), `}`, ''];
  const generated = [`# ${name}`, '', `Extracted from ${used.length ? used.map(path => `\`${path}\``).join(', ') : 'no sources'}.`, '', '## Color roles',
    tokens['--bg'] ? `Background \`${tokens['--bg']}\` with text \`${tokens['--fg'] ?? 'missing'}\` and accent \`${tokens['--accent'] ?? 'missing'}\`.` : 'No background colour was found; add `--bg`, `--fg` and `--accent` to tokens.css.',
    ...(tokens['--muted'] ? [`Muted text uses \`${tokens['--muted']}\`.`] : []), ...(tokens['--border'] ? [`Borders use \`${tokens['--border']}\`.`] : []), '', '## Typography',
    `Headings use ${tokens['--font-display'] ?? 'the default heading font'}; body copy uses ${tokens['--font-body'] ?? 'the default body font'}.`,
    ...(Object.keys(tokens).some(t => t.startsWith('--space-')) ? ['', '## Spacing', 'The spacing rhythm follows the `--space-N` tokens.'] : []), ''].join('\n');
  return {
    folder: { manifest: { id, name, description: `Design system extracted from a codebase (${used.length} source file${used.length === 1 ? '' : 's'}).`, system: 'shadcn', source: { type: 'local' } }, designMd: designMd ?? generated, tokensCss: lines.join('\n') },
    tokens, discovered, sources: used, missing,
  };
}
