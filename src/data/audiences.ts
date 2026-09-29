// 대상 태그 registry(01 A-1). 대상자는 category가 아니라 audience로 관리한다.
export const audiences = [
  { id: 'individual', name: '개인' },
  { id: 'household', name: '가구' },
  { id: 'youth', name: '청년' },
  { id: 'senior', name: '노인' },
  { id: 'disabled', name: '장애인' },
  { id: 'low-income', name: '저소득' },
  { id: 'families-with-children', name: '자녀가구' },
  { id: 'small-business-owner', name: '소상공인' },
  { id: 'sole-proprietor', name: '개인사업자' },
  { id: 'corporation', name: '법인' },
  { id: 'job-seeker', name: '구직자' },
] as const;
