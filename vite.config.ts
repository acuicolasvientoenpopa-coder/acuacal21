import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: { __APP_BUILD__: JSON.stringify(new Date().toISOString()) },
  base: "/",
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    includeAssets: ['favicon.svg', 'icons/*.svg'],
    manifest: {
      name: 'AcuiCal',
      short_name: 'AcuiCal',
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
    workbox: {
      skipWaiting: true,
      clientsClaim: true,
      globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/[a-z]\.tile\.openstreetmap\.org\/.*$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'osm-tiles',
            expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
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
