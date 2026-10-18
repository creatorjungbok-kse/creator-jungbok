// 실수령액 계산기 엔진 v1 테스트. 사용: npm run test:tools
// 기대값: 소득세법 시행령 별표 2(2026. 2. 27. 개정) 원문 PDF에서 직접 읽은 칸, 국세청 간이세액표 안내(mi=6583) 예시, 4대보험 모의계산(test-social-insurance T1).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { AT_10M, TABLE_SHA256, WITHHOLDING_ROWS } from '../src/lib/payroll/take-home/withholding-table.ts';
import { calcTakeHome, childDeduction, monthlyIncomeTax, tableTax } from '../src/lib/payroll/take-home/calculation.ts';

test('표 원문 해시: 추출 직렬화 문자열이 원문 추출값과 같다', () => {
  const s = [...WITHHOLDING_ROWS.map((r) => `${r[0]}:${r.slice(1).join(',')}`), `10000:${AT_10M.join(',')}`].join(';');
  assert.equal(createHash('sha256').update(s).digest('hex'), TABLE_SHA256);
});

test('표 구조: 646행, 행 연속, 구간 폭 5·10·20천원, 칸 11개', () => {
  assert.equal(WITHHOLDING_ROWS.length, 646);
  assert.equal(WITHHOLDING_ROWS[0][0], 770);
  assert.equal(WITHHOLDING_ROWS.at(-1)[0], 9_980);
  for (let i = 0; i < WITHHOLDING_ROWS.length; i++) {
    const r = WITHHOLDING_ROWS[i];
    assert.equal(r.length, 12, `칸 수 ${r[0]}`);
    const next = i + 1 < WITHHOLDING_ROWS.length ? WITHHOLDING_ROWS[i + 1][0] : 10_000;
    assert.equal(next - r[0], r[0] < 1_500 ? 5 : r[0] < 3_000 ? 10 : 20, `구간 폭 ${r[0]}`);
  }
  assert.equal(AT_10M.length, 11);
});

test('열 밀림 탐지: 가족 수가 늘면 세액이 늘지 않고, 급여가 오르면 줄지 않는다', () => {
  let prev = null;
  for (const r of [...WITHHOLDING_ROWS, [10_000, ...AT_10M]]) {
    // r[f]는 가족 f명 세액(r[0]은 하한). 1명→2명부터 10명→11명까지 모두 비교
    for (let f = 1; f < 11; f++) assert.ok(r[f + 1] <= r[f], `가족 ${r[0]} ${f} → ${f + 1}`);
    if (prev) for (let f = 1; f < 12; f++) assert.ok(r[f] >= prev[f], `급여 ${r[0]} 가족 ${f}`);
    prev = r;
  }
});

// 아래 기대값은 표 데이터(withholding-table.ts)와 독립된 출처에서 가져왔다. 같은 추출 결과를 코드와 테스트가 공유해 오류를 놓치지 않도록 한다.
// - 3,500천원 행(가족 1~5명): 국세청 간이세액표 안내 페이지(mi=6583) 예시 표
// - 그 밖의 칸: 별표 2 PDF를 글자 위치 없이 순서대로 읽은 원문 텍스트(행 묶음 추출기와 다른 방식)에서 사람이 직접 확인한 값
test('원문 대조: 첫·중간·마지막 구간, 가족 1명과 11명', () => {
  assert.equal(tableTax(770_000, 1), 0); // 첫 행 '-'
  assert.equal(tableTax(769_999, 1), 0); // 770천원 미만
  assert.equal(tableTax(1_060_000, 1), 1_040); // 첫 세액 발생 행
  assert.equal(tableTax(1_499_999, 1), 8_760); // 1,495~1,500(이 칸만 추출값 기준, 구간 경계 확인용)
  assert.equal(tableTax(1_500_000, 1), 8_920); // 구간 폭이 바뀌는 행
  assert.equal(tableTax(2_000_000, 3), 6_600);
  assert.deepEqual([1, 2, 3, 4, 5].map((f) => tableTax(3_500_000, f)), [127_220, 102_220, 62_460, 49_340, 37_630]); // 국세청 예시
  assert.equal(tableTax(3_519_999, 11), 10_640);
  assert.equal(tableTax(5_000_000, 1), 335_470);
  assert.equal(tableTax(5_000_000, 2), 306_710);
  assert.equal(tableTax(5_000_000, 11), 87_850);
  assert.equal(tableTax(9_999_999, 1), 1_503_990); // 마지막 행 9,980~10,000
  assert.equal(tableTax(9_999_999, 11), 958_650);
  assert.equal(tableTax(10_000_000, 1), 1_507_400); // 10,000천원인 경우
  assert.equal(tableTax(10_000_000, 11), 960_840);
});

test('가족 11명 초과(주석 4): 11명 세액 − (10명 − 11명) × 초과 인원, 음수면 0', () => {
  assert.equal(tableTax(3_500_000, 12), 10_640 - (14_010 - 10_640));
  assert.equal(tableTax(3_500_000, 14), 10_640 - 3_370 * 3);
  assert.equal(tableTax(3_500_000, 15), 0);
});

test('1,000만원 초과는 v1에서 계산하지 않는다', () => {
  assert.throws(() => tableTax(10_000_001, 1), RangeError);
});

test('자녀 공제(2026. 3. 1.~): 1명 20,830 · 2명 45,830 · 3명 79,160 · 4명 112,490', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(childDeduction), [0, 20_830, 45_830, 79_160, 112_490]);
});

test('국세청 예시 조건(3,500천원·가족 4명·자녀 2명)에 개정 공제 적용 + 비율 80/100/120', () => {
  assert.equal(monthlyIncomeTax(3_500_000, 4, 2, 100), 3_510); // 49,340 − 45,830
  assert.equal(monthlyIncomeTax(3_500_000, 4, 2, 80), 2_800); // 2,808 → 10원 미만 버림
  assert.equal(monthlyIncomeTax(3_500_000, 4, 2, 120), 4_210); // 4,212 → 4,210
});

test('자녀 공제 후 0원(음수 → 0)', () => {
  assert.equal(monthlyIncomeTax(2_000_000, 3, 2, 100), 0); // 6,600 − 45,830
  assert.equal(monthlyIncomeTax(2_000_000, 3, 2, 120), 0);
});

const base = { gross: 3_200_000, meal: 200_000, childcare: 0, childrenUnder6: 0, otherExempt: 0, family: 1, children8to20: 0, rate: 100, companySize: 'under150', age60: false, newHireAfter65: false };

test('전체: 월 320만원(식대 20만원)·가족 1명 → 과세 300만원, 4대보험 291,520, 소득세 74,350, 지방소득세 7,430', () => {
  const r = calcTakeHome(base);
  assert.equal(r.ok, true);
  const x = r.result;
  assert.equal(x.taxable, 3_000_000);
  assert.equal(x.insurance.workerTotal, 291_520); // test-social-insurance T1과 같은 기준 보수
  assert.equal(x.incomeTax, 74_350);
  assert.equal(x.localTax, 7_430);
  assert.equal(x.net, 3_200_000 - 291_520 - 74_350 - 7_430);
  assert.deepEqual(x.notices, []);
});

test('비과세 한도 초과분은 과세, 안내 표시', () => {
  const r = calcTakeHome({ ...base, meal: 250_000 });
  assert.equal(r.result.exempt.meal, 200_000);
  assert.equal(r.result.taxable, 3_000_000);
  assert.deepEqual(r.result.notices, ['meal-over-limit']);
  const c = calcTakeHome({ ...base, meal: 0, childcare: 300_000, childrenUnder6: 1 });
  assert.equal(c.result.exempt.childcare, 200_000);
  assert.deepEqual(c.result.notices, ['childcare-over-limit']);
});

test('입력 오류: 비과세 합계 ≥ 급여, 자녀 수 > 가족 − 1, 1,000만원 초과, 6세 이하 자녀 수 상한', () => {
  assert.deepEqual(calcTakeHome({ ...base, gross: 200_000 }), { ok: false, error: 'exempt-exceeds-gross' });
  assert.deepEqual(calcTakeHome({ ...base, family: 2, children8to20: 2 }), { ok: false, error: 'children-exceed-family' });
  assert.deepEqual(calcTakeHome({ ...base, gross: 10_200_001 }), { ok: false, error: 'over-10m' });
  // 6세 이하 자녀 수 입력 상한(비현실적 입력 차단)
  assert.deepEqual(calcTakeHome({ ...base, childrenUnder6: 21 }), { ok: false, error: 'family-invalid' });
  assert.deepEqual(calcTakeHome({ ...base, childrenUnder6: Number.MAX_SAFE_INTEGER }), { ok: false, error: 'family-invalid' });
  assert.equal(calcTakeHome({ ...base, childrenUnder6: 20 }).ok, true);
  assert.equal(calcTakeHome({ ...base, gross: 10_200_000 }).ok, true); // 과세 정확히 1,000만원
});

test('화면: GA 신호는 도구 이름만 1곳, 저장·전송 없음, 지방소득세는 예상 표기, 연봉 가정 문구', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync('src/components/tools/TakeHomePay.astro', 'utf8');
  assert.equal((src.match(/dispatchEvent\(/g) ?? []).length, 1);
  assert.match(src, /new CustomEvent\('kkultip:tool-use', \{ detail: 'take-home-pay' \}\)/);
  assert.doesNotMatch(src, /localStorage|sessionStorage|fetch\(|sendBeacon|gtag/);
  assert.match(src, /예상 지방소득세/);
  assert.match(src, /퇴직금은 연봉에 포함되지 않는다고 가정/);
  assert.doesNotMatch(src, /value="hour"|name="th-mode" value="(?!month|year)/); // 시급 모드 없음(v1)
});

test('월급↔연봉 전환 변환: 월 300만 → 연 3,600만 → 월 300만, 연 4,000만 → 월 3,333,333 → 연 39,999,996', async () => {
  const { convertPay } = await import('../src/lib/payroll/take-home/calculation.ts');
  assert.equal(convertPay(3_000_000, 'month', 'year'), 36_000_000);
  assert.equal(convertPay(36_000_000, 'year', 'month'), 3_000_000);
  assert.equal(convertPay(40_000_000, 'year', 'month'), 3_333_333);
  assert.equal(convertPay(3_333_333, 'month', 'year'), 39_999_996);
  assert.equal(convertPay(3_000_000, 'month', 'month'), 3_000_000);
});

test('아주 적은 급여: 공제가 급여보다 크면 실수령액을 내지 않고 범위 밖 오류', () => {
  assert.deepEqual(calcTakeHome({ ...base, meal: 0, gross: 1 }), { ok: false, error: 'net-negative' });
  assert.deepEqual(calcTakeHome({ ...base, meal: 0, gross: 20_000 }), { ok: false, error: 'net-negative' });
  const r = calcTakeHome({ ...base, meal: 0, gross: 400_000 });
  assert.equal(r.ok, true);
  assert.ok(r.result.net >= 0);
  // 1원부터 100만원까지 1천원 간격으로 음수 실수령액이 결과로 나오지 않는다
  for (let g = 1; g <= 1_000_000; g += 1_000) {
    const x = calcTakeHome({ ...base, meal: 0, gross: g });
    if (x.ok) assert.ok(x.result.net >= 0, `gross ${g}`);
    else assert.equal(x.error, 'net-negative');
  }
});
