// 가구 형태 (마이페이지에서 하나만 선택)
export const HOUSEHOLD_OPTIONS = [
  { code: 'SINGLE', label: '1인 가구' },
  { code: 'NEWLYWED', label: '신혼 부부' },
  { code: 'MULTI_CHILD', label: '다자녀' },
  { code: 'SINGLE_PARENT', label: '한부모' },
  { code: 'MULTICULTURAL', label: '다문화 가정' },
];

// 특수조건 (여러 개 선택 가능)
//  hidden: 예전 데이터에 남아 있을 수 있어 이름 표시용으로만 두고, 선택 버튼에는 안 보임
export const SPECIAL_OPTIONS = [
  { code: 'DISABLED', label: '장애인' },
  { code: 'VETERAN', label: '국가유공자·보훈대상' },
  { code: 'BASIC_LIVING', label: '기초생활수급자' },
  { code: 'NEAR_POVERTY', label: '차상위계층' },
  { code: 'CARE_LEAVER', label: '자립준비청년' },
  { code: 'NORTH_DEFECTOR', label: '북한이탈주민' },
  { code: 'PREGNANT', label: '임산부' },
  { code: 'SOLDIER', label: '군 복무·제대군인' },
  { code: 'FARMER', label: '농어업인' },
  { code: 'NEWLYWED', label: '신혼', hidden: true },
  { code: 'MULTI_CHILD', label: '다자녀', hidden: true },
  { code: 'OTHER', label: '기타' },
];

// 관심분야 (여러 개 선택 가능)
export const INTEREST_OPTIONS = [
  '주거', '취업', '창업', '교육', '장학금', '자산형성',
  '교통', '문화', '건강·의료', '출산·육아', '생활안정', '금융·대출',
  '귀농·귀촌', '에너지·요금', '청년', '대학생',
];

export function codesFor(options, labels) {
  return (labels || [])
    .map((label) => options.find((option) => option.label === label)?.code)
    .filter(Boolean);
}

export function labelsFor(options, codes) {
  return (codes || [])
    .map((code) => options.find((option) => option.code === code)?.label)
    .filter(Boolean);
}

export function labelText(options, codes) {
  const labels = labelsFor(options, codes);
  return labels.length > 0 ? labels.join(', ') : '선택 없음';
}
