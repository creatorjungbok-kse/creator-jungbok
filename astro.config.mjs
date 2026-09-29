import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://creatorjungbok.co.kr',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
