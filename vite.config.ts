import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

import fs from 'fs';

function zipDownloadPlugin() {
  return {
    name: 'zip-download-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const rawUrl = req.url ? req.url.split('?')[0] : '';
        const lowerUrl = rawUrl.toLowerCase();

        if (
          lowerUrl.endsWith('.zip') ||
          lowerUrl === '/download-zip' ||
          lowerUrl === '/api/download-zip'
        ) {
          let zipPath = path.resolve(process.cwd(), 'public', path.basename(rawUrl));
          if (!fs.existsSync(zipPath) || fs.statSync(zipPath).isDirectory()) {
            zipPath = path.resolve(process.cwd(), 'public', 'WinMediaScanner-Source.zip');
          }
          if (fs.existsSync(zipPath)) {
            const stat = fs.statSync(zipPath);
            res.writeHead(200, {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="${path.basename(zipPath)}"`,
              'Content-Length': stat.size,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            });
            fs.createReadStream(zipPath).pipe(res);
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), zipDownloadPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json', '.mjs', '.node'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
