// 글 요약(summary)을 '핵심 요약' 목록 항목으로 나눈다.
// 문장 끝(다. 요. 죠. 니다. 등 한글 뒤 마침표·물음표·느낌표) 다음 공백에서만 자른다.
// 3.3%, 2026.9.1 같은 숫자 속 점에서는 자르지 않는다.
export function splitSummary(summary: string): string[] {
  return summary
    .trim()
    .split(/(?<=[가-힣)][.!?])\s+(?=\S)/)
    .map((s) => s.trim())
    .filter(Boolean);
}
