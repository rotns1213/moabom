// src/pages/RegisterPage.jsx
// 회원가입 (/register, 로그인 전) + 마이페이지 (/mypage 또는 /register, 로그인 후)
// 순서: 1. 기본정보 → 2. 필수정보 → 3. 선택정보

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import styles from '../styles/RegisterPage.module.css';
import InputField from '../components/InputField';
import { MoaFace } from '../components/MoaCharacter';
import { getProfile, saveProfile } from '../api/moabomApi';
import { changePassword, checkLoginId, signup, updateAccount } from '../api/authApi';
import { useAuth } from '../auth/AuthContext';
import { HOUSEHOLD_OPTIONS, INTEREST_OPTIONS, SPECIAL_OPTIONS } from '../api/policyLabels';
import { PROVINCES, REGIONS, splitRegion } from '../api/regions';

const AGE_OPTIONS = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];
// 연령대 → 저장할 나이 (서버는 나이 숫자를 받음)
const AGE_VALUE = { '10대': 15, '20대': 25, '30대': 35, '40대': 45, '50대': 55, '60대 이상': 65 };
const GENDER_OPTIONS = ['남성', '여성'];
const INCOME_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const ageTag = (age) => {
  if (age == null) return '';
  if (age >= 60) return '60대 이상';
  if (age < 20) return '10대';
  return `${Math.floor(age / 10)}0대`;
};

// 성별 · 기타 키워드는 아직 서버에 저장 칸이 없어서, 이 브라우저에도 같이 기억해 둠
const extraKey = (user) => `moabom.profileExtra.${user.id}`;
function loadExtra(user) {
  try {
    return JSON.parse(localStorage.getItem(extraKey(user)) || '{}');
  } catch (error) {
    return {};
  }
}
function saveExtra(user, extra) {
  try {
    localStorage.setItem(extraKey(user), JSON.stringify(extra));
  } catch (error) {
    // 저장이 막혀 있어도 무시
  }
}

// 선택 버튼
const Chip = ({ children, selected, onClick }) => (
  <button
    type="button"
    className={`${styles.chip} ${selected ? styles.chipOn : ''}`}
    aria-pressed={selected}
    onClick={onClick}
  >
    {selected && (
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    )}
    {children}
  </button>
);

// 항목 한 줄 (제목 + 안내 + 내용)
const Field = ({ label, hint, required, children }) => (
  <div className={styles.field}>
    <div className={styles.fieldHead}>
      <span className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.star} aria-label="필수">*</span>}
      </span>
      {hint && <span className={styles.fieldHint}>{hint}</span>}
    </div>
    {children}
  </div>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user, token, setSession, logout } = useAuth();
  const editing = Boolean(user);

  const [account, setAccount] = useState({ name: '', loginId: '', password: '', dateOfBirth: '', email: '' });
  const updateField = (field) => (event) => {
    setAccount((current) => ({ ...current, [field]: event.target.value }));
  };

  // 필수정보
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [loadedAge, setLoadedAge] = useState(null);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [income, setIncome] = useState(null);
  // 선택정보
  const [interests, setInterests] = useState([]);
  const [household, setHousehold] = useState('');
  const [specials, setSpecials] = useState([]);
  const [otherKeywords, setOtherKeywords] = useState('');

  // 비밀번호 변경
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMessage, setPwMessage] = useState('');

  const [formMessage, setFormMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const provinceListRef = useRef(null);

  // 고른 시·도가 목록 안에서 보이도록 그 위치로 스크롤 (페이지 전체는 안 움직임)
  useEffect(() => {
    const list = provinceListRef.current;
    const selected = list && list.querySelector('[aria-pressed="true"]');
    if (list && selected) {
      const top = selected.offsetTop; // 목록(ul) 기준 위치
      if (top < list.scrollTop || top + selected.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = top - 6;
      }
    }
  }, [province]);

  // 로그인한 사람: 저장된 정보 불러오기
  useEffect(() => {
    if (!user) {
      return undefined;
    }
    setAccount((current) => ({
      ...current,
      name: user.name || '',
      loginId: user.loginId || '',
      email: user.email || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.replace(/-/g, '') : '',
    }));
    const extra = loadExtra(user);
    setGender(extra.gender || '');
    setOtherKeywords(extra.otherKeywords || '');
    if (!token) {
      return undefined;
    }
    let active = true;
    getProfile(user.id, token)
      .then((profile) => {
        if (!active) return;
        setAge(ageTag(profile.age));
        setLoadedAge(profile.age ?? null);
        const where = splitRegion(profile.region);
        setProvince(where.province);
        setDistrict(where.district);
        setIncome(profile.incomeBracket ?? null);
        setInterests(profile.interests || []);
        setHousehold((profile.householdTypes || [])[0] || '');
        setSpecials(profile.specialConditions || []);
        if (profile.gender) setGender(profile.gender);
      })
      .catch((error) => {
        if (!active) return;
        setFormMessage(error.status === 404
          ? '아직 저장된 정보가 없어요. 필수정보를 고르고 저장해 주세요.'
          : error.message);
      });
    return () => {
      active = false;
    };
  }, [token, user]);

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const region = province && district ? `${province} ${district}` : '';
  const requiredItems = [
    { name: '성별', done: Boolean(gender) },
    { name: '연령대', done: Boolean(age) },
    { name: '사는 지역', done: Boolean(region) },
    { name: '소득분위', done: income != null },
  ];
  const requiredDone = requiredItems.filter((item) => item.done).length;

  const handleCheckId = async () => {
    try {
      const result = await checkLoginId(account.loginId.trim());
      setFormMessage(result.available ? '사용할 수 있는 아이디예요.' : '이미 사용 중인 아이디예요.');
    } catch (error) {
      setFormMessage(error.message);
    }
  };

  const handlePassword = async () => {
    setPwMessage('');
    if (!pw.current || !pw.next) {
      setPwMessage('현재 비밀번호와 새 비밀번호를 입력해 주세요.');
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwMessage('새 비밀번호가 서로 달라요.');
      return;
    }
    try {
      await changePassword(token, { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      setPwOpen(false);
      setPwMessage('비밀번호를 바꿨어요.');
    } catch (error) {
      setPwMessage(error.status === 404
        ? '아직 서버에서 비밀번호 변경을 지원하지 않아요.'
        : error.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const missing = requiredItems.filter((item) => !item.done).map((item) => item.name);
    if (missing.length > 0) {
      setFormMessage(`필수정보를 골라 주세요: ${missing.join(', ')}`);
      document.getElementById('section-required')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const profile = {
      age: AGE_VALUE[age] || loadedAge,
      region,
      incomeBracket: income,
      householdTypes: household ? [household] : [],
      specialConditions: specials,
      interests,
      // 아래 두 값은 서버에 칸이 생기면 저장됨 (지금은 서버가 무시)
      gender,
      specialKeywords: specials.includes('OTHER') ? otherKeywords.trim() : '',
    };
    setSaving(true);
    setFormMessage('');
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
      }
      saveExtra(sessionUser, { gender, otherKeywords: profile.specialKeywords });
      setFormMessage(editing ? '저장했어요. 홈 화면 추천이 새로 정리돼요.' : '가입을 마쳤어요.');
      if (!editing) {
        navigate('/');
      }
    } catch (error) {
      setFormMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userName = account.name || (user && user.loginId) || '';

  return (
    <div className={styles.container}>
      {!editing && <Header />}

      {/* 머리 배너 */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <MoaFace size={56} className={styles.heroFace} />
          <div>
            <h1 className={styles.title}>{editing ? `${userName}님의 마이페이지` : '모아봄 회원가입'}</h1>
            <p className={styles.subtitle}>
              {editing
                ? '여기 정보로 나에게 맞는 지원금을 골라 드려요. 바뀐 게 있으면 언제든 고쳐 주세요.'
                : '정보를 알려주면 받을 수 있는 지원금을 바로 추천해 드려요.'}
            </p>
          </div>
        </div>
      </div>

      <form className={styles.layout} onSubmit={handleSubmit}>
        {/* ---------- 왼쪽: 순서 안내 + 저장 ---------- */}
        <aside className={styles.side}>
          <nav className={styles.steps} aria-label="입력 순서">
            {[
              { id: 'section-basic', label: '기본정보' },
              { id: 'section-required', label: '필수정보', meta: `${requiredDone}/4` },
              { id: 'section-optional', label: '선택정보' },
            ].map((step, index) => (
              <a key={step.id} href={`#${step.id}`} className={styles.step}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <span className={styles.stepNum}>{index + 1}</span>
                {step.label}
                {step.meta && <span className={styles.stepMeta}>{step.meta}</span>}
              </a>
            ))}
          </nav>

          <div className={styles.progress}>
            <span className={styles.progressText}>
              {requiredDone === 4 ? '추천받을 준비가 됐어요' : `필수정보 ${requiredDone}/4`}
            </span>
            <span className={styles.progressBar} aria-hidden="true">
              <span className={styles.progressFill} style={{ width: `${(requiredDone / 4) * 100}%` }} />
            </span>
          </div>

          {formMessage && <p className={styles.formMessage} role="status">{formMessage}</p>}
          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? '저장하는 중…' : editing ? '저장하기' : '가입하고 추천받기'}
          </button>
          {editing ? (
            <button type="button" className={styles.sideLink} onClick={handleLogout}>로그아웃</button>
          ) : (
            <button type="button" className={styles.sideLink} onClick={() => navigate(-1)}>돌아가기</button>
          )}
        </aside>

        {/* ---------- 오른쪽: 입력 ---------- */}
        <div className={styles.content}>
          {/* 1. 기본정보 */}
          <section className={styles.card} id="section-basic">
            <div className={styles.cardHead}>
              <span className={styles.cardNum}>1</span>
              <div>
                <h2 className={styles.cardTitle}>기본정보</h2>
                <p className={styles.cardLead}>가입할 때 입력한 정보예요.</p>
              </div>
            </div>

            <div className={styles.inputGrid}>
              <label className={styles.inputGroup}>
                <span className={styles.inputLabel}>이름</span>
                <InputField type="text" value={account.name} onChange={updateField('name')} autoComplete="name" />
              </label>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="mypage-login-id">
                  아이디
                  {editing && (
                    <span className={styles.lockNote}><span className={styles.star}>*</span> 아이디는 바꿀 수 없어요.</span>
                  )}
                </label>
                <div className={styles.idInputContainer}>
                  <InputField id="mypage-login-id" type="text" value={account.loginId} onChange={updateField('loginId')} readOnly={editing} autoComplete="username" />
                  {!editing && <button type="button" className={styles.checkButton} onClick={handleCheckId}>중복 확인</button>}
                </div>
              </div>

              <label className={styles.inputGroup}>
                <span className={styles.inputLabel}>생년월일</span>
                <InputField type="text" inputMode="numeric" placeholder="예: 20040512" value={account.dateOfBirth} onChange={updateField('dateOfBirth')} />
              </label>

              <label className={styles.inputGroup}>
                <span className={styles.inputLabel}>이메일</span>
                <InputField type="email" value={account.email} onChange={updateField('email')} autoComplete="email" />
              </label>

              {!editing && (
                <label className={`${styles.inputGroup} ${styles.inputWide}`}>
                  <span className={styles.inputLabel}>비밀번호</span>
                  <InputField type="password" value={account.password} onChange={updateField('password')} autoComplete="new-password" />
                </label>
              )}
            </div>

            {editing && (
              <div className={styles.passwordBox}>
                <button type="button" className={styles.passwordToggle} aria-expanded={pwOpen} onClick={() => setPwOpen((open) => !open)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>
                  비밀번호 변경하기
                  <svg className={`${styles.toggleChevron} ${pwOpen ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6" /></svg>
                </button>
                {pwOpen && (
                  <div className={styles.passwordFields}>
                    <InputField type="password" placeholder="현재 비밀번호" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
                    <InputField type="password" placeholder="새 비밀번호" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
                    <InputField type="password" placeholder="새 비밀번호 확인" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
                    <button type="button" className={styles.passwordSave} onClick={handlePassword}>비밀번호 바꾸기</button>
                  </div>
                )}
                {pwMessage && <p className={styles.pwMessage} role="status">{pwMessage}</p>}
              </div>
            )}
          </section>

          {/* 2. 필수정보 */}
          <section className={styles.card} id="section-required">
            <div className={styles.cardHead}>
              <span className={styles.cardNum}>2</span>
              <div>
                <h2 className={styles.cardTitle}>필수정보</h2>
                <p className={styles.cardLead}>신청할 수 있는 지원금인지 확인하는 데 꼭 필요해요.</p>
              </div>
            </div>

            <Field label="성별" required hint="하나 선택">
              <div className={styles.chipRow}>
                {GENDER_OPTIONS.map((option) => (
                  <Chip key={option} selected={gender === option} onClick={() => setGender(gender === option ? '' : option)}>{option}</Chip>
                ))}
              </div>
            </Field>

            <Field label="연령대" required hint="하나 선택">
              <div className={styles.chipRow}>
                {AGE_OPTIONS.map((option) => (
                  <Chip key={option} selected={age === option} onClick={() => setAge(age === option ? '' : option)}>{option}</Chip>
                ))}
              </div>
            </Field>

            <Field label="사는 지역" required hint={region ? `선택: ${region}` : '시·도를 고른 뒤 시·군·구를 골라 주세요'}>
              <div className={styles.regionPicker}>
                <ul className={styles.provinceList} aria-label="시·도" ref={provinceListRef}>
                  {PROVINCES.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        className={`${styles.province} ${province === name ? styles.provinceOn : ''}`}
                        aria-pressed={province === name}
                        onClick={() => {
                          setProvince(name);
                          setDistrict(REGIONS[name].length === 1 ? REGIONS[name][0] : '');
                        }}
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className={styles.districtBox}>
                  {province ? (
                    <div className={styles.districtGrid} aria-label={`${province} 시·군·구`}>
                      {REGIONS[province].map((name) => (
                        <button
                          key={name}
                          type="button"
                          className={`${styles.district} ${district === name ? styles.districtOn : ''}`}
                          aria-pressed={district === name}
                          onClick={() => setDistrict(name)}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.districtEmpty}>왼쪽에서 시·도를 먼저 골라 주세요.</p>
                  )}
                </div>
              </div>
            </Field>

            <Field label="소득분위" required hint="추천 계산에 꼭 필요해요 · 하나 선택">
              <div className={styles.chipRow}>
                {INCOME_OPTIONS.map((option) => (
                  <Chip key={option} selected={income === option} onClick={() => setIncome(income === option ? null : option)}>{option}분위</Chip>
                ))}
              </div>
            </Field>
          </section>

          {/* 3. 선택정보 */}
          <section className={styles.card} id="section-optional">
            <div className={styles.cardHead}>
              <span className={styles.cardNum}>3</span>
              <div>
                <h2 className={styles.cardTitle}>선택정보</h2>
                <p className={styles.cardLead}>고를수록 나에게 더 가까운 지원금이 위로 올라와요.</p>
              </div>
            </div>

            <Field label="관심분야" hint={`여러 개 선택 · ${interests.length}개 선택됨`}>
              <div className={styles.chipRow}>
                {INTEREST_OPTIONS.map((option) => (
                  <Chip key={option} selected={interests.includes(option)} onClick={() => toggle(interests, setInterests, option)}>{option}</Chip>
                ))}
              </div>
            </Field>

            <Field label="가구 형태" hint="하나만 선택">
              <div className={styles.chipRow} role="radiogroup" aria-label="가구 형태">
                {HOUSEHOLD_OPTIONS.map((option) => (
                  <Chip key={option.code} selected={household === option.code} onClick={() => setHousehold(household === option.code ? '' : option.code)}>{option.label}</Chip>
                ))}
              </div>
            </Field>

            <Field label="특수조건" hint="해당되면 모두 선택">
              <div className={styles.chipRow}>
                {SPECIAL_OPTIONS.filter((option) => !option.hidden).map((option) => (
                  <Chip key={option.code} selected={specials.includes(option.code)} onClick={() => toggle(specials, setSpecials, option.code)}>{option.label}</Chip>
                ))}
              </div>
              {specials.includes('OTHER') && (
                <div className={styles.otherBox}>
                  <label className={styles.inputLabel} htmlFor="mypage-other">기타 조건 키워드</label>
                  <InputField
                    id="mypage-other"
                    type="text"
                    placeholder="예: 청년 농부, 예술인, 경력 단절 (쉼표로 구분)"
                    value={otherKeywords}
                    onChange={(event) => setOtherKeywords(event.target.value)}
                  />
                </div>
              )}
            </Field>
          </section>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
