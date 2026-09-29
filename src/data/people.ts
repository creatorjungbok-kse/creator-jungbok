// 작성자·검수자 registry. 실제 사람만 등록한다(가짜 전문가 금지).
// canReview가 true인 사람만 reviewer로 지정할 수 있다. 현재 검수자는 없다.
export interface Person {
  id: string;
  name: string;
  canReview: boolean;
}

export const people: Person[] = [{ id: 'operator', name: '운영자', canReview: false }];
