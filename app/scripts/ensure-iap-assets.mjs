import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const appDir = resolve(import.meta.dirname, '..');
const repoRoot = resolve(appDir, '..');
const generatorScript = resolve(repoRoot, 'scripts', 'generate_minimal_iap_pngs.py');
const outputDir = resolve(appDir, 'assets', 'iap-official-png');

const pythonCommands = [
  ['python', [generatorScript]],
  ['py', ['-3', generatorScript]]
];

function runGenerator() {
  for (const [command, args] of pythonCommands) {
    const result = spawnSync(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: false
    });

    if (result.status === 0) {
      return true;
    }

    if (result.error && result.error.code === 'ENOENT') {
      continue;
    }
  }

  return false;
}

const generated = runGenerator();

if (!generated && !existsSync(outputDir)) {
  console.error('Unable to run the Python IAP asset generator and no pre-generated assets were found.');
  process.exit(1);
}

if (!generated) {
  console.warn('Python was not available, so the app is using the existing generated IAP chart assets.');
} else {
  console.log('IAP chart assets refreshed from the Python generator.');
}
