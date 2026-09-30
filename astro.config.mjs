import { satteri } from '@astrojs/markdown-satteri';
import { defineConfig, envField } from 'astro/config';

// Markdown 본문의 표를 가로 스크롤 영역(.table-scroll, base.css)으로 감싼다. 키보드로도 스크롤할 수 있게 초점을 받는다.
const tableScroll = {
  name: 'table-scroll',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, { raw: '<div class="table-scroll" tabindex="0" role="region" aria-label="표"></div>' });
    },
  },
};

export default defineConfig({
  site: 'https://creatorjungbok.co.kr',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // 같은 컬렉션 안 id 중복·같은 경로를 만드는 route 충돌을 경고가 아닌 빌드 실패로
  prerenderConflictBehavior: 'error',
  markdown: { processor: satteri({ hastPlugins: [tableScroll] }) },
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
