import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso de tamanho do chunk para 1000 kB.
    // O padrão é 500. Isso ajuda a evitar o warning em builds
    // sem a necessidade de otimizar o code-splitting imediatamente.
    chunkSizeWarningLimit: 1000,
  },
});
