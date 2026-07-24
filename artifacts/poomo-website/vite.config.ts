import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';

function localContactApi(): Plugin {
  return {
    name: 'jbs-local-contact-api',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url?.split('?')[0];

        if (pathname !== '/api/contact') {
          next();
          return;
        }

        try {
          const contactModule = await server.ssrLoadModule('/api/contact.ts');
          const contactHandler = contactModule.default as (
            request: typeof request,
            response: typeof response,
          ) => Promise<void>;

          await contactHandler(request, response);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const root = path.resolve(import.meta.dirname);
  const env = loadEnv(mode, root, '');

  for (const name of [
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
    'CONTACT_TO_EMAIL',
    'CONTACT_ALLOWED_ORIGIN',
  ]) {
    if (env[name] && !process.env[name]) {
      process.env[name] = env[name];
    }
  }

  const port = Number(process.env.PORT ?? env.PORT ?? 5173);
  const basePath = process.env.BASE_PATH ?? env.BASE_PATH ?? '/';
  const vercelOutputDir =
    process.env.VERCEL_OUTPUT_DIR ?? env.VERCEL_OUTPUT_DIR;
  const outDir = vercelOutputDir
    ? path.resolve(import.meta.dirname, vercelOutputDir)
    : process.env.VERCEL
      ? path.resolve(import.meta.dirname, 'dist')
      : path.resolve(import.meta.dirname, '..', '..', 'dist');

  return {
    base: basePath,
    plugins: [react(), tailwindcss(), localContactApi()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(
          import.meta.dirname,
          '..',
          '..',
          'attached_assets',
        ),
      },
      dedupe: ['react', 'react-dom'],
    },
    root,
    build: {
      outDir,
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      fs: {
        strict: true,
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
