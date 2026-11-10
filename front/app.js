const $ = id => document.getElementById(id);
const sample = { title: $('article-title').value, body: $('article-body').value };
const suggestions = [
  { label: '도입부', original: '주말 오후, 비를 피해 동네 카페에 들어갔다. 창가 자리에서 바라본 골목은 평소보다 조용했다.', revised: '비가 내리던 주말 오후, 잠시 비를 피하려고 동네 카페에 들어갔다. 창가에 앉으니 익숙한 골목도 낯설 만큼 고요해 보였다.', note: '첫 장면에 날씨와 시선을 더해 글의 분위기가 바로 전해지도록 다듬었어요.' },
  { label: '마무리', original: '바쁜 하루 사이에 잠시 쉬어갈 곳이 필요하다면, 이 카페에 다시 들르고 싶다.', revised: '다음에 또 비가 온다면, 나는 아마 그 창가 자리를 먼저 떠올릴 것이다.', note: '앞에서 등장한 빗소리와 창가 자리로 돌아오며 끝맺어 봤어요.' },
  { label: '중간 문단', original: '따뜻한 라떼를 주문하고 자리에 앉으니 커피 향과 빗소리가 자연스럽게 어우러졌다. 잠깐 들를 생각이었는데 어느새 한 시간 넘게 머물렀다.', revised: '따뜻한 라떼 한 잔을 앞에 두고 빗소리를 듣다 보니 시간이 천천히 흘렀다. 잠깐만 쉬어가려던 발걸음이 어느새 한 시간 넘게 머물렀다.', note: '같은 경험을 조금 더 차분한 리듬으로 표현했어요.' }
];
const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const key = suffix => `moa:${currentUser}:${suffix}`;
let currentUser = null;
let authMode = 'login';
let pending = null;
let dialogMode = 'new';
let memos = [];
let drafts = [];
let suggestionIndex = 0;
const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
function updateCount() { $('word-count').textContent = `${$('article-title').value.length + $('article-body').value.length}자`; }
function saveCurrent() { if (currentUser) localStorage.setItem(key('current'), JSON.stringify({ title: $('article-title').value, body: $('article-body').value })); }
function draftIsEmpty() { return !$('article-title').value.trim() && !$('article-body').value.trim(); }
function scrollChat() { $('chat-scroll').scrollTop = $('chat-scroll').scrollHeight; }
function addMessage(text, kind = 'assistant') { const row = element('div', `message ${kind}`); if (kind === 'assistant') row.append(element('div', 'avatar', '✳')); const bubble = element('div', 'bubble'); bubble.append(element('p', '', text)); row.append(bubble); $('messages').append(row); scrollChat(); return bubble; }
function resetChat() { pending = null; suggestionIndex = 0; $('messages').replaceChildren(); $('chat-input').value = ''; addMessage('어떤 경험을 했는지 생각나는대로 말해줘'); }
function addSuggestion() {
  const body = $('article-body').value;
  const available = suggestions.filter(item => body.includes(item.original));
  if (!available.length) { addMessage('이야기를 들었어요. 왼쪽 글에 먼저 적어주시면, 수정 제안을 보여드릴 수 있어요. 현재는 예시 응답으로 작동해요.'); return; }
  const s = available[suggestionIndex % available.length]; suggestionIndex++;
  const bubble = addMessage(s.note);
  const card = element('div', 'suggestion-card'); card.append(element('div', 'suggestion-label', `✦ 수정 제안 · ${s.label}`));
  const before = element('div', 'suggestion-before'); before.append(element('span', '', '현재 문장'), element('p', '', s.original));
  const after = element('div', 'suggestion-after'); after.append(element('span', '', '제안 문장'), element('p', '', s.revised)); card.append(before, after);
  const actions = element('div', 'suggestion-actions'); const skip = element('button', 'skip-button', '넘어가기'); const apply = element('button', 'apply-button', '글에 반영하기 ↗');
  skip.type = apply.type = 'button'; actions.append(skip, apply); card.append(actions); bubble.append(card);
  pending = { s, card };
  skip.addEventListener('click', () => resolveSuggestion(false, card)); apply.addEventListener('click', () => resolveSuggestion(true, card)); scrollChat();
}
function resolveSuggestion(apply, card) {
  if (!pending || pending.card !== card) return;
  const { s } = pending;
  if (apply) {
    if (!$('article-body').value.includes(s.original)) { addMessage('원래 문장이 변경되어 이 제안을 적용할 수 없어요.'); return; }
    $('article-body').value = $('article-body').value.replace(s.original, s.revised); updateCount(); saveCurrent();
  }
  card.classList.add('resolved'); card.querySelector('.suggestion-actions').replaceWith(element('div', 'resolution', apply ? '✓ 글에 반영했어요' : '↷ 이 제안은 넘어갔어요'));
  pending = null; addMessage(apply ? '왼쪽 글에 바로 반영했어요.' : '좋아요. 원래 문장을 그대로 둘게요.');
}
function respond(text) { const value = text.trim(); if (!value) return; addMessage(value, 'user'); if (pending) resolveSuggestion(false, pending.card); addSuggestion(); }
$('chat-form').addEventListener('submit', event => { event.preventDefault(); respond($('chat-input').value); $('chat-input').value = ''; });
$('chat-input').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('chat-form').requestSubmit(); } });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => respond(button.dataset.prompt)));
$('article-title').addEventListener('input', () => { updateCount(); saveCurrent(); });
$('article-body').addEventListener('input', () => { updateCount(); saveCurrent(); });

function setAuthMode(mode) {
  authMode = mode; const signup = mode === 'signup';
  $('signup-fields').hidden = !signup; $('blog-name').required = signup; $('blog-url').required = signup;
  $('auth-password').autocomplete = signup ? 'new-password' : 'current-password';
  $('auth-title').textContent = signup ? '나만의 글쓰기를 시작해요.' : '다시 만나서 반가워요.';
  $('auth-description').textContent = signup ? '계정과 블로그 정보를 입력해주세요.' : '이메일로 로그인하고 글쓰기를 이어가세요.';
  $('auth-submit').firstChild.textContent = signup ? '회원가입하기 ' : '로그인하기 ';
  $('auth-switch-copy').textContent = signup ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?';
  $('auth-toggle').textContent = signup ? '로그인' : '회원가입'; $('auth-error').hidden = true;
}
$('auth-toggle').addEventListener('click', () => setAuthMode(authMode === 'login' ? 'signup' : 'login'));
$('demo-login').addEventListener('click', () => { sessionStorage.setItem('moa:user', 'demo@moa.local'); enterWorkspace('demo@moa.local'); });
function authError(text) { $('auth-error').textContent = text; $('auth-error').hidden = false; }
function validBlogUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' && ['blog.naver.com', 'm.blog.naver.com'].includes(url.hostname) && /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname); } catch { return false; } }
async function hashPassword(password, salt) { const bytes = new TextEncoder().encode(`${salt}:${password}`); const digest = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join(''); }
$('auth-form').addEventListener('submit', async event => {
  event.preventDefault(); $('auth-error').hidden = true;
  const email = $('auth-email').value.trim().toLowerCase(); const password = $('auth-password').value;
  const accounts = safeRead('moa:accounts', {});
  if (authMode === 'signup') {
    const blogName = $('blog-name').value.trim(); const blogUrl = $('blog-url').value.trim();
    if (!blogName || !validBlogUrl(blogUrl)) { authError('블로그 이름과 네이버 블로그 메인화면 링크를 정확히 입력해주세요.'); return; }
    if (accounts[email]) { authError('이미 가입된 이메일입니다. 로그인해 주세요.'); return; }
    const salt = crypto.randomUUID(); accounts[email] = { salt, passwordHash: await hashPassword(password, salt), blogName, blogUrl };
    localStorage.setItem('moa:accounts', JSON.stringify(accounts));
  } else {
    const account = accounts[email];
    if (!account || !account.blogName || !account.blogUrl || await hashPassword(password, account.salt) !== account.passwordHash) { authError('이메일 또는 비밀번호를 확인해주세요.'); return; }
  }
  sessionStorage.setItem('moa:user', email); enterWorkspace(email);
});
function enterWorkspace(email) {
  currentUser = email; $('auth-screen').hidden = true; $('app-shell').hidden = false;
  const saved = safeRead(key('current'), null); const current = saved && typeof saved.title === 'string' && typeof saved.body === 'string' ? saved : sample;
  $('article-title').value = current.title; $('article-body').value = current.body;
  memos = safeRead(key('memos'), []); drafts = safeRead(key('drafts'), []);
  updateCount(); resetChat(); renderMemos(); renderDrafts();
}
$('logout').addEventListener('click', () => { sessionStorage.removeItem('moa:user'); currentUser = null; closePanels(); $('app-shell').hidden = true; $('auth-screen').hidden = false; $('auth-password').value = ''; setAuthMode('login'); });
const sessionUser = sessionStorage.getItem('moa:user'); if (sessionUser && (sessionUser === 'demo@moa.local' || safeRead('moa:accounts', {})[sessionUser])) enterWorkspace(sessionUser);

function setOverlay() { $('overlay').hidden = $('memo-drawer').hidden && $('draft-dialog').hidden; }
function closePanels() { $('memo-drawer').hidden = true; $('draft-dialog').hidden = true; setOverlay(); }
$('overlay').addEventListener('click', closePanels); $('memo-close').addEventListener('click', closePanels); $('dialog-close').addEventListener('click', closePanels); $('cancel-new').addEventListener('click', closePanels);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closePanels(); });
$('memo-open').addEventListener('click', () => { $('draft-dialog').hidden = true; $('memo-drawer').hidden = false; setOverlay(); $('memo-input').focus(); });
function renderMemos() {
  $('memo-list').replaceChildren();
  if (!memos.length) { $('memo-list').append(element('p', 'empty-state', '아직 적어둔 글감이 없어요.')); return; }
  for (const memo of memos) {
    const item = element('div', 'memo-item'); item.append(element('p', '', memo.text));
    const remove = element('button', 'memo-remove', '삭제'); remove.type = 'button'; remove.addEventListener('click', () => { memos = memos.filter(value => value.id !== memo.id); localStorage.setItem(key('memos'), JSON.stringify(memos)); renderMemos(); });
    item.append(remove); $('memo-list').append(item);
  }
}
$('memo-form').addEventListener('submit', event => { event.preventDefault(); const text = $('memo-input').value.trim(); if (!text) return; memos.unshift({ id: crypto.randomUUID(), text }); localStorage.setItem(key('memos'), JSON.stringify(memos)); $('memo-input').value = ''; renderMemos(); $('memo-input').focus(); });
function renderDrafts() {
  $('draft-list').replaceChildren(); $('draft-count').textContent = drafts.length;
  if (!drafts.length) { $('draft-list').append(element('p', 'empty-state', '저장된 글이 아직 없어요.')); return; }
  for (const draft of drafts) {
    const row = element('div', 'draft-item'); const details = element('div'); details.append(element('strong', '', draft.title.trim() || '제목 없는 글'), element('small', '', new Date(draft.savedAt).toLocaleString('ko-KR')));
    const load = element('button', 'draft-load', '불러오기'); load.type = 'button'; load.addEventListener('click', () => { $('article-title').value = draft.title; $('article-body').value = draft.body; updateCount(); saveCurrent(); resetChat(); closePanels(); });
    row.append(details, load); $('draft-list').append(row);
  }
}
function openDialog(mode) {
  dialogMode = mode; $('memo-drawer').hidden = true; $('draft-dialog').hidden = false;
  $('dialog-title').textContent = mode === 'new' ? '현재 글을 삭제하시겠습니까?' : '임시저장된 글';
  $('dialog-description').textContent = mode === 'new' ? '임시저장하고 새 글을 시작하거나, 저장하지 않고 삭제하거나, 현재 글로 돌아갈 수 있어요.' : '저장된 글을 확인하고 이어서 작성할 수 있어요.';
  $('dialog-actions').hidden = mode !== 'new'; renderDrafts(); setOverlay(); $('dialog-close').focus();
}
$('reset').addEventListener('click', () => openDialog('new'));
$('drafts-open').addEventListener('click', () => openDialog('drafts'));
function startBlank() { $('article-title').value = ''; $('article-body').value = ''; updateCount(); saveCurrent(); resetChat(); closePanels(); $('article-title').focus(); }
$('save-new').addEventListener('click', () => { if (!draftIsEmpty()) { drafts.unshift({ id: crypto.randomUUID(), title: $('article-title').value, body: $('article-body').value, savedAt: new Date().toISOString() }); localStorage.setItem(key('drafts'), JSON.stringify(drafts)); } startBlank(); });
$('delete-new').addEventListener('click', startBlank);
const workspace = $('workspace'); const splitter = $('splitter');
function setSplit(percent) { const width = Math.min(70, Math.max(30, percent)); workspace.style.setProperty('--left-width', `${width}%`); splitter.setAttribute('aria-valuenow', Math.round(width)); }
let dragging = false;
splitter.addEventListener('pointerdown', event => { dragging = true; splitter.setPointerCapture(event.pointerId); document.body.classList.add('dragging'); });
splitter.addEventListener('pointermove', event => { if (!dragging) return; const rect = workspace.getBoundingClientRect(); setSplit((event.clientX - rect.left) / rect.width * 100); });
function endDrag() { dragging = false; document.body.classList.remove('dragging'); }
splitter.addEventListener('pointerup', endDrag); splitter.addEventListener('pointercancel', endDrag);
splitter.addEventListener('keydown', event => { const value = Number(splitter.getAttribute('aria-valuenow')); if (event.key === 'ArrowLeft') { setSplit(value - 5); event.preventDefault(); } if (event.key === 'ArrowRight') { setSplit(value + 5); event.preventDefault(); } });
