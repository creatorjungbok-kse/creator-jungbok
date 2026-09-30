// 홈·대분류·benefits 허브의 목록 선택 규칙(01 D·E, 02 5·13·14장). 같은 입력이면 항상 같은 결과.
// 인기·검색량 데이터가 없으므로 "많이 찾는" 류의 선택은 하지 않는다(01 D: 근거 없는 인기 표기 금지).
import { benefitStatus, type BenefitStatus } from './benefit-status';
import type { ContentItem } from './content';

export const statusOf = (i: ContentItem): BenefitStatus | undefined =>
  i.kind === 'benefit' ? benefitStatus(i.entry.data.program).status : undefined;

const time = (d: Date | undefined, fallback: number) => (d ? +d : fallback);
const byUrl = (a: ContentItem, b: ContentItem) => a.url.localeCompare(b.url);
const newest = (key: 'dateModified' | 'datePublished' | 'researchedAt') => (a: ContentItem, b: ContentItem) =>
  +b.entry.data[key] - +a.entry.data[key] || byUrl(a, b);
const sorted = (items: ContentItem[], compare: (a: ContentItem, b: ContentItem) => number) => [...items].sort(compare);

export const latestModified = (items: ContentItem[]) => sorted(items, newest('dateModified'));
export const latestPublished = (items: ContentItem[]) => sorted(items, newest('datePublished'));

// 실제 내용이 바뀐 글(changelog가 있는 수정)만. 날짜만 올린 글은 schema가 막는다.
export const recentlyUpdated = (items: ContentItem[]) =>
  latestModified(items.filter((i) => +i.entry.data.dateModified !== +i.entry.data.datePublished));

// 최근 조사한 비용: cost 글, 조사 기준일 순
export const recentCosts = (items: ContentItem[]) =>
  sorted(items.filter((i) => i.kind === 'article' && i.entry.data.contentType === 'cost'), newest('researchedAt'));

// 대표 콘텐츠: 다른 글이 pillar로 가리키는 Pillar 글(02 5장). Supporting이 많은 순 → 최근 수정 순
export function pillars(items: ContentItem[], all: ContentItem[]) {
  const supporters = new Map<string, number>();
  for (const i of all) {
    const p = i.kind === 'article' ? i.entry.data.pillar : undefined;
    if (p) supporters.set(p, (supporters.get(p) ?? 0) + 1);
  }
  return sorted(
    items.filter((i) => supporters.has(i.url)),
    (a, b) => supporters.get(b.url)! - supporters.get(a.url)! || newest('dateModified')(a, b),
  );
}

// Timely 글(신청 종료 지원 제외): 홈 "최근 확인할 돈 정보". 관심도 데이터가 없으므로 인기를 암시하는 제목을 쓰지 않는다
export const timely = (items: ContentItem[]) =>
  latestPublished(items.filter((i) => i.entry.data.contentMode === 'timely' && statusOf(i) !== 'closed'));

// ── 지원사업 상태별 ─────────────────────────────────
const programOf = (i: ContentItem) => (i.kind === 'benefit' ? i.entry.data.program : undefined);
const FAR = Number.MAX_SAFE_INTEGER;

// 지금 신청 가능(마감 임박 우선 → 종료일 빠른 순 → 상시·예산 소진은 뒤)
export const openBenefits = (items: ContentItem[]) =>
  sorted(
    items.filter((i) => statusOf(i) === 'open' || statusOf(i) === 'closing-soon'),
    (a, b) =>
      Number(statusOf(b) === 'closing-soon') - Number(statusOf(a) === 'closing-soon') ||
      time(programOf(a)!.application.end, FAR) - time(programOf(b)!.application.end, FAR) ||
      byUrl(a, b),
  );

// 곧 시작(시작일 빠른 순)
export const upcomingBenefits = (items: ContentItem[]) =>
  sorted(
    items.filter((i) => statusOf(i) === 'upcoming'),
    (a, b) => time(programOf(a)!.application.start, FAR) - time(programOf(b)!.application.start, FAR) || byUrl(a, b),
  );

// 종료(최근 종료 순)
export const closedBenefits = (items: ContentItem[]) =>
  sorted(
    items.filter((i) => statusOf(i) === 'closed'),
    (a, b) => time(programOf(b)!.application.end, 0) - time(programOf(a)!.application.end, 0) || byUrl(a, b),
  );
