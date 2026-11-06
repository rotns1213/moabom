// src/components/Header.jsx
// 로그인 · 회원가입 화면 위쪽의 간단한 머리줄 (뒤로 가기)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Header.module.css';
import { ChevronLeft } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  return (
    <header className={styles.header}>
      <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="뒤로 가기">
        <ChevronLeft size={24} aria-hidden="true" />
      </button>
    </header>
  );
};

export default Header;
