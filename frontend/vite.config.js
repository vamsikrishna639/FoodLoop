// Vite build settings. React for JSX, Tailwind v4 as a Vite plugin.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
  build: {
    rolldownOptions: {
      output: {
        // Each page is already its own file (React.lazy in App.jsx). These
        // groups give the big shared libraries their own named files, so
        // they are cached separately from the app's code and the build
        // output is easy to read. Recharts stays inside the chart's file,
        // which only the admin's Overview loads.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/ },
            { name: 'forms', test: /node_modules[\\/]react-hook-form[\\/]/ },
          ],
        },
      },
    },
  },
});
