// 작성자·검수자 registry. 실제 사람(또는 사이트 자체)만 등록한다(가짜 전문가 금지).
// canReview가 true인 사람만 reviewer로 지정할 수 있다. 현재 검수자는 없다.
import { site } from '../config/site';

export interface Person {
  id: string;
  name: string;
  canReview: boolean;
  // 사이트 이름으로 표시하는 작성자(구조화 데이터에서 Person이 아닌 Organization)
  isSite?: boolean;
}

// 글 작성자 표시명은 사이트 이름(P9 확정). 브랜드 문자열은 config/site.ts에서만 읽는다.
export const people: Person[] = [{ id: 'operator', name: site.name, canReview: false, isSite: true }];
