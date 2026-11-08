import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageFile = resolve(packageRoot, 'package.json');
const packageJson = JSON.parse(await readFile(packageFile, 'utf8'));
const requiredExports = ['.', './react', './syntax'];
const failures = [];

for (const key of requiredExports) {
  const entry = packageJson.exports?.[key];
  if (!entry || typeof entry !== 'object') {
    failures.push(`Missing package export "${key}".`);
    continue;
  }
  for (const condition of ['types', 'import']) {
    const target = entry[condition];
    if (typeof target !== 'string') {
      failures.push(`Export "${key}" is missing the "${condition}" target.`);
      continue;
    }
    const absolute = resolve(packageRoot, target);
    try {
      const info = await stat(absolute);
      if (!info.isFile()) failures.push(`Export target is not a file: ${target}`);
    } catch {
      failures.push(`Export target does not exist: ${target}`);
    }
  }
}

const syntaxTarget = packageJson.exports?.['./syntax']?.import;
if (typeof syntaxTarget !== 'string') {
  failures.push('The syntax entry has no import target.');
} else {
  const syntaxEntry = resolve(packageRoot, syntaxTarget);
  const forbidden = /^(?:react|react-dom|recharts)(?:\/|$)/;
  const visited = new Set();

  async function walk(file) {
    if (visited.has(file)) return;
    visited.add(file);
    let source;
    try {
      source = await readFile(file, 'utf8');
    } catch {
      return;
    }
    const specifiers = [
      ...source.matchAll(/\bimport\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g),
      ...source.matchAll(/\bexport\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g),
    ].map((match) => match[1]);

    for (const specifier of specifiers) {
      if (!specifier) continue;
      if (forbidden.test(specifier)) {
        failures.push(`Syntax entry imports browser-only package "${specifier}" from ${file}.`);
        continue;
      }
      if (!specifier.startsWith('.')) continue;
      await walk(resolve(dirname(file), specifier));
    }
  }

  await walk(syntaxEntry);
  try {
    await import(pathToFileURL(syntaxEntry).href);
    if ('window' in globalThis) {
      failures.push('The syntax entry unexpectedly created a browser window global.');
    }
  } catch (error) {
    failures.push(`Unable to import the syntax entry in Node: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`package check: ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Package exports and syntax-only bundle checks passed.');
}
