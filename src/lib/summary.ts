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

// 핵심 요약 한 줄을 HTML로 만든다. 숫자+단위(금액·횟수·%·기간·버전)와 summaryBold에 적은 말을 <strong>으로 감싼다.
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// 날짜(년·월·일)는 너무 많아 빼고, 금액·비율·횟수·기간·버전 번호만 자동으로 굵게
const NUM = /\d+\.\d+\.\d+|\d[\d,.]*(?:\s?(?:%|원|만원|억원|억|천원|회|개월|세(?!대)|시간|분|명|배|건|개|kWh|달러))+/g;
export function emphasizeSummary(line: string, bold: string[] = []): string {
  const marks: [number, number][] = [];
  for (const b of bold) { let i = line.indexOf(b); while (i >= 0) { marks.push([i, i + b.length]); i = line.indexOf(b, i + b.length); } }
  for (const m of line.matchAll(NUM)) marks.push([m.index!, m.index! + m[0].length]);
  marks.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged: [number, number][] = [];
  for (const [s, e] of marks) { const last = merged[merged.length - 1]; if (last && s <= last[1]) last[1] = Math.max(last[1], e); else merged.push([s, e]); }
  let out = '', pos = 0;
  for (const [s, e] of merged) { out += esc(line.slice(pos, s)) + '<strong>' + esc(line.slice(s, e)) + '</strong>'; pos = e; }
  return out + esc(line.slice(pos));
}
