import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  site: 'https://creatorjungbok.co.kr',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // 같은 컬렉션 안 id 중복·같은 경로를 만드는 route 충돌을 경고가 아닌 빌드 실패로
  prerenderConflictBehavior: 'error',
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
