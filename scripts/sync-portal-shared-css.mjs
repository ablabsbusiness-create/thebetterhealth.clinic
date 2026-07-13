import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const source = resolve(repoRoot, 'emr', 'portal-shared.css');

const targets = [
  resolve(repoRoot, 'emr', 'kid', 'public', 'portal-shared.css'),
  resolve(repoRoot, 'emr', 'lungs', 'public', 'portal-shared.css')
];

for (const target of targets) {
  copyFileSync(source, target);
  console.log(`Synced portal-shared.css -> ${target}`);
}
