// src/components/MoaLogo.jsx
// 모아봄 로고: MOABOM 의 첫 번째 'O' 자리에 정면을 보는 모아 얼굴
// 모아 얼굴 지름 = 글자(대문자) 높이, 새싹만 글자 위로 살짝 나옴
// 사용법: <MoaLogo height={52} />   (height = 영문 대문자 높이. 새싹은 그 위로 나옴)

import React, { useId } from 'react';

// 좌표 기준: 글자 크기 40, 글자 바닥선 y=44, 대문자 높이 약 29 → 글자 위쪽 y=15
// 영문 대문자 높이(y 15.3 ~ 44.4)만 기준 영역으로 잡음 → height 를 검색창 높이와 같게 주면 글자 높이 = 검색창 높이
// 새싹은 기준 영역 위로 나가므로 overflow: visible 로 보이게 함
const VIEW_Y = 15.3;
const VIEW_W = 182;
const VIEW_H = 29.1;

function MoaLogo({ height = 52, className }) {
  const id = useId().replace(/:/g, '');
  const width = Math.round((height * VIEW_W) / VIEW_H);
  const font = "'Pretendard Variable', Pretendard, -apple-system, sans-serif";
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label="MOABOM 모아봄"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={`${id}hood`} cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor="#8fd677" />
          <stop offset="0.55" stopColor="#4fae4b" />
          <stop offset="1" stopColor="#2f8a3c" />
        </radialGradient>
        <linearGradient id={`${id}leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a8e48a" />
          <stop offset="1" stopColor="#3a9a45" />
        </linearGradient>
      </defs>

      {/* M */}
      <text x="0" y="44" fontFamily={font} fontSize="40" fontWeight="800" fill="#1f4fbf" letterSpacing="-1">M</text>

      {/* O = 정면을 보는 모아 얼굴 (지름 = 대문자 높이 29) */}
      <g transform="translate(37 15)">
        {/* 새싹 (글자 위로 살짝) */}
        <path d="M14.5 1.5v-4" stroke="#3a9a45" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 -2.5c-3.5-4-9-4.5-11.5-2 3 3.2 8 3.8 11.5 2z" fill={`url(#${id}leaf)`} />
        <path d="M15 -2.5c3.5-4 9-4.5 11.5-2-3 3.2-8 3.8-11.5 2z" fill={`url(#${id}leaf)`} />
        {/* 후드 */}
        <circle cx="14.5" cy="14.5" r="14.5" fill={`url(#${id}hood)`} />
        {/* 얼굴 */}
        <ellipse cx="14.5" cy="16" rx="10.3" ry="9" fill="#f4e0bf" />
        <ellipse cx="10.8" cy="14.6" rx="1.6" ry="2.2" fill="#3d2a22" />
        <ellipse cx="18.2" cy="14.6" rx="1.6" ry="2.2" fill="#3d2a22" />
        <ellipse cx="8" cy="18.8" rx="2" ry="1.3" fill="#f4a3a8" />
        <ellipse cx="21" cy="18.8" rx="2" ry="1.3" fill="#f4a3a8" />
        <path d="M12.3 18.6c1.2 1.7 3.2 1.7 4.4 0" stroke="#3d2a22" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        {/* 광택 */}
        <path d="M4 9c2.2-4.5 6-6.8 9.8-7.2-3.6 1.9-6 4.5-7.4 7.8-.9.5-2 .2-2.4-.6z" fill="#fff" opacity="0.55" />
      </g>

      {/* ABOM */}
      <text x="67" y="44" fontFamily={font} fontSize="40" fontWeight="800" fill="#1f4fbf" letterSpacing="-1">ABOM</text>
    </svg>
  );
}

export default MoaLogo;
