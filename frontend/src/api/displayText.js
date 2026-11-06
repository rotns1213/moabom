// 화면에 보여줄 글자 다듬기

// 지원금 제목 앞의 "[예시]" 표시 빼기
export function cleanTitle(title) {
  return (title || '').replace(/^\s*\[예시\]\s*/, '');
}

// 분류 이름: "예시 카테고리" 같은 테스트용 이름은 화면에 안 보여줌
export function cleanCategory(category) {
  const text = (category || '').trim();
  return text.includes('예시') ? '' : text;
}

// 카드에 보여줄 주요 해시태그 (최대 3개)
//  1순위: 지원금 데이터의 keywords
//  2순위: 대상 연령대·분류 이름에서 만들기
export function grantTags(grant) {
  const fromKeywords = (grant.keywords || []).filter(Boolean);
  const eligibility = grant.eligibility || {};
  const fallback = [
    eligibility.targetAgeGroup || grant.targetAgeGroup,
    cleanCategory(grant.categoryTitle),
  ].filter(Boolean);
  const tags = fromKeywords.length > 0 ? fromKeywords : fallback;
  return [...new Set(tags)].slice(0, 3);
}
