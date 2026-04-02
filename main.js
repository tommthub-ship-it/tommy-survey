/* ─── Tommy Survey — Shared Utilities ──────────────────
   LocalStorage 기반 데이터 레이어 + 인증 + 공통 UI 헬퍼
──────────────────────────────────────────────────────── */

/* ── Storage helpers ─────────────────────────────────── */
const DB = {
  get: (key, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),

  getUsers:     () => DB.get('ts_users', []),
  setUsers:     d  => DB.set('ts_users', d),
  getSurveys:   () => DB.get('ts_surveys', []),
  setSurveys:   d  => DB.set('ts_surveys', d),
  getResponses: () => DB.get('ts_responses', []),
  setResponses: d  => DB.set('ts_responses', d),
  getSession:   () => DB.get('ts_session', null),
  setSession:   d  => DB.set('ts_session', d),
  clearSession: () => localStorage.removeItem('ts_session'),
};

/* ── ID / date helpers ───────────────────────────────── */
function genId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}

function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { year:'numeric', month:'short', day:'numeric' });
}

function fmtNum(n) {
  return Number(n).toLocaleString('ko-KR');
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)   return '방금 전';
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  return `${Math.floor(diff/86400)}일 전`;
}

/* ── Auth helpers ────────────────────────────────────── */
function currentUser() {
  const session = DB.getSession();
  if (!session) return null;
  return DB.getUsers().find(u => u.id === session.userId) || null;
}

function requireAuth(role) {
  const user = currentUser();
  if (!user) { window.location.href = '/auth.html'; return null; }
  if (role && user.role !== role) {
    window.location.href = user.role === 'creator' ? '/dashboard.html' : '/panel.html';
    return null;
  }
  return user;
}

function logout() {
  DB.clearSession();
  window.location.href = '/index.html';
}

/* ── Navbar renderer ─────────────────────────────────── */
function renderNav() {
  const user = currentUser();
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const logoHref = user
    ? (user.role === 'creator' ? '/dashboard.html' : '/panel.html')
    : '/index.html';

  const userSection = user ? `
    <div class="navbar-user">
      <span class="navbar-username">${user.name}</span>
      <span class="badge ${user.role === 'creator' ? 'badge-creator' : 'badge-panel'}">${user.role === 'creator' ? '의뢰자' : '패널'}</span>
      <div class="avatar" title="${user.name}">${user.name.slice(0,1)}</div>
      <button class="btn btn-ghost btn-sm" onclick="logout()">로그아웃</button>
    </div>
  ` : `
    <div class="navbar-links">
      <a href="/auth.html" class="btn btn-ghost btn-sm">로그인</a>
      <a href="/auth.html?tab=register" class="btn btn-primary btn-sm">시작하기</a>
    </div>
  `;

  nav.innerHTML = `
    <div class="container">
      <a href="${logoHref}" class="navbar-logo">Tommy<span>Survey</span></a>
      ${userSection}
    </div>
  `;
}

/* ── Toast ───────────────────────────────────────────── */
function toast(msg, type = 'default') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* ── Seed Data (최초 1회 생성) ───────────────────────── */
function seedData() {
  if (DB.getUsers().length > 0) return;

  const creatorId = genId('user');
  const panelId   = genId('user');
  const survey1Id = genId('survey');
  const survey2Id = genId('survey');
  const q1 = genId('q'), q2 = genId('q'), q3 = genId('q');
  const q4 = genId('q'), q5 = genId('q');

  DB.setUsers([
    {
      id: creatorId, email: 'creator@demo.com', password: 'demo1234',
      name: '김기획', role: 'creator', credits: 150000,
      createdAt: new Date(Date.now() - 86400*14*1000).toISOString()
    },
    {
      id: panelId, email: 'panel@demo.com', password: 'demo1234',
      name: '이응답', role: 'panel', points: 1240,
      createdAt: new Date(Date.now() - 86400*10*1000).toISOString()
    }
  ]);

  DB.setSurveys([
    {
      id: survey1Id, creatorId,
      title: '2024 스마트폰 사용 실태 조사',
      description: '사용자의 스마트폰 이용 패턴과 만족도를 파악하기 위한 설문입니다.',
      status: 'active',
      reward: 200,
      targetCount: 100,
      questions: [
        { id: q1, type: 'single', text: '현재 사용 중인 스마트폰 브랜드는 무엇입니까?', required: true,
          options: ['삼성', '애플', 'LG', '기타'] },
        { id: q2, type: 'scale', text: '현재 스마트폰에 대한 전반적인 만족도를 평가해 주세요.', required: true,
          min: 1, max: 5, minLabel: '매우 불만족', maxLabel: '매우 만족' },
        { id: q3, type: 'multiple', text: '스마트폰으로 주로 사용하는 기능을 모두 선택해 주세요.', required: true,
          options: ['SNS', '동영상 시청', '게임', '쇼핑', '업무·생산성', '금융'] },
        { id: q4, type: 'text', text: '스마트폰 사용 시 가장 불편한 점은 무엇인가요?', required: false, options: [] },
      ],
      createdAt: new Date(Date.now() - 86400*3*1000).toISOString(),
      publishedAt: new Date(Date.now() - 86400*3*1000).toISOString(),
    },
    {
      id: survey2Id, creatorId,
      title: '배달 앱 브랜드 인지도 조사',
      description: '주요 배달 앱에 대한 소비자 인지도와 이용 경험을 조사합니다.',
      status: 'closed',
      reward: 300,
      targetCount: 50,
      questions: [
        { id: q5, type: 'single', text: '가장 자주 이용하는 배달 앱은 어디입니까?', required: true,
          options: ['배달의민족', '쿠팡이츠', '요기요', '기타'] },
      ],
      createdAt: new Date(Date.now() - 86400*10*1000).toISOString(),
      publishedAt: new Date(Date.now() - 86400*10*1000).toISOString(),
      closedAt: new Date(Date.now() - 86400*2*1000).toISOString(),
    }
  ]);

  // 샘플 응답 (survey2)
  const optionCounts = { '배달의민족': 22, '쿠팡이츠': 15, '요기요': 9, '기타': 4 };
  const responses = [];
  for (const [opt, cnt] of Object.entries(optionCounts)) {
    for (let i = 0; i < cnt; i++) {
      responses.push({
        id: genId('resp'), surveyId: survey2Id,
        panelId: genId('panel'),
        answers: [{ questionId: q5, value: opt }],
        completedAt: new Date(Date.now() - Math.random()*86400*8*1000).toISOString(),
        duration: 30 + Math.floor(Math.random() * 60)
      });
    }
  }
  DB.setResponses(responses);
}

/* ── Question type labels ────────────────────────────── */
const Q_TYPES = {
  single:   { label: '단일 선택', icon: '◉' },
  multiple: { label: '복수 선택', icon: '☑' },
  text:     { label: '단답형',    icon: '✏️' },
  scale:    { label: '척도형',    icon: '⭐' },
  nps:      { label: 'NPS',       icon: '📊' },
};

/* ── Survey status labels ────────────────────────────── */
function statusBadge(status) {
  const map = {
    active: '<span class="badge badge-active">진행중</span>',
    draft:  '<span class="badge badge-draft">임시저장</span>',
    closed: '<span class="badge badge-closed">완료</span>',
  };
  return map[status] || map.draft;
}

/* ── Survey response count ───────────────────────────── */
function getResponseCount(surveyId) {
  return DB.getResponses().filter(r => r.surveyId === surveyId).length;
}

/* ── Init ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  seedData();
  renderNav();
});
