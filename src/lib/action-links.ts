// 공식 행동 링크(ActionLinks)의 버튼 문구와 URL 검증. 외부 import 없이 순수 함수로 유지한다(node 테스트에서 직접 import).
// 버튼 문구는 이 파일에서만 만든다: 기관명 + 목적이 항상 보이고, 신청할 수 없는 상태에는 '신청하기'를 쓰지 않는다.
import type { BenefitStatus } from './benefit-status';

export const linkActions = ['application', 'info', 'check'] as const;
export type LinkAction = (typeof linkActions)[number];

// application(신청 관련 공식 페이지)은 지원·혜택 글에서만 쓰고, 상태에 따라 문구가 바뀐다
const applicationLabels: Record<BenefitStatus, (org: string) => string> = {
  open: (org) => `${org}에서 신청하기`,
  'closing-soon': (org) => `${org}에서 신청하기`,
  upcoming: (org) => `${org} 신청 안내 보기`,
  closed: (org) => `${org} 공고 보기`,
};
const otherLabels: Record<Exclude<LinkAction, 'application'>, (org: string) => string> = {
  info: (org) => `${org} 공식 안내 보기`,
  check: (org) => `${org}에서 확인하기`,
};

export function actionLabel(org: string, action: LinkAction, status?: BenefitStatus): string {
  if (action === 'application') return applicationLabels[status ?? 'open'](org);
  return otherLabels[action](org);
}

// 그 자체로는 한 기관의 도메인이 아닌 공용 접미사. 출처 URL의 호스트가 여기에 해당하면 하위 도메인 허용을 하지 않는다.
// (국내 공공·교육·법인 2단계 도메인과 광역 지자체 도메인, 흔한 최상위 도메인)
const PUBLIC_SUFFIXES = new Set([
  'kr', 'go.kr', 'or.kr', 'co.kr', 'ac.kr', 're.kr', 'ne.kr', 'pe.kr', 'mil.kr', 'hs.kr', 'ms.kr', 'es.kr', 'sc.kr', 'kg.kr',
  'seoul.kr', 'busan.kr', 'daegu.kr', 'incheon.kr', 'gwangju.kr', 'daejeon.kr', 'ulsan.kr', 'gyeonggi.kr', 'gangwon.kr',
  'chungbuk.kr', 'chungnam.kr', 'jeonbuk.kr', 'jeonnam.kr', 'gyeongbuk.kr', 'gyeongnam.kr', 'jeju.kr',
  'com', 'net', 'org', 'io', 'co', 'gov', 'edu', 'info', 'biz', 'app', 'dev', 'site',
]);

const HOSTNAME = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

// 예외 호스트(출처의 actionHosts)로 쓸 수 있는 값인지. 정확한 호스트 이름만, 공용 접미사는 안 된다
export function hostExceptionProblem(host: string): string | undefined {
  if (!HOSTNAME.test(host)) return `호스트 이름 형식이 아님: ${host}`;
  if (PUBLIC_SUFFIXES.has(host)) return `공용 도메인 접미사는 예외로 둘 수 없음: ${host}`;
  return undefined;
}

// 행동 링크 URL이 참조한 공식 출처에 속하는지. 문제가 없으면 undefined, 있으면 이유.
// 허용: ① 출처 URL과 완전히 같음 ② 출처 호스트와 같은 호스트 ③ 출처 호스트(www. 제외)의 하위 도메인
//      ④ 출처에 사람이 확인해 등록한 예외 호스트(actionHosts)와 같은 호스트
// 공통: https만, 포트·사용자 정보 없음. 출처 호스트가 공용 접미사이면 ③은 쓰지 않는다.
export function actionUrlProblem(url: string, source: { url: string; actionHosts?: readonly string[] }): string | undefined {
  let target: URL;
  let origin: URL;
  try {
    target = new URL(url);
    origin = new URL(source.url);
  } catch {
    return 'URL 형식 오류';
  }
  if (target.protocol !== 'https:') return 'https 주소만 허용';
  if (target.port || target.username || target.password) return '포트·사용자 정보가 있는 주소는 허용하지 않음';
  if (target.href === origin.href) return undefined;

  const host = target.hostname;
  const base = origin.hostname.replace(/^www\./, '');
  if (host === origin.hostname || host === base) return undefined;
  if (!PUBLIC_SUFFIXES.has(base) && base.includes('.') && host.endsWith(`.${base}`)) return undefined;
  if (source.actionHosts?.includes(host)) return undefined;
  return `출처(${origin.hostname})와 다른 도메인 ${host}`;
}
