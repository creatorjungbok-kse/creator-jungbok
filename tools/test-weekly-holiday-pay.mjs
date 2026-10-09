// 주휴수당 계산기 v1 — 스펙(docs/ready/weekly-holiday-pay/spec.md) 12번 테스트 T1~T36. 사용: npm run test:tools
// raw = 내부 정확값(분수), disp = 화면 표시값(0.5원 이상 올림). 기대값은 손으로 계산했다(스펙 표와 같은 값).
// 화면 동작(분기 노출·오류 문구·연도 버튼)은 같은 함수를 쓰는 화면에서 따로 확인한다 — 여기서는 그 함수의 판정을 고정한다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exact, isWholeWon, roundHalfUpWon } from '../src/lib/payroll/shared/money.ts';
import { parseScaled, parseWonInt } from '../src/lib/payroll/shared/validation.ts';
import { kstDate } from '../src/lib/payroll/shared/korea-time.ts';
import { belowMinimumWage, defaultYear, minimumWageFor } from '../src/lib/payroll/shared/minimum-wage.ts';
import { branchFor, judge } from '../src/lib/payroll/weekly-holiday-pay/eligibility.ts';
import { calcAmounts, evaluate, hoursLabel } from '../src/lib/payroll/weekly-holiday-pay/calculation.ts';
import { HOURS_DECIMALS, HOURS_MAX10, HOURS_MIN10, HOURS_STEP10, WAGE_MAX, WAGE_MIN } from '../src/lib/payroll/weekly-holiday-pay/rules.ts';

const hours = (s) => parseScaled(s, { decimals: HOURS_DECIMALS, step: HOURS_STEP10, min: HOURS_MIN10, max: HOURS_MAX10 });
const wageOf = (s) => parseWonInt(s, { min: WAGE_MIN, max: WAGE_MAX });

// 화면과 같은 순서로: 입력 파싱 → 판정 → 계산 → 표시값
function calc({ year, wage, h, full = true, five, pattern }) {
  const w = wageOf(String(wage));
  const hh = hours(h);
  assert.ok(w.ok && hh.ok, `입력 오류 ${wage} / ${h}`);
  const r = evaluate(w.value, { hours10: hh.value, fullAttendance: full, fiveDayStandard: five, workPattern40: pattern });
  const below = year === undefined ? false : belowMinimumWage(w.value, year);
  if (r.kind !== 'amount') return { kind: r.kind, reason: r.reason ?? r.missing, below };
  const disp = (x) => roundHalfUpWon(x);
  return {
    kind: 'amount',
    holidayHours: hoursLabel(r.holidayHours10),
    holidayPay: disp(r.holidayPay),
    regularPay: disp(r.regularPay),
    gross: disp(r.grossWeekly),
    raw: [r.holidayPay, r.regularPay, r.grossWeekly].map((x) => x.n / x.d),
    rounded: ![r.holidayPay, r.regularPay, r.grossWeekly].every(isWholeWon),
    below,
  };
}
const amount = (r, holidayHours, holidayPay, regularPay, gross) => {
  assert.equal(r.kind, 'amount');
  assert.deepEqual([r.holidayHours, r.holidayPay, r.regularPay, r.gross], [holidayHours, holidayPay, regularPay, gross]);
};

// ── 경계에서 계산을 거부하는지(금액을 내지 않음) ──
test('T1·T2 주 15시간 미만 → 비대상, 분기 질문 없음', () => {
  for (const h of ['14', '14.5']) {
    assert.deepEqual(calc({ year: 2026, wage: 10320, h }), { kind: 'not-eligible', reason: 'under-15h', below: false });
    assert.equal(branchFor(hours(h).value), 'none');
  }
});
test('T9 결근 → 비대상(개근 아님), 금액 없음', () => {
  assert.deepEqual(calc({ year: 2026, wage: 10320, h: '20', full: false, five: 'yes' }), { kind: 'not-eligible', reason: 'not-full-attendance', below: false });
});
test('T10 15시간 미만 + 결근 → 15시간 미만이 먼저', () => {
  assert.equal(calc({ year: 2026, wage: 10320, h: '14', full: false }).reason, 'under-15h');
});
test('T24 통상근로자 주 5일 아니오·모름 → 계산 중단, 금액 없음', () => {
  assert.deepEqual(calc({ year: 2026, wage: 10320, h: '20', five: 'no-or-unknown' }), { kind: 'stop', reason: 'standard-not-5day', below: false });
});
test('T8 주 40시간·요일마다 다름 → 계산 중단, 금액 없음', () => {
  assert.deepEqual(calc({ year: 2026, wage: 10320, h: '40', pattern: 'uneven' }), { kind: 'stop', reason: 'uneven-40h', below: false });
});
test('T21·T25 분기 질문 미선택 → 판정하지 않음(화면에서는 입력 오류)', () => {
  assert.deepEqual(judge({ hours10: 400, fullAttendance: true }), { kind: 'incomplete', missing: 'work-pattern-40' });
  assert.deepEqual(judge({ hours10: 200, fullAttendance: true }), { kind: 'incomplete', missing: 'five-day-standard' });
  // 분기 미선택은 결근보다 먼저(스펙 3번: 입력 오류가 1순위)
  assert.deepEqual(judge({ hours10: 200, fullAttendance: false }), { kind: 'incomplete', missing: 'five-day-standard' });
});
test('T36 40시간 초과 입력 → 입력 오류(금액·판정 없음)', () => {
  for (const h of ['40.5', '45', '52']) assert.deepEqual(hours(h), { ok: false, code: 'range' });
});
test('통상근로자 주 5일 답(I5a)은 40시간 판정에 쓰이지 않고, 40시간 답(I5b)은 단시간 판정에 쓰이지 않는다', () => {
  assert.equal(judge({ hours10: 200, fullAttendance: true, fiveDayStandard: 'no-or-unknown', workPattern40: 'five-days-8h' }).kind, 'stop');
  assert.equal(judge({ hours10: 400, fullAttendance: true, fiveDayStandard: 'yes', workPattern40: 'uneven' }).kind, 'stop');
  assert.equal(judge({ hours10: 400, fullAttendance: true, fiveDayStandard: 'no-or-unknown', workPattern40: 'five-days-8h' }).kind, 'ok');
});

// ── 금액 ──
test('T3~T7 2026 최저임금', () => {
  amount(calc({ year: 2026, wage: 10320, h: '15', five: 'yes' }), '3', 30_960, 154_800, 185_760);
  amount(calc({ year: 2026, wage: 10320, h: '18', five: 'yes' }), '3.6', 37_152, 185_760, 222_912);
  amount(calc({ year: 2026, wage: 10320, h: '20', five: 'yes' }), '4', 41_280, 206_400, 247_680);
  amount(calc({ year: 2026, wage: 10320, h: '39', five: 'yes' }), '7.8', 80_496, 402_480, 482_976);
  amount(calc({ year: 2026, wage: 10320, h: '40', pattern: 'five-days-8h' }), '8', 82_560, 412_800, 495_360);
});
test('T11~T13 2027 최저임금', () => {
  amount(calc({ year: 2027, wage: 10700, h: '15', five: 'yes' }), '3', 32_100, 160_500, 192_600);
  amount(calc({ year: 2027, wage: 10700, h: '20', five: 'yes' }), '4', 42_800, 214_000, 256_800);
  amount(calc({ year: 2027, wage: 10700, h: '40', pattern: 'five-days-8h' }), '8', 85_600, 428_000, 513_600);
});
test('T14~T16 직접 입력한 시급·최저임금 미만 경고', () => {
  const t14 = calc({ year: 2026, wage: 12000, h: '20', five: 'yes' });
  amount(t14, '4', 48_000, 240_000, 288_000);
  assert.equal(t14.below, false);
  const t15 = calc({ year: 2026, wage: 10000, h: '20', five: 'yes' });
  amount(t15, '4', 40_000, 200_000, 240_000);
  assert.equal(t15.below, true);
  const t16 = calc({ year: 2027, wage: 10320, h: '20', five: 'yes' });
  assert.equal(t16.holidayPay, 41_280);
  assert.equal(t16.below, true);
});
test('T17·T28·T32~T35 원 미만: raw 보존, 표시는 0.5원 이상 올림', () => {
  const t17 = calc({ year: 2026, wage: 10321, h: '15.5', five: 'yes' });
  amount(t17, '3.1', 31_995, 159_976, 191_971);
  assert.deepEqual(t17.raw, [31_995.1, 159_975.5, 191_970.6]);
  assert.equal(t17.rounded, true);
  // T28: 항목 합(32,008 + 160,038 = 192,046)과 합계 표시(192,045)가 1원 다름
  const t28 = calc({ year: 2026, wage: 10325, h: '15.5', five: 'yes' });
  amount(t28, '3.1', 32_008, 160_038, 192_045);
  assert.deepEqual(t28.raw, [32_007.5, 160_037.5, 192_045]);
  assert.equal(t28.holidayPay + t28.regularPay - t28.gross, 1);
  // T32 (= T17 소정근로 임금 159,975.5 → 159,976)
  assert.equal(t17.regularPay, 159_976);
  // T33
  const t33 = calc({ year: 2026, wage: 10323, h: '16.5', five: 'yes' });
  amount(t33, '3.3', 34_066, 170_330, 204_395);
  assert.deepEqual(t33.raw, [34_065.9, 170_329.5, 204_395.4]);
  // T34: 짝수 반올림이면 34,072 / 170,362가 나와 실패해야 하는 경우
  const t34 = calc({ year: 2026, wage: 10325, h: '16.5', five: 'yes' });
  amount(t34, '3.3', 34_073, 170_363, 204_435);
  assert.deepEqual(t34.raw, [34_072.5, 170_362.5, 204_435]);
  // T35 (= T28 입력)
  assert.deepEqual([t28.holidayPay, t28.regularPay], [32_008, 160_038]);
  // 내부값은 분수 그대로(표시 함수가 바꾸지 않음)
  const a = calcAmounts(10325, 155);
  assert.deepEqual(a.holidayPay, exact(320_075, 10));
});
test('T18 17.5시간: 원 미만 없음 → 반올림 안내 없음', () => {
  const r = calc({ year: 2026, wage: 10320, h: '17.5', five: 'yes' });
  amount(r, '3.5', 36_120, 180_600, 216_720);
  assert.equal(r.rounded, false);
});
test('T27 39.5시간(40 미만 경계): 통상근로자 주 5일 질문 대상', () => {
  assert.equal(branchFor(395), 'five-day-standard');
  amount(calc({ year: 2026, wage: 10320, h: '39.5', five: 'yes' }), '7.9', 81_528, 407_640, 489_168);
});

// ── 입력 검사·분기 ──
test('T19 시급 오류: 빈 칸·0·1,000,001·10.5', () => {
  assert.equal(wageOf('').code, 'empty');
  assert.equal(wageOf('0').code, 'range');
  assert.equal(wageOf('1,000,001').code, 'range');
  assert.equal(wageOf('10.5').code, 'format');
});
test('T20 시간 오류: 0·40.5·41·17.3', () => {
  assert.equal(hours('0').code, 'range');
  assert.equal(hours('40.5').code, 'range');
  assert.equal(hours('41').code, 'range');
  assert.equal(hours('17.3').code, 'step');
});
test('T26 분기 노출: 14 → 없음, 20 → 통상근로자 주 5일, 40 → 근무 형태', () => {
  assert.equal(branchFor(140), 'none');
  assert.equal(branchFor(150), 'five-day-standard');
  assert.equal(branchFor(200), 'five-day-standard');
  assert.equal(branchFor(395), 'five-day-standard');
  assert.equal(branchFor(400), 'work-pattern-40');
});

// ── 연도·stale ──
test('T22·T29 기본 연도: Asia/Seoul 날짜로 전환(기기 시간대 UTC여도)', () => {
  assert.equal(defaultYear(kstDate(new Date('2026-12-31T14:59:00Z'))), 2026);
  assert.equal(defaultYear(kstDate(new Date('2026-12-31T15:00:00Z'))), 2027);
});
test('T23 최저임금으로 채우기 값', () => {
  assert.equal(minimumWageFor(2026).hourly, 10_320);
  assert.equal(minimumWageFor(2027).hourly, 10_700);
});
test('T30 stale(2028년 상수 없음): 자동 선택 없음, 최저임금 경고 없음, 직접 입력 시급은 정상 계산', () => {
  assert.equal(defaultYear('2028-01-05'), null);
  const r = calc({ year: undefined, wage: 10320, h: '20', five: 'yes' });
  amount(r, '4', 41_280, 206_400, 247_680);
  assert.equal(r.below, false);
});
// T31(빌드 guard)은 tools/test-check-build.mjs(reviewFrom 경고·형식)와 test-payroll-shared.mjs(오늘 연도 상수 필수)에서 확인한다
