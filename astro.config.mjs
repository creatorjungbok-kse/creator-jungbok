import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  site: 'https://creatorjungbok.co.kr',
  trailingSlash: 'always',
  build: { format: 'directory' },
  env: {
    // build-time 전용(서버 컨텍스트). 허용값 외의 값은 빌드 실패. 판정은 src/config/env.ts에서만 한다.
    schema: {
      SITE_ENV: envField.enum({
        context: 'server',
        access: 'public',
        values: ['development', 'preview', 'production'],
        optional: true,
      }),
      SHELL_PREVIEW: envField.boolean({ context: 'server', access: 'public', default: false }),
    },
  },
});
