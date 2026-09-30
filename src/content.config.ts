import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { categories } from './data/categories';
import { commonSources } from './data/sources';
import { articleSchema, benefitSchema, commonSourceSchema } from './lib/content-schema';

commonSources.forEach((s) => commonSourceSchema.parse(s));
const duplicateSource = commonSources.find((s, i) => commonSources.findIndex((x) => x.id === s.id) !== i);
if (duplicateSource) throw new Error(`공통 출처 id 중복: ${duplicateSource.id}`);

// 파일 경로가 곧 URL이다: articles/{category}/{slug}.md, benefits/{slug}.md
const slug = '[a-z0-9]+(?:-[a-z0-9]+)*';
const articlePath = new RegExp(`^(${categories.map((c) => c.slug).join('|')})/(${slug})\\.md$`);
const benefitPath = new RegExp(`^(${slug})\\.md$`);

// dev·test 화면 확인용 fixture는 src/dev/content/에만 두고 slug가 fixture-로 시작한다.
// 실제 콘텐츠는 이 접두를 쓸 수 없다. 화면 포함 여부는 lib/content.ts가 isShellPreview로 정한다.
const FIXTURE_PREFIX = 'fixture-';

const loader = (kind: 'articles' | 'benefits', fixture: boolean) => {
  const [pattern, hint] = kind === 'articles' ? [articlePath, '{category}/{kebab-case-slug}.md'] : [benefitPath, '{kebab-case-slug}.md, 하위 폴더 없음'];
  return glob({
    pattern: '**/*.md',
    base: fixture ? `./src/dev/content/${kind}` : `./src/content/${kind}`,
    generateId: ({ entry }) => {
      if (!pattern.test(entry)) throw new Error(`콘텐츠 파일 경로 오류: ${entry} (${hint})`);
      const id = entry.replace(/\.md$/, '');
      if (id.split('/').pop()!.startsWith(FIXTURE_PREFIX) !== fixture) {
        throw new Error(`콘텐츠 파일 경로 오류: ${entry} (${FIXTURE_PREFIX} 접두는 src/dev/content/의 fixture 전용)`);
      }
      return id;
    },
  });
};

export const collections = {
  articles: defineCollection({ loader: loader('articles', false), schema: articleSchema }),
  benefits: defineCollection({ loader: loader('benefits', false), schema: benefitSchema }),
  fixtureArticles: defineCollection({ loader: loader('articles', true), schema: articleSchema }),
  fixtureBenefits: defineCollection({ loader: loader('benefits', true), schema: benefitSchema }),
};
