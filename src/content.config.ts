import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { categories } from './data/categories';
import { commonSources } from './data/sources';
import { articleSchema, benefitSchema, commonSourceSchema } from './lib/content-schema';

// 공통 출처 registry 자체도 빌드 때 검증한다.
commonSources.forEach((s) => commonSourceSchema.parse(s));
const duplicateSource = commonSources.find((s, i) => commonSources.findIndex((x) => x.id === s.id) !== i);
if (duplicateSource) throw new Error(`공통 출처 id 중복: ${duplicateSource.id}`);

// URL slug의 source of truth = 파일 경로. frontmatter에 slug를 쓰지 않는다.
const slug = '[a-z0-9]+(?:-[a-z0-9]+)*';
const articlePath = new RegExp(`^(${categories.map((c) => c.slug).join('|')})/(${slug})\\.md$`);
const benefitPath = new RegExp(`^(${slug})\\.md$`);

const idFrom = (pattern: RegExp, hint: string) => ({ entry }: { entry: string }) => {
  const m = entry.match(pattern);
  if (!m) throw new Error(`콘텐츠 파일 경로 오류: ${entry} (${hint})`);
  return entry.replace(/\.md$/, '');
};

const articles = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/articles',
    generateId: idFrom(articlePath, '{category}/{kebab-case-slug}.md'),
  }),
  schema: articleSchema,
});

const benefits = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/benefits',
    generateId: idFrom(benefitPath, '{kebab-case-slug}.md, 하위 폴더 없음'),
  }),
  schema: benefitSchema,
});

export const collections = { articles, benefits };
