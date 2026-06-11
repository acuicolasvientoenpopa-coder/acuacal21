import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: "/",
  plugins: [react(), VitePWA({
      registerType: 'autoUpdate',
    injectRegister: null,
    includeAssets: ['favicon.svg', 'icons/*.svg'],
    manifest: {
      name: 'AquaCalc',
      short_name: 'AquaCalc',
      description: 'Gestión acuícola para pequeños y medianos productores',
      theme_color: '#0a1628',
      background_color: '#0a1628',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      lang: 'es',
      categories: ['agriculture', 'productivity', 'business'],
      icons: [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
        { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
      ],
      shortcuts: [
        { name: 'Calculadora', url: '/calc', icons: [{ src: '/favicon.svg', sizes: 'any' }] },
        { name: 'Bitácora', url: '/bitacora', icons: [{ src: '/favicon.svg', sizes: 'any' }] },
      ],
    },
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    },
  },
})
