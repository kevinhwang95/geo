import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    //https: {}, // Enable HTTPS with default options
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Ensure environment variables are properly replaced
    'import.meta.env.DEV': mode === 'development',
    'import.meta.env.PROD': mode === 'production',
  },
  // Environment variable configuration
  envPrefix: 'VITE_', // Only expose variables prefixed with VITE_
  envDir: './', // Look for .env files in the root directory
  build: {
    // Remove console.log in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    } as any,
    // Generate source maps only in development
    sourcemap: mode === 'development',
    // Remove unused code more aggressively in production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          maps: ['@googlemaps/js-api-loader', '@react-google-maps/api'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  // Environment-specific configurations
  ...(mode === 'production' && {
    // Production-specific optimizations
    build: {
      target: 'es2015',
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
    },
  }),
}))