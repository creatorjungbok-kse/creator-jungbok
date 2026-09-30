// 글 분량별 광고 슬롯(03 6장, Phase A 보수적 축소). 분량은 본문 H2(섹션) 수로 나눈다.
// - article: 4개 이하 top / 5개 이상 top·mid·lower (change 글은 한 단계 보수적으로 8개 이상부터)
// - benefit: mid 1개
// 글 데이터의 ads 값이 기본값을 덮어쓴다(03 15장).
import { adsEnabled } from '../config/ads';
import type { ContentItem } from './content';

type SlotName = 'top' | 'mid' | 'lower';

export function contentAdSlots(item: ContentItem, sections: number): Set<SlotName> {
  const ads = item.entry.data.ads;
  if (!adsEnabled || ads?.enabled === false) return new Set();
  const long = item.kind === 'article' && sections >= (item.entry.data.contentType === 'change' ? 8 : 5);
  const slots = new Set<SlotName>(item.kind === 'benefit' ? ['mid'] : long ? ['top', 'mid', 'lower'] : ['top']);
  for (const [name, on] of Object.entries(ads?.slots ?? {}) as [SlotName, boolean | undefined][]) {
    if (on === true) slots.add(name);
    if (on === false) slots.delete(name);
  }
  return slots;
}

// 본문 HTML을 가운데 H2 앞에서 둘로 나눈다(article-mid 자리). H2가 2개 미만이면 나누지 않는다.
export function splitAtMiddleH2(html: string): [string, string] {
  const starts = [...html.matchAll(/<h2[\s>]/g)].map((m) => m.index);
  if (starts.length < 2) return [html, ''];
  const at = starts[Math.floor(starts.length / 2)];
  return [html.slice(0, at), html.slice(at)];
}
