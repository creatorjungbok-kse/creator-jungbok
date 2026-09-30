// 관련 글 계산. 같은 입력이면 항상 같은 결과(빌드 시점 결정적).
// 순서: 수동 related → pillar → 같은 category+주제 → 같은 category → 같은 주제.
// 자기 자신과 신청 종료된 지원사업은 제외한다. 같은 단계 안에서는 최근 수정일, URL 순.
import { benefitStatus } from './benefit-status';
import type { ContentItem } from './content';

const isClosed = (i: ContentItem) => i.kind === 'benefit' && benefitStatus(i.entry.data.program).status === 'closed';

const byRecent = (a: ContentItem, b: ContentItem) =>
  +b.entry.data.dateModified - +a.entry.data.dateModified || a.url.localeCompare(b.url);

export function relatedItems(item: ContentItem, all: ContentItem[]): ContentItem[] {
  const { data } = item.entry;
  const byUrl = new Map(all.map((i) => [i.url, i]));
  const pillar = item.kind === 'article' ? item.entry.data.pillar : undefined;
  const manual = [...(data.related ?? []), ...(pillar ? [pillar] : [])].map((url) => byUrl.get(url)!);

  const sharesTopic = (i: ContentItem) => i.entry.data.topics.some((t) => data.topics.includes(t));
  const sameCategory = (i: ContentItem) => i.category === item.category;
  const others = all.filter((i) => i !== item).sort(byRecent);
  const tiers = [
    others.filter((i) => sameCategory(i) && sharesTopic(i)),
    others.filter(sameCategory),
    others.filter(sharesTopic),
  ];

  return [...new Set([...manual, ...tiers.flat()])].filter((i) => i !== item && !isClosed(i));
}
