import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(import.meta.dirname, '..');
const outputRoot = resolve(repoRoot, 'vercel-dist');

const publicEntries = [
  'assets',
  'the-better-kid-clinic',
  'the-better-lungs-clinic',
  'index.html',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'CNAME'
];

const sharedEmrEntries = [
  'download',
  'icons',
  'password',
  'download.html',
  'password.html',
  'site.webmanifest',
  'sw.js'
];

const emrApps = [
  { name: 'kid', dir: 'emr/kid', outputPath: 'emr/kid' },
  { name: 'lungs', dir: 'emr/lungs', outputPath: 'emr/lungs' },
  { name: 'ab-labs', dir: 'emr/ab-labs', outputPath: 'emr/ab-labs', replaceBase: true }
];

const textExtensions = new Set([
  '.html',
  '.js',
  '.css',
  '.json',
  '.webmanifest',
  '.xml',
  '.txt'
]);

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`);
  }
}

function copyEntry(entry, destinationBase = outputRoot) {
  const source = resolve(repoRoot, entry);

  if (!existsSync(source)) {
    return;
  }

  cpSync(source, resolve(destinationBase, entry), {
    recursive: true,
    force: true
  });
}

function ensureDependencies(appDir) {
  if (existsSync(resolve(appDir, 'node_modules'))) {
    return;
  }

  const hasPackageLock = existsSync(resolve(appDir, 'package-lock.json'));
  run('npm', [hasPackageLock ? 'ci' : 'install'], appDir);
}

function replaceInTextFiles(dir, replacements) {
  for (const name of readdirSync(dir)) {
    const filePath = join(dir, name);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      replaceInTextFiles(filePath, replacements);
      continue;
    }

    if (!textExtensions.has(extname(filePath))) {
      continue;
    }

    let content = readFileSync(filePath, 'utf8');
    let nextContent = content;

    for (const [from, to] of replacements) {
      nextContent = nextContent.split(from).join(to);
    }

    if (nextContent !== content) {
      writeFileSync(filePath, nextContent);
    }
  }
}

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });

for (const entry of publicEntries) {
  copyEntry(entry);
}

mkdirSync(resolve(outputRoot, 'emr'), { recursive: true });
for (const entry of sharedEmrEntries) {
  copyEntry(`emr/${entry}`);
}

for (const app of emrApps) {
  const appDir = resolve(repoRoot, app.dir);
  ensureDependencies(appDir);
  run('npm', ['run', 'build'], appDir);

  const target = resolve(outputRoot, app.outputPath);
  mkdirSync(target, { recursive: true });
  cpSync(resolve(appDir, 'dist'), target, { recursive: true, force: true });

  if (app.replaceBase) {
    replaceInTextFiles(target, [
      ['/emr/kid/', '/emr/ab-labs/'],
      ['/emr/kid', '/emr/ab-labs']
    ]);
  }
}

console.log(`Built combined Vercel output at ${outputRoot}`);
