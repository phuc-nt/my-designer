import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractDesignSystem, tailwindTokens } from '../src/shared/design-system-extract';
import { compileFolderPackage } from '../src/shared/design-system-folder';

const tailwind = `import type { Config } from 'tailwindcss'
export default {
  content: ['./src/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#c2642a', 500: '#c2642a', 700: '#8f4418' },
        background: '#faf7f0',
        foreground: "#1c1a17",
        muted: '#6b6259',
        border: '#e3ddd0',
      },
      fontFamily: { display: ['Fraunces', 'serif'], sans: ["Source Serif 4", 'serif'] },
      borderRadius: { DEFAULT: '12px', lg: '1rem' },
      spacing: { 1: '4px', 2: '8px', 3: '16px' },
    },
  },
  plugins: [],
} satisfies Config
`;

test('tailwindTokens reads colours, fonts, radii and spacing from a config without evaluating it', () => {
  const tokens = tailwindTokens(tailwind);
  assert.equal(tokens['--tw-color-brand'], '#c2642a');
  assert.equal(tokens['--tw-color-brand-700'], '#8f4418');
  assert.equal(tokens['--tw-color-foreground'], '#1c1a17');
  assert.equal(tokens['--tw-font-display'], 'Fraunces');
  assert.equal(tokens['--tw-font-sans'], 'Source Serif 4');
  assert.equal(tokens['--tw-radius-DEFAULT'], '12px');
  assert.equal(tokens['--tw-space-2'], '8px');
});

test('a Tailwind codebase extracts into a folder that compiles cleanly', () => {
  const result = extractDesignSystem([{ path: 'tailwind.config.ts', content: tailwind }, { path: 'src/app.tsx', content: 'export const x = 1;' }], { name: 'Acme' });
  assert.deepEqual(result.sources, ['tailwind.config.ts']);
  assert.equal(result.folder.manifest.id, 'acme');
  assert.equal(result.tokens['--bg'], '#faf7f0'); assert.equal(result.tokens['--fg'], '#1c1a17');
  assert.equal(result.tokens['--accent'], '#c2642a'); assert.equal(result.tokens['--primary'], '#c2642a');
  assert.equal(result.tokens['--font-display'], 'Fraunces'); assert.equal(result.tokens['--font-body'], 'Source Serif 4');
  assert.equal(result.tokens['--radius'], '12px'); assert.equal(result.tokens['--space-3'], '16px');
  assert.deepEqual(result.missing, ['--secondary', '--surface']);
  const compiled = compileFolderPackage(result.folder);
  assert.deepEqual(compiled.findings, []);
  assert.equal(compiled.definition.theme.colors.accent, '#c2642a'); assert.equal(compiled.definition.theme.radius, 12);
  assert.deepEqual(compiled.definition.theme.spacing, [4, 8, 16]);
  assert.match(result.folder.designMd, /^# Acme/);
});

test('shadcn-style CSS variables resolve var() references and HSL triplets; an existing DESIGN.md is kept', () => {
  const css = `@layer base {\n  :root {\n    --background: 0 0% 100%;\n    --foreground: 222.2 84% 4.9%;\n    --primary: 221.2 83.2% 53.3%;\n    --card: var(--background);\n    --muted-foreground: hsl(var(--foreground));\n    --border: 214.3 31.8% 91.4%;\n    --radius: 0.5rem;\n    --font-sans: "Inter", sans-serif;\n  }\n}\n`;
  const result = extractDesignSystem([{ path: 'src/globals.css', content: css }, { path: 'DESIGN.md', content: '# Northwind\n\nHand-written notes.\n' }]);
  assert.equal(result.folder.manifest.name, 'Northwind');
  assert.equal(result.folder.designMd, '# Northwind\n\nHand-written notes.\n');
  assert.equal(result.tokens['--bg'], 'hsl(0 0% 100%)');
  assert.equal(result.tokens['--fg'], 'hsl(222.2 84% 4.9%)');
  assert.equal(result.tokens['--accent'], 'hsl(221.2 83.2% 53.3%)');
  assert.equal(result.tokens['--surface'], 'hsl(0 0% 100%)', 'var() chains resolve');
  assert.equal(result.tokens['--muted'], 'hsl(222.2 84% 4.9%)', 'hsl(var()) resolves');
  assert.equal(result.tokens['--font-display'], 'Inter'); assert.equal(result.tokens['--font-body'], 'Inter');
  assert.deepEqual(compileFolderPackage(result.folder).findings, []);
  assert.match(result.folder.tokensCss, /^:root \{\n {2}--accent: hsl\(221\.2 83\.2% 53\.3%\);\n/);
});

test('an empty codebase reports what is missing instead of inventing tokens', () => {
  const result = extractDesignSystem([{ path: 'README.md', content: '# nothing' }]);
  assert.deepEqual(result.sources, []); assert.deepEqual(result.tokens, {});
  assert.ok(result.missing.includes('--bg') && result.missing.includes('--font-body'));
  assert.ok(compileFolderPackage(result.folder).findings.some(f => f.level === 'error' && f.message.includes('--bg')));
});
