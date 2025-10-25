import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

const SUPABASE_URL = "https://ngqymbjatenxztrjjdxa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncXltYmphdGVueHp0cmpqZHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDg5MDcsImV4cCI6MjA3MDY4NDkwN30.8CVsfliWGJiXjrCxkF28L9af_VPwnBZHipxfo76kgOQ";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/rss.xml': {
        target: `${SUPABASE_URL}/functions/v1/generate-rss`,
        changeOrigin: true,
        rewrite: () => '',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('apikey', SUPABASE_ANON_KEY);
          });
        },
      },
      '/sitemap.xml': {
        target: `${SUPABASE_URL}/functions/v1/generate-sitemap`,
        changeOrigin: true,
        rewrite: () => '',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('apikey', SUPABASE_ANON_KEY);
          });
        },
      },
    },
  },
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    exclude: ["lovable-tagger"],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
    },
  },
}));
