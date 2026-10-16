// 연차 계산기 v1 — 설계 v2(docs/ready/annual-leave/calculator-design.md) 테스트. 사용: npm run test:tools
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  annualAriseDay,
  annualDays,
  calculate,
  firstYearEndDay,
  needsAttendance,
  oneDayHoursLabel,
  parseYmd,
  partTimeHours,
  seoulTodayDay,
  unusedPay,
  ymd,
} from '../src/lib/payroll/annual-leave/calculation.ts';

const d = (s) => {
  const v = parseYmd(s);
  assert.notEqual(v, null, s);
  return v;
};
const base = (o = {}) => ({
  workplace: 'five-plus',
  mineHoursT: 400,
  regularHoursT: 400,
  hireDay: d('2026-01-02'),
  mode: 'retire',
  baseDay: d('2027-01-02'),
  attendance80: 'yes',
  missedMonths: 0,
  companyBasis: 'hire',
  ...o,
});
const run = (o) => {
  const r = calculate(base(o));
  assert.equal(r.kind, 'result', JSON.stringify(r));
  return r;
};

test('대법원 사례: 2026.1.2 입사, 마지막 근무 2027.1.1 → 11일, 2027.1.2 → 누적 26일', () => {
  const a = run({ baseDay: d('2027-01-01'), attendance80: null });
  assert.equal(a.cumulativeDays, 11);
  assert.equal(a.annuals.length, 0);
  assert.equal(a.usableDays, 11, '월 단위 사용기간(2027.1.1까지) 안');
  assert.ok(a.cautions.includes('year-exact'));
  const b = run({ baseDay: d('2027-01-02') });
  assert.equal(b.cumulativeDays, 26);
  assert.equal(b.usableDays, 15, '새로 생긴 연차는 15일(첫해 11일은 사용기간 지남)');
  assert.equal(b.monthlyUsable, false);
  assert.equal(ymd(b.latestAnnual.arise), '2027-01-02');
  assert.equal(ymd(b.latestAnnual.expires), '2028-01-01');
});

test('첫해 월 단위 발생일: 1개월 개근을 마친 다음 날, 사용기간은 첫 1년 만료일까지', () => {
  const r = run({ mode: 'today', baseDay: d('2026-03-01'), attendance80: null });
  assert.deepEqual(r.monthlyRows.map((g) => ymd(g.arise)).slice(0, 3), ['2026-02-02', '2026-03-02', '2026-04-02']);
  assert.equal(ymd(r.monthlyRows[10].arise), '2026-12-02');
  assert.equal(r.monthlyRows.length, 11, '12번째 달 몫은 없다(최대 11일)');
  assert.equal(r.monthlyDays, 1);
  assert.equal(ymd(r.monthlyRows[0].expires), '2027-01-01');
  assert.equal(ymd(firstYearEndDay(d('2026-01-02'))), '2027-01-01');
  assert.equal(ymd(r.nextGrant.arise), '2026-03-02', '다음은 2번째 달 몫');
  // 사용기간 마지막 날·다음 날
  assert.equal(run({ mode: 'today', baseDay: d('2027-01-01'), attendance80: null }).monthlyUsable, true);
  assert.equal(run({ mode: 'today', baseDay: d('2027-01-02') }).monthlyUsable, false);
});

test('입사 직후: 아직 생긴 연차 없음, 다음 발생일 안내', () => {
  const r = run({ mode: 'today', baseDay: d('2026-02-01'), attendance80: null });
  assert.equal(r.cumulativeDays, 0);
  assert.equal(r.usableDays, 0);
  assert.equal(ymd(r.nextGrant.arise), '2026-02-02');
});

test('달 말 경계(29~31일 입사): 날짜를 단정하지 않고 확인 안내', () => {
  const r = run({ hireDay: d('2026-01-31'), mode: 'today', baseDay: d('2026-02-28'), attendance80: null });
  const feb = r.monthlyRows[0];
  assert.equal(feb.uncertain, true);
  assert.equal(ymd(feb.arise), '2026-03-01');
  assert.ok(r.cautions.includes('month-boundary'));
  assert.equal(r.monthlyRows[1].uncertain, false, '3.31은 있는 날짜');
  assert.equal(ymd(r.monthlyRows[1].arise), '2026-03-31');
  // 경계에서 먼 날은 안내 없음
  assert.ok(!run({ hireDay: d('2026-01-31'), mode: 'today', baseDay: d('2026-03-15'), attendance80: null }).cautions.includes('month-boundary'));
  // 29일 입사: 평년 2월에 29일이 없다
  assert.equal(run({ hireDay: d('2027-01-29'), mode: 'today', baseDay: d('2027-02-10'), attendance80: null }).monthlyRows[0].uncertain, true);
});

test('퇴직 기준: 마지막 근무일이 1개월 개근을 마친 날이면 그 1일은 넣지 않고 확인 안내', () => {
  const r = run({ baseDay: d('2026-03-01'), attendance80: null });
  assert.equal(r.monthlyDays, 1);
  assert.ok(r.cautions.includes('retire-on-completion'));
});

test('2.29 입사: 1년 만료 다음 해 2.28, 15일은 3.1 발생', () => {
  assert.equal(ymd(annualAriseDay(d('2024-02-29'), 1)), '2025-03-01');
  const r = run({ hireDay: d('2024-02-29'), baseDay: d('2025-03-01') });
  assert.equal(ymd(r.latestAnnual.arise), '2025-03-01');
  assert.equal(r.latestAnnual.days, 15);
});

test('1·3·5·21·30년 경계: 15·16·17·25·25일, 발생 전날·당일', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 20, 21, 30].map(annualDays), [15, 15, 16, 16, 17, 24, 25, 25]);
  const hire = d('2018-01-02');
  const before = run({ hireDay: hire, mode: 'today', baseDay: d('2021-01-01') });
  assert.equal(before.latestAnnual.n, 2);
  assert.equal(before.latestAnnual.days, 15);
  assert.equal(before.nextGrant.days, 16);
  assert.equal(ymd(before.nextGrant.arise), '2021-01-02');
  const on = run({ hireDay: hire, mode: 'today', baseDay: d('2021-01-02') });
  assert.equal(on.latestAnnual.days, 16);
  assert.equal(on.usableDays, 16);
  assert.equal(on.cumulativeDays, 11 + 15 + 15 + 16);
});

test('개근하지 못한 달: 그만큼 뺌, 지난 달 수보다 많으면 오류', () => {
  assert.equal(run({ baseDay: d('2027-01-01'), attendance80: null, missedMonths: 2 }).cumulativeDays, 9);
  assert.ok(run({ baseDay: d('2027-01-01'), attendance80: null, missedMonths: 2 }).cautions.includes('missed-months'));
  const e = calculate(base({ baseDay: d('2026-03-05'), attendance80: null, missedMonths: 3 }));
  assert.deepEqual(e, { kind: 'error', code: 'missed-too-many' });
});

test('중단: 4명 이하·규모 바뀜·15시간 미만·80% 미만/모름', () => {
  assert.equal(calculate(base({ workplace: 'four-or-less' })).reason, 'four-or-less');
  assert.equal(calculate(base({ workplace: 'changed' })).reason, 'size-changed');
  assert.equal(calculate(base({ mineHoursT: 145 })).reason, 'under15');
  assert.equal(calculate(base({ attendance80: 'no' })).reason, 'attendance');
  assert.equal(calculate(base({ attendance80: 'unknown' })).reason, 'attendance');
  // 1년이 안 됐으면 출근율을 묻지 않는다
  assert.equal(needsAttendance(d('2026-01-02'), d('2027-01-01')), false);
  assert.equal(needsAttendance(d('2026-01-02'), d('2027-01-02')), true);
  assert.equal(calculate(base({ baseDay: d('2026-06-01'), attendance80: null })).kind, 'result');
});

test('5명 모름은 계산하되 꼬리표, 회계연도·모름은 안내', () => {
  assert.equal(run({ workplace: 'unknown' }).cautions[0], 'workplace-unknown');
  assert.ok(run({ companyBasis: 'fiscal' }).cautions.includes('fiscal'));
  assert.ok(run({ companyBasis: 'unknown' }).cautions.includes('basis-unknown'));
});

test('2017.5.29 이전 입사: 현재 근속연수 연차만, 이력 없음 / 2017.5.30 입사는 이력 계산', () => {
  const old = run({ hireDay: d('2017-05-29'), mode: 'today', baseDay: d('2026-10-16'), missedMonths: null });
  assert.equal(old.oldRule, true);
  assert.equal(old.cumulativeDays, null);
  assert.equal(old.monthlyRows.length, 0);
  assert.equal(old.annuals.length, 1);
  assert.equal(old.latestAnnual.n, 9);
  assert.equal(old.latestAnnual.days, 19);
  assert.equal(old.usableDays, 19);
  const neu = run({ hireDay: d('2017-05-30'), mode: 'today', baseDay: d('2026-10-16') });
  assert.equal(neu.oldRule, false);
  assert.equal(neu.cumulativeDays, 11 + 15 + 15 + 16 + 16 + 17 + 17 + 18 + 18 + 19);
  // 옛 규정 입사자의 첫 2년 안 기준일은 계산하지 않음
  assert.equal(calculate(base({ hireDay: d('2017-01-02'), baseDay: d('2018-03-01'), missedMonths: null })).reason, 'old-rule-early');
  // 장기 근속(30년) 한도
  const long = run({ hireDay: d('1990-03-02'), mode: 'today', baseDay: d('2026-10-16'), missedMonths: null });
  assert.equal(long.latestAnnual.days, 25);
});

test('단시간근로자: 주 18/40시간 → 15일 54시간, 16일 58시간(1시간 미만 올림), 월 단위는 합계 없음', () => {
  assert.equal(partTimeHours(15, 180, 400), 54);
  assert.equal(partTimeHours(16, 180, 400), 58);
  assert.equal(partTimeHours(15, 200, 400), 60);
  assert.equal(oneDayHoursLabel(180, 400), '3.6');
  assert.equal(oneDayHoursLabel(200, 400), '4');
  const r = run({ mineHoursT: 180 });
  assert.equal(r.partTime, true);
  assert.equal(r.latestAnnual.hours, 54);
  assert.equal(r.usableHours, 54);
  assert.equal(r.cumulativeAnnualHours, 54);
  assert.ok(r.monthlyRows.every((g) => g.hours === null), '월 단위는 시간 합산 안 함');
  assert.equal(r.oneDayHours, '3.6');
  assert.equal(calculate(base({ mineHoursT: 400, regularHoursT: 350 })).code, 'hours-order');
  assert.equal(run({}).partTime, false);
});

test('미사용 연차수당: 일수·시간 × 통상임금, 원 미만 버림', () => {
  assert.equal(unusedPay(60, 100_000), 600_000);
  assert.equal(unusedPay(5, 100_001), 50_000);
  assert.equal(unusedPay(36, 10_320), 37_152);
});

test('한국 날짜: UTC 14:59 → 같은 날, 15:00 → 다음 날', () => {
  assert.equal(ymd(seoulTodayDay(new Date('2026-12-31T14:59:00Z'))), '2026-12-31');
  assert.equal(ymd(seoulTodayDay(new Date('2026-12-31T15:00:00Z'))), '2027-01-01');
});

test('날짜 오류', () => {
  assert.equal(calculate(base({ baseDay: d('2025-12-31') })).code, 'date-order');
  assert.equal(calculate(base({ hireDay: d('1969-12-31') })).code, 'hire-range');
});

test('2020.3.31 개정 전후 사용기간: 2020.3.30 이전 발생분은 각 발생일부터 1년(부칙 제2조)', () => {
  // GPT 지적 사례: 2019.1.2 입사, 2020.1.2 기준 → 첫해 11일도 사용기간 안 → 26일
  const a = run({ hireDay: d('2019-01-02'), mode: 'today', baseDay: d('2020-01-02') });
  assert.equal(ymd(a.monthlyRows[0].expires), '2020-02-01');
  assert.equal(ymd(a.monthlyRows[10].expires), '2020-12-01');
  assert.equal(a.monthlyLegacyPeriod, true);
  assert.equal(a.monthlyUsableDays, 11);
  assert.equal(a.usableDays, 26);
  assert.equal(ymd(a.monthlyUsableUntil), '2020-12-01');
  // 첫 달분 만료 다음 날: 10 + 15
  assert.equal(run({ hireDay: d('2019-01-02'), mode: 'today', baseDay: d('2020-02-02') }).usableDays, 25);
  // 섞인 경우: 2019.6.2 입사 → 2020.3.2까지 9개는 각 1년, 4.2·5.2는 첫 1년(2020.6.1)까지
  const m = run({ hireDay: d('2019-06-02'), mode: 'today', baseDay: d('2020-06-02') });
  assert.equal(ymd(m.monthlyRows[8].arise), '2020-03-02');
  assert.equal(ymd(m.monthlyRows[8].expires), '2021-03-01');
  assert.equal(ymd(m.monthlyRows[9].expires), '2020-06-01');
  assert.equal(m.monthlyUsableDays, 9);
  assert.equal(m.usableDays, 24);
  assert.equal(m.cumulativeDays, 26);
  // 일부만 남았는데 개근 못 한 달이 있으면 자동 계산하지 않음
  assert.equal(calculate(base({ hireDay: d('2019-06-02'), mode: 'today', baseDay: d('2020-06-02'), missedMonths: 1 })).reason, 'legacy-period-missed');
  // 모두 남아 있으면 개근 못 한 달만큼 뺀다
  assert.equal(run({ hireDay: d('2019-01-02'), mode: 'today', baseDay: d('2020-01-02'), missedMonths: 2 }).monthlyUsableDays, 9);
  // 경계: 2020.3.31 발생분은 개정 규정, 3.30 이전은 종전 규정
  const b = run({ hireDay: d('2019-05-31'), mode: 'today', baseDay: d('2020-04-15'), attendance80: null });
  assert.equal(ymd(b.monthlyRows[9].arise), '2020-03-31');
  assert.equal(ymd(b.monthlyRows[9].expires), '2020-05-30', '첫 1년 만료일');
  assert.equal(ymd(b.monthlyRows[8].arise), '2020-03-01');
  assert.equal(ymd(b.monthlyRows[8].expires), '2021-02-28', '종전 규정: 발생일부터 1년');
  // 2020.3.31 이후 입사는 모두 첫 1년 만료일
  assert.equal(run({ mode: 'today', baseDay: d('2026-12-02'), attendance80: null }).monthlyLegacyPeriod, false);
});
