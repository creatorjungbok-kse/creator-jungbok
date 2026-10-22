// 컬렉션을 하나의 목록으로 합치고 URL을 계산한다. 공개 URL의 계산은 이 파일에서만 한다.
// 글 사이의 검증도 여기서 한 번만 실행한다(빌드 실패).
// dev·test fixture(src/dev/content/)는 isShellPreview일 때만 포함한다. production에는 절대 들어가지 않는다.
import { getCollection, type CollectionEntry } from 'astro:content';
import { isShellPreview } from '../config/env';
import { categories, categoryHref, primaryNavMinPosts, type Category } from '../data/categories';
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

// table-cards(모바일에서 카드로 바뀌는 표) 본문 칸에 굵은 글씨와 보통 글씨가 섞이면 카드에서 굵은 부분이 따로 떨어진 줄로 보인다(2026-10-22 발견).
// 그 표의 본문 행에서 섞인 칸만 금지한다. 칸 전체 굵게·머리 행·일반 표·본문 강조는 허용.
export function tableCardBoldLines(body: string): number[] {
  const bad: number[] = [];
  let inCards = false;
  let row = 0;
  body.split('\n').forEach((line, i) => {
    const t = line.trim();
    if (/^<div class="table-cards">/.test(t)) {
      inCards = true;
      row = 0;
      return;
    }
    if (inCards && t.startsWith('</div>')) {
      inCards = false;
      return;
    }
    if (!inCards) return;
    if (!t.startsWith('|')) {
      row = 0;
      return;
    }
    row++;
    if (row <= 2) return;
    // 칸 전체가 굵은 글씨면 괜찮고, 굵은 글씨와 보통 글씨가 섞인 칸만 갈라진다
    const cells = t.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (cells.some((c) => c.includes('**') && !/^\*\*[^*]+\*\*$/.test(c))) bad.push(i + 1);
  });
  return bad;
}

// 오류 줄 번호 계산용 원본 마크다운(검증 실패 메시지에만 쓴다)
const rawSources = import.meta.glob<string>(['/src/content/**/*.md', '/src/dev/content/**/*.md'], { query: '?raw', import: 'default', eager: true });

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

    const body = item.entry.body ?? '';
    const bold = tableCardBoldLines(body);
    if (bold.length) {
      // 오류 위치는 원본 파일의 줄 번호로 알려 준다
      let offset = 0;
      const raw = rawSources[`/${item.entry.filePath ?? ''}`] ?? '';
      const at = raw.indexOf(body);
      if (at > 0) offset = raw.slice(0, at).split('\n').length - 1;
      for (const n of bold) errors.push(`${where(item)}: table-cards 표 칸에 굵은 글씨와 보통 글씨가 섞임(${item.entry.filePath ?? ''} ${n + offset}번째 줄)`);
    }
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

// 공개 글이 1개 이상인 대분류(categories 배열 순서 유지). 글이 0개인 대분류는 nav·홈·footer·sitemap에서 빠지고
// 허브는 noindex가 된다(직접 접근하면 빈 상태 화면). 첫 글이 생기면 코드 수정 없이 다시 나타난다.
// production은 fixture를 포함하지 않으므로 preview fixture가 production 결과를 바꾸지 않는다.
export async function activeCategories(): Promise<Category[]> {
  const all = await getAllContent();
  return categories.filter((c) => all.some((i) => i.category === c.slug));
}

export const activeCategoryLinks = async () => (await activeCategories()).map((c) => ({ href: categoryHref(c), title: c.name }));

// 상단 메뉴·홈 카테고리 영역·footer에 보일 대분류: 공개 글 수가 primaryNavMinPosts(기본 1) 이상(categories 배열 순서 유지).
// 기준 미달이어도 카테고리 페이지·글·sidebar·sitemap·사이트 검색에는 정상 노출된다(activeCategories)
export async function primaryNavCategories(): Promise<Category[]> {
  const all = await getAllContent();
  return categories.filter((c) => all.filter((i) => i.category === c.slug).length >= primaryNavMinPosts(c));
}
export const primaryNavCategoryLinks = async () => (await primaryNavCategories()).map((c) => ({ href: categoryHref(c), title: c.name }));

export const hasPublicContent = async (slug: string) => (await getAllContent()).some((i) => i.category === slug);
