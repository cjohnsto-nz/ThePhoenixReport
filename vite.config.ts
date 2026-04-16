import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ThePhoenixReport/' : '/',
  plugins: [react(), yaml()],
  assetsInclude: ['**/*.yaml', '**/*.yml'],
}));
