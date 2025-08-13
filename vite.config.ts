// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/pacientes": {
        target: "http://localhost:3005",
        changeOrigin: true,
        secure: false,
      },
      "/clinicas": {
        target: "http://localhost:3005",
        changeOrigin: true,
        secure: false,
      },
      "/citas": {
        target: "http://localhost:3005",
        changeOrigin: true,
        secure: false,
      },
      "/usuarios": {
        target: "http://localhost:3005",
        changeOrigin: true,
        secure: false,
      },
      "/consultorios": {
        target: "http://localhost:3005",
        changeOrigin: true,
        secure: false,
      },
      // si más adelante agregas módulos (/usuarios, /citas…), regístralos aquí
    },
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
