import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import styles from '../styles/HomePage.module.css';
import MainBannerImage from '../assets/images/main_banner.jpg';
import { getGrants, getRecommendations } from '../api/moabomApi';
import { useAuth } from '../auth/AuthContext';

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
  return (
    <Link to={`/support/details/${grant.grantId}`} className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.cardCategory}>{grant.categoryTitle || '지원금'}</span>
        <span
          className={`${styles.deadline} ${deadline.urgent ? styles.deadlineUrgent : ''} ${deadline.closed ? styles.deadlineClosed : ''}`}
        >
          {deadline.text}
        </span>
      </div>
      <h3 className={styles.cardTitle}>{grant.title}</h3>
      <p className={styles.cardDetail}>{grant.description}</p>
      <div className={styles.cardFooter}>
        <span className={styles.cardTarget}>{targetText(grant)}</span>
        {grant.sample && <span className={styles.sampleTag}>예시 데이터</span>}
      </div>
    </Link>
  );
}

const HomePage = () => {
  const navigate = useNavigate();
  const { ready, user, token } = useAuth();
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const grantsRef = useRef(null);
  const grantsAnchorRef = useRef(null);
  const recommendAnchorRef = useRef(null);
  const [grants, setGrants] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendationState, setRecommendationState] = useState('guest');
  const [recommendationMessage, setRecommendationMessage] = useState('');

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

  const visibleGrants = useMemo(() => {
    const keyword = query.trim();
    if (!keyword) {
      return grants;
    }
    return grants.filter((grant) => `${grant.title} ${grant.description}`.includes(keyword));
  }, [grants, query]);

  const maxScore = useMemo(
    () => Math.max(0, ...recommendations.map((item) => Number(item.score) || 0)),
    [recommendations],
  );

  const scrollCards = (direction) => {
    const list = grantsRef.current;
    if (list) {
      list.scrollBy({ left: direction * Math.max(280, list.clientWidth * 0.8), behavior: 'smooth' });
    }
  };

  const userName = user ? (user.name || user.loginId) : '';

  return (
    <div className={styles.container}>
      {/* 1. 첫 화면 */}
      <section className={styles.hero}>
        <div className={styles.heroPanel} style={{ backgroundImage: `url(${MainBannerImage})` }}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              나의 지원금,<br />
              여기 다 모아봄
            </h1>
            <p className={styles.heroLead}>
              {user
                ? `${userName}님 조건에 맞는 지원금을 골라 두었어요.`
                : '나이, 지역, 소득만 알려주면 받을 수 있는 지원금을 한곳에서 찾아드려요.'}
            </p>
            <div className={styles.heroButtons}>
              {user ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => recommendAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  내 추천 지원금 보기
                </button>
              ) : (
                <button type="button" className={styles.primaryButton} onClick={() => navigate('/register')}>
                  내 조건 입력하고 추천받기
                </button>
              )}
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => grantsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                전체 지원금 둘러보기
              </button>
            </div>
            {!loading && !error && (
              <p className={styles.heroCount}>
                지금 확인할 수 있는 지원금 <strong>{grants.length}건</strong>
              </p>
            )}
          </div>
        </div>
      </section>

      <div className={styles.contentArea}>
        {/* 2. 전체 지원금 */}
        <section className={styles.section} ref={grantsAnchorRef}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                {query ? `'${query}' 검색 결과` : '확인된 지원금'}
              </h2>
              <p className={styles.sectionLead}>
                {query
                  ? `${visibleGrants.length}건을 찾았어요.`
                  : '마감이 가까운 지원금은 분홍색으로 표시돼요.'}
              </p>
            </div>
            <div className={styles.scrollControls}>
              <button className={styles.scrollButton} onClick={() => scrollCards(-1)} aria-label="이전 지원금 보기">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6" /></svg>
              </button>
              <button className={styles.scrollButton} onClick={() => scrollCards(1)} aria-label="다음 지원금 보기">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
              </button>
            </div>
          </div>

          {error && <p className={styles.notice}>{error}</p>}
          {loading && <p className={styles.notice}>지원금을 불러오는 중이에요.</p>}
          {!loading && !error && visibleGrants.length === 0 && (
            <p className={styles.notice}>
              {query ? '검색어와 맞는 지원금이 없어요. 다른 단어로 검색해 보세요.' : '아직 등록된 지원금이 없어요.'}
            </p>
          )}

          <div className={styles.cardRow} ref={grantsRef}>
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
                              {statusLabel[item.eligibilityStatus] || item.eligibilityStatus}
                            </span>
                            <span className={`${styles.deadline} ${deadline.urgent ? styles.deadlineUrgent : ''}`}>
                              {deadline.text}
                            </span>
                          </div>
                          <h3 className={styles.rankTitle}>{item.grant.title}</h3>
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
