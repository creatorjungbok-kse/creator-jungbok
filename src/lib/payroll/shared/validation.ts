// 공통 숫자 파싱·범위 검사(급여 계열 도구 공용). 특정 제도의 규칙(주 15시간·개근 등)은 넣지 않는다.
// 문자열을 바로 정수(스케일 정수)로 바꾼다 — Number('17.5') * 10 같은 실수 연산을 거치지 않는다.

export type ParseCode = 'empty' | 'format' | 'step' | 'range';
export type Parsed = { ok: true; value: number } | { ok: false; code: ParseCode };

const clean = (raw: string) => raw.trim().replace(/,/g, '');

// 원 단위 정수(쉼표 허용). 예: '10,320' → 10320
export function parseWonInt(raw: string, range: { min: number; max: number }): Parsed {
  const s = clean(raw);
  if (s === '') return { ok: false, code: 'empty' };
  if (!/^\d+$/.test(s)) return { ok: false, code: 'format' };
  if (s.replace(/^0+/, '').length > 15) return { ok: false, code: 'range' };
  const value = Number(s);
  if (value < range.min || value > range.max) return { ok: false, code: 'range' };
  return { ok: true, value };
}

// 소수 자릿수가 정해진 수를 10^decimals 배 정수로. 예: decimals 1, '17.5' → 175
// step·min·max는 스케일 정수 단위(예: 0.5시간 단위 = step 5)
export function parseScaled(raw: string, o: { decimals: number; step: number; min: number; max: number }): Parsed {
  const s = clean(raw);
  if (s === '') return { ok: false, code: 'empty' };
  const m = s.match(/^(\d+)(?:\.(\d+))?$/);
  if (!m) return { ok: false, code: 'format' };
  const [, whole, frac = ''] = m;
  // 정해진 자릿수보다 긴 소수: 뒤가 모두 0이면 허용(17.50), 아니면 단위 오류
  if (frac.length > o.decimals && !/^0+$/.test(frac.slice(o.decimals))) return { ok: false, code: 'step' };
  if (whole.replace(/^0+/, '').length > 12) return { ok: false, code: 'range' };
  const value = Number(whole) * 10 ** o.decimals + Number(frac.slice(0, o.decimals).padEnd(o.decimals, '0') || '0');
  if (value % o.step !== 0) return { ok: false, code: 'step' };
  if (value < o.min || value > o.max) return { ok: false, code: 'range' };
  return { ok: true, value };
}
