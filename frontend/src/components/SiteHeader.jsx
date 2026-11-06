import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import HeaderAccount from './HeaderAccount';
import styles from './SiteHeader.module.css';
import MoaLogo from './MoaLogo';

// ---------- 아이콘 (선 아이콘, 24px 기준) ----------
function BellIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z" />
      <path d="M10 21h4" />
      <path d="M12 3v2" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v15.5L12 16.8l-6.5 3.7V5A1.5 1.5 0 0 1 7 3.5z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-.9 0-1.8-.1-2.6-.3L5 20l1-3.6C4.5 15 3.5 13.1 3.5 11c0-3.9 3.8-7 8.5-7z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" strokeWidth="2.6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className={styles.menuIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h11" />
    </svg>
  );
}

// 가운데 메뉴줄: 누르면 그 단어로 지원금 검색
const CATEGORIES = [
  { label: '전체 지원금', keyword: '' },
  { label: '청년', keyword: '청년' },
  { label: '주거', keyword: '월세' },
  { label: '취업', keyword: '구직' },
  { label: '교통', keyword: '교통' },
  { label: '양육', keyword: '양육' },
  { label: '생활', keyword: '생활' },
  { label: '문화', keyword: '문화' },
];

function SiteHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const query = location.pathname === '/' ? (params.get('q') || '') : '';
  const [text, setText] = useState(query);

  useEffect(() => {
    setText(query);
  }, [query]);

  // 검색하면 홈 화면으로 가서 ?q= 로 걸러 보여줌
  const goSearch = (keyword) => {
    const value = keyword.trim();
    navigate({ pathname: '/', search: value ? `?q=${encodeURIComponent(value)}` : '' });
  };

  const toolClass = (path) => (
    location.pathname === path ? `${styles.tool} ${styles.toolCurrent}` : styles.tool
  );

  return (
    <header className={styles.header}>
      {/* 1줄: 작은 메뉴 */}
      <div className={styles.topBar}>
        <div className={styles.inner}>
          <span className={styles.topNote}>정부·지자체 지원금을 한곳에서</span>
          <nav className={styles.tools} aria-label="내 메뉴">
            <Link to="/alerts" className={toolClass('/alerts')} aria-current={location.pathname === '/alerts' ? 'page' : undefined}>
              <BellIcon />
              <span className={styles.toolLabel}>알림</span>
            </Link>
            <Link to={user ? '/scraps' : '/login'} className={toolClass('/scraps')} aria-current={location.pathname === '/scraps' ? 'page' : undefined}>
              <BookmarkIcon />
              <span className={styles.toolLabel}>스크랩</span>
            </Link>
            <Link to="/moachat" className={toolClass('/moachat')} aria-current={location.pathname === '/moachat' ? 'page' : undefined}>
              <ChatIcon />
              <span className={styles.toolLabel}>모아챗</span>
            </Link>
            <span className={styles.divider} aria-hidden="true" />
            <HeaderAccount />
          </nav>
        </div>
      </div>

      {/* 2줄: 로고 + 검색창 */}
      <div className={styles.mainBar}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo} aria-label="MOABOM 홈">
            <MoaLogo height={30} className={styles.logoMark} />
          </Link>
          <form
            className={styles.searchForm}
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              goSearch(text);
            }}
          >
            <input
              type="search"
              className={styles.searchInput}
              placeholder="청년, 월세, 교통비 등 지원금 검색"
              aria-label="지원금 검색"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <button type="submit" className={styles.searchButton} aria-label="검색">
              <SearchIcon />
            </button>
          </form>
          <div className={styles.mainLinks}>
            <Link
              to={user ? '/' : '/login'}
              state={user ? { focus: 'recommend' } : undefined}
              className={styles.textLink}
            >
              맞춤 추천
            </Link>
            <span className={styles.linkDivider} aria-hidden="true" />
            <Link to="/moachat" className={styles.textLink}>모아챗 상담</Link>
          </div>
        </div>
      </div>

      {/* 3줄: 카테고리 메뉴 */}
      <div className={styles.navBar}>
        <div className={styles.inner}>
          <nav className={styles.categories} aria-label="지원금 분류">
            <button type="button" className={styles.menuButton} aria-label="전체 메뉴" onClick={() => goSearch('')}>
              <MenuIcon />
            </button>
            {CATEGORIES.map(({ label, keyword }) => (
              <button
                key={label}
                type="button"
                className={`${styles.category} ${location.pathname === '/' && query === keyword ? styles.categoryOn : ''}`}
                onClick={() => goSearch(keyword)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
