import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const portalApiTarget =
    process.env.VITE_PORTAL_API_DEV_TARGET ||
    env.VITE_PORTAL_API_DEV_TARGET ||
    'http://localhost:3001'

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/portal-app.js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/portal-app.css'
            }
            return 'assets/[name][extname]'
          },
        },
      },
    },
    server: {
      proxy: {
        '/portal-api': portalApiTarget,
      },
    },
  }
})
