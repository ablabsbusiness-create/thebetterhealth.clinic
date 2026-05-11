import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const appDir = resolve(import.meta.dirname, '..');
const repoRoot = resolve(appDir, '..');
const generatorScript = resolve(repoRoot, 'scripts', 'generate_minimal_iap_pngs.py');
const whoGeneratorScript = resolve(repoRoot, 'scripts', 'generate_official_who_pngs.py');
const nellhausGeneratorScript = resolve(repoRoot, 'scripts', 'generate_nellhaus_ofc_pngs.py');
const outputDir = resolve(appDir, 'assets', 'iap-official-png');
const whoOutputDir = resolve(appDir, 'assets', 'who-official-png');
const nellhausOutputDir = resolve(appDir, 'assets', 'nellhaus-official-png');

const pythonCommands = [
  ['python', [generatorScript]],
  ['py', ['-3', generatorScript]]
];

function runGenerator() {
  for (const [command, args] of pythonCommands) {
    const result = spawnSync(command, args.map((arg) => arg === generatorScript ? generatorScript : arg), {
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

function runWhoGenerator() {
  for (const [command, args] of pythonCommands) {
    const result = spawnSync(command, args.map((arg) => arg === generatorScript ? whoGeneratorScript : arg), {
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

function runNellhausGenerator() {
  for (const [command, args] of pythonCommands) {
    const result = spawnSync(command, args.map((arg) => arg === generatorScript ? nellhausGeneratorScript : arg), {
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
const generatedWho = existsSync(whoOutputDir) || runWhoGenerator();
const generatedNellhaus = existsSync(nellhausOutputDir) || runNellhausGenerator();

if (!generated && !existsSync(outputDir)) {
  console.error('Unable to run the Python IAP asset generator and no pre-generated assets were found.');
  process.exit(1);
}

if (!generatedWho && !existsSync(whoOutputDir)) {
  console.error('Unable to run the Python WHO chart asset generator and no pre-generated WHO assets were found.');
  process.exit(1);
}

if (!generatedNellhaus && !existsSync(nellhausOutputDir)) {
  console.error('Unable to run the Python Nellhaus OFC chart asset generator and no pre-generated Nellhaus assets were found.');
  process.exit(1);
}

if (!generated) {
  console.warn('Python was not available, so the app is using the existing generated IAP chart assets.');
} else {
  console.log('IAP chart assets refreshed from the Python generator.');
}
