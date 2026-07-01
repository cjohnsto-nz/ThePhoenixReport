import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import yamlPlugin from '@modyfi/vite-plugin-yaml';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ThePhoenixReport/' : '/',
  plugins: [react(), yamlPlugin()],
  assetsInclude: ['**/*.yaml', '**/*.yml'],
}));
