import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => {
  const isExportBuild = mode === 'export'

  return {
    // Use relative paths for portable offline exports and the repo path for hosted builds.
    base: isExportBuild ? './' : '/LiveOn-Memories/',
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
      ...(isExportBuild ? [viteSingleFile()] : []),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],

    build: isExportBuild
      ? {
          assetsInlineLimit: () => true,
          cssCodeSplit: false,
        }
      : undefined,

    // Proxy /api and /media to the Flask backend in development
    server: {
      proxy: {
        '/api':   'http://localhost:5000',
        '/media': 'http://localhost:5000',
      },
    },
  }
})
