// 사업자 세금 달력 v1 — 일정 데이터와 상태 판정. 확정 설계: docs/ready/tax-calendar/design.md
// 외부 import 없음 — 빌드(서버 렌더)·화면 스크립트·node 테스트가 같은 함수를 쓴다.
// 기한은 사람이 국세청 원문(세무일정·보도참고자료·안내문)을 보고 입력한다. 코드는 기한을 계산하지 않는다.
// 예외: 월합계 세금계산서 발급기한(부가세법 제34조③)은 '다음 달 10일, 토요일·공휴일이면 다음 영업일' 규칙을 공휴일 목록으로 계산한다.
// 날짜는 모두 한국 날짜 YYYY-MM-DD 문자열로 비교한다(방문자 기기 시간대와 무관).

export type Profile = 'individual' | 'simplified' | 'corp-return' | 'corp-notice' | 'corp-unknown';
export type Verification = 'confirmed' | 'statutory' | 'expected';
export type ActionType = 'file-pay' | 'pay' | 'issue';

export const profileLabels: Record<Profile, string> = {
  individual: '개인 일반과세자',
  simplified: '간이과세자',
  'corp-return': '법인 · 예정신고 대상',
  'corp-notice': '법인 · 예정고지 대상(소규모 법인)',
  'corp-unknown': '법인 · 잘 모르겠음',
};

export interface PaymentExtension {
  deadline: string;
  who: string;
  text: string;
}

export interface TaxEvent {
  id: string;
  taxType: 'vat';
  actionType: ActionType;
  title: string;
  // 이 일정이 해당하는 사업자(corp-unknown은 따로 처리: corp-return·corp-notice 일정을 조건과 함께 모두 보여준다)
  audiences: Exclude<Profile, 'corp-unknown'>[];
  // 같은 사업자 안에서도 조건이 있으면(예: 세금계산서를 발급한 간이과세자) 화면에 그대로 보여준다
  condition?: string;
  start: string;
  // 신고기한과 납부기한을 따로 둔다(납부기한만 연장되는 경우가 있다)
  fileDeadline?: string;
  payDeadline: string;
  verification: Verification;
  verificationNote?: string;
  todo: string;
  afterDeadline: string;
  paymentExtension?: PaymentExtension;
  sourceIds: string[];
  checkedAt: string;
  articleUrl: string;
  articleLabel: string;
}

// 국세청 보도참고자료(2026.10, 호우·홈플러스 피해기업 직권 연장): 납부기한만 연장, 신고 의무는 그대로
const disasterExtension: PaymentExtension = {
  deadline: '2026-12-28',
  who: '호우 피해지역·홈플러스 관련 사업자 중 국세청 직권연장 대상자',
  text: '국세청 직권연장 대상자로 확인됐다면 납부기한이 2026년 12월 28일까지 연장됩니다. 예정신고 의무 자체가 없어지는 것은 아닙니다.',
};

const afterFile =
  '기한이 지났습니다. 신고하지 못했다면 기한 후 신고와 가산세를 확인하세요. 가능 여부와 방법은 상황에 따라 다르니 홈택스나 국세청 126에서 확인하세요.';
const afterPay = '기한이 지났습니다. 아직 내지 못했다면 미납 세액과 납부지연가산세를 홈택스에서 확인하고 납부하세요.';

export const taxEvents: TaxEvent[] = [
  {
    id: 'vat-2026-2-pre-return',
    taxType: 'vat',
    actionType: 'file-pay',
    title: '2026년 2기 부가세 예정신고·납부',
    audiences: ['corp-return'],
    condition: '예정신고 대상 법인(직전 과세기간 공급가액 1억5천만원 이상)',
    start: '2026-10-01',
    fileDeadline: '2026-10-26',
    payDeadline: '2026-10-26',
    verification: 'confirmed',
    todo: '7~9월 매출·매입으로 예정신고를 하고 세액을 납부합니다.',
    afterDeadline: afterFile,
    paymentExtension: disasterExtension,
    sourceIds: ['local:nts-tax-schedule', 'local:nts-2026-10-press', 'local:law-vat-48', 'local:law-basic-5'],
    checkedAt: '2026-10-16',
    articleUrl: '/business/vat-preliminary-return/',
    articleLabel: '부가세 예정신고 보기',
  },
  {
    id: 'vat-2026-2-pre-notice',
    taxType: 'vat',
    actionType: 'pay',
    title: '2026년 2기 부가세 예정고지 납부',
    audiences: ['individual', 'corp-notice'],
    condition: '개인 일반과세자, 소규모 법인(직전 과세기간 공급가액 1억5천만원 미만)',
    start: '2026-10-01',
    payDeadline: '2026-11-02',
    verification: 'confirmed',
    verificationNote: '국세청이 납부기한을 11월 2일로 일괄 안내했습니다.',
    todo: '고지서를 받았는지 확인하고 고지된 세액을 납부합니다. 신고는 하지 않아도 됩니다. 공급가액이나 납부세액이 직전 과세기간의 3분의 1에 못 미치면 예정신고를 선택할 수 있습니다.',
    afterDeadline: afterPay,
    paymentExtension: disasterExtension,
    sourceIds: ['local:nts-2026-10-press', 'local:law-vat-48'],
    checkedAt: '2026-10-16',
    articleUrl: '/business/vat-preliminary-payment/',
    articleLabel: '고지세액 확인·납부 방법 보기',
  },
  {
    id: 'vat-2026-2-final',
    taxType: 'vat',
    actionType: 'file-pay',
    title: '2026년 2기 부가세 확정신고·납부',
    audiences: ['individual', 'corp-return', 'corp-notice'],
    condition: '일반과세자(개인·법인) · 7~12월분',
    start: '2027-01-01',
    fileDeadline: '2027-01-25',
    payDeadline: '2027-01-25',
    verification: 'confirmed',
    verificationNote: '국세청 세무일정(2027년 1월)에 게시된 기한입니다.',
    todo: '7~12월분 부가세를 신고·납부합니다. 예정신고로 이미 신고한 부분은 다시 신고하지 않습니다.',
    afterDeadline: afterFile,
    sourceIds: ['local:nts-tax-schedule', 'local:law-vat-49'],
    checkedAt: '2026-10-16',
    articleUrl: '/business/vat-preliminary-return/',
    articleLabel: '부가세 1년 신고 일정 보기',
  },
  {
    id: 'vat-2026-simplified',
    taxType: 'vat',
    actionType: 'file-pay',
    title: '2026년 간이과세자 부가세 확정신고',
    audiences: ['simplified'],
    condition: '간이과세자 · 2026년 1~12월분',
    start: '2027-01-01',
    fileDeadline: '2027-01-25',
    payDeadline: '2027-01-25',
    verification: 'statutory',
    verificationNote: '법정 신고기한 기준입니다. 국세청의 해당 신고기간 개별 안내가 나오면 연장 여부를 재확인합니다.',
    todo: '1년치(1~12월) 부가세를 신고·납부합니다. 해당 과세기간 공급대가가 4,800만원 미만이면 납부의무가 면제됩니다.',
    afterDeadline: afterFile,
    sourceIds: ['local:law-vat-67', 'local:law-basic-5'],
    checkedAt: '2026-10-16',
    articleUrl: '/business/simplified-taxpayer/',
    articleLabel: '간이과세자 보기',
  },
  {
    id: 'vat-2027-1-pre-return',
    taxType: 'vat',
    actionType: 'file-pay',
    title: '2027년 1기 부가세 예정신고·납부',
    audiences: ['corp-return'],
    condition: '예정신고 대상 법인 · 1~3월분',
    start: '2027-04-01',
    fileDeadline: '2027-04-26',
    payDeadline: '2027-04-26',
    verification: 'expected',
    verificationNote: '법정 기한(4월 25일, 일요일)으로 예상한 날짜입니다. 국세청 개별 안내 확인 전입니다.',
    todo: '1~3월분 예정신고·납부를 준비합니다.',
    afterDeadline: afterFile,
    sourceIds: ['local:law-vat-48', 'local:law-basic-5'],
    checkedAt: '2026-10-16',
    articleUrl: '/business/vat-preliminary-return/',
    articleLabel: '부가세 예정신고 보기',
  },
  {
    id: 'vat-2027-1-pre-notice',
    taxType: 'vat',
    actionType: 'pay',
    title: '2027년 1기 부가세 예정고지 납부',
    audiences: ['individual', 'corp-notice'],
    condition: '개인 일반과세자, 소규모 법인',
    start: '2027-04-01',
    payDeadline: '2027-04-26',
    verification: 'expected',
    verificationNote: '법정 기한으로 예상한 날짜입니다. 국세청 개별 안내 확인 전입니다.',
    todo: '고지서가 오면 고지된 세액을 납부합니다.',
    afterDeadline: afterPay,
    sourceIds: ['local:law-vat-48', 'local:law-basic-5'],
    checkedAt: '2026-10-16',
    articleUrl: '/business/vat-preliminary-payment/',
    articleLabel: '예정고지 납부 보기',
  },
  {
    id: 'vat-2027-1-final',
    taxType: 'vat',
    actionType: 'file-pay',
    title: '2027년 1기 부가세 확정신고·납부',
    audiences: ['individual', 'corp-return', 'corp-notice'],
    condition: '일반과세자(개인·법인) · 1~6월분',
    start: '2027-07-01',
    fileDeadline: '2027-07-26',
    payDeadline: '2027-07-26',
    verification: 'expected',
    verificationNote: '법정 기한(7월 25일, 일요일)으로 예상한 날짜입니다. 국세청 개별 안내 확인 전입니다.',
    todo: '1~6월분 부가세 확정신고·납부를 준비합니다.',
    afterDeadline: afterFile,
    sourceIds: ['local:law-vat-49', 'local:law-basic-5'],
    checkedAt: '2026-10-16',
    articleUrl: '/business/vat-preliminary-return/',
    articleLabel: '부가세 1년 신고 일정 보기',
  },
  {
    id: 'vat-2027-simplified-interim',
    taxType: 'vat',
    actionType: 'file-pay',
    title: '2027년 간이과세자 7월 일정: 세금계산서 발급 여부에 따라 예정신고 또는 예정부과 납부 확인',
    audiences: ['simplified'],
    condition: '상반기에 세금계산서를 발급한 간이과세자는 1~6월분을 신고·납부해야 하고, 그 밖의 간이과세자는 세무서가 고지한 세액을 납부합니다(징수할 금액이 50만원 미만이면 고지하지 않음)',
    start: '2027-07-01',
    fileDeadline: '2027-07-26',
    payDeadline: '2027-07-26',
    verification: 'expected',
    verificationNote: '법정 기한으로 예상한 날짜입니다. 2027년에도 같은 제도인지 국세청 7월 안내로 확인합니다.',
    todo: '세금계산서 발급 여부에 따라 예정신고 또는 예정부과 납부 중 무엇에 해당하는지 확인합니다. 모든 간이과세자가 신고·납부해야 하는 일정은 아닙니다.',
    afterDeadline: afterFile,
    sourceIds: ['local:law-vat-66', 'local:law-basic-5'],
    checkedAt: '2026-10-16',
    articleUrl: '/business/simplified-taxpayer/',
    articleLabel: '간이과세자 보기',
  },
];

// 공휴일(토요일·일요일 제외). 월합계 세금계산서 발급기한 계산에만 쓴다. 출처: 우주항공청(한국천문연구원) 2027년 월력요항
export const holidays: { from: string; to: string; list: string[] } = {
  from: '2026-11-01',
  to: '2027-12-31',
  list: [
    '2026-12-25',
    '2027-01-01',
    '2027-02-08',
    '2027-02-09',
    '2027-03-01',
    '2027-05-03',
    '2027-05-05',
    '2027-05-13',
    '2027-07-19',
    '2027-08-16',
    '2027-09-14',
    '2027-09-15',
    '2027-09-16',
    '2027-10-04',
    '2027-10-11',
    '2027-12-27',
  ],
};

// ── 날짜 ──
const DAY = 86_400_000;
const toDay = (ymd: string) => Date.parse(`${ymd}T00:00:00Z`) / DAY;
const fromDay = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
const weekday = (ymd: string) => new Date(`${ymd}T00:00:00Z`).getUTCDay();
export const daysBetween = (a: string, b: string) => toDay(b) - toDay(a);

const seoulFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
// 한국 날짜(방문자 기기 시간대와 무관)
export function seoulToday(now: Date = new Date()): string {
  const p = Object.fromEntries(seoulFormatter.formatToParts(now).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

const isBusinessDay = (ymd: string) => weekday(ymd) !== 0 && weekday(ymd) !== 6 && !holidays.list.includes(ymd);

// 월합계 세금계산서: 거래월(YYYY-MM)의 다음 달 10일, 토요일·공휴일이면 바로 다음 영업일(부가세법 제34조③)
// 공휴일 목록 범위를 벗어나면 null(날짜를 단정하지 않는다)
export function monthlyInvoiceDue(month: string): string | null {
  const [y, m] = month.split('-').map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  let d = `${ny}-${String(nm).padStart(2, '0')}-10`;
  if (d < holidays.from || d > holidays.to) return null;
  while (!isBusinessDay(d)) {
    d = fromDay(toDay(d) + 1);
    if (d > holidays.to) return null;
  }
  return d;
}

// 오늘 기준 다음 월합계 발급기한(지난달 거래분 기한이 아직 안 지났으면 그것)
export function nextMonthlyInvoice(today: string): { month: string; due: string } | null {
  const [y, m] = today.split('-').map(Number);
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const cur = `${y}-${String(m).padStart(2, '0')}`;
  for (const month of [prev, cur]) {
    const due = monthlyInvoiceDue(month);
    if (due === null) {
      // 공휴일 목록 시작 전 달(이미 지난 기한)은 건너뛰고, 목록 끝을 넘으면 단정하지 않는다
      if (month < holidays.from.slice(0, 7)) continue;
      return null;
    }
    if (due >= today) return { month, due };
  }
  return null;
}

// ── 상태 ──
export const CLOSING_SOON_DAYS = 7;
export const PAST_VISIBLE_DAYS = 30;
export type EventStatus = 'expected' | 'upcoming' | 'open' | 'closing' | 'today' | 'past';

// 이 사업자에게 보여줄 기준 기한: 신고가 있으면 신고기한, 없으면 납부기한
export const mainDeadline = (e: TaxEvent) => e.fileDeadline ?? e.payDeadline;

export function eventStatus(e: TaxEvent, today: string): EventStatus {
  // 국세청 안내 전 예상 일정은 D-day·진행 상태를 만들지 않는다
  if (e.verification === 'expected') return 'expected';
  const deadline = mainDeadline(e);
  if (today < e.start) return 'upcoming';
  if (today > deadline) return 'past';
  const left = daysBetween(today, deadline);
  if (left === 0) return 'today';
  if (left <= CLOSING_SOON_DAYS) return 'closing';
  return 'open';
}

export function dDay(e: TaxEvent, today: string): string | undefined {
  const s = eventStatus(e, today);
  if (s === 'today') return '오늘 마감';
  if (s === 'closing' || s === 'open') return `D-${daysBetween(today, mainDeadline(e))}`;
  return undefined;
}

export type View = Profile | 'all';

export function eventsFor(profile: View): TaxEvent[] {
  if (profile === 'all') return [...taxEvents];
  if (profile === 'corp-unknown') return taxEvents.filter((e) => e.audiences.includes('corp-return') || e.audiences.includes('corp-notice'));
  return taxEvents.filter((e) => e.audiences.includes(profile));
}

export interface Board {
  now: TaxEvent[]; // 진행 중·마감 임박·오늘 마감
  next: TaxEvent[]; // 시작 전(확정·법정 기준)
  later: TaxEvent[]; // 예상(국세청 안내 전)
  past: TaxEvent[]; // 기한이 지난 지 30일 이내, 또는 일부 사업자의 납부기한 연장이 아직 유효한 일정
  monthly: { month: string; due: string } | null;
  stale: boolean; // 확정·법정 기준 일정이 더는 없음 → 최신 일정 확인 안내
  expiredExpected: TaxEvent[]; // 예상 기한이 지났는데 확정되지 않은 일정 → 목록에서 빼고 공식 일정 재확인 안내
}

// 기한이 지난 일정을 '기한이 지난 일정'에 남길지: 30일 이내이거나, 납부기한 연장이 아직 유효하면 남긴다
export const pastVisible = (e: TaxEvent, today: string) =>
  daysBetween(mainDeadline(e), today) <= PAST_VISIBLE_DAYS || (e.paymentExtension !== undefined && today <= e.paymentExtension.deadline);

export function board(profile: View, today: string): Board {
  const list = eventsFor(profile);
  const by = (s: EventStatus[]) => list.filter((e) => s.includes(eventStatus(e, today))).sort((a, b) => mainDeadline(a).localeCompare(mainDeadline(b)));
  const past = by(['past']).filter((e) => pastVisible(e, today));
  const expected = by(['expected']);
  const live = list.filter((e) => e.verification !== 'expected' && mainDeadline(e) >= today);
  return {
    now: by(['open', 'closing', 'today']),
    next: by(['upcoming']),
    later: expected.filter((e) => mainDeadline(e) >= today),
    past,
    monthly: nextMonthlyInvoice(today),
    stale: live.length === 0,
    expiredExpected: expected.filter((e) => mainDeadline(e) < today),
  };
}

// 데이터 점검(테스트·빌드 점검에서 쓴다). 문제 목록을 돌려준다(빈 배열이면 정상)
export function validateData(): string[] {
  const errors: string[] = [];
  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  const ids = new Set<string>();
  for (const e of taxEvents) {
    if (ids.has(e.id)) errors.push(`중복 id ${e.id}`);
    ids.add(e.id);
    for (const [k, v] of Object.entries({ start: e.start, payDeadline: e.payDeadline, fileDeadline: e.fileDeadline, checkedAt: e.checkedAt })) {
      if (v !== undefined && (!ymd.test(v) || fromDay(toDay(v)) !== v)) errors.push(`${e.id} ${k} 날짜 형식 ${v}`);
    }
    if (e.audiences.length === 0) errors.push(`${e.id} 대상 없음`);
    if (e.sourceIds.length === 0) errors.push(`${e.id} 출처 없음`);
    if (e.start > e.payDeadline) errors.push(`${e.id} 시작일이 납부기한보다 늦음`);
    if (e.fileDeadline && e.fileDeadline > e.payDeadline) errors.push(`${e.id} 신고기한이 납부기한보다 늦음`);
    if (e.actionType === 'pay' && e.fileDeadline) errors.push(`${e.id} 납부 일정에 신고기한이 있음`);
    if (e.verification !== 'confirmed' && !e.verificationNote) errors.push(`${e.id} 확인 상태 설명 없음`);
    if (e.paymentExtension && e.paymentExtension.deadline <= e.payDeadline) errors.push(`${e.id} 연장 납부기한이 원래 기한보다 빠름`);
  }
  return errors;
}

// 마지막 확정·법정 기준 기한(이 날짜 60일 전부터 빌드 점검이 갱신 경고를 낸다)
export const lastLiveDeadline = taxEvents.filter((e) => e.verification !== 'expected').map(mainDeadline).sort().at(-1)!;
export const reviewFromDate = (() => fromDay(toDay(lastLiveDeadline) - 60))();

// ── 표시용 ──
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
export function dateLabel(ymd: string, withYear = false): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${withYear ? `${y}년 ` : ''}${m}월 ${d}일(${WEEK[weekday(ymd)]})`;
}
export const dotDate = (ymd: string) => ymd.replaceAll('-', '.');

// 일정 카드의 기한 줄: 상태에 맞는 문구(예상 일정은 D-day 없이 '예상')
export function deadlineLine(e: TaxEvent, today: string): string {
  const s = eventStatus(e, today);
  const dl = mainDeadline(e);
  const withYear = dl.slice(0, 4) !== today.slice(0, 4);
  const what = e.actionType === 'pay' ? '납부' : '신고·납부';
  if (s === 'expected') return `${dateLabel(dl, withYear)} 예상 · 국세청 개별 안내 확인 전`;
  if (s === 'upcoming') return `${dateLabel(e.start, e.start.slice(0, 4) !== today.slice(0, 4))}부터 ${dateLabel(dl, withYear)}까지 ${what}`;
  if (s === 'past') return `${dateLabel(dl, withYear)} 기한 지남`;
  return `${dateLabel(dl, withYear)}까지 ${what} · ${dDay(e, today)}`;
}

export const audienceText = (e: TaxEvent) => [...new Set(e.audiences.map((a) => (a.startsWith('corp') ? profileLabels[a] : profileLabels[a])))].join(', ');

// 기존 글 상단 '지금 할 일' 박스: 그 글에 연결된 일정 중 지금 진행 중이거나 가장 가까운 확정·법정 일정
export function articleNowEvents(articleUrl: string, today: string): TaxEvent[] {
  const list = taxEvents.filter((e) => e.articleUrl === articleUrl && e.verification !== 'expected');
  const now = list.filter((e) => ['open', 'closing', 'today'].includes(eventStatus(e, today)));
  if (now.length) return now;
  const next = list.filter((e) => eventStatus(e, today) === 'upcoming').sort((a, b) => a.start.localeCompare(b.start));
  return next.slice(0, 1);
}
export const linkedArticleUrls = [...new Set(taxEvents.map((e) => e.articleUrl)), '/business/e-tax-invoice/'];
