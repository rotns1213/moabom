import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/ChatPage.module.css';
import { sendChat } from '../api/moabomApi';
import { useAuth } from '../auth/AuthContext';
import { MoaFace } from '../components/MoaCharacter';

// ------------------------------------------------------------------
// 모아챗 — 왼쪽: 대화 기록 / 가운데: 대화 / 아래: 입력창
// 대화 기록은 서버에 저장 API가 없어서, 이 브라우저(localStorage)에만 저장합니다.
// ------------------------------------------------------------------

const SUGGESTIONS = [
  { title: '나에게 맞는 지원금 찾기', text: '20대 1인 가구인데 받을 수 있는 지원금이 뭐가 있어?' },
  { title: '신청 조건 확인', text: '청년 월세 지원 신청 조건을 알려줘' },
  { title: '취업 준비 지원', text: '취업준비생이 받을 수 있는 지원금을 알려줘' },
  { title: '서류 준비', text: '지원금 신청할 때 보통 어떤 서류가 필요해?' },
];

const storageKey = (user) => `moabom.chats.${user ? user.id : 'guest'}`;

function loadChats(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveChats(key, chats) {
  try {
    localStorage.setItem(key, JSON.stringify(chats));
  } catch (error) {
    // 저장 공간이 막혀 있어도 대화는 계속할 수 있게 무시
  }
}

// 아이디 일부 가리기: moabom01 → moa***01
function maskId(id) {
  const text = id || '';
  if (text.length <= 4) {
    return `${text.slice(0, 1)}***`;
  }
  return `${text.slice(0, 3)}***${text.slice(-2)}`;
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function ChatPage() {
  const { user } = useAuth();
  const key = storageKey(user);
  const [chats, setChats] = useState(() => loadChats(key));
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState('recent'); // 'recent' = 최근 항목, 'moaham' = 모아함
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [recentOpen, setRecentOpen] = useState(true);
  const [menuFor, setMenuFor] = useState(null); // ⋯ 메뉴가 열린 대화
  const [editingId, setEditingId] = useState(null); // 이름 바꾸는 중인 대화
  const [editText, setEditText] = useState('');
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const pageRef = useRef(null);

  // 채팅 화면이 머리말(헤더) 아래 남은 화면 높이를 꽉 채우게
  useEffect(() => {
    const fit = () => {
      const page = pageRef.current;
      if (page) {
        const top = page.getBoundingClientRect().top + window.scrollY;
        page.style.height = `${Math.max(480, window.innerHeight - top)}px`;
      }
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // 로그인 사용자가 바뀌면 그 사람의 기록으로 다시 불러오기
  useEffect(() => {
    setChats(loadChats(key));
    setActiveId(null);
  }, [key]);

  useEffect(() => {
    saveChats(key, chats);
  }, [key, chats]);

  const active = chats.find((chat) => chat.id === activeId) || null;
  const messages = active ? active.messages : [];
  // 사이드바에 보여줄 대화 (최신순 → 모아함 / 검색으로 거르기)
  const listed = useMemo(() => {
    const keyword = searchText.trim();
    return [...chats]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .filter((chat) => view !== 'moaham' || chat.pinned)
      .filter((chat) => !keyword
        || chat.title.includes(keyword)
        || chat.messages.some((message) => message.text.includes(keyword)));
  }, [chats, view, searchText]);
  const pinnedCount = chats.filter((chat) => chat.pinned).length;

  // ⋯ 메뉴: 바깥을 누르면 닫기
  useEffect(() => {
    if (!menuFor) {
      return undefined;
    }
    const close = (event) => {
      if (!event.target.closest('[data-chat-menu]')) {
        setMenuFor(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuFor]);

  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus();
    }
  }, [searchOpen]);

  // 새 메시지가 오면 맨 아래로 스크롤
  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    // 대화가 있을 땐 맨 아래로, 첫 화면(추천 질문)은 맨 위부터 보이게
    listRef.current.scrollTop = messages.length > 0 ? listRef.current.scrollHeight : 0;
  }, [messages.length, waiting]);

  // 입력창 높이를 글 길이에 맞게 (최대 6줄 정도)
  useEffect(() => {
    const box = inputRef.current;
    if (box) {
      box.style.height = 'auto';
      box.style.height = `${Math.min(box.scrollHeight, 160)}px`;
    }
  }, [input]);

  const addMessage = (chatId, message) => {
    setChats((current) => current.map((chat) => (
      chat.id === chatId
        ? { ...chat, messages: [...chat.messages, message], updatedAt: Date.now() }
        : chat
    )));
  };

  const send = async (raw) => {
    const text = raw.trim();
    if (!text || waiting) {
      return;
    }
    let chatId = activeId;
    if (!active) {
      // 첫 질문이면 새 대화를 만들고, 질문 앞부분을 제목으로
      chatId = newId();
      const chat = {
        id: chatId,
        title: text.length > 24 ? `${text.slice(0, 24)}…` : text,
        updatedAt: Date.now(),
        messages: [],
      };
      setChats((current) => [chat, ...current]);
      setActiveId(chatId);
    }
    addMessage(chatId, { role: 'user', text });
    setInput('');
    setWaiting(true);
    try {
      const data = await sendChat(text);
      addMessage(chatId, { role: 'bot', text: data.reply || '답변을 받지 못했어요. 다시 한 번 물어봐 주세요.' });
    } catch (error) {
      addMessage(chatId, { role: 'bot', text: '서버와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.', error: true });
    } finally {
      setWaiting(false);
      inputRef.current?.focus();
    }
  };

  const startNew = () => {
    setActiveId(null);
    setInput('');
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const openChat = (chatId) => {
    setActiveId(chatId);
    setSidebarOpen(false);
  };

  const startRename = (chat) => {
    setEditingId(chat.id);
    setEditText(chat.title);
    setMenuFor(null);
  };

  const finishRename = () => {
    const title = editText.trim();
    if (editingId && title) {
      setChats((current) => current.map((chat) => (chat.id === editingId ? { ...chat, title } : chat)));
    }
    setEditingId(null);
  };

  const togglePin = (chatId) => {
    setChats((current) => current.map((chat) => (chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat)));
    setMenuFor(null);
  };

  const removeChat = (chatId) => {
    setMenuFor(null);
    setChats((current) => current.filter((chat) => chat.id !== chatId));
    if (chatId === activeId) {
      setActiveId(null);
    }
  };

  return (
    <div className={styles.page} ref={pageRef}>
      {/* ---------- 왼쪽: 대화 기록 ---------- */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`} aria-label="대화 기록">
        <button type="button" className={styles.newChat} onClick={startNew}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          새 대화
        </button>

        {/* 검색 · 모아함 (새 대화보다 가벼운 메뉴 줄) */}
        <nav className={styles.sideNav} aria-label="대화 찾기">
          <button
            type="button"
            className={`${styles.navItem} ${searchOpen ? styles.navOn : ''}`}
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((open) => !open);
              setSearchText('');
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
            대화 검색
          </button>
          {searchOpen && (
            <input
              ref={searchRef}
              type="search"
              className={styles.searchInput}
              placeholder="제목이나 내용으로 찾기"
              aria-label="대화 검색"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSearchOpen(false);
                  setSearchText('');
                }
              }}
            />
          )}
          <button
            type="button"
            className={`${styles.navItem} ${view === 'moaham' ? styles.navOn : ''}`}
            aria-pressed={view === 'moaham'}
            onClick={() => setView((current) => (current === 'moaham' ? 'recent' : 'moaham'))}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></svg>
            모아함
            {pinnedCount > 0 && <span className={styles.navCount}>{pinnedCount}</span>}
          </button>
        </nav>

        {/* 최근 항목 (접고 펴기) */}
        <div className={styles.history}>
          <button
            type="button"
            className={styles.sectionToggle}
            aria-expanded={recentOpen}
            onClick={() => setRecentOpen((open) => !open)}
          >
            {view === 'moaham' ? '모아함에 담은 대화' : '최근 항목'}
            <svg className={recentOpen ? styles.chevronOpen : ''} viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>

          {recentOpen && (
            listed.length === 0 ? (
              <p className={styles.historyEmpty}>
                {searchText ? '찾는 대화가 없어요.' : view === 'moaham' ? '⋯ 메뉴에서 대화를 모아함에 담아 보세요.' : '아직 대화 기록이 없어요.'}
              </p>
            ) : (
              <ul className={styles.historyList}>
                {listed.map((chat) => (
                  <li key={chat.id} className={`${styles.historyItem} ${chat.id === activeId ? styles.historyOn : ''}`}>
                    {editingId === chat.id ? (
                      <input
                        className={styles.renameInput}
                        value={editText}
                        aria-label="대화 이름"
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        onChange={(event) => setEditText(event.target.value)}
                        onBlur={finishRename}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                            finishRename();
                          } else if (event.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.historyOpen}
                          onClick={() => openChat(chat.id)}
                          onDoubleClick={() => startRename(chat)}
                          aria-current={chat.id === activeId ? 'true' : undefined}
                        >
                          {chat.pinned && (
                            <svg className={styles.pinMark} viewBox="0 0 24 24" aria-label="모아함에 담김"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></svg>
                          )}
                          <span>{chat.title}</span>
                        </button>
                        <div className={styles.itemMenu} data-chat-menu>
                          <button
                            type="button"
                            className={`${styles.moreButton} ${menuFor === chat.id ? styles.moreOn : ''}`}
                            aria-label={`'${chat.title}' 대화 메뉴`}
                            aria-haspopup="menu"
                            aria-expanded={menuFor === chat.id}
                            onClick={() => setMenuFor((current) => (current === chat.id ? null : chat.id))}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h.01M12 12h.01M18 12h.01" /></svg>
                          </button>
                          {menuFor === chat.id && (
                            <ul className={styles.menu} role="menu">
                              <li role="none">
                                <button type="button" role="menuitem" onClick={() => startRename(chat)}>
                                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>
                                  이름 바꾸기
                                </button>
                              </li>
                              <li role="none">
                                <button type="button" role="menuitem" onClick={() => togglePin(chat.id)}>
                                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></svg>
                                  {chat.pinned ? '모아함에서 빼기' : '모아함에 담기'}
                                </button>
                              </li>
                              <li role="none">
                                <button type="button" role="menuitem" className={styles.menuDanger} onClick={() => removeChat(chat.id)}>
                                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>
                                  삭제
                                </button>
                              </li>
                            </ul>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )
          )}
          <p className={styles.historyNote}>대화 기록은 이 브라우저에만 저장돼요.</p>
        </div>

        {/* 맨 아래: 내 프로필 */}
        {user ? (
          <Link to="/mypage" className={styles.profile}>
            <span className={styles.avatar} aria-hidden="true">{(user.name || user.loginId || '?').slice(0, 1)}</span>
            <span className={styles.profileText}>
              <strong>{user.name || '회원'}</strong>
              <span>{maskId(user.loginId || user.username)}</span>
            </span>
            <svg className={styles.profileArrow} viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </Link>
        ) : (
          <Link to="/login" className={styles.profile}>
            <span className={styles.avatar} aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6" /><path d="M5 19.5c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" /></svg>
            </span>
            <span className={styles.profileText}>
              <strong>로그인</strong>
              <span>로그인하면 기록이 내 계정별로 저장돼요</span>
            </span>
          </Link>
        )}
      </aside>
      {sidebarOpen && (
        <button type="button" className={styles.backdrop} aria-label="대화 기록 닫기" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ---------- 가운데: 대화 ---------- */}
      <section className={styles.main}>
        <div className={styles.topBar}>
          <button type="button" className={styles.menuButton} aria-label="대화 기록 열기" onClick={() => setSidebarOpen(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
          </button>
          <h1 className={styles.chatTitle}>{active ? active.title : '모아챗'}</h1>
          <button type="button" className={styles.topNew} aria-label="새 대화" onClick={startNew}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>

        <div className={styles.scroll} ref={listRef}>
          {messages.length === 0 ? (
            <div className={styles.welcome}>
              <MoaFace size={64} className={styles.welcomeFace} />
              <h2 className={styles.welcomeTitle}>무엇이 궁금하신가요?</h2>
              <p className={styles.welcomeText}>지원금 조건, 신청 방법, 필요한 서류까지 모아가 알려드려요.</p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((item) => (
                  <button key={item.title} type="button" className={styles.suggestion} onClick={() => send(item.text)}>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.thread}>
              {messages.map((message, index) => (
                message.role === 'user' ? (
                  <div key={index} className={styles.userRow}>
                    <p className={styles.userBubble}>{message.text}</p>
                  </div>
                ) : (
                  <div key={index} className={styles.botRow}>
                    <MoaFace size={32} className={styles.botFace} />
                    <p className={`${styles.botText} ${message.error ? styles.botError : ''}`}>{message.text}</p>
                  </div>
                )
              ))}
              {waiting && (
                <div className={styles.botRow}>
                  <MoaFace size={32} className={styles.botFace} />
                  <span className={styles.typing} aria-label="모아가 답을 쓰는 중">
                    <i /><i /><i />
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---------- 아래: 입력창 ---------- */}
        <div className={styles.composerWrap}>
          <form
            className={styles.composer}
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <textarea
              ref={inputRef}
              className={styles.input}
              rows={1}
              value={input}
              placeholder="모아에게 물어보세요"
              aria-label="질문 입력"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                // 엔터 = 보내기, Shift+엔터 = 줄바꿈 (한글 조합 중에는 무시)
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send(input);
                }
              }}
            />
            <button type="submit" className={styles.sendButton} disabled={!input.trim() || waiting} aria-label="보내기">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" /></svg>
            </button>
          </form>
          <p className={styles.disclaimer}>모아챗도 틀릴 수 있어요. 신청 전에 공식 공고를 꼭 확인해 주세요.</p>
        </div>
      </section>
    </div>
  );
}

export default ChatPage;
