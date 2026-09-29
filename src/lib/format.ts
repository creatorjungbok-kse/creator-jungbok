// 화면 표시용 형식 변환. 값은 바꾸지 않고 표현만 만든다(가격 추정 금지).

// 콘텐츠 날짜는 frontmatter의 YYYY-MM-DD(UTC 자정)이므로 UTC 기준으로 읽는다.
export function formatDate(d: Date, precision: 'day' | 'month' = 'day') {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return precision === 'month' ? `${y}.${m}` : `${y}.${m}.${day}`;
}


interface PriceLike {
  min?: number;
  max?: number;
  text?: string;
  unit: '원' | '%';
  per?: string;
}

const num = (n: number, unit: PriceLike['unit']) => `${n.toLocaleString('ko-KR')}${unit === '원' ? '원' : '%'}`;

export function formatPrice(p: PriceLike) {
  if (p.text) return p.text;
  const { min, max, unit } = p;
  let value: string;
  if (min !== undefined && max !== undefined) value = min === max ? num(min, unit) : `${min.toLocaleString('ko-KR')}~${num(max, unit)}`;
  else if (min !== undefined) value = `${num(min, unit)}부터`;
  else value = `최대 ${num(max!, unit)}`;
  return p.per ? `${value} / ${p.per}` : value;
}

export const vatLabels = { included: 'VAT 포함', excluded: 'VAT 별도', unknown: 'VAT 미확인' } as const;

interface ApplicationLike {
  mode: 'period' | 'rolling' | 'until-budget';
  start?: Date;
  end?: Date;
}

// 신청 기간 안내 문구(공식 데이터가 있는 값만 쓴다)
export function applicationPeriod(a: ApplicationLike) {
  if (a.mode === 'rolling') return '상시 신청';
  const start = a.start && formatDate(a.start);
  const end = a.end ? formatDate(a.end) : a.mode === 'until-budget' ? '예산 소진 시' : undefined;
  if (start && end) return `신청 ${start} ~ ${end}`;
  return start ? `신청 ${start}부터` : end && `신청 ${end}까지`;
}
