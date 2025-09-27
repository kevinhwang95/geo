import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import mkcert from 'vite-plugin-mkcert';

// https://vite.dev/config/
export default defineConfig({
  server: {
    https: {}, // Enable HTTPS with default options
  },
  plugins: [react(), tailwindcss(), mkcert()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})