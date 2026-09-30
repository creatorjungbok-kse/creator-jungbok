// 글 분량별 광고 슬롯(03 6장, Phase A 보수적 축소). 분량은 본문 H2(섹션) 수로 나눈다.
// - article: 4개 이하 top / 5개 이상 top·mid·lower (change 글은 한 단계 보수적으로 8개 이상부터, top 없음)
// - benefit: mid 1개
// 글 데이터의 ads 값이 기본값을 덮어쓴다(03 15장).
import { adsEnabled, type AdSlotId } from '../config/ads';
import type { ContentItem } from './content';

type SlotName = 'top' | 'mid' | 'lower';

export function contentAdSlots(item: ContentItem, sections: number): Set<SlotName> {
  const ads = item.entry.data.ads;
  if (!adsEnabled || ads?.enabled === false) return new Set();
  const change = item.kind === 'article' && item.entry.data.contentType === 'change';
  const long = item.kind === 'article' && sections >= (change ? 8 : 5);
  const slots = new Set<SlotName>(item.kind === 'benefit' ? ['mid'] : long ? ['top', 'mid', 'lower'] : ['top']);
  for (const [name, on] of Object.entries(ads?.slots ?? {}) as [SlotName, boolean | undefined][]) {
    if (on === true) slots.add(name);
    if (on === false) slots.delete(name);
  }
  // change 글은 top을 두지 않는다(요약·적용 시점 바로 뒤라 모바일 첫 화면에 들어온다)
  if (change) slots.delete('top');
  return slots;
}

// 모바일(약 390px 폭)에서 HTML이 차지할 높이 추정(px). [가정] 한 줄 18자·27px, 표 행 48px, 제목 44px, 문단 16px·목록 8px 간격
function mobileHeight(html: string): number {
  const count = (re: RegExp) => (html.match(re) ?? []).length;
  const chars = html.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
  return Math.ceil(chars / 18) * 27 + count(/<tr[\s>]/g) * 48 + count(/<h[2-4][\s>]/g) * 44 + count(/<p[\s>]/g) * 16 + count(/<li[\s>]/g) * 8;
}

// article-top 자리 = 본문 H2 순번(1부터 before 미만) 중, 그 앞 본문 높이 + 본문 위 블록 높이(extraAbove)가 기준 이상인 첫 자리.
// 머리·요약·목차(모바일 약 460px 이상) 아래로 이만큼 더 내려가야 390×844 첫 화면 밖이 된다. 없으면 top을 두지 않는다
const MIN_ABOVE_TOP = 500;
export function topCut(html: string, extraAbove: number, before: number): number | undefined {
  const starts = [...html.matchAll(/<h2[\s>]/g)].map((m) => m.index);
  for (let k = 1; k < Math.min(starts.length, before); k++) if (mobileHeight(html.slice(0, starts[k])) + extraAbove >= MIN_ABOVE_TOP) return k;
  return undefined;
}

// 본문 HTML을 지정한 H2 순번(0부터) 앞에서 나누고, 나눈 자리마다 광고 슬롯을 붙인다. 본문에 없는 순번은 건너뛴다.
export function splitBody(html: string, cuts: { h2: number; id: AdSlotId }[]): { html: string; adBefore?: AdSlotId }[] {
  const starts = [...html.matchAll(/<h2[\s>]/g)].map((m) => m.index);
  const parts: { html: string; adBefore?: AdSlotId }[] = [];
  let from = 0;
  let adBefore: AdSlotId | undefined;
  for (const cut of [...cuts].sort((a, b) => a.h2 - b.h2)) {
    const at = starts[cut.h2];
    if (at === undefined || cut.h2 === 0) continue;
    parts.push({ html: html.slice(from, at), adBefore });
    from = at;
    adBefore = cut.id;
  }
  parts.push({ html: html.slice(from), adBefore });
  return parts;
}
