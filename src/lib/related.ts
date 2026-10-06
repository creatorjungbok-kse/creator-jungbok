// 관련 글 계산("다음에 볼 정보"). 같은 입력이면 항상 같은 결과(빌드 시점 결정적).
// 순서: 수동 related → pillar → 같은 주제(같은 category 먼저). 같은 주제가 아니면 채우지 않는다(빈칸 채우기 없음).
// 자기 자신과 신청 종료된 지원사업은 제외한다. 같은 단계 안에서는 최근 수정일, URL 순. 최대 3개.
// relatedAuto: false인 글은 manual-only: related에 직접 적은 글만 그 순서대로 쓴다(pillar·같은 주제 채움 없음, 비면 0개).
import { benefitStatus } from './benefit-status.ts';
import type { ContentItem } from './content';

const RELATED_MAX = 3;

const isClosed = (i: ContentItem) => i.kind === 'benefit' && benefitStatus(i.entry.data.program).status === 'closed';

const byRecent = (a: ContentItem, b: ContentItem) =>
  +b.entry.data.dateModified - +a.entry.data.dateModified || a.url.localeCompare(b.url);

export function relatedItems(item: ContentItem, all: ContentItem[]): ContentItem[] {
  const { data } = item.entry;
  const byUrl = new Map(all.map((i) => [i.url, i]));
  const usable = (i: ContentItem) => i !== item && !isClosed(i);

  if (data.relatedAuto === false) {
    const manualOnly = (data.related ?? []).map((url) => byUrl.get(url)!);
    return [...new Set(manualOnly)].filter(usable).slice(0, RELATED_MAX);
  }

  const pillar = item.kind === 'article' ? item.entry.data.pillar : undefined;
  const manual = [...(data.related ?? []), ...(pillar ? [pillar] : [])].map((url) => byUrl.get(url)!);

  const sameTopic = all.filter((i) => i !== item && i.entry.data.topics.some((t) => data.topics.includes(t))).sort(byRecent);
  const tiers = [sameTopic.filter((i) => i.category === item.category), sameTopic];

  return [...new Set([...manual, ...tiers.flat()])].filter(usable).slice(0, RELATED_MAX);
}
