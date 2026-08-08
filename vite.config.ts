import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Supabase's REST and Storage hosts, matched for runtime caching below.
const SUPABASE_HOST = /^https:\/\/[a-z0-9-]+\.supabase\.co/

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // New builds take over on the next load — no "update available" prompt.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // The manifest lives here (not in public/) so it can't drift from the
      // build. Same output filename as before, so existing installs are fine.
      manifest: {
        name: 'Juan & Isa',
        short_name: 'Juan & Isa',
        description: 'Your shared bucket list, together.',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#F8F3EC',
        background_color: '#F8F3EC',
        icons: [
          { src: 'icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // HashRouter keeps every route inside index.html
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Plan photos — immutable once uploaded, so serve from cache first.
            urlPattern: new RegExp(
              `${SUPABASE_HOST.source}/storage/v1/object/public/.*`
            ),
            handler: 'CacheFirst',
            options: {
              cacheName: 'plan-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Plans, categories and activities. Network first so the app is
            // always fresh online, falling back to the last successful
            // response when there's no signal — this is what makes the list
            // readable offline. Workbox only caches GETs, so mutations are
            // untouched and simply fail offline.
            urlPattern: new RegExp(`${SUPABASE_HOST.source}/rest/v1/.*`),
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'supabase-data',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: '/ours/',
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.ngrok-free.dev', '.devtunnels.ms'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
})
