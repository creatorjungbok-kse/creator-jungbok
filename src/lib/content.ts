// 컬렉션을 하나의 목록으로 합치고 URL을 계산한다. 공개 URL의 계산은 이 파일에서만 한다.
// 글 사이의 검증도 여기서 한 번만 실행한다(빌드 실패).
// dev·test fixture(src/dev/content/)는 isShellPreview일 때만 포함한다. production에는 절대 들어가지 않는다.
import { getCollection, type CollectionEntry } from 'astro:content';
import { isShellPreview } from '../config/env';
import { categories } from '../data/categories';
import { genericTerms } from '../data/synonyms';
import { normalize } from './search';

type ArticleEntry = CollectionEntry<'articles'> | CollectionEntry<'fixtureArticles'>;
type BenefitEntry = CollectionEntry<'benefits'> | CollectionEntry<'fixtureBenefits'>;

export type ContentItem =
  | { kind: 'article'; category: string; slug: string; url: string; entry: ArticleEntry }
  | { kind: 'benefit'; category: 'benefits'; slug: string; url: string; entry: BenefitEntry };

const toItem = {
  article: (entry: ArticleEntry): ContentItem => {
    const [category, slug] = entry.id.split('/');
    return { kind: 'article', category, slug, url: `/${category}/${slug}/`, entry };
  },
  benefit: (entry: BenefitEntry): ContentItem => ({
    kind: 'benefit',
    category: 'benefits',
    slug: entry.id,
    url: `/benefits/${entry.id}/`,
    entry,
  }),
};

// primaryQuery 비교용: 검색과 같은 정규화(공백·문장부호 제거, 동의어 통일) 후 일반어 제거(02 6장)
function normalizeQuery(q: string) {
  let s = normalize(q);
  for (const term of genericTerms) s = s.replaceAll(term, '');
  return s;
}

function validate(items: ContentItem[]) {
  const errors: string[] = [];
  const where = (i: ContentItem) => `${i.entry.collection}/${i.entry.id}`;
  const byUrl = new Map<string, ContentItem>();
  const byQuery = new Map<string, ContentItem>();

  for (const item of items) {
    const { data } = item.entry;
    const category = categories.find((c) => c.slug === item.category)!;
    const subSlugs = category.subcategories.map((s) => s.slug);

    const other = byUrl.get(item.url);
    if (other) errors.push(`공개 URL 충돌 ${item.url}: ${where(other)} ↔ ${where(item)}`);
    byUrl.set(item.url, item);

    // 중분류 허브(/category/subcategory/)와 pagination 경로는 글 slug로 쓸 수 없다
    if (subSlugs.includes(item.slug) || item.slug === 'page') errors.push(`${where(item)}: 예약된 slug ${item.slug}`);
    if (!subSlugs.includes(data.subcategory)) errors.push(`${where(item)}: ${item.category}에 없는 subcategory ${data.subcategory}`);
    if (item.kind === 'article' && item.category === 'benefits' && !['guide', 'change'].includes(item.entry.data.contentType)) {
      errors.push(`${where(item)}: benefits 카테고리의 일반 글은 guide·change만 가능`);
    }

    const key = normalizeQuery(data.primaryQuery);
    const dup = byQuery.get(key);
    if (dup) errors.push(`primaryQuery 중복: ${where(dup)} ↔ ${where(item)} (${data.primaryQuery})`);
    byQuery.set(key, item);
  }

  for (const item of items) {
    const { data } = item.entry;
    const pillar = item.kind === 'article' ? item.entry.data.pillar : undefined;
    const links = [...(data.related ?? []), ...(pillar ? [pillar] : [])];
    for (const url of links) {
      if (!byUrl.has(url)) errors.push(`${where(item)}: 존재하지 않는 글 링크 ${url}`);
      if (url === item.url) errors.push(`${where(item)}: 자기 자신을 링크 ${url}`);
    }
  }

  if (errors.length) throw new Error(`콘텐츠 검증 실패\n- ${errors.join('\n- ')}`);
}

let cache: Promise<ContentItem[]> | undefined;

export function getAllContent(): Promise<ContentItem[]> {
  cache ??= (async () => {
    const items = [
      ...(await getCollection('articles')).map(toItem.article),
      ...(await getCollection('benefits')).map(toItem.benefit),
      ...(isShellPreview
        ? [...(await getCollection('fixtureArticles')).map(toItem.article), ...(await getCollection('fixtureBenefits')).map(toItem.benefit)]
        : []),
    ];
    validate(items);
    return items;
  })();
  return cache;
}
