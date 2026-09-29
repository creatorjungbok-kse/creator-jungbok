// 두 컬렉션을 하나의 목록으로 합치고 URL을 계산한다. 공개 URL의 계산은 이 파일에서만 한다.
// 글 사이의 검증도 여기서 한 번만 실행한다(빌드 실패).
import { getCollection, type CollectionEntry } from 'astro:content';
import { categories } from '../data/categories';
import { genericTerms, synonymGroups } from '../data/synonyms';

type ContentItem =
  | { collection: 'articles'; category: string; slug: string; url: string; entry: CollectionEntry<'articles'> }
  | { collection: 'benefits'; category: 'benefits'; slug: string; url: string; entry: CollectionEntry<'benefits'> };

const toItem = {
  articles: (entry: CollectionEntry<'articles'>): ContentItem => {
    const [category, slug] = entry.id.split('/');
    return { collection: 'articles', category, slug, url: `/${category}/${slug}/`, entry };
  },
  benefits: (entry: CollectionEntry<'benefits'>): ContentItem => ({
    collection: 'benefits',
    category: 'benefits',
    slug: entry.id,
    url: `/benefits/${entry.id}/`,
    entry,
  }),
};

// primaryQuery 비교용: 공백·일반어 제거, 동의어는 묶음의 첫 단어로 통일(02 6장)
function normalizeQuery(q: string) {
  let s = q.replace(/\s+/g, '');
  for (const group of synonymGroups) for (const word of group.slice(1)) s = s.replaceAll(word, group[0]);
  for (const term of genericTerms) s = s.replaceAll(term, '');
  return s;
}

function validate(items: ContentItem[]) {
  const errors: string[] = [];
  const where = (i: ContentItem) => `${i.collection}/${i.entry.id}`;
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
    if (item.collection === 'articles' && item.category === 'benefits' && !['guide', 'change'].includes(item.entry.data.contentType)) {
      errors.push(`${where(item)}: benefits 카테고리의 일반 글은 guide·change만 가능`);
    }

    const key = normalizeQuery(data.primaryQuery);
    const dup = byQuery.get(key);
    if (dup) errors.push(`primaryQuery 중복: ${where(dup)} ↔ ${where(item)} (${data.primaryQuery})`);
    byQuery.set(key, item);
  }

  for (const item of items) {
    const { data } = item.entry;
    const pillar = item.collection === 'articles' ? item.entry.data.pillar : undefined;
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
      ...(await getCollection('articles')).map(toItem.articles),
      ...(await getCollection('benefits')).map(toItem.benefits),
    ];
    validate(items);
    return items;
  })();
  return cache;
}
