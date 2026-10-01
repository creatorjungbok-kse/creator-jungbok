// 알뜰폰 요금제 A/B 예상 총비용 비교(순수 함수). 실제 통신사 가격은 저장하지 않는다 — 사용자가 입력한 값만 계산한다.
// 외부 import 없음: 화면 스크립트·node 테스트가 같은 함수를 쓴다.

// 입력 범위(원·개월, 정수)
export const limits = {
  price: { min: 0, max: 200_000, unit: '원' },
  promoMonths: { min: 1, max: 60, unit: '개월' },
  oneTime: { min: 0, max: 200_000, unit: '원' },
  current: { min: 0, max: 300_000, unit: '원' },
} as const;
// 결과에 함께 보여 주는 기간
export const horizons = [12, 24] as const;

export type Plan =
  // 기간 할인: 할인 개월 동안 할인 월요금, 이후 종료 후 월요금
  | { kind: 'period'; promoPrice: number; promoMonths: number; regularPrice: number; oneTime: number }
  // 종료 시점 없음: 같은 월요금 유지
  | { kind: 'flat'; price: number; oneTime: number };

export function planTotal(plan: Plan, months: number): number {
  if (plan.kind === 'flat') return plan.price * months + plan.oneTime;
  const promo = Math.min(plan.promoMonths, months);
  return plan.promoPrice * promo + plan.regularPrice * (months - promo) + plan.oneTime;
}

// 월평균: 원 단위 반올림(0.5원은 올림). 정수 연산
export const monthlyAverage = (total: number, months: number) => Math.floor((2 * total + months) / (2 * months));

export interface HorizonResult {
  months: number;
  totalA: number;
  totalB: number;
  averageA: number;
  averageB: number;
  // 두 총액 차이(0 이상)와 적게 드는 쪽(같으면 null)
  difference: number;
  lower: 'a' | 'b' | null;
  // 현재 통신비 × 기간 - 총액(양수 = 현재보다 적게 듦). 현재 통신비를 넣지 않으면 없음
  vsCurrentA?: number;
  vsCurrentB?: number;
}

export function comparePlans(a: Plan, b: Plan, currentMonthly?: number): HorizonResult[] {
  return horizons.map((months) => {
    const totalA = planTotal(a, months);
    const totalB = planTotal(b, months);
    const current = currentMonthly === undefined ? undefined : currentMonthly * months;
    return {
      months,
      totalA,
      totalB,
      averageA: monthlyAverage(totalA, months),
      averageB: monthlyAverage(totalB, months),
      difference: Math.abs(totalA - totalB),
      lower: totalA === totalB ? null : totalA < totalB ? 'a' : 'b',
      ...(current === undefined ? {} : { vsCurrentA: current - totalA, vsCurrentB: current - totalB }),
    };
  });
}

// ── 입력 검증 ──
type Limit = { min: number; max: number; unit: string };
export type Field<T> = { ok: true; value: T } | { ok: false; error: string };

// 정수 입력(쉼표 허용). 비어 있으면 필수는 오류, 선택은 undefined
export function parseInteger(raw: string, limit: Limit, required: string | false): Field<number | undefined> {
  const s = raw.trim().replace(/,/g, '');
  const range = `${limit.min.toLocaleString('ko-KR')}~${limit.max.toLocaleString('ko-KR')}${limit.unit} 사이의 정수로 입력하세요.`;
  if (s === '') return required ? { ok: false, error: `${required}${hasFinalConsonant(required) ? '을' : '를'} 입력하세요. ${range}` } : { ok: true, value: undefined };
  if (!/^\d+$/.test(s)) return { ok: false, error: range };
  const value = Number(s);
  if (value < limit.min || value > limit.max) return { ok: false, error: range };
  return { ok: true, value };
}

export interface PlanInput {
  kind: 'period' | 'flat';
  price: string;
  promoMonths: string;
  regularPrice: string;
  oneTime: string;
}
export type PlanField = 'price' | 'promoMonths' | 'regularPrice' | 'oneTime';

// 요금제 한 개의 입력 → Plan 또는 칸별 오류
export function readPlan(input: PlanInput): { ok: true; plan: Plan } | { ok: false; errors: Partial<Record<PlanField, string>> } {
  const errors: Partial<Record<PlanField, string>> = {};
  const take = (field: PlanField, raw: string, limit: Limit, required: string | false) => {
    const r = parseInteger(raw, limit, required);
    if (!r.ok) errors[field] = r.error;
    return r.ok ? r.value : undefined;
  };
  const price = take('price', input.price, limits.price, input.kind === 'period' ? '할인 월요금' : '월요금');
  const oneTime = take('oneTime', input.oneTime, limits.oneTime, false) ?? 0;
  if (input.kind === 'flat') {
    return Object.keys(errors).length ? { ok: false, errors } : { ok: true, plan: { kind: 'flat', price: price!, oneTime } };
  }
  const promoMonths = take('promoMonths', input.promoMonths, limits.promoMonths, '할인 개월 수');
  const regularPrice = take('regularPrice', input.regularPrice, limits.price, '할인 종료 후 월요금');
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, plan: { kind: 'period', promoPrice: price!, promoMonths: promoMonths!, regularPrice: regularPrice!, oneTime } };
}

// ── 화면 문구 ──
export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
export const defaultNames = { a: '요금제 A', b: '요금제 B' } as const;

// 조사(이/가, 을/를): 마지막 글자(뒤쪽 기호·괄호 제외)의 받침으로 고른다. 영문·숫자는 한국어 읽기 기준
const LATIN_FINAL = new Set(['l', 'm', 'n', 'r']);
const DIGIT_FINAL = new Set(['0', '1', '3', '6', '7', '8']);
function hasFinalConsonant(word: string): boolean {
  const ch = word.replace(/[^0-9A-Za-z가-힣]+$/, '').slice(-1);
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/\d/.test(ch)) return DIGIT_FINAL.has(ch);
  return LATIN_FINAL.has(ch.toLowerCase());
}
export const subjectParticle = (name: string): '이' | '가' => (hasFinalConsonant(name) ? '이' : '가');

// '12개월 기준 요금제 B가 2,800원 적게 듭니다.' / '12개월 기준 두 요금제의 예상 총액이 같습니다.'
export function differenceSentence(r: HorizonResult, names: { a: string; b: string }): string {
  if (r.lower === null) return `${r.months}개월 기준 두 요금제의 예상 총액이 같습니다.`;
  const name = names[r.lower];
  return `${r.months}개월 기준 ${name}${subjectParticle(name)} ${won(r.difference)} 적게 듭니다.`;
}

// 현재 통신비 대비. 더 드는 경우를 '절약'으로 쓰지 않는다
export function vsCurrentText(v: number): string {
  if (v === 0) return '현재 요금과 같습니다.';
  return v > 0 ? `현재 요금보다 ${won(v)} 적게 듭니다.` : `현재 요금보다 ${won(-v)} 더 듭니다.`;
}
