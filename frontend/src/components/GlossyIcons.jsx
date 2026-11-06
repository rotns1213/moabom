// src/components/GlossyIcons.jsx
// 반짝이는(글로시) 느낌의 아이콘 모음 — 모아 캐릭터처럼 입체적으로 보이게
// 색: 모아봄 핑크(#1f4fbf)를 밝게/진하게 섞은 그라데이션 + 위쪽 빛 반사
// 사용법: <GlossyCoin size={44} />

import React, { useId } from 'react';

// 지원금 = 동전
export function GlossyCoin({ size = 44, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}face`} cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor="#cfdcf6" />
          <stop offset="0.45" stopColor="#4a78dc" />
          <stop offset="1" stopColor="#173e99" />
        </radialGradient>
        <linearGradient id={`${id}rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f6fd8" />
          <stop offset="1" stopColor="#173e99" />
        </linearGradient>
        <linearGradient id={`${id}shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#173e99" opacity="0.18" />
      {/* 동전 옆면 */}
      <circle cx="32" cy="33" r="25" fill={`url(#${id}rim)`} />
      {/* 동전 앞면 */}
      <circle cx="32" cy="30" r="25" fill={`url(#${id}face)`} />
      <circle cx="32" cy="30" r="20.5" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.5" />
      {/* ₩ 표시 */}
      <path
        d="M22.5 21.5l4.5 16 5-11 5 11 4.5-16M21 29h22"
        fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* 빛 반사 */}
      <ellipse cx="25" cy="15" rx="12" ry="6" fill={`url(#${id}shine)`} transform="rotate(-18 25 15)" />
    </svg>
  );
}

// 추천 = 반짝이는 별
export function GlossyStar({ size = 44, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}body`} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#d3dff7" />
          <stop offset="0.5" stopColor="#3f6fd8" />
          <stop offset="1" stopColor="#1a46ad" />
        </radialGradient>
        <linearGradient id={`${id}shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="58" rx="17" ry="3.5" fill="#173e99" opacity="0.18" />
      {/* 둥근 별 */}
      <path
        d="M32 6.5c1.6 0 2.9 1 3.6 2.4l5.3 10.8 11.9 1.7c3.3.5 4.6 4.5 2.2 6.8l-8.6 8.4 2 11.8c.6 3.3-2.9 5.8-5.8 4.2L32 46.9l-10.6 5.6c-3 1.6-6.4-.9-5.8-4.2l2-11.8-8.6-8.4c-2.4-2.3-1.1-6.3 2.2-6.8l11.9-1.7 5.3-10.8c.7-1.4 2-2.4 3.6-2.4z"
        fill={`url(#${id}body)`}
      />
      {/* 빛 반사 */}
      <path
        d="M29.5 13.5c1-2 3.9-2 4.9 0l2.6 5.2c-3.8 1.6-7.6 1.9-11 .9z"
        fill={`url(#${id}shine)`}
      />
      <ellipse cx="22" cy="26" rx="5" ry="2.2" fill="#fff" opacity="0.55" transform="rotate(-25 22 26)" />
      {/* 작은 반짝임 */}
      <path d="M53 6l1.3 3.2L57.5 10.5l-3.2 1.3L53 15l-1.3-3.2-3.2-1.3 3.2-1.3z" fill="#1f4fbf" />
    </svg>
  );
}

// 검색 = 돋보기
export function GlossySearch({ size = 28, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}glass`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#ffe6ed" />
          <stop offset="1" stopColor="#a9bfee" />
        </radialGradient>
        <linearGradient id={`${id}ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8faae3" />
          <stop offset="1" stopColor="#173e99" />
        </linearGradient>
        <linearGradient id={`${id}handle`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a78dc" />
          <stop offset="1" stopColor="#173e99" />
        </linearGradient>
      </defs>
      <path d="M40 41l13 13" stroke={`url(#${id}handle)`} strokeWidth="9" strokeLinecap="round" />
      <circle cx="27" cy="27" r="18" fill={`url(#${id}glass)`} stroke={`url(#${id}ring)`} strokeWidth="6" />
      <ellipse cx="21" cy="19" rx="7" ry="4" fill="#fff" opacity="0.9" transform="rotate(-35 21 19)" />
    </svg>
  );
}

// ---------- 헤더 메뉴용 ----------

// 알림 = 종
export function GlossyBell({ size = 26, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}b`} cx="38%" cy="28%" r="80%">
          <stop offset="0" stopColor="#d3dff7" />
          <stop offset="0.5" stopColor="#3f6fd8" />
          <stop offset="1" stopColor="#173e99" />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="52" r="6" fill="#173e99" />
      <path d="M32 7c-11 0-18 8.5-18 19v9.5L8.5 44c-1 1.7.2 3.8 2.2 3.8h42.6c2 0 3.2-2.1 2.2-3.8L50 35.5V26c0-10.5-7-19-18-19z" fill={`url(#${id}b)`} />
      <rect x="28.5" y="3" width="7" height="7" rx="3.5" fill="#173e99" />
      <path d="M22 15c3-4 7-5.5 10-5.5 2 0 4 .4 5.5 1.2-6 1.5-11 5.5-13 12.5-2 .3-3.5-.5-3.5-2 0-2.2.3-4.3 1-6.2z" fill={`url(#${id}s)`} />
    </svg>
  );
}

// 스크랩 = 책갈피
export function GlossyBookmark({ size = 26, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a9bfee" />
          <stop offset="0.5" stopColor="#3f6fd8" />
          <stop offset="1" stopColor="#173e99" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M17 6h30c3 0 5 2 5 5v46.5c0 2-2.3 3.2-4 2L32 48.5 16 59.5c-1.7 1.2-4 0-4-2V11c0-3 2-5 5-5z" fill={`url(#${id}b)`} />
      <path d="M17 9h7v40l-7 5V11c0-1.2.8-2 2-2z" fill={`url(#${id}s)`} />
      <path d="M32 18.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="#fff" />
    </svg>
  );
}

// 모아챗 = 말풍선
export function GlossyChat({ size = 26, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}b`} cx="35%" cy="25%" r="85%">
          <stop offset="0" stopColor="#cfdcf6" />
          <stop offset="0.5" stopColor="#3f6fd8" />
          <stop offset="1" stopColor="#173e99" />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M32 7C17.6 7 6 16.6 6 28.5c0 6.6 3.6 12.5 9.3 16.4L13 56l12.4-6.4c2.1.5 4.3.7 6.6.7 14.4 0 26-9.6 26-21.5S46.4 7 32 7z" fill={`url(#${id}b)`} />
      <path d="M14 20c3.5-6 10.5-9.5 18-9.5 4 0 8 1 11 3-12-1-23 3-29 11.5z" fill={`url(#${id}s)`} />
      <circle cx="21" cy="29" r="3.6" fill="#fff" />
      <circle cx="32" cy="29" r="3.6" fill="#fff" />
      <circle cx="43" cy="29" r="3.6" fill="#fff" />
    </svg>
  );
}

// 연필 (배너 장식)
export function GlossyPencil({ size = 48, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a9bfee" />
          <stop offset="0.5" stopColor="#3f6fd8" />
          <stop offset="1" stopColor="#173e99" />
        </linearGradient>
      </defs>
      <g transform="rotate(45 32 32)">
        <rect x="25" y="4" width="14" height="8" rx="3" fill="#b3c8f0" />
        <rect x="25" y="10" width="14" height="5" fill="#d9d9d9" />
        <rect x="25" y="15" width="14" height="30" fill={`url(#${id}b)`} />
        <rect x="27.5" y="15" width="3" height="30" fill="#fff" opacity="0.6" />
        <path d="M25 45h14l-7 13z" fill="#f7dcc4" />
        <path d="M29.6 53.5h4.8L32 58z" fill="#5a3a2e" />
      </g>
    </svg>
  );
}

// ---------- 자주 찾는 지원금 바로가기용 ----------

// 공통 그라데이션 (핑크 광택)
function GlossDefs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#b3c8f0" />
        <stop offset="0.5" stopColor="#3f6fd8" />
        <stop offset="1" stopColor="#173e99" />
      </linearGradient>
      <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

// 주거 = 집
export function GlossyHouse({ size = 28, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <GlossDefs id={id} />
      <path d="M32 6L5 29c-1.6 1.4-.6 4 1.5 4H12v21c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V33h5.5c2.1 0 3.1-2.6 1.5-4z" fill={`url(#${id}b)`} />
      <rect x="26" y="38" width="12" height="20" rx="3" fill="#fff" opacity="0.95" />
      <path d="M32 11L13 27.5c4 1 7-.5 9.5-3L32 16z" fill={`url(#${id}s)`} />
    </svg>
  );
}

// 교통 = 버스
export function GlossyBus({ size = 28, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <GlossDefs id={id} />
      <rect x="10" y="6" width="44" height="46" rx="10" fill={`url(#${id}b)`} />
      <rect x="15" y="14" width="34" height="18" rx="4" fill="#fff" opacity="0.95" />
      <circle cx="20" cy="42" r="3.5" fill="#fff" />
      <circle cx="44" cy="42" r="3.5" fill="#fff" />
      <rect x="15" y="50" width="8" height="8" rx="3" fill="#12357f" />
      <rect x="41" y="50" width="8" height="8" rx="3" fill="#12357f" />
      <path d="M16 9h32c2 0 3.5 1 4 2.5H12c.5-1.5 2-2.5 4-2.5z" fill={`url(#${id}s)`} />
    </svg>
  );
}

// 취업 = 가방
export function GlossyBag({ size = 28, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <GlossDefs id={id} />
      <path d="M24 16v-4c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v4" fill="none" stroke="#173e99" strokeWidth="5" />
      <rect x="6" y="16" width="52" height="40" rx="9" fill={`url(#${id}b)`} />
      <rect x="6" y="31" width="52" height="4" fill="#fff" opacity="0.5" />
      <rect x="27" y="28" width="10" height="10" rx="2.5" fill="#fff" />
      <path d="M14 19h36c3 0 5 1.5 6 3.5H8c1-2 3-3.5 6-3.5z" fill={`url(#${id}s)`} />
    </svg>
  );
}

// 교육 = 책
export function GlossyBook({ size = 28, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <GlossDefs id={id} />
      <path d="M32 14C25 9 15 8 6 10v42c9-2 19-1 26 4 7-5 17-6 26-4V10c-9-2-19-1-26 4z" fill={`url(#${id}b)`} />
      <path d="M32 14v42" stroke="#fff" strokeWidth="2.5" opacity="0.8" />
      <path d="M12 20c5-1 10-.5 14 1.5M12 28c5-1 10-.5 14 1.5M38 21.5c4-2 9-2.5 14-1.5M38 29.5c4-2 9-2.5 14-1.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
      <path d="M8 12c7-1.5 15-.8 21 2.5-7-1-14-.6-21 1.5z" fill={`url(#${id}s)`} />
    </svg>
  );
}

// 양육 = 하트
export function GlossyHeart({ size = 28, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <GlossDefs id={id} />
      <path d="M32 56S6 41 6 22.5C6 14 12.5 8 20 8c5.2 0 9.4 2.8 12 7 2.6-4.2 6.8-7 12-7 7.5 0 14 6 14 14.5C58 41 32 56 32 56z" fill={`url(#${id}b)`} />
      <ellipse cx="19" cy="18" rx="7" ry="4" fill={`url(#${id}s)`} transform="rotate(-30 19 18)" />
    </svg>
  );
}

// 대학 = 학사모
export function GlossyCap({ size = 28, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <GlossDefs id={id} />
      <path d="M17 30v12c0 4 7 9 15 9s15-5 15-9V30L32 37z" fill="#173e99" />
      <path d="M32 10L3 23.5 32 37l29-13.5z" fill={`url(#${id}b)`} />
      <path d="M32 13L10 23.5c8-2 16-4 22-8.5 6 4.5 14 6.5 22 8.5z" fill={`url(#${id}s)`} />
      <path d="M54 26v14" stroke="#ffc23d" strokeWidth="3" strokeLinecap="round" />
      <circle cx="54" cy="42" r="3.5" fill="#ffc23d" />
    </svg>
  );
}

// 문화 = 티켓
export function GlossyTicket({ size = 28, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <GlossDefs id={id} />
      <g transform="rotate(-14 32 32)">
        <path d="M8 18h48c2 0 3 1 3 3v6a5 5 0 0 0 0 10v6c0 2-1 3-3 3H8c-2 0-3-1-3-3v-6a5 5 0 0 0 0-10v-6c0-2 1-3 3-3z" fill={`url(#${id}b)`} />
        <path d="M42 21v22" stroke="#fff" strokeWidth="2.5" strokeDasharray="3 3.5" opacity="0.85" />
        <path d="M23 25l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="#fff" />
        <path d="M9 20h46c1.5 0 2.5.7 3 2H6c.5-1.3 1.5-2 3-2z" fill={`url(#${id}s)`} />
      </g>
    </svg>
  );
}
