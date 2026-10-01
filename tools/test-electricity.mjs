// 전기요금 계산기 단위 테스트. 사용: npm run test:tools
// 기대값은 공식 요금표·법령 비율로 계산 코드와 따로(소수 연산) 구한 값이다. 공개 전 한전ON 공식 계산 결과와 수동 대조한다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { electricityBill as c } from '../src/tools/electricity-bill/constants.ts';
import { calcElectricityBill, parseKwh, percent, tierLabels, validUntil } from '../src/tools/electricity-bill/calc.ts';

const bill = (kWh, season) => calcElectricityBill(kWh, season, c);
const total = (kWh, season) => bill(kWh, season).total;

test('검증 벡터: 그 외 200 / 그 외 350 / 7~8월 450 / 그 외 201(내역 전체)', () => {
  assert.deepEqual(bill(200, 'other'), { basic: 910, energy: 24000, climate: 1800, fuelAdjustment: 1000, subtotal: 27710, vat: 2771, fund: 740, total: 31220 });
  assert.deepEqual(bill(350, 'other'), { basic: 1600, energy: 56190, climate: 3150, fuelAdjustment: 1750, subtotal: 62690, vat: 6269, fund: 1690, total: 70640 });
  assert.deepEqual(bill(450, 'summer'), { basic: 1600, energy: 68190, climate: 4050, fuelAdjustment: 2250, subtotal: 76090, vat: 7609, fund: 2050, total: 85740 });
  // 전력량요금 24,214.6원 → 원 미만 절사 24,214원
  assert.deepEqual(bill(201, 'other'), { basic: 1600, energy: 24214, climate: 1809, fuelAdjustment: 1005, subtotal: 28628, vat: 2863, fund: 770, total: 32260 });
});

test('구간 경계: 기본요금은 총 사용량이 든 구간, 전력량요금은 구간별 누진', () => {
  const cases = [
    ['other', 1, 910, 1160],
    ['other', 200, 910, 31220],
    ['other', 201, 1600, 32260],
    ['other', 400, 1600, 83530],
    ['other', 401, 7300, 90310],
    ['other', 1000, 7300, 307220],
    ['summer', 300, 910, 46320],
    ['summer', 301, 1600, 47360],
    ['summer', 450, 1600, 85740],
    ['summer', 451, 7300, 92530],
    ['summer', 1000, 7300, 291320],
  ];
  for (const [season, kWh, basic, expected] of cases) {
    const b = bill(kWh, season);
    assert.equal(b.basic, basic, `${season} ${kWh} 기본요금`);
    assert.equal(b.total, expected, `${season} ${kWh} 청구금액`);
  }
  // 하계는 같은 사용량이라도 구간이 넓어 같거나 싸다
  assert.ok(total(450, 'summer') < total(450, 'other'));
});

test('부가가치세: 원 미만 4사5입(0.5원은 올림)', () => {
  // 그 외 203kWh: 전기요금계 29,085 × 10% = 2,908.5 → 2,909
  const b = bill(203, 'other');
  assert.equal(b.subtotal, 29085);
  assert.equal(b.vat, 2909);
  assert.equal(b.total, 32770);
  // 7~8월 1,000kWh: 258,505 × 10% = 25,850.5 → 25,851
  assert.equal(bill(1000, 'summer').vat, 25851);
  // 0.4원은 버림: 그 외 1kWh 1,044 × 10% = 104.4 → 104
  assert.equal(bill(1, 'other').vat, 104);
});

test('전력산업기반기금: 2.7%, 10원 미만 절사', () => {
  // 27,710 × 2.7% = 748.17 → 740
  assert.equal(bill(200, 'other').fund, 740);
  // 1,044 × 2.7% = 28.188 → 20
  assert.equal(bill(1, 'other').fund, 20);
  for (const kWh of [1, 57, 200, 333, 999]) assert.equal(bill(kWh, 'other').fund % 10, 0);
});

test('청구금액: 합계의 10원 미만 절사', () => {
  // 27,710 + 2,771 + 740 = 31,221 → 31,220
  const b = bill(200, 'other');
  assert.equal(b.subtotal + b.vat + b.fund, 31221);
  assert.equal(b.total, 31220);
  for (let kWh = 1; kWh <= 1000; kWh += 37) {
    for (const season of ['other', 'summer']) {
      const x = bill(kWh, season);
      assert.equal(x.total % 10, 0);
      assert.ok(x.subtotal + x.vat + x.fund - x.total < 10);
    }
  }
});

test('기금률은 현행 시행령 2.7%로 고정(옛 계산기 안내의 3.7%가 아님)', () => {
  assert.equal(c.fundRate, 0.027);
  assert.notEqual(c.fundRate, 0.037);
  assert.equal(percent(c.fundRate), '2.7%');
  // 3.7%로 바뀌면 200kWh 결과가 31,500원이 되어 검증 벡터가 깨진다
  const wrong = calcElectricityBill(200, 'other', { ...c, fundRate: 0.037 });
  assert.equal(wrong.fund, 1020);
  assert.equal(wrong.total, 31500);
  assert.notEqual(wrong.total, total(200, 'other'));
});

test('상수: 요금표·단가·기간·출처', () => {
  assert.deepEqual(c.seasons.other.tiers, [
    { upTo: 200, basic: 910, rate10: 1200 },
    { upTo: 400, basic: 1600, rate10: 2146 },
    { upTo: null, basic: 7300, rate10: 3073 },
  ]);
  assert.deepEqual(c.seasons.summer.tiers.map((t) => t.upTo), [300, 450, null]);
  assert.equal(c.climate.rate10, 90);
  assert.equal(c.fuelAdjustment.rate10, 50);
  assert.equal(c.vatRate, 0.1);
  assert.deepEqual([c.fuelAdjustment.effectiveFrom, c.fuelAdjustment.effectiveTo, c.fuelAdjustment.checkedAt], ['2026-10-01', '2026-12-31', '2026-10-01']);
  assert.equal(validUntil(c), '2026-12-31');
  assert.deepEqual(tierLabels(c.seasons.other.tiers), ['200kWh 이하', '201~400kWh', '400kWh 초과']);
  assert.deepEqual(tierLabels(c.seasons.summer.tiers), ['300kWh 이하', '301~450kWh', '450kWh 초과']);
  for (const ids of [c.tariffSourceIds, c.climate.sourceIds, c.fuelAdjustment.sourceIds, c.vatSourceIds, c.fundSourceIds]) assert.ok(ids.length > 0);
});

test('입력 검증: 1~1,000 정수만', () => {
  const ok = (raw, value) => assert.deepEqual(parseKwh(raw, c), { ok: true, value }, raw);
  const bad = (raw, part) => {
    const r = parseKwh(raw, c);
    assert.equal(r.ok, false, raw);
    assert.match(r.error, new RegExp(part), raw);
  };
  ok('1', 1);
  ok('1000', 1000);
  ok('1,000', 1000);
  ok(' 350 ', 350);
  bad('', '월 사용량을 입력하세요');
  bad('   ', '월 사용량을 입력하세요');
  bad('0', '1~1,000kWh 사이의 정수');
  bad('1001', '1~1,000kWh 사이의 정수');
  bad('1,001', '1~1,000kWh 사이의 정수');
  bad('200.5', '1~1,000kWh 사이의 정수');
  bad('-5', '1~1,000kWh 사이의 정수');
  bad('abc', '1~1,000kWh 사이의 정수');
  bad('1e3', '1~1,000kWh 사이의 정수');
});
