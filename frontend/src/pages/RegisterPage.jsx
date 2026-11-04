// src/pages/RegisterPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header'; 
import styles from '../styles/RegisterPage.module.css';
import InputField from '../components/InputField';
import { getProfile, saveProfile } from '../api/moabomApi';
import { checkLoginId, signup, updateAccount } from '../api/authApi';
import { useAuth } from '../auth/AuthContext';
import { HOUSEHOLD_OPTIONS, SPECIAL_OPTIONS, codesFor, labelsFor } from '../api/policyLabels'; 

// 임시 버튼 컴포넌트 (type="button"으로 폼 제출 방지)
const TagButton = ({ children, isSelected, onClick }) => (
  <button
    type="button"
    className={`${styles.tagButton} ${isSelected ? styles.selectedTag : ''}`}
    aria-pressed={isSelected}
    onClick={onClick}
  >
    {children}
  </button>
);


const RegisterPage = () => {
  const navigate = useNavigate();
  const { user, token, setSession } = useAuth();
  const [account, setAccount] = useState({
    name: '',
    loginId: '',
    password: '',
    dateOfBirth: '',
    email: '',
  });

  const updateField = (field) => (event) => {
    setAccount((current) => ({ ...current, [field]: event.target.value }));
  };

  // ⭐ 상태를 배열로 초기화하여 다중 선택 허용 ⭐
  const [selectedTags, setSelectedTags] = useState({
      연령대: [],
      가구형태: [],
      소득분위: [],
      지역: [],
      특수조건: [],
      관심분야: [],
  });

  const handleTagClick = (group, value) => {
      setSelectedTags(prev => {
          const currentArray = prev[group] || [];
          const single = group === '연령대' || group === '소득분위' || group === '지역';
          if (single) {
              return {
                  ...prev,
                  [group]: currentArray.includes(value) ? [] : [value],
              };
          }
          if (currentArray.includes(value)) {
              return {
                  ...prev,
                  [group]: currentArray.filter(tag => tag !== value)
              };
          }
          return {
              ...prev,
              [group]: [...currentArray, value]
          };
      });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const [formMessage, setFormMessage] = useState('');
  const [loadedAge, setLoadedAge] = useState(null);
  const editing = Boolean(user);

  useEffect(() => {
    if (user) {
      setAccount((current) => ({
        ...current,
        name: user.name || '',
        loginId: user.loginId || '',
        email: user.email || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.replace(/-/g, '') : '',
      }));
    }
    if (!user || !token) {
      return undefined;
    }
    let active = true;
    getProfile(user.id, token)
      .then((profile) => {
        if (!active) {
          return;
        }
        const ageTag = profile.age == null
          ? ''
          : profile.age >= 60
            ? '60대 이상'
            : `${Math.floor(profile.age / 10)}0대`;
        const incomeTag = profile.incomeBracket == null ? '' : `${profile.incomeBracket}분위`;
        setLoadedAge(profile.age ?? null);
        setSelectedTags((current) => ({
          ...current,
          연령대: ageTag ? [ageTag] : [],
          소득분위: incomeTag ? [incomeTag] : [],
          지역: profile.region ? [profile.region] : [],
          가구형태: labelsFor(HOUSEHOLD_OPTIONS, profile.householdTypes),
          특수조건: labelsFor(SPECIAL_OPTIONS, profile.specialConditions),
          관심분야: profile.interests || [],
        }));
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setFormMessage(error.status === 404
          ? '저장된 추천 프로필이 없습니다. 연령대, 지역, 소득분위를 선택한 뒤 저장해 주세요.'
          : error.message);
      });
    return () => {
      active = false;
    };
  }, [token, user]);

  const handleCheckId = async () => {
    try {
      const result = await checkLoginId(account.loginId.trim());
      setFormMessage(result.available ? '사용할 수 있는 아이디입니다.' : '이미 사용 중인 아이디입니다.');
    } catch (error) {
      setFormMessage(error.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const ageMap = { '20대': 25, '30대': 35, '40대': 45, '50대': 55, '60대 이상': 65 };
    const age = ageMap[selectedTags.연령대[0]] || (editing ? loadedAge : undefined);
    const region = selectedTags.지역[0];
    const income = Number.parseInt(selectedTags.소득분위[0], 10);
    if (!age || !region || !income) {
      setFormMessage('추천에 사용할 연령대, 지역, 소득분위를 각각 하나 이상 선택해 주세요.');
      return;
    }
    const profile = {
      age,
      region,
      incomeBracket: income,
      householdTypes: codesFor(HOUSEHOLD_OPTIONS, selectedTags.가구형태),
      specialConditions: codesFor(SPECIAL_OPTIONS, selectedTags.특수조건),
      interests: selectedTags.관심분야,
    };
    try {
      let sessionUser = user;
      let sessionToken = token;
      if (!sessionUser) {
        if (!account.password) {
          setFormMessage('비밀번호를 입력해 주세요.');
          return;
        }
        const session = await signup({
          name: account.name.trim(),
          loginId: account.loginId.trim(),
          password: account.password,
          dateOfBirth: account.dateOfBirth.trim(),
          email: account.email.trim(),
          region,
          incomeBracket: income,
        });
        setSession(session.token, session.user);
        sessionUser = session.user;
        sessionToken = session.token;
        await saveProfile(sessionUser.id, sessionToken, profile);
        setFormMessage('회원 정보와 추천 프로필을 저장했습니다.');
      } else {
        await saveProfile(sessionUser.id, sessionToken, profile);
        const updated = await updateAccount(sessionToken, {
          name: account.name.trim(),
          email: account.email.trim(),
          dateOfBirth: account.dateOfBirth.trim(),
          region,
          incomeBracket: income,
        });
        setSession(sessionToken, updated.user);
        setFormMessage('추천 프로필을 저장했습니다.');
      }
      navigate('/');
    } catch (error) {
      setFormMessage(error.message);
    }
  };

  // 화면에 보여줄 선택지 (이전에 저장된 값이 목록에 없으면 앞에 붙여서 보여줌)
  const withSaved = (group, list) => (
    selectedTags[group][0] && !list.includes(selectedTags[group][0])
      ? [selectedTags[group][0], ...list]
      : list
  );
  const ageOptions = withSaved('연령대', ['20대', '30대', '40대', '50대', '60대 이상']);
  const incomeOptions = withSaved('소득분위', ['1분위', '2분위', '3분위', '4분위', '5분위', '6분위']);
  const regionOptions = withSaved('지역', ['예시특별시', '예시도', '전국(예시)']);
  const interestOptions = ['주거', '취업', '교육', '자산형성'];

  const requiredGroups = ['연령대', '지역', '소득분위'];
  const requiredDone = requiredGroups.filter((group) => selectedTags[group].length > 0).length;
  const ready = requiredDone === requiredGroups.length;

  const summaryRows = [
    { group: '연령대', required: true },
    { group: '지역', required: true },
    { group: '소득분위', required: true },
    { group: '관심분야', required: false },
    { group: '가구형태', required: false },
    { group: '특수조건', required: false },
  ];
  const summaryName = { 연령대: '연령대', 지역: '지역', 소득분위: '소득분위', 관심분야: '관심 분야', 가구형태: '가구 형태', 특수조건: '특수조건' };

  const chipGroup = (title, group, options, hint) => (
    <div className={styles.field} role="group" aria-label={title}>
      <div className={styles.fieldHead}>
        <span className={styles.fieldLabel}>{title}</span>
        <span className={styles.fieldHint}>{hint}</span>
      </div>
      <div className={styles.buttonRow}>
        {options.map((option) => {
          const label = typeof option === 'string' ? option : option.label;
          const key = typeof option === 'string' ? option : option.code;
          return (
            <TagButton
              key={key}
              isSelected={selectedTags[group].includes(label)}
              onClick={() => handleTagClick(group, label)}
            >
              {label}
            </TagButton>
          );
        })}
      </div>
    </div>
  );

  const accountSection = (
    <section className={styles.card} key="account">
      <h2 className={styles.cardTitle}>기본 정보</h2>
      {editing && <p className={styles.cardLead}>아이디는 바꿀 수 없어요.</p>}
      <div className={styles.inputGrid}>
        <label className={styles.inputGroup}>
          <span className={styles.inputLabel}>이름</span>
          <InputField type="text" value={account.name} onChange={updateField('name')} autoComplete="name" />
        </label>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="register-login-id">아이디</label>
          <div className={styles.idInputContainer}>
            <InputField id="register-login-id" type="text" value={account.loginId} onChange={updateField('loginId')} readOnly={editing} autoComplete="username" />
            {!editing && <button type="button" className={styles.checkButton} onClick={handleCheckId}>중복 확인</button>}
          </div>
        </div>
        {!editing && (
          <label className={styles.inputGroup}>
            <span className={styles.inputLabel}>비밀번호</span>
            <InputField type="password" value={account.password} onChange={updateField('password')} autoComplete="new-password" />
          </label>
        )}
        <label className={styles.inputGroup}>
          <span className={styles.inputLabel}>생년월일</span>
          <InputField type="text" inputMode="numeric" placeholder="예: 20030512" value={account.dateOfBirth} onChange={updateField('dateOfBirth')} />
        </label>
        <label className={`${styles.inputGroup} ${styles.inputWide}`}>
          <span className={styles.inputLabel}>이메일</span>
          <InputField type="email" value={account.email} onChange={updateField('email')} autoComplete="email" />
        </label>
      </div>
    </section>
  );

  const requiredSection = (
    <section className={styles.card} key="required">
      <h2 className={styles.cardTitle}>추천에 꼭 필요한 정보</h2>
      <p className={styles.cardLead}>세 가지를 골라야 신청할 수 있는 지원금을 찾을 수 있어요.</p>
      {chipGroup('연령대', '연령대', ageOptions, '하나 선택')}
      {chipGroup('사는 지역', '지역', regionOptions, '하나 선택')}
      {chipGroup('소득분위', '소득분위', incomeOptions, '하나 선택')}
    </section>
  );

  const optionalSection = (
    <section className={styles.card} key="optional">
      <h2 className={styles.cardTitle}>관심사와 생활 상황</h2>
      <p className={styles.cardLead}>고를수록 나에게 더 가까운 지원금이 위로 올라와요. 여러 개 골라도 돼요.</p>
      {chipGroup('관심 분야', '관심분야', interestOptions, '여러 개 선택')}
      {chipGroup('가구 형태', '가구형태', HOUSEHOLD_OPTIONS, '해당되면 선택')}
      {chipGroup('특수조건', '특수조건', SPECIAL_OPTIONS, '해당되면 선택')}
    </section>
  );

  const sections = editing
    ? [requiredSection, optionalSection, accountSection]
    : [accountSection, requiredSection, optionalSection];

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        <div className={styles.pageHead}>
          <h1 className={styles.title}>{editing ? '관심분야 설정' : '회원가입'}</h1>
          <p className={styles.subtitle}>{editing
            ? '조건을 바꾸면 홈 화면의 추천 지원금이 새로 정리돼요.'
            : '가입하면서 내 조건을 알려주면 바로 맞춤 지원금을 추천해 드려요.'}</p>
        </div>

        <form className={styles.layout} onSubmit={handleRegisterSubmit}>
          <div className={styles.formColumn}>
            {sections}
          </div>

          {/* 선택한 조건 요약 (넓은 화면: 오른쪽 고정 / 휴대폰: 아래 고정 막대) */}
          <aside className={styles.summary} aria-label="선택한 조건">
            <div className={styles.summaryBox}>
              <h2 className={styles.summaryTitle}>선택한 조건</h2>
              <dl className={styles.summaryList}>
                {summaryRows.map(({ group, required }) => (
                  <div key={group} className={styles.summaryRow}>
                    <dt>{summaryName[group]}</dt>
                    <dd className={selectedTags[group].length ? styles.summaryValue : styles.summaryEmpty}>
                      {selectedTags[group].length
                        ? selectedTags[group].join(', ')
                        : (required ? '선택 필요' : '선택 안 함')}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className={styles.summaryAction}>
              <div className={styles.progress}>
                <span className={styles.progressText}>
                  {ready ? '추천받을 준비가 됐어요' : `필수 조건 ${requiredDone}/3`}
                </span>
                <span className={styles.progressBar} aria-hidden="true">
                  <span className={styles.progressFill} style={{ width: `${(requiredDone / 3) * 100}%` }} />
                </span>
              </div>
              {formMessage && <p className={styles.formMessage} role="status">{formMessage}</p>}
              <div className={styles.footerButtons}>
                <button type="button" className={`${styles.buttonBase} ${styles.backButton}`} onClick={handleGoBack}>
                  돌아가기
                </button>
                <button type="submit" className={`${styles.buttonBase} ${styles.submitButton}`}>
                  {editing ? '저장하기' : '가입하고 추천받기'}
                </button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
