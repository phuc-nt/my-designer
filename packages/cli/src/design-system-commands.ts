import type { Command } from 'commander';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { designSystemSchema } from '../../../src/shared/design-systems';
import { compileFolderPackage, decompileFolderPackage } from '../../../src/shared/design-system-folder';
import { extractDesignSystem, isDesignSource, type ExtractSource } from '../../../src/shared/design-system-extract';
import { Client, CliError, inputJson, output, positiveInteger } from './client';

const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', 'coverage', '.turbo', '.cache', 'design-system']);
/** CSS/SCSS files, tailwind configs and DESIGN.md under `root`, bounded so a monorepo cannot stall the command. */
async function collectDesignSources(root: string, limits = { files: 400, depth: 8, bytes: 512 * 1024 }): Promise<ExtractSource[]> {
  const info = await stat(root).catch(() => null);
  if (!info?.isDirectory()) throw new CliError('input_required', `${root} is not a directory.`);
  const sources: ExtractSource[] = [];
  const walk = async (directory: string, depth: number) => {
    if (depth > limits.depth || sources.length >= limits.files) return;
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { if (!SKIPPED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')) await walk(path, depth + 1); continue; }
      if (!entry.isFile() || !isDesignSource(path) || sources.length >= limits.files) continue;
      if ((await stat(path)).size > limits.bytes) continue;
      sources.push({ path: relative(root, path), content: await readFile(path, 'utf8') });
    }
  };
  await walk(root, 0);
  return sources;
}
export function registerDesignSystemCommands(program: Command, client: () => Client) {
  const path = (id: string) => `/api/design-systems/${encodeURIComponent(id)}`;
  const print = (fn: (...args: any[]) => Promise<unknown>) => async (...args: any[]) => output(await fn(...args));
  const systems = program.command('design-systems').description('Create, version, apply and reuse design libraries');
  systems.command('schema').action(() => output(designSystemSchema.toJSONSchema()));
  systems.command('list').action(print(() => client().json('/api/design-systems')));
  systems.command('get <id>').option('--system-version <number>', 'Pinned immutable version').action(print((id, options) => client().json(path(id) + (options.systemVersion ? `?version=${positiveInteger(options.systemVersion)}` : ''))));
  systems.command('versions <id>').action(print(id => client().json(path(id) + '/versions')));
  systems.command('create').requiredOption('--file <path>', 'Definition JSON or - for stdin').action(print(async options => client().json('/api/design-systems', 'POST', designSystemSchema.parse(await inputJson(options.file)))));
  systems.command('update <id>').requiredOption('--system-version <number>', 'Latest observed version; conflicts are never retried').requiredOption('--file <path>', 'Definition JSON or - for stdin').action(print(async (id, options) => client().json(path(id), 'PUT', { expectedVersion: positiveInteger(options.systemVersion), definition: designSystemSchema.parse(await inputJson(options.file)) })));
  systems.command('apply <id> <project-id>').requiredOption('--revision <number>', 'Observed project revision').option('--system-version <number>', 'Saved system version').action(print((id, projectId, options) => client().json(path(id) + '/apply', 'POST', { projectId, expectedRevision: positiveInteger(options.revision), version: options.systemVersion ? positiveInteger(options.systemVersion) : undefined })));
  systems.command('insert <id> <project-id>').requiredOption('--revision <number>', 'Observed project revision').requiredOption('--page <id>', 'Destination page').requiredOption('--item <id>', 'Component/composition ID').option('--system-version <number>', 'Saved system version').action(print((id, projectId, options) => client().json(path(id) + '/insert', 'POST', { projectId, pageId: options.page, itemId: options.item, expectedRevision: positiveInteger(options.revision), version: options.systemVersion ? positiveInteger(options.systemVersion) : undefined })));
  systems.command('remove <id>').action(print(id => client().json(path(id), 'DELETE')));
  systems.command('import').description('Compile a portable DESIGN.md + tokens.css + manifest.json folder into a design system')
    .requiredOption('--folder <path>', 'Directory containing manifest.json, DESIGN.md and tokens.css')
    .action(print(async options => {
      const manifest = JSON.parse(await readFile(join(options.folder, 'manifest.json'), 'utf8'));
      const designMd = await readFile(join(options.folder, 'DESIGN.md'), 'utf8');
      const tokensCss = await readFile(join(options.folder, 'tokens.css'), 'utf8');
      return client().json('/api/design-systems/import', 'POST', { manifest, designMd, tokensCss });
    }));
  systems.command('extract').description('Derive a portable design-system folder from a codebase: CSS/SCSS custom properties, tailwind.config and an existing DESIGN.md')
    .requiredOption('--from <dir>', 'Codebase root to scan (node_modules, .git and build output are skipped)')
    .option('--output <folder>', 'Where to write manifest.json, DESIGN.md and tokens.css (default: <from>/design-system)')
    .option('--id <slug>', 'System id; defaults to a slug of the name').option('--name <name>', 'System name; defaults to the DESIGN.md title')
    .option('--import', 'Also import the folder into the studio (fails when the compile guard reports errors)')
    .action(print(async options => {
      const sources = await collectDesignSources(options.from);
      const result = extractDesignSystem(sources, { id: options.id, name: options.name });
      const compiled = compileFolderPackage(result.folder);
      const folder = options.output ?? join(options.from, 'design-system');
      await mkdir(folder, { recursive: true });
      await Promise.all([
        writeFile(join(folder, 'manifest.json'), JSON.stringify(result.folder.manifest, null, 2) + '\n'),
        writeFile(join(folder, 'DESIGN.md'), result.folder.designMd),
        writeFile(join(folder, 'tokens.css'), result.folder.tokensCss),
      ]);
      const summary = { folder, sources: result.sources, tokens: result.tokens, missing: result.missing, discovered: Object.keys(result.discovered).length, findings: compiled.findings, warnings: compiled.warnings };
      if (!options.import) return summary;
      if (compiled.findings.some(f => f.level === 'error')) throw new CliError('invalid_folder', `The extracted folder does not compile yet: ${compiled.findings.map(f => f.message).join(' ')} Edit ${join(folder, 'tokens.css')} and run design-systems import --folder.`);
      return { ...summary, imported: await client().json('/api/design-systems/import', 'POST', result.folder) };
    }));
  systems.command('export <id>').description('Write a saved design system back into a portable folder')
    .requiredOption('--folder <path>', 'Output directory').option('--system-version <number>', 'Pinned immutable version')
    .action(print(async (id, options) => {
      const url = path(id) + (options.systemVersion ? `?version=${positiveInteger(options.systemVersion)}` : '');
      const { system } = await client().json<{ system: { id: string; version: number; definition: unknown } }>(url);
      const folder = decompileFolderPackage(designSystemSchema.parse(system.definition), system.id);
      await mkdir(options.folder, { recursive: true });
      await Promise.all([
        writeFile(join(options.folder, 'manifest.json'), JSON.stringify(folder.manifest, null, 2) + '\n'),
        writeFile(join(options.folder, 'DESIGN.md'), folder.designMd),
        writeFile(join(options.folder, 'tokens.css'), folder.tokensCss),
      ]);
      return { folder: options.folder, systemId: system.id, version: system.version };
    }));
  program.command('fonts').description('Search Google Fonts catalog').option('--query <text>', 'Family search').action(print(options => client().json('/api/fonts' + (options.query ? `?q=${encodeURIComponent(options.query)}` : ''))));
}
