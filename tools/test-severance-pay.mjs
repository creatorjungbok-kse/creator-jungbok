// 퇴직금 계산기 v1 — 설계 문서(docs/ready/severance-pay/calculator-spec.md) 테스트. 사용: npm run test:tools
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BONUS_MAX,
  WAGE_MAX,
  calculate,
  checkExclusions,
  floorWon,
  oneYearEndDay,
  parseYmd,
  preStop,
  threeMonthWindow,
  wageRows,
  wonCentsLabel,
  ymd,
} from '../src/lib/payroll/severance-pay/calculation.ts';

const d = (s) => {
  const v = parseYmd(s);
  assert.notEqual(v, null, s);
  return v;
};
const base = (o = {}) => ({ bonus12: 0, annualLeavePay: 0, ordinaryDaily: null, exclusions: [], ...o });

test('고용노동부 공식 예제: 입사 2014.10.2, 퇴직일 2017.9.16(마지막 근무 9.15)', () => {
  const rows = wageRows(d('2017-09-16'));
  assert.deepEqual(
    rows.map((r) => [ymd(r.start), ymd(r.end), r.days]),
    [
      ['2017-06-16', '2017-06-30', 15],
      ['2017-07-01', '2017-07-31', 31],
      ['2017-08-01', '2017-08-31', 31],
      ['2017-09-01', '2017-09-15', 15],
    ],
  );
  const r = calculate(
    base({
      hireDay: d('2014-10-02'),
      lastWorkDay: d('2017-09-15'),
      wages: [1_180_000, 2_360_000, 2_360_000, 1_180_000],
      bonus12: 4_000_000,
      annualLeavePay: 300_000,
    }),
  );
  assert.equal(r.kind, 'amount');
  assert.equal(r.serviceDays, 1080);
  assert.equal(r.calcDays, 92);
  assert.equal(r.total.n / r.total.d, 8_155_000n);
  // 정밀값 88,641.3043… → 1전 단위 올림 88,641.31(고용노동부 화면 '88,641원 31전'과 같음)
  assert.equal(wonCentsLabel(r.averageDailyRaw), '88,641.30원');
  assert.equal(wonCentsLabel(r.averageDaily), '88,641.31원');
  // 88,641.31 × 30 × 1,080 ÷ 365 = 7,868,434.48… → 원 단위 반올림 7,868,434원(고용노동부 계산기 결과)
  assert.equal(r.severanceWon, 7_868_434n);
});

test('정확히 1년과 하루 부족', () => {
  // 2025.3.1 입사 → 2026.2.28까지 근무하면 1년
  assert.equal(ymd(oneYearEndDay(d('2025-03-01'))), '2026-02-28');
  const ok = calculate(base({ hireDay: d('2025-03-01'), lastWorkDay: d('2026-02-28'), wages: [3_000_000, 3_000_000, 3_000_000] }));
  assert.equal(ok.kind, 'amount');
  assert.equal(ok.serviceDays, 365);
  const short = calculate(base({ hireDay: d('2025-03-01'), lastWorkDay: d('2026-02-27'), wages: [] }));
  assert.deepEqual(short, { kind: 'not-eligible', reason: 'under1year' });
});

test('윤년: 2.29 입사·윤년이 낀 1년', () => {
  // 2024.2.29 입사 → 2025년 2월에 29일이 없으므로 2.28 만료(민법 제160조③)
  assert.equal(ymd(oneYearEndDay(d('2024-02-29'))), '2025-02-28');
  // 2023.3.1 입사 → 2024.2.29까지 1년(366일)
  assert.equal(ymd(oneYearEndDay(d('2023-03-01'))), '2024-02-29');
  const r = calculate(base({ hireDay: d('2023-03-01'), lastWorkDay: d('2024-02-29'), wages: [3_000_000, 3_000_000, 3_000_000] }));
  assert.equal(r.serviceDays, 366);
  // 윤년 2월이 3개월에 들어가는 경우 일수
  const w2 = threeMonthWindow(d('2024-04-01'));
  assert.equal(w2.end - w2.start + 1, 91); // 1.1~3.31 = 31+29+31
});

test('판정: 제도 유형·근로시간·중간정산', () => {
  const s = { plan: 'severance', hours: 'always15', interimSettled: false, leaveOfAbsence: false };
  assert.equal(preStop(s), null);
  assert.deepEqual(preStop({ ...s, plan: 'db' }), null);
  assert.deepEqual(preStop({ ...s, plan: 'unknown' }), null);
  assert.deepEqual(preStop({ ...s, plan: 'dc' }), { kind: 'stop', reason: 'dc' });
  assert.deepEqual(preStop({ ...s, hours: 'always-under15' }), { kind: 'not-eligible', reason: 'under15' });
  assert.deepEqual(preStop({ ...s, hours: 'mixed' }), { kind: 'stop', reason: 'mixed-hours' });
  // 중간정산 뒤 1년 미만 퇴직: '대상 아님'이 아니라 계산 중단(오판 방지)
  assert.deepEqual(preStop({ ...s, interimSettled: true }), { kind: 'stop', reason: 'interim' });
});

test('통상임금이 평균임금보다 크면 통상임금 적용', () => {
  const r = calculate(base({ hireDay: d('2020-01-01'), lastWorkDay: d('2025-12-31'), wages: [1_000_000, 1_000_000, 1_000_000], ordinaryDaily: 100_000 }));
  assert.equal(r.usedOrdinary, true);
  assert.equal(r.serviceDays, 2192);
  assert.equal(r.severanceWon, (2n * 100_000n * 30n * 2192n + 365n) / (2n * 365n));
  const r2 = calculate(base({ hireDay: d('2020-01-01'), lastWorkDay: d('2025-12-31'), wages: [9_000_000, 9_000_000, 9_000_000], ordinaryDaily: 100_000 }));
  assert.equal(r2.usedOrdinary, false);
  const r3 = calculate(base({ hireDay: d('2020-01-01'), lastWorkDay: d('2025-12-31'), wages: [1_000_000, 1_000_000, 1_000_000] }));
  assert.equal(r3.ordinaryDaily, null);
  assert.equal(r3.usedOrdinary, false);
});

test('평균임금 제외기간: 일부·전체·겹침·범위 밖', () => {
  const win = threeMonthWindow(d('2026-10-01')); // 7.1~9.30, 92일
  assert.equal(win.end - win.start + 1, 92);
  assert.deepEqual(checkExclusions(win, [{ start: d('2026-09-01'), end: d('2026-09-30') }]), { ok: true, excludedDays: 30 });
  // 3개월 앞에서 시작해 걸친 기간은 3개월 안쪽만 센다
  assert.deepEqual(checkExclusions(win, [{ start: d('2026-06-01'), end: d('2026-07-10') }]), { ok: true, excludedDays: 10 });
  assert.deepEqual(checkExclusions(win, [{ start: d('2026-06-01'), end: d('2026-09-30') }]), { ok: false, code: 'all' });
  assert.deepEqual(
    checkExclusions(win, [
      { start: d('2026-07-01'), end: d('2026-07-31') },
      { start: d('2026-07-31'), end: d('2026-08-10') },
    ]),
    { ok: false, code: 'overlap' },
  );
  assert.deepEqual(checkExclusions(win, [{ start: d('2026-01-01'), end: d('2026-01-31') }]), { ok: false, code: 'outside' });
  assert.deepEqual(checkExclusions(win, [{ start: d('2026-08-10'), end: d('2026-08-01') }]), { ok: false, code: 'reversed' });

  const r = calculate(
    base({
      hireDay: d('2020-07-01'),
      lastWorkDay: d('2026-09-30'),
      wages: [3_000_000, 3_000_000, 0],
      exclusions: [{ start: d('2026-09-01'), end: d('2026-09-30') }],
    }),
  );
  assert.equal(r.calcDays, 62);
  assert.equal(floorWon(r.averageDaily), 96_774n); // 6,000,000 ÷ 62
  const all = calculate(base({ hireDay: d('2020-07-01'), lastWorkDay: d('2026-09-30'), wages: [0, 0, 0], exclusions: [{ start: d('2026-05-01'), end: d('2026-09-30') }] }));
  assert.deepEqual(all, { kind: 'stop', reason: 'all-excluded' });
});

test('입력 오류: 날짜 역전·칸 수·큰 금액', () => {
  assert.deepEqual(calculate(base({ hireDay: d('2026-01-01'), lastWorkDay: d('2025-01-01'), wages: [] })), { kind: 'error', code: 'date-order' });
  assert.deepEqual(calculate(base({ hireDay: d('2020-01-01'), lastWorkDay: d('2025-12-31'), wages: [1] })), { kind: 'error', code: 'rows' });
  assert.equal(parseYmd('2025-02-30'), null);
  assert.equal(parseYmd('2025-2-3'), null);
  // 상한 금액·56년 근속에서도 정수 범위 안에서 계산
  const r = calculate(
    base({ hireDay: d('1970-01-01'), lastWorkDay: d('2025-12-31'), wages: [WAGE_MAX, WAGE_MAX, WAGE_MAX], bonus12: BONUS_MAX, annualLeavePay: WAGE_MAX, noSmallWorkplaceBefore2013: true }),
  );
  assert.equal(r.kind, 'amount');
  assert.ok(floorWon(r.severance) > 0n);
});

// 고용노동부 퇴직금 계산기 화면 스크립트(retire_cal.js의 setDate, 2026-10-16 열람)의 기간 계산을 그대로 옮긴 기대값
test('월말 퇴직일의 3개월 기간(고용노동부 계산기와 같은 처리)', () => {
  const cases = [
    ['2025-05-31', '2025-03-01', '2025-05-30', 3], // 2.31 없음 → 3.1부터
    ['2025-05-30', '2025-03-01', '2025-05-29', 3],
    ['2025-05-29', '2025-03-01', '2025-05-28', 3], // 평년 2.29 없음
    ['2024-05-29', '2024-02-29', '2024-05-28', 4], // 윤년 2.29 있음
    ['2024-05-31', '2024-03-01', '2024-05-30', 3],
    ['2025-07-31', '2025-04-30', '2025-07-30', 4], // 4.31 없음 → 4.30부터
    ['2025-12-31', '2025-09-30', '2025-12-30', 4], // 9.31 없음 → 9.30부터
    ['2026-03-31', '2025-12-31', '2026-03-30', 4],
    ['2026-03-30', '2025-12-30', '2026-03-29', 4],
    ['2026-10-01', '2026-07-01', '2026-09-30', 3], // 1일 퇴직 → 꽉 찬 3개월
  ];
  for (const [retire, start, end, rows] of cases) {
    const w = threeMonthWindow(d(retire));
    assert.equal(ymd(w.start), start, retire);
    assert.equal(ymd(w.end), end, retire);
    assert.equal(wageRows(d(retire)).length, rows, retire);
  }
  // 7.31 퇴직: 첫 칸이 4.30 하루
  assert.deepEqual(wageRows(d('2025-07-31')).map((r) => r.days), [1, 31, 30, 30]);
});

test('제외기간이 있으면 상여금·연차수당 반영액도 산정일수 비율만큼(고용노동부 계산기와 같은 처리)', () => {
  const r = calculate(
    base({
      hireDay: d('2020-07-01'),
      lastWorkDay: d('2026-09-30'),
      wages: [3_000_000, 3_000_000, 0],
      bonus12: 4_000_000,
      annualLeavePay: 400_000,
      exclusions: [{ start: d('2026-09-01'), end: d('2026-09-30') }],
    }),
  );
  assert.equal(r.calcDays, 62);
  assert.equal(r.windowDays, 92);
  assert.equal(wonCentsLabel(r.bonusAdd), '673,913.04원'); // 4,000,000 × 3/12 × 62/92
  assert.equal(wonCentsLabel(r.leaveAdd), '67,391.30원');
  const noEx = calculate(base({ hireDay: d('2020-07-01'), lastWorkDay: d('2026-09-30'), wages: [3_000_000, 3_000_000, 3_000_000], bonus12: 4_000_000 }));
  assert.equal(wonCentsLabel(noEx.bonusAdd), '1,000,000원');
});

test('2013년 이전 입사: 상시 4명 이하 이력을 확인하기 전에는 계산하지 않음', () => {
  const w = [3_000_000, 3_000_000, 3_000_000];
  assert.deepEqual(calculate(base({ hireDay: d('2012-12-31'), lastWorkDay: d('2025-12-31'), wages: w })), { kind: 'stop', reason: 'small-pre2013' });
  assert.deepEqual(
    calculate(base({ hireDay: d('2012-12-31'), lastWorkDay: d('2025-12-31'), wages: w, noSmallWorkplaceBefore2013: false })),
    { kind: 'stop', reason: 'small-pre2013' },
  );
  assert.equal(calculate(base({ hireDay: d('2012-12-31'), lastWorkDay: d('2025-12-31'), wages: w, noSmallWorkplaceBefore2013: true })).kind, 'amount');
  // 2013.1.1 이후 입사는 묻지 않고 계산
  assert.equal(calculate(base({ hireDay: d('2013-01-01'), lastWorkDay: d('2025-12-31'), wages: w })).kind, 'amount');
});

test('끝수 처리(고용노동부 계산기와 같음): 평균임금 1전 올림 · 통상임금 비교 · 원 단위 반올림 · 장기근속', () => {
  const run = (o) => calculate(base({ hireDay: d('2020-01-01'), lastWorkDay: d('2025-12-31'), ...o }));
  // 딱 떨어지면 올리지 않음: 9,200,000 ÷ 92 = 100,000.00
  const even = run({ wages: [3_100_000, 3_100_000, 3_000_000] }); // 10.1~12.31 = 92일
  assert.equal(even.calcDays, 92);
  assert.equal(wonCentsLabel(even.averageDaily), '100,000원');
  // 아주 작은 끝수도 1전 올림: 9,200,001 ÷ 92 = 100,000.0108… → 100,000.02
  const tiny = run({ wages: [3_100_001, 3_100_000, 3_000_000] });
  assert.equal(wonCentsLabel(tiny.averageDaily), '100,000.02원');
  // 통상임금 비교는 올림한 평균임금과 한다: 100,000.02 > 100,000 → 평균임금, 100,001 > 100,000.02 → 통상임금
  assert.equal(run({ wages: [3_100_001, 3_100_000, 3_000_000], ordinaryDaily: 100_000 }).usedOrdinary, false);
  assert.equal(run({ wages: [3_100_001, 3_100_000, 3_000_000], ordinaryDaily: 100_001 }).usedOrdinary, true);
  // 원 단위 반올림: 100,000 × 30 × 2,192 ÷ 365 = 18,016,438.35… → 18,016,438 / 통상 100,001 → 18,016,618.51… → 18,016,619
  assert.equal(even.severanceWon, 18_016_438n);
  assert.equal(run({ wages: [3_100_000, 3_100_000, 3_000_000], ordinaryDaily: 100_001 }).severanceWon, 18_016_619n);
  // 장기근속(30년): 공식 방식 산식과 같은 값
  const long = calculate(base({ hireDay: d('1995-10-01'), lastWorkDay: d('2025-09-30'), wages: [4_123_457, 4_123_457, 4_123_457], bonus12: 7_777_777, noSmallWorkplaceBefore2013: true }));
  const days = long.serviceDays;
  assert.equal(days, 10958);
  const avgCents = Math.ceil(((4_123_457 * 3 + 7_777_777 / 4) / long.calcDays) * 100); // 정수 전 단위
  assert.equal(long.averageDaily.n, BigInt(avgCents));
  assert.equal(long.severanceWon, BigInt(Math.round((avgCents * 30 * days) / 365 / 100)));
});
