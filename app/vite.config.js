import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { cpSync } from 'node:fs';

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
        cpSync(resolve(__dirname, 'assets', 'iap-svg'), resolve(distAssets, 'iap-svg'), { recursive: true });
        cpSync(resolve(__dirname, 'assets', 'iap-jpg'), resolve(distAssets, 'iap-jpg'), { recursive: true });
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
