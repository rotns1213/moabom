// src/components/MoaCharacter.jsx
// 모아봄 캐릭터 '모아' — 그림 파일 없이 코드(SVG)로 그린 버전
// 초록 후드 + 새싹 잎 + 베이지 얼굴, 오른쪽을 바라보는 모습
// 사용법: <MoaCharacter height={110} />

import React, { useId } from 'react';

function MoaCharacter({ height = 110, className }) {
  const id = useId().replace(/:/g, '');
  const width = Math.round((height * 200) / 254);
  return (
    <svg className={className} width={width} height={height} viewBox="0 -14 200 254" aria-hidden="true">
      <defs>
        {/* 후드(머리) 초록 광택 */}
        <radialGradient id={`${id}hood`} cx="34%" cy="26%" r="78%">
          <stop offset="0" stopColor="#a6e38a" />
          <stop offset="0.45" stopColor="#62bf5a" />
          <stop offset="1" stopColor="#2f8a3c" />
        </radialGradient>
        <radialGradient id={`${id}body`} cx="35%" cy="25%" r="85%">
          <stop offset="0" stopColor="#8fd677" />
          <stop offset="0.55" stopColor="#56b14f" />
          <stop offset="1" stopColor="#2f8a3c" />
        </radialGradient>
        <radialGradient id={`${id}face`} cx="40%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fff3df" />
          <stop offset="0.6" stopColor="#f2dcb8" />
          <stop offset="1" stopColor="#dcbf94" />
        </radialGradient>
        <linearGradient id={`${id}leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b4ea96" />
          <stop offset="0.5" stopColor="#6cc45f" />
          <stop offset="1" stopColor="#3a9a45" />
        </linearGradient>
        <linearGradient id={`${id}shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="104" cy="232" rx="50" ry="6" fill="#2f8a3c" opacity="0.15" />

      {/* 다리 */}
      <rect x="76" y="196" width="24" height="34" rx="12" fill="#3f9a45" />
      <rect x="106" y="196" width="24" height="34" rx="12" fill={`url(#${id}body)`} />

      {/* 뒤쪽 팔 */}
      <path d="M70 170c-10 4-18 12-20 22" stroke="#3a8f41" strokeWidth="16" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="194" r="9" fill="#dcbf94" />

      {/* 몸통 */}
      <ellipse cx="104" cy="182" rx="40" ry="34" fill={`url(#${id}body)`} />
      <ellipse cx="114" cy="186" rx="22" ry="20" fill="#9fdc85" opacity="0.75" />

      {/* 앞쪽 팔: 오른쪽을 가리킴 */}
      <path d="M128 172c12-2 22-8 30-16" stroke={`url(#${id}body)`} strokeWidth="16" strokeLinecap="round" fill="none" />
      <circle cx="160" cy="153" r="10" fill={`url(#${id}face)`} />

      {/* 새싹 줄기 + 잎 */}
      <path d="M92 40c2-8 0-14-3-20" stroke="#3a9a45" strokeWidth="7" strokeLinecap="round" fill="none" />
      <g transform="rotate(30 88 18)">
        <path d="M88 18C72 2 46 4 38 18c14 12 38 14 50 0z" fill={`url(#${id}leaf)`} />
        <path d="M42 17c14-4 30-3 44 1" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>
      <g transform="rotate(-26 90 18)">
        <path d="M90 18c10-16 36-20 50-8-8 16-34 22-50 8z" fill={`url(#${id}leaf)`} />
        <path d="M94 16c12-5 26-7 42-5" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>

      {/* 후드(머리) */}
      <circle cx="96" cy="100" r="66" fill={`url(#${id}hood)`} />
      {/* 얼굴 테두리(밝은 초록) */}
      <ellipse cx="114" cy="108" rx="50" ry="45" fill="#7fcf6c" />
      {/* 얼굴: 오른쪽으로 치우쳐서 오른쪽을 보는 느낌 */}
      <ellipse cx="116" cy="110" rx="43" ry="38" fill={`url(#${id}face)`} />

      {/* 눈 (오른쪽을 봄) */}
      <ellipse cx="106" cy="104" rx="7" ry="9.5" fill="#3d2a22" />
      <ellipse cx="139" cy="105" rx="6.5" ry="9" fill="#3d2a22" />
      <circle cx="109" cy="100" r="2.6" fill="#fff" />
      <circle cx="141.5" cy="101" r="2.4" fill="#fff" />
      {/* 볼 */}
      <ellipse cx="95" cy="124" rx="9" ry="6" fill="#f4a3a8" opacity="0.8" />
      <ellipse cx="150" cy="124" rx="7" ry="5.5" fill="#f4a3a8" opacity="0.8" />
      {/* 웃는 입 */}
      <path d="M114 124c4 7 14 7 18 0" stroke="#3d2a22" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* 머리 광택 */}
      <path d="M48 70c8-20 26-32 46-34-18 8-30 20-36 38-4 2-9 0-10-4z" fill={`url(#${id}shine)`} />
      <ellipse cx="62" cy="128" rx="5" ry="9" fill="#fff" opacity="0.18" transform="rotate(20 62 128)" />
    </svg>
  );
}

export default MoaCharacter;

// ------------------------------------------------------------------
// 지원금을 찾는 모아: 정면을 보고, 한 손엔 돋보기 / 한 손엔 지원금 서류
// 사용법: <MoaExplorer height={210} />
// ------------------------------------------------------------------
export function MoaExplorer({ height = 210, className }) {
  const id = useId().replace(/:/g, '');
  const width = Math.round((height * 240) / 260);
  return (
    <svg className={className} width={width} height={height} viewBox="-20 -16 240 260" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}hood`} cx="34%" cy="26%" r="78%">
          <stop offset="0" stopColor="#a6e38a" />
          <stop offset="0.45" stopColor="#62bf5a" />
          <stop offset="1" stopColor="#2f8a3c" />
        </radialGradient>
        <radialGradient id={`${id}body`} cx="35%" cy="25%" r="85%">
          <stop offset="0" stopColor="#8fd677" />
          <stop offset="0.55" stopColor="#56b14f" />
          <stop offset="1" stopColor="#2f8a3c" />
        </radialGradient>
        <radialGradient id={`${id}face`} cx="45%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fff3df" />
          <stop offset="0.6" stopColor="#f2dcb8" />
          <stop offset="1" stopColor="#dcbf94" />
        </radialGradient>
        <linearGradient id={`${id}leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b4ea96" />
          <stop offset="0.5" stopColor="#6cc45f" />
          <stop offset="1" stopColor="#3a9a45" />
        </linearGradient>
        <linearGradient id={`${id}shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}lens`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#dce8ff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#9cbcf5" stopOpacity="0.7" />
        </radialGradient>
        <linearGradient id={`${id}rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7aa2f0" />
          <stop offset="1" stopColor="#173e99" />
        </linearGradient>
        <linearGradient id={`${id}handle`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3f6fd8" />
          <stop offset="1" stopColor="#0e2a66" />
        </linearGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="100" cy="232" rx="56" ry="6" fill="#0e2a66" opacity="0.18" />

      {/* 다리 */}
      <rect x="76" y="196" width="22" height="34" rx="11" fill="#3f9a45" />
      <rect x="102" y="196" width="22" height="34" rx="11" fill={`url(#${id}body)`} />

      {/* 몸통 */}
      <ellipse cx="100" cy="182" rx="40" ry="34" fill={`url(#${id}body)`} />
      <ellipse cx="100" cy="188" rx="22" ry="19" fill="#9fdc85" opacity="0.75" />

      {/* 새싹 */}
      <path d="M100 38c0-8 0-14-1-20" stroke="#3a9a45" strokeWidth="7" strokeLinecap="round" fill="none" />
      <g transform="rotate(30 99 18)">
        <path d="M99 18C83 2 57 4 49 18c14 12 38 14 50 0z" fill={`url(#${id}leaf)`} />
        <path d="M53 17c14-4 30-3 44 1" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>
      <g transform="rotate(-30 101 18)">
        <path d="M101 18c10-16 36-20 50-8-8 16-34 22-50 8z" fill={`url(#${id}leaf)`} />
        <path d="M105 16c12-5 26-7 42-5" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>

      {/* 머리(후드) + 정면 얼굴 */}
      <circle cx="100" cy="100" r="66" fill={`url(#${id}hood)`} />
      <ellipse cx="100" cy="110" rx="50" ry="45" fill="#7fcf6c" />
      <ellipse cx="100" cy="112" rx="43" ry="38" fill={`url(#${id}face)`} />
      <ellipse cx="84" cy="106" rx="7" ry="9.5" fill="#3d2a22" />
      <ellipse cx="116" cy="106" rx="7" ry="9.5" fill="#3d2a22" />
      <circle cx="86.5" cy="102" r="2.6" fill="#fff" />
      <circle cx="118.5" cy="102" r="2.6" fill="#fff" />
      <ellipse cx="72" cy="124" rx="8.5" ry="5.5" fill="#f4a3a8" opacity="0.8" />
      <ellipse cx="128" cy="124" rx="8.5" ry="5.5" fill="#f4a3a8" opacity="0.8" />
      <path d="M91 123c4 7 14 7 18 0" stroke="#3d2a22" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M50 72c8-20 26-32 46-34-18 8-30 20-36 38-4 2-9 0-10-4z" fill={`url(#${id}shine)`} />

      {/* 왼손: 지원금 서류 */}
      <g transform="translate(-12 -4) rotate(-10 40 188)">
        <rect x="16" y="161" width="52" height="64" rx="7" fill="#0e2a66" opacity="0.18" />
        <rect x="14" y="158" width="52" height="64" rx="7" fill="#fff" />
        <rect x="14" y="158" width="52" height="15" rx="7" fill="#1f4fbf" />
        <rect x="14" y="166" width="52" height="7" fill="#1f4fbf" />
        <circle cx="40" cy="190" r="9" fill="#ffc23d" />
        <path d="M35.5 186l2 8 2.5-5.5 2.5 5.5 2-8M34.5 189.5h11" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="22" y="204" width="36" height="3.5" rx="1.75" fill="#c9d7f2" />
        <rect x="22" y="211" width="26" height="3.5" rx="1.75" fill="#c9d7f2" />
      </g>
      <path d="M70 176c-8 4-14 10-17 16" stroke={`url(#${id}body)`} strokeWidth="15" strokeLinecap="round" fill="none" />
      <circle cx="52" cy="194" r="9.5" fill={`url(#${id}face)`} />

      {/* 오른손: 돋보기 */}
      <path d="M130 172c10-4 18-10 24-18" stroke={`url(#${id}body)`} strokeWidth="15" strokeLinecap="round" fill="none" />
      <path d="M158 150l14-22" stroke={`url(#${id}handle)`} strokeWidth="9" strokeLinecap="round" />
      <circle cx="184" cy="108" r="24" fill={`url(#${id}lens)`} stroke={`url(#${id}rim)`} strokeWidth="7" />
      <ellipse cx="176" cy="99" rx="8" ry="4.5" fill="#fff" opacity="0.9" transform="rotate(-35 176 99)" />
      <circle cx="157" cy="153" r="10" fill={`url(#${id}face)`} />
    </svg>
  );
}

// ------------------------------------------------------------------
// 모아 얼굴만 (채팅 아이콘용, 정면)
// 사용법: <MoaFace size={32} />
// ------------------------------------------------------------------
export function MoaFace({ size = 32, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 -6 40 46" aria-hidden="true">
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
      <path d="M20 4V-1" stroke="#3a9a45" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M19.5 -1c-4-5-10.5-5.5-13.5-2.5 3.5 3.8 9.5 4.5 13.5 2.5z" fill={`url(#${id}leaf)`} />
      <path d="M20.5 -1c4-5 10.5-5.5 13.5-2.5-3.5 3.8-9.5 4.5-13.5 2.5z" fill={`url(#${id}leaf)`} />
      <circle cx="20" cy="21" r="18" fill={`url(#${id}hood)`} />
      <ellipse cx="20" cy="23" rx="12.8" ry="11.2" fill="#f4e0bf" />
      <ellipse cx="15.4" cy="21.3" rx="2" ry="2.7" fill="#3d2a22" />
      <ellipse cx="24.6" cy="21.3" rx="2" ry="2.7" fill="#3d2a22" />
      <ellipse cx="11.8" cy="26.4" rx="2.4" ry="1.6" fill="#f4a3a8" />
      <ellipse cx="28.2" cy="26.4" rx="2.4" ry="1.6" fill="#f4a3a8" />
      <path d="M17.2 26.2c1.5 2.1 4.1 2.1 5.6 0" stroke="#3d2a22" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M7 14c2.6-5.4 7.2-8.2 11.8-8.7-4.3 2.3-7.2 5.4-8.8 9.4-1.1.6-2.4.2-3-.7z" fill="#fff" opacity="0.55" />
    </svg>
  );
}
