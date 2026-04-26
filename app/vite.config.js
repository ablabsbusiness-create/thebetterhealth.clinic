import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { cpSync, existsSync } from 'node:fs';

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
        search: resolve(__dirname, 'search.html'),
        history: resolve(__dirname, 'history.html')
      }
    }
  }
});
