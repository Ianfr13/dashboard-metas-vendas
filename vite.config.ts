import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { VitePWA } from "vite-plugin-pwa";
// NOTA: Para ativar Bundle Analysis e Brotli Compression:
// 1. Instalar: pnpm add -D rollup-plugin-visualizer vite-plugin-compression
// 2. Descomentar as linhas abaixo
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';


const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
    manifest: {
      name: "Douravita Dashboard",
      short_name: "Douravita",
      description: "Dashboard de Metas e Vendas em Tempo Real",
      theme_color: "#ffffff",
      icons: [
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
    workbox: {
      // cleanupOutdatedCaches: true,
      // clientsClaim: true,
      // skipWaiting: true,
    },
    srcDir: "src",
    filename: "sw.ts",
    strategies: "injectManifest"
  }),
  // Bundle Analysis - Gera relatório visual
  visualizer({
    open: false,
    gzipSize: true,
    brotliSize: true,
    filename: 'dist/stats.html'
  }),
  // Brotli Compression
  viteCompression({
    algorithm: 'brotliCompress',
    ext: '.br',
    threshold: 1024,
    deleteOriginFile: false
  }),
  // Gzip Compression
  viteCompression({
    algorithm: 'gzip',
    ext: '.gz',
    threshold: 1024,
    deleteOriginFile: false
  })
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Chunking dinâmico otimizado para melhor cache
        manualChunks: (id) => {
          // Vendor chunks (libs grandes que mudam pouco)
          if (id.includes('node_modules')) {
            // Charts (grande, isolado)
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            // Supabase + Query (data layer)
            if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
              return 'vendor-data';
            }
            // Tudo que é essencial para o App rodar (React, Router, UI Libs, Utils)
            // Agrupamos para evitar circular dependencies e garantir ordem de load
            return 'vendor-core';
          }
        },
        // Garantir hashes nos nomes para cache imutável
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
