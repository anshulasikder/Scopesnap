import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Mount API router under /api
  app.use('/api', apiRouter);

  if (!isProduction) {
    // In development mode, mount Vite middleware to serve React SPA with HMR/Vite pipeline
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built static assets from dist/
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ScopeSnap Server] Running on http://0.0.0.0:${PORT} (env: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('[ScopeSnap Server] Failed to start:', err);
  process.exit(1);
});
