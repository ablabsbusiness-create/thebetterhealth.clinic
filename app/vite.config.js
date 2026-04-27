import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { cpSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(__dirname, '..');
const pythonChartRendererScript = resolve(__dirname, 'scripts', 'render_growth_charts.py');
const pythonCommands = [
  ['python', [pythonChartRendererScript]],
  ['py', ['-3', pythonChartRendererScript]]
];

function runPythonChartRenderer(requestBody) {
  for (const [command, args] of pythonCommands) {
    const result = spawnSync(command, args, {
      cwd: repoRoot,
      input: requestBody,
      encoding: 'utf-8',
      shell: false
    });

    if (result.status === 0) {
      return { ok: true, body: result.stdout };
    }

    if (result.error?.code === 'ENOENT') {
      continue;
    }

    return {
      ok: false,
      statusCode: 500,
      body: JSON.stringify({
        error: result.stdout?.trim() || result.stderr?.trim() || 'Python chart renderer failed.'
      })
    };
  }

  return {
    ok: false,
    statusCode: 500,
    body: JSON.stringify({
      error: 'Python is not available for local chart rendering.'
    })
  };
}

export default defineConfig({
  root: __dirname,
  envDir: __dirname,
  base: '/app/',
  resolve: {
    alias: {
      jspdf: resolve(__dirname, 'node_modules/jspdf/dist/jspdf.es.min.js')
    }
  },
  plugins: [
    {
      name: 'copy-iap-assets',
      closeBundle() {
        const distAssets = resolve(__dirname, 'dist', 'assets');
        const generatedChartAssets = resolve(__dirname, 'assets', 'iap-official-png');

        if (existsSync(generatedChartAssets)) {
          cpSync(generatedChartAssets, resolve(distAssets, 'iap-official-png'), { recursive: true });
        }
      }
    },
    {
      name: 'python-growth-chart-api',
      configureServer(server) {
        server.middlewares.use('/api/growth_charts', (req, res) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Method not allowed.' }));
            return;
          }

          const bodyChunks = [];
          req.on('data', (chunk) => {
            bodyChunks.push(chunk);
          });
          req.on('end', () => {
            const requestBody = Buffer.concat(bodyChunks).toString('utf-8') || '{}';
            const result = runPythonChartRenderer(requestBody);
            res.statusCode = result.ok ? 200 : result.statusCode;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(result.body);
          });
        });
      }
    }
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        password: resolve(__dirname, 'password.html'),
        entryDashboard: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'clinci.html'),
        choose: resolve(__dirname, 'choose.html'),
        newPatient: resolve(__dirname, 'new-patient.html'),
        growthChart: resolve(__dirname, 'growth-chart-dashboard.html'),
        prescription: resolve(__dirname, 'prescription.html'),
        preview: resolve(__dirname, 'preview.html'),
        prescriptionGrowthChart: resolve(__dirname, 'prescription-growth-chart-dashboard.html'),
        search: resolve(__dirname, 'search.html')
      }
    }
  }
});
