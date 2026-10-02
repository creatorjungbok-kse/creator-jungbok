// 검색 정규화·점수화. 빌드(인덱스 생성, primaryQuery 중복 검사)와 브라우저(/search/)가 같은 코드를 쓴다.
// 외부 의존 없는 순수 함수로 유지한다(node 테스트에서 직접 import).
import { searchSuffixTerms, synonymGroups } from '../data/synonyms.ts';

// 비교용 형태: 소문자·NFC, 공백·문장부호 제거, 동의어는 묶음의 첫 단어로 통일
export function normalize(text: string): string {
  let s = text.normalize('NFC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
  for (const group of synonymGroups) for (const word of group.slice(1)) s = s.replaceAll(word, group[0]);
  return s;
}

// 검색어 → 핵심어 목록. 끝에 붙은 "비용·가격…"은 떼되, 떼고 나면 아무것도 없으면 그대로 둔다
export function queryTerms(q: string): string[] {
  const terms = q.split(/\s+/).map(normalize).filter(Boolean);
  const core = terms
    .map((t) => {
      const suffix = searchSuffixTerms.find((g) => t.endsWith(g) && t.length > g.length);
      return suffix ? t.slice(0, -suffix.length) : t;
    })
    .filter((t) => !(searchSuffixTerms as readonly string[]).includes(t));
  return core.length ? core : terms;
}

type SearchStatus = 'upcoming' | 'open' | 'closing-soon' | 'paused' | 'closed';

// /search-index.json 한 항목. 화면 표시용 값 + 비교용 정규화 값(t·s·m)
export interface SearchDoc {
  url: string;
  title: string;
  category: string;
  categoryName: string;
  type: 'cost' | 'compare' | 'guide' | 'change' | 'benefit';
  summary: string;
  // 지원사업: 빌드 시점 상태·신청 기간·혜택 요약 / cost: 첫 가격 항목
  status?: SearchStatus;
  detail?: string;
  updated: string;
  t: string;
  s: string;
  m: string;
}

// 필드 가중치: 제목 → 동의어(primaryQuery·synonyms·중분류) → 요약(01 G)
const WEIGHT = { t: 100, s: 30, m: 10 } as const;
// 제목 전체가 검색어와 같거나 검색어를 이어 붙인 형태를 포함할 때
const EXACT_TITLE = 1000;
const TITLE_PHRASE = 200;
// 신청 가능한 지원은 같은 단계 안에서 앞으로(제목 일치 단계를 넘지는 않음)
const OPEN_BOOST = 25;

function score(doc: SearchDoc, terms: string[]): number {
  let total = 0;
  for (const term of terms) {
    const best = (['t', 's', 'm'] as const).find((f) => doc[f].includes(term));
    if (!best) return 0; // 모든 핵심어가 어딘가에 있어야 한다
    total += WEIGHT[best];
  }
  const phrase = terms.join('');
  if (doc.t === phrase) total += EXACT_TITLE;
  else if (terms.length > 1 && doc.t.includes(phrase)) total += TITLE_PHRASE;
  if (doc.status === 'open' || doc.status === 'closing-soon') total += OPEN_BOOST;
  return total;
}

interface SearchOptions {
  category?: string;
  openOnly?: boolean;
}

// 정렬: 신청 종료는 항상 뒤 → 점수 → 최근 업데이트 → URL
export function search(docs: SearchDoc[], q: string, { category, openOnly }: SearchOptions = {}): SearchDoc[] {
  const terms = queryTerms(q);
  if (!terms.length) return [];
  return docs
    .filter((d) => (!category || d.category === category) && (!openOnly || d.status === 'open' || d.status === 'closing-soon'))
    .map((doc) => ({ doc, score: score(doc, terms) }))
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        Number(a.doc.status === 'closed') - Number(b.doc.status === 'closed') ||
        b.score - a.score ||
        b.doc.updated.localeCompare(a.doc.updated) ||
        a.doc.url.localeCompare(b.doc.url),
    )
    .map((r) => r.doc);
}
