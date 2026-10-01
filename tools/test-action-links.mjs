// 공식 행동 링크 문구·URL 검증 단위 테스트. 사용: npm run test:links
// (빌드 단계 차단은 test:content의 action-* 케이스가 확인한다)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { actionLabel, actionUrlProblem, hostExceptionProblem } from '../src/lib/action-links.ts';

const gov24 = { url: 'https://www.gov.kr/' };
const ok = (url, source = gov24) => assert.equal(actionUrlProblem(url, source), undefined, url);
const bad = (url, part, source = gov24) => assert.match(actionUrlProblem(url, source) ?? '', new RegExp(part), url);

test('문구: 기관명 + 목적, 신청할 수 없는 상태에는 신청하기를 쓰지 않는다', () => {
  assert.equal(actionLabel('정부24', 'application', 'open'), '정부24에서 신청하기');
  assert.equal(actionLabel('정부24', 'application', 'closing-soon'), '정부24에서 신청하기');
  assert.equal(actionLabel('정부24', 'application', 'upcoming'), '정부24 신청 안내 보기');
  assert.equal(actionLabel('정부24', 'application', 'closed'), '정부24 공고 보기');
  assert.equal(actionLabel('서울시', 'info'), '서울시 공식 안내 보기');
  assert.equal(actionLabel('국세청', 'check'), '국세청에서 확인하기');
});

test('허용: 출처 URL 자체, 같은 호스트, www 없는 호스트, 하위 도메인', () => {
  ok('https://www.gov.kr/');
  ok('https://www.gov.kr/portal/service/1?x=1');
  ok('https://gov.kr/a');
  ok('https://plus.gov.kr/a');
  ok('https://www.seoul.go.kr/news/1', { url: 'https://www.seoul.go.kr/main' });
  ok('https://news.seoul.go.kr/a', { url: 'https://www.seoul.go.kr/main' });
});

test('차단: 다른 도메인·비슷한 이름·http·포트·사용자 정보', () => {
  bad('https://www.example.com/', '다른 도메인');
  bad('https://www.gov.kr.example.com/', '다른 도메인');
  bad('https://evilgov.kr/', '다른 도메인');
  bad('https://gov.kr.evil/', '다른 도메인');
  bad('http://www.gov.kr/', 'https');
  bad('https://www.gov.kr:8443/', '포트');
  bad('https://www.gov.kr@example.com/', '사용자 정보');
  bad('not a url', 'URL 형식');
});

test('출처 호스트가 공용 접미사면 하위 도메인을 허용하지 않는다', () => {
  bad('https://anything.go.kr/', '다른 도메인', { url: 'https://go.kr/' });
  bad('https://shop.co.kr/', '다른 도메인', { url: 'https://www.co.kr/' });
});

test('예외 호스트: 등록된 정확한 호스트만', () => {
  const city = { url: 'https://www.test-city.go.kr/notice/1', actionHosts: ['form.test-city.kr'] };
  ok('https://form.test-city.kr/form', city);
  bad('https://x.form.test-city.kr/form', '다른 도메인', city);
  bad('https://test-city.kr/form', '다른 도메인', city);
  assert.match(hostExceptionProblem('go.kr') ?? '', /공용 도메인/);
  assert.match(hostExceptionProblem('co.kr') ?? '', /공용 도메인/);
  assert.match(hostExceptionProblem('*.gov.kr') ?? '', /형식/);
  assert.match(hostExceptionProblem('https://a.kr') ?? '', /형식/);
  assert.equal(hostExceptionProblem('form.test-city.kr'), undefined);
});
