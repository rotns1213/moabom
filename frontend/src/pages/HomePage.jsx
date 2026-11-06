import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import styles from '../styles/HomePage.module.css';
import { MoaExplorer } from '../components/MoaCharacter';
import {
  GlossyBag, GlossyBell, GlossyBook, GlossyBookmark, GlossyBus, GlossyCap, GlossyChat,
  GlossyCoin, GlossyHeart, GlossyHouse, GlossySearch, GlossyStar, GlossyTicket,
} from '../components/GlossyIcons';
import { getBehaviors, getGrants, getPopularGrants, getProfile, getRecommendations, saveProfile } from '../api/moabomApi';
import { cleanCategory, cleanTitle, grantTags } from '../api/displayText';
import { useAuth } from '../auth/AuthContext';

// 확인된 지원금 정렬 방법
const SORT_OPTIONS = [
  { value: 'deadline-asc', label: '마감 빠른순' },
  { value: 'deadline-desc', label: '마감 느린순' },
  { value: 'name', label: '가나다순' },
  { value: 'recommend', label: '맞춤 추천순', member: true },
];

// ------------------------------------------------------------------
// '자주 찾는 지원금' 카테고리 추천
//  - base  : 모두에게 기본으로 많이 찾는 정도 (로그인 전에는 이 순서)
//  - score : 회원 프로필(나이·관심분야·가구 형태·소득분위·특수조건)과 맞으면 점수 추가
//  - 점수 높은 순으로 8개 표시 (점수가 같으면 아래 목록 순서)
// ------------------------------------------------------------------
const inAge = (p, min, max) => p.age != null && p.age >= min && p.age <= max;
const has = (list, value) => (list || []).includes(value);

const CATEGORY_POOL = [
  { label: '청년', keyword: '청년', Icon: GlossyStar, base: 5,
    score: (p) => (inAge(p, 19, 34) ? 6 : 0) },
  { label: '취업준비생', keyword: '구직', Icon: GlossyBag, base: 4,
    score: (p) => (inAge(p, 19, 34) ? 3 : 0) + (has(p.interests, '취업') ? 6 : 0) },
  { label: '교통비', keyword: '교통', Icon: GlossyBus, base: 4,
    score: (p) => (inAge(p, 19, 39) ? 3 : 0) },
  { label: '자취·월세', keyword: '월세', Icon: GlossyHouse, base: 4,
    score: (p) => (has(p.householdTypes, 'SINGLE') ? 5 : 0) + (has(p.interests, '주거') ? 5 : 0) + (inAge(p, 19, 39) ? 2 : 0) },
  { label: '문화', keyword: '문화', Icon: GlossyTicket, base: 3,
    score: (p) => (p.incomeBracket != null && p.incomeBracket <= 3 ? 2 : 0) + (inAge(p, 19, 34) ? 1 : 0) },
  { label: '대학생', keyword: '교육', Icon: GlossyCap, base: 3,
    score: (p) => (inAge(p, 19, 29) ? 4 : 0) + (has(p.interests, '교육') ? 5 : 0) },
  { label: '생활 안정', keyword: '생활', Icon: GlossyCoin, base: 3,
    score: (p) => (p.incomeBracket != null && p.incomeBracket <= 2 ? 4 : 0) },
  { label: '양육 지원', keyword: '양육', Icon: GlossyHeart, base: 3,
    score: (p) => (has(p.householdTypes, 'MULTI_CHILD') || has(p.householdTypes, 'SINGLE_PARENT') ? 7 : 0)
      + (has(p.householdTypes, 'NEWLYWED') ? 3 : 0) + (inAge(p, 30, 49) ? 2 : 0) },
  { label: '자산 형성', keyword: '자산', Icon: GlossyCoin, base: 2,
    score: (p) => (has(p.interests, '자산형성') ? 6 : 0) + (inAge(p, 19, 39) ? 2 : 0) },
  { label: '교육·자격증', keyword: '교육', Icon: GlossyBook, base: 2,
    score: (p) => (has(p.interests, '교육') ? 4 : 0) },
  { label: '신혼부부', keyword: '신혼', Icon: GlossyHeart, base: 1,
    score: (p) => (has(p.householdTypes, 'NEWLYWED') || has(p.specialConditions, 'NEWLYWED') ? 8 : 0) },
  { label: '중장년', keyword: '장년', Icon: GlossySearch, base: 1,
    score: (p) => (p.age != null && p.age >= 50 ? 8 : 0) },
  { label: '장애인 지원', keyword: '장애', Icon: GlossyHeart, base: 0,
    score: (p) => (has(p.specialConditions, 'DISABLED') ? 9 : 0) },
  { label: '국가유공자', keyword: '유공자', Icon: GlossyStar, base: 0,
    score: (p) => (has(p.specialConditions, 'VETERAN') ? 9 : 0) },
];

// 관심 카테고리 해시태그와 이름이 같은 카테고리는 점수 +6 (예: #문화 → '문화')
const tagBonus = (item, profile) => (
  has(profile.interests, item.label) || has(profile.interests, item.keyword) ? 6 : 0
);

function pickCategories(profile) {
  return CATEGORY_POOL
    .map((item, order) => ({
      ...item,
      order,
      total: item.base + (profile ? item.score(profile) + tagBonus(item, profile) : 0),
    }))
    .sort((a, b) => (b.total - a.total) || (a.order - b.order))
    .slice(0, 8);
}

// 첫 화면 배너 (화살표로 넘김)
const SLIDES = [
  {
    title: ['나의 지원금,', '여기 다 모아봄'],
    text: '나이, 지역, 소득만 알려주면 받을 수 있는 지원금을 찾아드려요.',
    action: 'recommend',
    button: '내 조건으로 추천받기',
    Badge: GlossyStar,
  },
  {
    title: ['헷갈리는 신청 조건,', '모아챗에게 물어보세요'],
    text: '지원 대상인지, 무엇을 준비해야 하는지 바로 답해 드려요.',
    action: 'chat',
    button: '모아챗 열기',
    Badge: GlossyChat,
  },
  {
    title: ['마감일 놓치지 않게', '미리 알려드려요'],
    text: '스크랩한 지원금은 마감이 다가오면 알림으로 챙겨 드려요.',
    action: 'scrap',
    button: '스크랩 보러 가기',
    Badge: GlossyBell,
  },
];

const statusLabel = {
  ELIGIBLE: '신청 가능',
  CHECK_REQUIRED: '조건 확인 필요',
  INELIGIBLE: '자격 미충족',
};

const statusClass = {
  ELIGIBLE: 'statusOk',
  CHECK_REQUIRED: 'statusCheck',
  INELIGIBLE: 'statusNo',
};

function recommendationDetail(item) {
  const reasons = item.reasons || [];
  const reason = reasons.find((entry) => entry.includes(' - ')) || item.grant.description;
  return reason
    .replace(' PASS - ', ' 충족 - ')
    .replace(' FAIL - ', ' 불충족 - ')
    .replace(' UNKNOWN - ', ' 정보 부족 - ');
}

// 지원금 데이터가 eligibility 안에 있거나 바깥에 있어도 같은 값을 꺼내기
function pick(grant, key) {
  if (grant.eligibility && grant.eligibility[key] != null) {
    return grant.eligibility[key];
  }
  return grant[key];
}

// 마감일까지 남은 날짜를 "D-12", "오늘 마감", "상시" 같은 글자로 바꾸기
function deadlineText(endDate) {
  if (!endDate) {
    return { text: '상시 모집', urgent: false };
  }
  const end = new Date(`${endDate}T23:59:59`);
  if (Number.isNaN(end.getTime())) {
    return { text: endDate, urgent: false };
  }
  const days = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)) - 1;
  if (days < 0) {
    return { text: '마감', urgent: false, closed: true };
  }
  if (days === 0) {
    return { text: '오늘 마감', urgent: true };
  }
  return { text: `D-${days}`, urgent: days <= 14 };
}

function targetText(grant) {
  const parts = [pick(grant, 'targetAgeGroup'), pick(grant, 'targetRegion')].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '대상 정보 확인 필요';
}

function GrantCard({ grant }) {
  const deadline = deadlineText(grant.endDate);
  const category = cleanCategory(grant.categoryTitle);
  const tags = grantTags(grant);
  let ddayClass = styles.dday;
  if (deadline.closed) {
    ddayClass = `${styles.dday} ${styles.ddayClosed}`;
  } else if (!grant.endDate) {
    ddayClass = `${styles.dday} ${styles.ddayAlways}`;
  }
  return (
    <Link to={`/support/details/${grant.grantId}`} className={styles.card}>
      <div className={styles.cardTop}>
        <span className={ddayClass}>{deadline.text}</span>
        {category && <span className={styles.cardCategory}>{category}</span>}
      </div>
      <h3 className={styles.cardTitle}>{cleanTitle(grant.title)}</h3>
      <p className={styles.cardDetail}>{grant.description}</p>
      {tags.length > 0 && (
        <ul className={styles.cardTags} aria-label="주요 키워드">
          {tags.map((tag) => <li key={tag}>#{tag}</li>)}
        </ul>
      )}
      <div className={styles.cardFooter}>
        <span className={styles.cardTarget}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
            <circle cx="12" cy="10" r="2.3" />
          </svg>
          {targetText(grant)}
        </span>
        <span className={styles.cardMore}>
          자세히
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
        </span>
      </div>
    </Link>
  );
}

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ready, user, token } = useAuth();
  const [slide, setSlide] = useState(0);
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const grantsAnchorRef = useRef(null);
  const recommendAnchorRef = useRef(null);
  const [grants, setGrants] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendationState, setRecommendationState] = useState('guest');
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const [hot, setHot] = useState({ state: 'loading', ranking: [], updatedAt: '' });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!ready) {
      return undefined;
    }
    let active = true;
    setLoading(true);
    const recommendationCall = user
      ? getRecommendations(user.id, token)
      : Promise.resolve(null);
    Promise.allSettled([getGrants(), recommendationCall])
      .then(([grantResult, recommendationResult]) => {
        if (!active) {
          return;
        }
        if (grantResult.status === 'fulfilled') {
          setGrants(grantResult.value.grants || []);
          setError('');
        } else {
          setError(grantResult.reason.message);
        }
        if (!user) {
          setRecommendations([]);
          setRecommendationState('guest');
        } else if (recommendationResult.status === 'fulfilled') {
          setRecommendations(recommendationResult.value.recommendations || []);
          setRecommendationState('ready');
        } else if (recommendationResult.reason.status === 404) {
          setRecommendations([]);
          setRecommendationState('noProfile');
        } else {
          setRecommendations([]);
          setRecommendationState('error');
          setRecommendationMessage(recommendationResult.reason.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [ready, user, token]);

  // 회원 프로필 (카테고리 추천에 사용)
  useEffect(() => {
    if (!user || !token) {
      setProfile(null);
      return undefined;
    }
    let active = true;
    getProfile(user.id, token)
      .then((loaded) => {
        if (active) {
          setProfile(loaded);
        }
      })
      .catch(() => {
        if (active) {
          setProfile(null);
        }
      });
    return () => {
      active = false;
    };
  }, [user, token]);

  const quickLinks = useMemo(() => pickCategories(profile), [profile]);
  const [scrapCount, setScrapCount] = useState(null);
  const [sortBy, setSortBy] = useState('deadline-asc');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  // 정렬 메뉴: 바깥을 누르거나 Esc 를 누르면 닫기
  useEffect(() => {
    if (!sortOpen) {
      return undefined;
    }
    const close = (event) => {
      if (!sortRef.current?.contains(event.target)) {
        setSortOpen(false);
      }
    };
    const esc = (event) => {
      if (event.key === 'Escape') {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [sortOpen]);

  // 내 스크랩 개수 (서버에 저장된 SCRAP 기록 수)
  useEffect(() => {
    if (!user || !token) {
      setScrapCount(null);
      return undefined;
    }
    let active = true;
    getBehaviors(user.id, token)
      .then((body) => {
        if (active) {
          setScrapCount((body.behaviors || []).filter((behavior) => behavior.type === 'SCRAP').length);
        }
      })
      .catch(() => {
        if (active) {
          setScrapCount(null);
        }
      });
    return () => {
      active = false;
    };
  }, [user, token]);
  const [interestMessage, setInterestMessage] = useState('');

  // 관심 카테고리 지우기 → 바로 저장하고, 맞춤 카테고리·추천 순위를 다시 계산
  const removeInterest = async (interest) => {
    if (!profile || !user) {
      return;
    }
    const before = profile;
    const next = { ...profile, interests: (profile.interests || []).filter((item) => item !== interest) };
    setProfile(next); // 화면 먼저 반영 (맞춤 카테고리는 이 값으로 즉시 다시 계산됨)
    setInterestMessage('');
    try {
      await saveProfile(user.id, token, {
        age: next.age,
        region: next.region,
        incomeBracket: next.incomeBracket,
        householdTypes: next.householdTypes || [],
        specialConditions: next.specialConditions || [],
        interests: next.interests,
      });
      const refreshed = await getRecommendations(user.id, token);
      setRecommendations(refreshed.recommendations || []);
    } catch (saveError) {
      setProfile(before); // 저장 실패 시 되돌리기
      setInterestMessage('관심 카테고리를 지우지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  // 실시간 인기 순위
  useEffect(() => {
    let active = true;
    getPopularGrants()
      .then((body) => {
        if (active) {
          setHot({ state: 'ready', ranking: (body.ranking || []).slice(0, 5), updatedAt: body.updatedAt || '' });
        }
      })
      .catch(() => {
        if (active) {
          setHot({ state: 'error', ranking: [], updatedAt: '' });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleGrants = useMemo(() => {
    const keyword = query.trim();
    const list = keyword
      ? grants.filter((grant) => `${grant.title} ${grant.description} ${grant.categoryTitle || ''}`.includes(keyword))
      : grants;
    const today = new Date().toISOString().slice(0, 10);
    const isClosed = (grant) => Boolean(grant.endDate) && grant.endDate < today;
    // 마감 빠른순 기준값: 마감일이 없으면(상시) 가장 늦은 것으로
    const due = (grant) => grant.endDate || '9999-12-31';
    const byDeadline = (a, b) => due(a).localeCompare(due(b));
    const rank = new Map(recommendations.map((item) => [item.grant.grantId, item.rank]));

    return [...list].sort((a, b) => {
      // 이미 마감된 지원금은 어떤 정렬이든 맨 뒤
      if (isClosed(a) !== isClosed(b)) {
        return isClosed(a) ? 1 : -1;
      }
      if (sortBy === 'deadline-desc') {
        return byDeadline(b, a);
      }
      if (sortBy === 'name') {
        return cleanTitle(a.title).localeCompare(cleanTitle(b.title), 'ko');
      }
      if (sortBy === 'recommend') {
        const ra = rank.has(a.grantId) ? rank.get(a.grantId) : 999;
        const rb = rank.has(b.grantId) ? rank.get(b.grantId) : 999;
        return (ra - rb) || byDeadline(a, b);
      }
      return byDeadline(a, b);
    });
  }, [grants, query, sortBy, recommendations]);

  const sortChoices = SORT_OPTIONS.filter((option) => !option.member || recommendations.length > 0);
  const currentSort = SORT_OPTIONS.find((option) => option.value === sortBy) || SORT_OPTIONS[0];

  const maxScore = useMemo(
    () => Math.max(0, ...recommendations.map((item) => Number(item.score) || 0)),
    [recommendations],
  );

  // 첫 화면 검색: 주소의 ?q= 값을 바꾸면 헤더 검색창과 지원금 목록이 같이 바뀜
  const search = (keyword) => {
    const value = keyword.trim();
    setParams(value ? { q: value } : {}, { replace: true });
    grantsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const userName = user ? (user.name || user.loginId) : '';

  useEffect(() => {
    if (!loading && location.state && location.state.focus === 'recommend') {
      recommendAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, location.state]);

  // 집계 시각 "11.05 13:50 기준"
  const hotTime = (() => {
    const date = hot.updatedAt ? new Date(hot.updatedAt) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return '';
    }
    const two = (n) => String(n).padStart(2, '0');
    return `${two(date.getMonth() + 1)}.${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())} 기준`;
  })();

  const slideAction = (action) => {
    if (action === 'chat') {
      navigate('/moachat');
    } else if (action === 'scrap') {
      navigate(user ? '/scraps' : '/login');
    } else if (user) {
      recommendAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/register');
    }
  };
  const current = SLIDES[slide];

  return (
    <div className={styles.container}>
      {/* 1. 첫 화면: 왼쪽 = 배너 + 자주 찾는 지원금, 오른쪽 = 로그인 + 마감 임박 */}
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          {/* 배너 */}
          <div className={styles.banner} aria-roledescription="배너" aria-label={`${slide + 1} / ${SLIDES.length}`}>
            <div className={styles.bannerText}>
              <h1 className={styles.bannerTitle}>
                {current.title[0]}<br />
                {current.title[1]}
              </h1>
              <p className={styles.bannerLead}>{current.text}</p>
              <button type="button" className={styles.bannerButton} onClick={() => slideAction(current.action)}>
                {current.button}
              </button>
            </div>
            <div className={styles.bannerArt} aria-hidden="true">
              <span className={styles.ringBig} />
              <span className={styles.ringSmall} />
              <current.Badge size={56} className={styles.bannerBadge} />
              <MoaExplorer height={214} className={styles.bannerMoa} />
            </div>
            <button
              type="button"
              className={`${styles.bannerArrow} ${styles.arrowPrev}`}
              aria-label="이전 배너"
              onClick={() => setSlide((slide + SLIDES.length - 1) % SLIDES.length)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6" /></svg>
            </button>
            <button
              type="button"
              className={`${styles.bannerArrow} ${styles.arrowNext}`}
              aria-label="다음 배너"
              onClick={() => setSlide((slide + 1) % SLIDES.length)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
            </button>
            <span className={styles.bannerCount}>{slide + 1} / {SLIDES.length}</span>
          </div>

        {/* 자주 찾는 지원금 */}
          <div className={styles.quickPanel}>
            <div className={styles.quickHead}>
              <div>
                <h2 className={styles.quickTitle}>
                  {profile ? `${userName}님 맞춤 카테고리` : '자주 찾는 지원금'}
                </h2>
                {profile && <p className={styles.quickNote}>설정한 연령대·관심분야·가구 형태 기준으로 골랐어요</p>}
              </div>
              <button
                type="button"
                className={styles.quickMore}
                onClick={() => grantsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                전체 보기
              </button>
            </div>
            <ul className={styles.quickGrid}>
              {quickLinks.map(({ label, keyword, Icon }) => (
                <li key={label}>
                  <button type="button" className={styles.quickItem} onClick={() => search(keyword)}>
                    <span>{label}</span>
                    <Icon size={28} className={styles.quickIcon} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 오른쪽: 로그인 박스 + 마감 임박 */}
        <aside className={styles.side}>
          {user ? (
            <div className={`${styles.loginBox} ${styles.memberBox}`}>
              <p className={styles.greeting}>
                <strong>{userName}</strong>님, 반가워요.
              </p>
              {recommendations.length > 0 ? (
                <button
                  type="button"
                  className={styles.greetingSub}
                  onClick={() => recommendAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  나에게 맞는 지원금 <strong>{recommendations.length}건</strong>을 찾았어요
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
                </button>
              ) : (
                <p className={styles.greetingNote}>관심 카테고리를 고르면 맞는 지원금을 찾아 드려요.</p>
              )}

              {/* 알림 · 스크랩 */}
              <div className={styles.quickTiles}>
                <Link to="/alerts" className={styles.quickTile}>
                  <GlossyBell size={26} />
                  <span>알림</span>
                </Link>
                <Link to="/scraps" className={styles.quickTile}>
                  <GlossyBookmark size={26} />
                  <span>스크랩</span>
                  {scrapCount != null && <b className={styles.tileCount}>{scrapCount}</b>}
                </Link>
              </div>

              {/* 내 관심 카테고리 (최대 3개, 나머지는 +N) */}
              <div className={styles.tagHead}>
                <span>내 관심 카테고리</span>
              </div>
              {profile && (profile.interests || []).length > 0 ? (
                <ul className={styles.chips} aria-label="내 관심 카테고리">
                  {profile.interests.slice(0, 3).map((interest) => (
                    <li key={interest} className={styles.chip}>
                      <span>#{interest}</span>
                      <button
                        type="button"
                        className={styles.chipRemove}
                        aria-label={`${interest} 관심 카테고리 지우기`}
                        onClick={() => removeInterest(interest)}
                      >
                        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg>
                      </button>
                    </li>
                  ))}
                  {profile.interests.length > 3 && (
                    <li>
                      <Link
                        to="/mypage"
                        className={styles.chipMore}
                        aria-label={`관심 카테고리 ${profile.interests.length - 3}개 더 보기`}
                      >
                        +{profile.interests.length - 3}
                      </Link>
                    </li>
                  )}
                </ul>
              ) : (
                <p className={styles.profileEmpty}>아직 고른 관심 카테고리가 없어요.</p>
              )}
              {interestMessage && <p className={styles.interestError} role="status">{interestMessage}</p>}
              <Link to="/mypage" className={styles.mypageLink}>
                마이페이지 바로가기
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
              </Link>
            </div>
          ) : (
            <div className={styles.loginBox}>
              <div className={styles.loginButtons}>
                <Link to="/login" className={styles.loginHalf}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="8.2" r="3.8" />
                    <path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" />
                  </svg>
                  로그인
                </Link>
                <Link to="/register" className={styles.loginHalf}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="10" cy="8.2" r="3.8" />
                    <path d="M3 20c1.2-3.6 3.6-5.4 7-5.4 1.6 0 3 .4 4.2 1.2M18.5 13v6M15.5 16h6" />
                  </svg>
                  회원가입
                </Link>
              </div>
              <Link to="/register" className={styles.loginStrip}>내 조건 입력하고 맞춤 추천 받기</Link>
            </div>
          )}

          <div className={styles.hotBox}>
            <div className={styles.hotHead}>
              <h2 className={styles.hotTitle}>
                <svg className={styles.flame} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.5c.6 3.2 2.6 4.8 4.3 6.6 1.6 1.7 2.7 3.6 2.7 6A7 7 0 0 1 5 15.1c0-2.4 1.1-4.3 2.6-5.6.3 1.6 1.1 2.7 2.2 3.3C9.4 8.9 10.6 5.4 12 2.5z" />
                  <path d="M12 21a3.6 3.6 0 0 1-3.6-3.6c0-1.6 1-2.7 2.1-3.7.2 1 .8 1.6 1.5 1.9.2-1.4.8-2.5 1.6-3.4.6 1.8 2 2.8 2 5.2A3.6 3.6 0 0 1 12 21z" className={styles.flameInner} />
                </svg>
                실시간 HOT 지원금
              </h2>
              {hotTime && <span className={styles.hotTime}>{hotTime}</span>}
            </div>
            {hot.state === 'loading' && <p className={styles.hotEmpty}>순위를 불러오는 중이에요.</p>}
            {hot.state === 'error' && <p className={styles.hotEmpty}>지금은 인기 순위를 불러오지 못했어요.</p>}
            {hot.state === 'ready' && hot.ranking.length === 0 && (
              <p className={styles.hotEmpty}>아직 집계된 순위가 없어요.</p>
            )}
            {hot.ranking.length > 0 && (
              <ol className={styles.hotList}>
                {hot.ranking.map((item) => {
                  let change = { text: '-', label: '변동 없음', cls: styles.same };
                  if (item.change == null) {
                    change = { text: 'NEW', label: '새로 진입', cls: styles.isNew };
                  } else if (item.change > 0) {
                    change = { text: `▲${item.change}`, label: `${item.change}계단 상승`, cls: styles.up };
                  } else if (item.change < 0) {
                    change = { text: `▼${-item.change}`, label: `${-item.change}계단 하락`, cls: styles.down };
                  }
                  return (
                    <li key={item.grant.grantId}>
                      <Link to={`/support/details/${item.grant.grantId}`} className={styles.hotItem}>
                        <span className={`${styles.hotRank} ${item.rank <= 3 ? styles.hotTop : ''}`}>{item.rank}</span>
                        <span className={styles.hotName}>{cleanTitle(item.grant.title)}</span>
                        <span className={`${styles.hotChange} ${change.cls}`} aria-label={change.label}>{change.text}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </aside>
      </section>

      <div className={styles.contentArea}>
        {/* 2. 전체 지원금 */}
        <section className={styles.section} ref={grantsAnchorRef}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                {query ? `'${query}' 검색 결과` : '확인된 지원금'}
              </h2>
              {!loading && !error && (
                <p className={styles.sectionLead}>
                  {user ? `${userName}님에게 어울리는 지원금 ${visibleGrants.length}개를 찾았어요.` : `지원금 ${visibleGrants.length}개를 찾았어요.`}
                </p>
              )}
            </div>
            <div className={styles.sectionTools}>
              {query && (
                <button type="button" className={styles.textLink} onClick={() => search('')}>
                  검색 지우기
                </button>
              )}
              {/* 정렬 버튼 */}
              <div className={styles.sort} ref={sortRef}>
                <button
                  type="button"
                  className={styles.sortButton}
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                  onClick={() => setSortOpen((open) => !open)}
                >
                  <svg className={styles.sortIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
                  </svg>
                  {currentSort.label}
                  <svg className={styles.sortChevron} viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6" /></svg>
                </button>
                {sortOpen && (
                  <ul className={styles.sortMenu} role="listbox" aria-label="정렬 방법">
                    {sortChoices.map((option) => (
                      <li key={option.value} role="option" aria-selected={option.value === sortBy}>
                        <button
                          type="button"
                          className={`${styles.sortOption} ${option.value === sortBy ? styles.sortOptionOn : ''}`}
                          onClick={() => {
                            setSortBy(option.value);
                            setSortOpen(false);
                          }}
                        >
                          {option.label}
                          {option.value === sortBy && (
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {error && <p className={styles.notice}>{error}</p>}
          {loading && <p className={styles.notice}>지원금을 불러오는 중이에요.</p>}
          {!loading && !error && visibleGrants.length === 0 && (
            <p className={styles.notice}>
              {query ? '검색어와 맞는 지원금이 없어요. 다른 단어로 검색해 보세요.' : '아직 등록된 지원금이 없어요.'}
            </p>
          )}

          <div className={styles.cardGrid}>
            {visibleGrants.map((grant) => (
              <GrantCard key={grant.grantId} grant={grant} />
            ))}
          </div>
        </section>

        {/* 3. 추천 + 모아챗 */}
        <div className={styles.split}>
          <section className={styles.recommend} ref={recommendAnchorRef}>
            <div className={styles.recommendHead}>
              <h2 className={styles.sectionTitle}>모아가 추천해요</h2>
              {recommendationState === 'ready' && (
                <Link to="/register" className={styles.textLink}>관심분야 수정</Link>
              )}
            </div>

            {recommendationState === 'guest' && (
              <div className={styles.emptyPanel}>
                <p className={styles.emptyTitle}>로그인하면 나에게 맞는 지원금을 순위로 보여드려요</p>
                <p className={styles.emptyText}>
                  연령대, 지역, 소득분위를 기준으로 신청할 수 있는지까지 함께 확인해요.
                </p>
                <div className={styles.emptyButtons}>
                  <button type="button" className={styles.primaryButton} onClick={() => navigate('/login')}>로그인</button>
                  <button type="button" className={styles.secondaryButton} onClick={() => navigate('/register')}>회원가입</button>
                </div>
              </div>
            )}

            {recommendationState === 'noProfile' && (
              <div className={styles.emptyPanel}>
                <p className={styles.emptyTitle}>관심분야를 설정하면 추천이 시작돼요</p>
                <p className={styles.emptyText}>연령대, 지역, 소득분위 세 가지만 고르면 돼요.</p>
                <div className={styles.emptyButtons}>
                  <button type="button" className={styles.primaryButton} onClick={() => navigate('/register')}>관심분야 설정하기</button>
                </div>
              </div>
            )}

            {recommendationState === 'error' && (
              <p className={styles.notice}>{recommendationMessage}</p>
            )}

            {recommendationState === 'ready' && recommendations.length === 0 && (
              <div className={styles.emptyPanel}>
                <p className={styles.emptyTitle}>지금 조건에 맞는 지원금이 없어요</p>
                <p className={styles.emptyText}>관심분야나 지역을 바꾸면 다른 지원금이 추천될 수 있어요.</p>
                <div className={styles.emptyButtons}>
                  <button type="button" className={styles.secondaryButton} onClick={() => navigate('/register')}>관심분야 수정하기</button>
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <ol className={styles.rankList}>
                {recommendations.map((item) => {
                  const deadline = deadlineText(item.grant.endDate);
                  const fit = maxScore > 0 ? Math.round(((Number(item.score) || 0) / maxScore) * 100) : 0;
                  return (
                    <li key={item.grant.grantId}>
                      <Link to={`/support/details/${item.grant.grantId}`} className={styles.rankItem}>
                        <span className={styles.rankNumber}>{item.rank}</span>
                        <div className={styles.rankBody}>
                          <div className={styles.rankTop}>
                            <span className={`${styles.status} ${styles[statusClass[item.eligibilityStatus]] || ''}`}>
                              <span className={styles.statusDot} aria-hidden="true" />
                              {statusLabel[item.eligibilityStatus] || item.eligibilityStatus}
                            </span>
                            <span className={`${styles.deadline} ${deadline.urgent ? styles.deadlineUrgent : ''}`}>
                              {deadline.text}
                            </span>
                          </div>
                          <h3 className={styles.rankTitle}>{cleanTitle(item.grant.title)}</h3>
                          <p className={styles.rankReason}>{recommendationDetail(item)}</p>
                          <div className={styles.fit} aria-label={`추천 점수 ${item.score}`}>
                            <span className={styles.fitBar}>
                              <span className={styles.fitFill} style={{ width: `${fit}%` }} />
                            </span>
                            <span className={styles.fitScore}>{item.score}점</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <aside className={styles.chatPanel}>
            <h2 className={styles.chatTitle}>궁금한 건 모아챗에게</h2>
            <p className={styles.chatLead}>조건이 헷갈리면 물어보세요. 바로 답해 드려요.</p>
            <div className={styles.bubbles} aria-hidden="true">
              <span className={styles.bubbleUser}>자취하는 대학생도 받을 수 있는 지원금 있어?</span>
              <span className={styles.bubbleBot}>나이와 사는 지역을 알려주면 찾아볼게요!</span>
            </div>
            <Link to="/moachat" className={styles.chatButton}>모아챗 열기</Link>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
