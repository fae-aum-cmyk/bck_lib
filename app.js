/* ============================================================
   BCK Digital Library — application shell
   Vanilla ES2020. No build step: served straight from GitHub Pages.
   Data layer lives in /data/*.json and loads via fetch() in parallel.
   ============================================================ */

/* ---------- tiny helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[c]);
}

function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(value || 0);
}

/** Compact Ugandan-shilling formatting for large totals (e.g. 80.6M). */
function formatUgx(value) {
  const n = value || 0;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return formatCount(n);
}

function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const min = 60e3, hour = 60 * min, day = 24 * hour;
  if (diff < min) return 'just now';
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* ---------- inline icons ---------- */
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  books: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  sparkle: '<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  question: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  bookmark: '<path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  clock: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  layers: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 0 0 1 4 19.5v-15A2.5 2 0 0 1 6.5 2z"/>',
  flask: '<path d="M10 2v7.5L4.2 19a1 1 0 0 0 .87 1.5h13.86a1 1 0 0 0 .87-1.5L14 9.5V2"/><path d="M8.5 2h7"/><path d="M6.5 15h11"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.6-1.4-.3-.4-.4-.8-.4-1.1 0-.8.7-1.5 1.5-1.5H16a6 6 0 0 0 6-6c0-4.4-4.5-8-10-8z"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
};

function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

/* ============================================================
   STORAGE
   ============================================================ */

const KEY = {
  posts: 'bck.blog.posts',
  comments: 'bck.blog.comments',
  profile: 'bck.user.profile',
  bookmarks: 'bck.user.bookmarks',
  history: 'bck.user.history',
  study: 'bck.study.space',
  theme: 'bck.theme',
};

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the app still works, it just won't persist */
  }
}

/* ============================================================
   PROFILE
   ============================================================ */

function getProfile() {
  let profile = readStore(KEY.profile, null);
  if (!profile || !profile.deviceId) {
    profile = {
      name: 'BCK Learner',
      deviceId: `dev-${Math.random().toString(36).slice(2, 10)}`,
      classLevel: null,
      subjects: [],
      theme: 'light',
    };
    writeStore(KEY.profile, profile);
  }
  profile.subjects = Array.isArray(profile.subjects) ? profile.subjects : [];
  return profile;
}

function saveProfile(patch) {
  const next = { ...getProfile(), ...patch };
  writeStore(KEY.profile, next);
  return next;
}

const profile = () => readStore(KEY.profile, getProfile());

/* ============================================================
   BLOG SERVICE (localStorage-backed, mirrors the reference API)
   ============================================================ */

const Blog = {
  list() {
    return readStore(KEY.posts, []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },
  get(id) {
    return this.list().find((p) => p.id === id) || null;
  },
  create(data) {
    const posts = readStore(KEY.posts, []);
    const post = {
      id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title: data.title,
      body: data.body,
      author_name: data.author_name,
      category: data.category,
      subject: data.subject || null,
      class_level: data.class_level || null,
      tags: data.tags || [],
      likes: [],
      created_at: new Date().toISOString(),
    };
    posts.unshift(post);
    writeStore(KEY.posts, posts);
    return post;
  },
  update(id, patch) {
    const posts = readStore(KEY.posts, []);
    const index = posts.findIndex((p) => p.id === id);
    if (index === -1) return null;
    posts[index] = { ...posts[index], ...patch };
    writeStore(KEY.posts, posts);
    return posts[index];
  },
  remove(id) {
    const posts = readStore(KEY.posts, []).filter((p) => p.id !== id);
    writeStore(KEY.posts, posts);
    const comments = readStore(KEY.comments, []).filter((c) => c.post_id !== id);
    writeStore(KEY.comments, comments);
  },
  toggleLike(id) {
    const posts = readStore(KEY.posts, []);
    const index = posts.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const me = getProfile().deviceId;
    const post = posts[index];
    post.likes = post.likes.includes(me)
      ? post.likes.filter((l) => l !== me)
      : [...post.likes, me];
    posts[index] = post;
    writeStore(KEY.posts, posts);
    return post;
  },
  listComments(postId) {
    return readStore(KEY.comments, [])
      .filter((c) => c.post_id === postId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },
  addComment(postId, body, author) {
    const comments = readStore(KEY.comments, []);
    const comment = {
      id: `lc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      post_id: postId,
      author_name: author,
      body,
      created_at: new Date().toISOString(),
    };
    comments.push(comment);
    writeStore(KEY.comments, comments);
    return comment;
  },
};

/** Shape a stored post into the shape the views consume. */
function decoratePost(post) {
  const me = getProfile().deviceId;
  return {
    ...post,
    likes_count: (post.likes || []).length,
    comments_count: Blog.listComments(post.id).length,
    liked_by_me: (post.likes || []).includes(me),
  };
}

/* ============================================================
   BOOKMARKS + HISTORY
   ============================================================ */

const Bookmarks = {
  list() {
    return readStore(KEY.bookmarks, []);
  },
  has(id) {
    return this.list().some((b) => b.id === id);
  },
  toggle(resource) {
    const list = this.list();
    const index = list.findIndex((b) => b.id === resource.id);
    if (index !== -1) {
      list.splice(index, 1);
      writeStore(KEY.bookmarks, list);
      return false;
    }
    list.unshift({ ...resource, saved_at: new Date().toISOString() });
    writeStore(KEY.bookmarks, list);
    return true;
  },
  remove(id) {
    writeStore(KEY.bookmarks, this.list().filter((b) => b.id !== id));
  },
};

const History = {
  list() {
    return readStore(KEY.history, []);
  },
  push(resource) {
    const list = this.list().filter((r) => r.id !== resource.id);
    list.unshift({ ...resource, viewed_at: new Date().toISOString() });
    writeStore(KEY.history, list.slice(0, 40));
  },
  remove(id) {
    writeStore(KEY.history, this.list().filter((r) => r.id !== id));
  },
  clear() {
    writeStore(KEY.history, []);
  },
};

/* ============================================================
   STUDY SPACE
   ============================================================ */

const Study = {
  get() {
    return readStore(KEY.study, null);
  },
  save(value) {
    writeStore(KEY.study, value);
    return value;
  },
  clear() {
    localStorage.removeItem(KEY.study);
  },
};

/* ============================================================
   DATA LOADING
   ============================================================ */

const Data = {
  resources: [],
  classes: [],
  subjects: [],
  classSubjects: {},
  loaded: false,
};

async function loadData() {
  if (Data.loaded) return Data;

  /* The catalogue ships as per-class shards so the payload stays small and
     the shards can be fetched in parallel. resource_shards.json is the index. */
  const [classes, subjects, classSubjects, shardIndex] = await Promise.all([
    fetch('data/classes.json').then((r) => r.json()),
    fetch('data/subjects.json').then((r) => r.json()),
    fetch('data/class_subjects.json').then((r) => r.json()),
    fetch('data/resource_shards.json').then((r) => r.json()),
  ]);

  const shards = await Promise.all(
    shardIndex.map((s) => fetch(`data/${s.file}`).then((r) => r.json()))
  );

  Data.classes = classes;
  Data.subjects = subjects;
  Data.classSubjects = classSubjects;
  Data.resources = shards.flat();
  Data.loaded = true;
  return Data;
}

const classById = (id) => Data.classes.find((c) => c.id === id);
const resourceById = (id) => Data.resources.find((r) => r.id === id);

/* ============================================================
   ROUTER
   ============================================================ */

const ROUTES = [
  { path: '/', render: viewDashboard },
  { path: '/library', render: viewLibrary },
  { path: '/class/:classId', render: viewClass },
  { path: '/blog', render: viewBlog },
  { path: '/blog/new', render: viewNewPost },
  { path: '/blog/:id', render: viewPostDetail },
  { path: '/bookmarks', render: viewBookmarks },
  { path: '/history', render: viewHistory },
  { path: '/study-space', render: viewStudySpace },
  { path: '/assistant', render: viewAssistant },
  { path: '/profile', render: viewProfile },
];

let currentRoute = null;

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return { path, query: new URLSearchParams(queryPart || '') };
}

function matchRoute(path) {
  for (const route of ROUTES) {
    if (!route.path.includes(':')) {
      if (route.path === path) return { route, params: {} };
      continue;
    }
    const routeParts = route.path.split('/');
    const pathParts = path.split('/');
    if (routeParts.length !== pathParts.length) continue;
    const params = {};
    let matched = true;
    for (let i = 0; i < routeParts.length; i += 1) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (routeParts[i] !== pathParts[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return { route, params };
  }
  return null;
}

function navigate(path, { replace = false } = {}) {
  const target = `#${path}`;
  if (replace) window.location.replace(target);
  else window.location.hash = path;
}

async function handleRoute() {
  const { path, query } = parseHash();
  const matched = matchRoute(path);
  const host = $('#view-host');

  /* A route change always dismisses any open dialog, so the modal
     overlay can never trap pointer events over the new view. */
  closeModal('reader-modal');

  if (!matched) {
    host.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon('inbox')}</div>
        <h3>Page not found</h3>
        <p>The page you are looking for does not exist.</p>
        <a class="btn-primary" href="#/" data-link>Back to dashboard</a>
      </div>`;
    setActiveNav(null);
    return;
  }

  host.setAttribute('aria-busy', 'true');
  try {
    await loadData();
    const html = await matched.route.render({ ...matched.params, query });
    host.innerHTML = html;
    setActiveNav(path);
    host.scrollIntoView({ block: 'start' });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  } catch (error) {
    host.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon('inbox')}</div>
        <h3>Something went wrong</h3>
        <p>${escapeHtml(error.message || 'Could not load this view.')}</p>
      </div>`;
  } finally {
    host.removeAttribute('aria-busy');
  }
  currentRoute = path;
}

function setActiveNav(path) {
  $$('.nav-item').forEach((item) => {
    const route = item.dataset.route || '';
    const active = route === path
      || (route !== '/' && path.startsWith(`${route}/`))
      || (route === '/blog' && path.startsWith('/blog'));
    item.classList.toggle('is-active', active);
  });
}

/* ============================================================
   TOAST + MODAL
   ============================================================ */

let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ============================================================
   GLOBAL SEARCH
   ============================================================ */

function renderGlobalSearch(query) {
  const panel = $('#search-results');
  const term = query.trim().toLowerCase();

  if (!term) {
    panel.hidden = true;
    panel.innerHTML = '';
    return;
  }

  const hits = Data.resources
    .filter((r) =>
      r.title.toLowerCase().includes(term) ||
      r.subject.toLowerCase().includes(term) ||
      (r.description || '').toLowerCase().includes(term))
    .slice(0, 12);

  if (!hits.length) {
    panel.innerHTML = '<div class="search-empty">No resources match that search.</div>';
    panel.hidden = false;
    return;
  }

  panel.innerHTML = hits
    .map(
      (r) => `
      <button class="search-hit" data-resource="${escapeHtml(r.id)}">
        <b>${escapeHtml(r.title)}</b>
        <small>${escapeHtml(r.subject)} · ${escapeHtml(r.class.toUpperCase())}</small>
      </button>`
    )
    .join('');
  panel.hidden = false;
}

/* ============================================================
   VIEWS — DASHBOARD
   ============================================================ */

function viewDashboard() {
  const p = profile();
  const study = Study.get();
  const bookmarkCount = Bookmarks.list().length;
  const historyCount = History.list().length;
  const postCount = Blog.list().length;

  const classCards = Data.classes
    .map((c) => {
      const max = Math.max(...Data.classes.map((x) => x.count));
      const pct = Math.round((c.count / max) * 100);
      return `
        <a class="class-card" href="#/class/${c.id}" data-link>
          <div class="cc-head">
            <span class="cc-code">${escapeHtml(c.short)}</span>
            <span class="cc-label">${escapeHtml(c.label)}</span>
          </div>
          <p class="cc-tagline">${escapeHtml(c.tagline)}</p>
          <div class="cc-count">${formatCount(c.count)} resources</div>
          <div class="cc-bar"><i style="width:${pct}%"></i></div>
        </a>`;
    })
    .join('');

  const features = [
    {
      icon: 'books',
      color: 'hsl(var(--brand-600))',
      title: 'Beautifully organised library',
      tag: 'Library',
      body: `Browse ${formatCount(Data.resources.length)} approved resources by class, subject and type — without losing your place.`,
      href: '#/library',
    },
    {
      icon: 'search',
      color: 'hsl(var(--accent))',
      title: 'Select-to-search reader',
      tag: 'Reading aid',
      body: 'Highlight any word in a PDF and the library opens a focused Google search in a small window.',
      href: '#/library',
    },
    {
      icon: 'sparkle',
      color: 'hsl(262 60% 50%)',
      title: 'AI study buddy',
      tag: 'AI',
      body: 'Ask for past papers, a revision plan, or a study tip. The buddy answers from the library contents.',
      href: '#/assistant',
    },
    {
      icon: 'chat',
      color: 'hsl(215 70% 52%)',
      title: 'Discussions & Q&A',
      tag: 'Community',
      body: 'Post a question, share a tip, or start a study group. Powered by the BCK community.',
      href: '#/blog',
    },
    {
      icon: 'bookmark',
      color: 'hsl(330 65% 52%)',
      title: 'Bookmarks & history',
      tag: 'Personal',
      body: 'Save resources with notes, see what you opened recently. Your study space, always one tap away.',
      href: '#/bookmarks',
    },
    {
      icon: 'layers',
      color: 'hsl(215 70% 45%)',
      title: 'Subject map',
      tag: 'Navigation',
      body: 'Visualise the breadth of subjects per class, and dive straight into the ones you are revising.',
      href: '#/library',
    },
    {
      icon: 'target',
      color: 'hsl(0 72% 51%)',
      title: 'UCE & UACE ready',
      tag: 'Exams',
      body: 'Filter by UCE, UACE and UNEB mock papers. Designed for the BCK curriculum.',
      href: '#/library',
    },
    {
      icon: 'phone',
      color: 'hsl(222 32% 40%)',
      title: 'Install as a PWA',
      tag: 'Mobile',
      body: 'Add the library to your phone. Works offline, syncs your bookmarks and notes.',
      href: '#/profile',
    },
    {
      icon: 'moon',
      color: 'hsl(262 50% 40%)',
      title: 'Light & dark themes',
      tag: 'Theme',
      body: 'Choose what suits your study session. The library adapts to your phone and your eyes.',
      href: '#/profile',
    },
  ]
    .map(
      (f) => `
      <a class="dash-card" href="${f.href}" data-link>
        <span class="dc-icon" style="background:${f.color}">${icon(f.icon)}</span>
        <h3>${escapeHtml(f.title)}</h3>
        <p>${escapeHtml(f.body)}</p>
      </a>`
    )
    .join('');

  return `
    <div class="page-head">
      <p class="kicker">${icon('sparkle')} Bishop Cipriano Kihangire SSS · Day Section</p>
      <h1>A focused home for <span class="text-gradient">BCK study resources.</span></h1>
      <p style="margin-top:.5rem;max-width:38rem;color:hsl(var(--muted-foreground));font-size:.9375rem">
        Approved notes, past papers and revision materials for Senior 1–6 — beautifully presented,
        with smart search and a community discussions board.
      </p>
    </div>

    <div class="stat-grid" style="margin-bottom:1.5rem">
      <div class="stat-tile"><b>${formatCount(Data.resources.length)}</b><span>Resources</span></div>
      <div class="stat-tile"><b>${Data.classes.length}</b><span>Classes</span></div>
      <div class="stat-tile"><b>${Data.subjects.length}</b><span>Subjects</span></div>
      <div class="stat-tile"><b>${formatUgx(Data.resources.reduce((sum, r) => sum + (r.price || 0), 0))}</b><span>UGX value</span></div>
    </div>

    <div class="page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;flex-wrap:wrap">
      <div>
        <p class="kicker">Step 01 / 04</p>
        <h1 style="font-size:1.4rem">Start with your year.</h1>
        <p>Pick a class to open its subject map. Each shelf is organised for the way BCK students actually study.</p>
      </div>
    </div>
    <div class="class-grid" style="margin-bottom:2rem">${classCards}</div>

    <div class="page-head" style="margin-bottom:1rem">
      <p class="kicker">Step 02 / 04</p>
      <h1 style="font-size:1.4rem">Every tool a BCK student needs.</h1>
      <p>A reading aid, an AI study buddy, a discussion space, and the entire Fresh Teacher archive — all in one focused app.</p>
    </div>
    <div class="dash-grid" style="margin-bottom:2rem">${features}</div>

    <div class="page-head" style="margin-bottom:1rem">
      <p class="kicker">Step 03 / 04</p>
      <h1 style="font-size:1.4rem">From a class to a clear next step.</h1>
      <p>Four small steps put every resource in reach — without the friction of lost tabs and slow searches.</p>
    </div>
    <div class="dash-grid" style="margin-bottom:2rem">
      ${[
        ['01', 'Pick your class', 'Start with S1–S6 to see the right shelf for your year.'],
        ['02', 'Choose a subject', 'Open the subject map and focus on one area at a time.'],
        ['03', 'Read with assistance', 'Select any text in a PDF to open a focused Google search.'],
        ['04', 'Plan & discuss', 'Ask the AI buddy for a 7-day revision plan, then post a question.'],
      ]
        .map(
          ([n, t, d]) => `
          <div class="dash-card">
            <div class="dc-icon" style="background:hsl(var(--primary))"><b class="font-mono">${n}</b></div>
            <h3>${escapeHtml(t)}</h3>
            <p>${escapeHtml(d)}</p>
          </div>`
        )
        .join('')}
    </div>

    <div class="card-elev" style="padding:1.5rem;background:linear-gradient(135deg,hsl(var(--brand-700)),hsl(var(--brand-900)));color:white;border:0">
      <p class="kicker" style="color:hsl(var(--gold-300))">Step 04 / 04</p>
      <h1 style="font-size:1.5rem;margin-top:.35rem;font-family:'Plus Jakarta Sans',Inter,sans-serif;font-weight:800;letter-spacing:-.03em">
        Open your study orbit. Start in seconds.
      </h1>
      <p style="margin-top:.5rem;max-width:32rem;color:rgb(255 255 255/.82);font-size:.9rem">
        The library is free, works on your phone, and remembers your setup. No accounts needed —
        your bookmarks and notes live on your device.
      </p>
      <div style="display:flex;gap:.6rem;margin-top:1rem;flex-wrap:wrap">
        <a class="btn-primary" href="#/library" data-link style="background:hsl(var(--gold-400));border-color:hsl(var(--gold-400));color:hsl(var(--accent-foreground))">
          Enter the library →
        </a>
        <a class="btn-secondary" href="#/assistant" data-link style="background:rgb(255 255 255/.1);border-color:rgb(255 255 255/.2);color:white">
          Talk to the AI Buddy
        </a>
      </div>
      <p style="margin-top:1rem;font-size:.75rem;color:rgb(255 255 255/.6)">
        Signed in as ${escapeHtml(p.name)}${p.classLevel ? ` · ${escapeHtml(p.classLevel.toUpperCase())}` : ''} ·
        ${bookmarkCount} bookmarks · ${historyCount} recently viewed · ${postCount} posts
      </p>
    </div>`;
}

/* ============================================================
   VIEWS — LIBRARY
   ============================================================ */

function libraryFilters() {
  const { query } = parseHash();
  return {
    q: query.get('q') || '',
    cls: query.get('class') || 'all',
    subject: query.get('subject') || 'all',
    type: query.get('type') || 'all',
    term: query.get('term') || 'all',
    sort: query.get('sort') || 'relevance',
    page: Number(query.get('page') || '1'),
  };
}

function applyLibraryFilters(filters) {
  let list = Data.resources;

  if (filters.cls !== 'all') list = list.filter((r) => r.class === filters.cls);
  if (filters.subject !== 'all') list = list.filter((r) => r.subject === filters.subject);
  if (filters.type !== 'all') list = list.filter((r) => r.type === filters.type);
  if (filters.term !== 'all') list = list.filter((r) => r.term === filters.term);

  const term = filters.q.trim().toLowerCase();
  if (term) {
    list = list.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.subject.toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term)
    );
  }

  if (filters.sort === 'recent') {
    list = [...list].sort((a, b) => (b.year || 0) - (a.year || 0));
  } else if (filters.sort === 'title') {
    list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  }

  return list;
}

function viewLibrary() {
  const filters = libraryFilters();
  const matches = applyLibraryFilters(filters);

  const types = [...new Set(Data.resources.map((r) => r.type))].sort();
  const terms = [...new Set(Data.resources.map((r) => r.term).filter(Boolean))].sort();
  const subjectOptions = filters.cls === 'all'
    ? Data.subjects
    : Object.keys(Data.classSubjects[filters.cls] || {}).sort();

  const pageSize = 24;
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const page = Math.min(filters.page, pages);
  const visible = matches.slice((page - 1) * pageSize, page * pageSize);

  const option = (value, label, selected) =>
    `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;

  const cards = visible
    .map(
      (r) => `
      <article class="resource-card" data-resource="${escapeHtml(r.id)}">
        <div class="rc-top">
          <span class="rc-file">${escapeHtml(r.type)}</span>
          ${r.term ? `<span class="chip chip-neutral">${escapeHtml(r.term)}</span>` : ''}
          <span class="chip chip-neutral">${escapeHtml(r.class.toUpperCase())}</span>
        </div>
        <h3>${escapeHtml(r.title)}</h3>
        <span class="rc-sub">${escapeHtml(r.subject)}</span>
        <div class="rc-foot">
          <button class="btn-ghost" data-bookmark="${escapeHtml(r.id)}" title="Save bookmark">
            ${icon('bookmark')}<span class="sr-only">Bookmark</span>
          </button>
          <span class="rc-sub" style="margin-left:auto">${r.price ? `UGX ${formatCount(r.price)}` : 'Free'}</span>
        </div>
      </article>`
    )
    .join('');

  return `
    <div class="page-head">
      <h1>Library</h1>
      <p>Browse every approved resource. Use the filters to narrow down by class, subject, type and term.</p>
    </div>

    <div class="card-elev filter-bar">
      <div class="field" style="grid-column:1/-1">
        <div class="search-wrap" style="position:relative">
          <span style="position:absolute;left:.75rem;top:50%;transform:translateY(-50%);width:1rem;height:1rem;color:hsl(var(--muted-foreground));pointer-events:none">${icon('search')}</span>
          <input class="input" id="lib-search" style="padding-left:2.3rem" type="search"
                 placeholder="Search resources, subjects, terms…" value="${escapeHtml(filters.q)}" />
        </div>
      </div>
      <select class="select" id="filter-class" aria-label="Filter by class">
        ${option('all', 'All classes', filters.cls)}
        ${Data.classes.map((c) => option(c.id, `${c.short} — ${c.label}`, filters.cls)).join('')}
      </select>
      <select class="select" id="filter-subject" aria-label="Filter by subject">
        ${option('all', 'All subjects', filters.subject)}
        ${subjectOptions.map((s) => option(s, s, filters.subject)).join('')}
      </select>
      <select class="select" id="filter-type" aria-label="Filter by type">
        ${option('all', 'All types', filters.type)}
        ${types.map((t) => option(t, t, filters.type)).join('')}
      </select>
      <select class="select" id="filter-term" aria-label="Filter by term">
        ${option('all', 'Any term', filters.term)}
        ${terms.map((t) => option(t, t, filters.term)).join('')}
      </select>
    </div>

    <div class="result-row">
      <span>${formatCount(matches.length)} result${matches.length === 1 ? '' : 's'}</span>
      <div class="sort-group" role="group" aria-label="Sort results">
        ${[
          ['relevance', 'Relevance'],
          ['recent', 'Recent'],
          ['title', 'Title'],
        ]
          .map(
            ([key, label]) =>
              `<button data-sort="${key}" class="${filters.sort === key ? 'is-active' : ''}">${label}</button>`
          )
          .join('')}
      </div>
    </div>

    ${
      visible.length
        ? `<div class="resource-grid">${cards}</div>`
        : `<div class="empty-state" style="margin-top:1rem">
             <div class="empty-icon">${icon('inbox')}</div>
             <h3>No resources match these filters</h3>
             <p>Try removing a filter or searching for a different keyword.</p>
           </div>`
    }

    ${
      pages > 1
        ? `<div class="load-more">
             <button class="btn-secondary" data-page="${page - 1}"${page <= 1 ? ' disabled' : ''}>Previous</button>
             <span class="muted" style="padding:0 .75rem;align-self:center;font-size:.8125rem">Page ${page} of ${pages}</span>
             <button class="btn-secondary" data-page="${page + 1}"${page >= pages ? ' disabled' : ''}>Next</button>
           </div>`
        : ''
    }`;
}

/* ============================================================
   VIEWS — CLASS DETAIL
   ============================================================ */

function viewClass({ classId }) {
  const cls = classById(classId);
  if (!cls) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon('inbox')}</div>
        <h3>Class not found</h3>
        <p>We could not find that class in the library.</p>
        <a class="btn-primary" href="#/" data-link>Back to dashboard</a>
      </div>`;
  }

  const counts = Data.classSubjects[classId] || {};
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;

  return `
    <a class="back-link" href="#/" data-link>${icon('arrowLeft')} Back to dashboard</a>
    <div class="page-head">
      <p class="kicker">${escapeHtml(cls.short)} · ${escapeHtml(cls.tagline)}</p>
      <h1>${escapeHtml(cls.label)} subject map</h1>
      <p>${formatCount(cls.count)} approved resources across ${entries.length} subjects. Pick a subject to open its notes, papers and study resources.</p>
    </div>

    <div class="stat-grid" style="margin-bottom:1.5rem">
      <div class="stat-tile"><b>${formatCount(cls.count)}</b><span>Resources</span></div>
      <div class="stat-tile"><b>${entries.length}</b><span>Subjects</span></div>
      <div class="stat-tile"><b>${entries.filter(([, n]) => n > 50).length}</b><span>Large shelves</span></div>
      <div class="stat-tile"><b>${cls.short}</b><span>Class</span></div>
    </div>

    <div class="subject-grid">
      ${entries
        .map(
          ([subject, count]) => `
        <a class="subject-card" href="#/library?class=${cls.id}&subject=${encodeURIComponent(subject)}" data-link>
          <b>${escapeHtml(subject)}</b>
          <small>${formatCount(count)} resources</small>
          <div class="cc-bar" style="margin-top:.5rem"><i style="width:${Math.round((count / max) * 100)}%"></i></div>
        </a>`
        )
        .join('')}
    </div>`;
}

/* ============================================================
   VIEWS — DISCUSSIONS (BLOG)
   ============================================================ */

const POST_CATEGORIES = [
  {
    id: 'discussion',
    label: 'Discussion',
    chip: 'chip-blue',
    color: 'hsl(215 70% 52%)',
    icon: 'chat',
    desc: 'Start a conversation about a topic or study method.',
  },
  {
    id: 'question',
    label: 'Question',
    chip: 'chip-amber',
    color: 'hsl(30 80% 48%)',
    icon: 'question',
    desc: 'Ask for help — someone in the library has probably faced this before.',
  },
  {
    id: 'announcement',
    label: 'Announcement',
    chip: 'chip-emerald',
    color: 'hsl(152 60% 40%)',
    icon: 'megaphone',
    desc: 'Share news with your class — reminders, new resources, events.',
  },
  {
    id: 'resource',
    label: 'Resource pick',
    chip: 'chip-violet',
    color: 'hsl(262 60% 50%)',
    icon: 'bookmark',
    desc: 'Recommend a paper, note or technique that helped you.',
  },
];

const categoryById = (id) => POST_CATEGORIES.find((c) => c.id === id) || POST_CATEGORIES[0];

function viewBlog() {
  const { query } = parseHash();
  const activeCategory = query.get('category') || 'all';
  const term = (query.get('q') || '').toLowerCase();
  const scope = query.get('scope') || 'all';

  const all = Blog.list().map(decoratePost);
  const counts = { all: all.length };
  all.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  let list = all;
  if (activeCategory !== 'all') list = list.filter((p) => p.category === activeCategory);
  if (term) {
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.body.toLowerCase().includes(term) ||
        p.author_name.toLowerCase().includes(term) ||
        (p.subject || '').toLowerCase().includes(term) ||
        p.tags.some((t) => t.toLowerCase().includes(term))
    );
  }

  const p = profile();
  const filters = [
    { id: 'all', label: 'All posts', icon: 'chat', chip: 'chip-neutral' },
    ...POST_CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon, chip: c.chip })),
  ];

  const cards = list
    .map((post) => {
      const cat = categoryById(post.category);
      return `
      <article class="card-elev post-card">
        <div class="post-card-head">
          <div class="post-avatar">${escapeHtml(post.author_name.slice(0, 2).toUpperCase())}</div>
          <div style="flex:1;min-width:0">
            <div class="post-meta-row">
              <span class="chip ${cat.chip}">${icon(cat.icon)} ${escapeHtml(post.category)}</span>
              ${post.subject ? `<span class="chip chip-neutral">${escapeHtml(post.subject)}</span>` : ''}
              ${post.class_level ? `<span class="chip chip-neutral">${escapeHtml(post.class_level.toUpperCase())}</span>` : ''}
              <span class="ts">${escapeHtml(relativeTime(post.created_at))}</span>
            </div>
            <a href="#/blog/${encodeURIComponent(post.id)}" data-link>
              <h3 class="post-title">${escapeHtml(post.title)}</h3>
            </a>
            <p class="post-excerpt">${escapeHtml(post.body)}</p>
            ${
              post.tags.length
                ? `<div class="post-tags">${post.tags.map((t) => `<span>#${escapeHtml(t)}</span>`).join('')}</div>`
                : ''
            }
            <div class="post-foot">
              <span class="author">${escapeHtml(post.author_name)}</span>
              <span>·</span>
              <button data-like="${escapeHtml(post.id)}" class="${post.liked_by_me ? 'is-liked' : ''}">
                ${icon('heart')}<span class="count">${post.likes_count}</span>
              </button>
              <a href="#/blog/${encodeURIComponent(post.id)}" data-link style="display:inline-flex;align-items:center;gap:.25rem">
                ${icon('comment')}<span class="count">${post.comments_count}</span>
              </a>
            </div>
          </div>
        </div>
      </article>`;
    })
    .join('');

  return `
    <div class="blog-hero">
      <div class="blog-hero-inner">
        <div>
          <span class="chip chip-neutral" style="background:hsl(var(--card));border-color:hsl(var(--border))">
            ${icon('sparkle')} Discussions
          </span>
          <h1>Study together.</h1>
          <p>Ask questions, share study tips, recommend resources, and post announcements for your class. Posts are public and stay tied to your study space.</p>
        </div>
        <a class="btn-primary" href="#/blog/new" data-link style="align-self:flex-start">${icon('plus')} New post</a>
      </div>
    </div>

    <div class="card-elev blog-toolbar" style="margin-top:1rem">
      <div class="search-wrap">
        ${icon('search')}
        <input class="input" id="blog-search" type="search" placeholder="Search posts, subjects, tags…" value="${escapeHtml(query.get('q') || '')}" />
      </div>
      <div class="blog-filters">
        ${filters
          .map(
            (f) => `
          <button class="chip-filter ${activeCategory === f.id ? 'is-active' : ''}" data-category="${f.id}">
            ${icon(f.icon)} ${escapeHtml(f.label)}
            <span class="count">${counts[f.id] || 0}</span>
          </button>`
          )
          .join('')}
      </div>
    </div>

    ${
      list.length
        ? `<div class="post-list" style="margin-top:1rem">${cards}</div>`
        : `<div class="empty-state" style="margin-top:1rem">
             <div class="empty-icon">${icon('chat')}</div>
             <h3>${all.length === 0 ? 'No posts yet — be the first' : 'Nothing matches your filter'}</h3>
             <p>${
               all.length === 0
                 ? 'Start a discussion, ask a question, or share a resource with the BCK community.'
                 : 'Try a different filter or search query.'
             }</p>
             ${
               all.length === 0
                 ? `<a class="btn-primary" href="#/blog/new" data-link>${icon('plus')} Create the first post</a>`
                 : ''
             }
           </div>`
    }

    <div class="tip-inline" style="margin-top:1rem">
      ${icon('lightbulb')}
      <span><strong>Tip:</strong> set a display name in your <a href="#/profile" data-link style="color:hsl(var(--primary));font-weight:600">profile</a> so others can recognise your posts.</span>
    </div>`;
}

/* ============================================================
   VIEWS — NEW POST
   ============================================================ */

const STARTERS = [
  'What study method works best for you during holidays?',
  'How do you stay focused when revising for UCE?',
  'Share your favourite past paper strategy.',
  'Which subject should everyone revise before the mock exams?',
];

function viewNewPost() {
  const p = profile();
  const classOptions = ['', ...Data.classes.map((c) => c.short)];

  return `
    <a class="back-link" href="#/blog" data-link>${icon('arrowLeft')} Back</a>

    <div class="page-head" style="margin-bottom:1.25rem">
      <span class="chip chip-neutral">${icon('sparkle')} New post</span>
      <h1 style="margin-top:.5rem">Share with the library.</h1>
      <p>Ask a question, recommend a resource, or start a discussion. Posts are public and remain tied to your study space.</p>
    </div>

    <form class="post-form" id="post-form">
      <div class="card-elev post-form-card">
        <h2>1. Choose a category</h2>
        <div class="cat-grid" id="cat-grid">
          ${POST_CATEGORIES.map(
            (c, i) => `
            <button type="button" class="cat-option ${i === 0 ? 'is-active' : ''}" data-cat="${c.id}">
              <span class="cat-icon" style="background:${c.color}">${icon(c.icon)}</span>
              <b>${escapeHtml(c.label)}</b>
            </button>`
          ).join('')}
        </div>
        <p class="cat-desc" id="cat-desc">${escapeHtml(POST_CATEGORIES[0].desc)}</p>
      </div>

      <div class="card-elev post-form-card">
        <h2>2. Write your post</h2>
        <div class="field" style="margin-bottom:1rem">
          <label for="post-title">Title</label>
          <input class="input" id="post-title" maxlength="140" required
                 placeholder="e.g. How do I factorise quadratics quickly?" />
          <div class="form-row"><span class="char-count" id="title-count">0/140</span></div>
        </div>
        <div class="field">
          <label for="post-body">Body</label>
          <textarea class="textarea" id="post-body" maxlength="4000" required
            placeholder="Share your thoughts, question, or recommendation. Plain text works great."></textarea>
        </div>
        <div style="margin-top:1rem">
          <p style="font-size:.8125rem;margin-bottom:.5rem">${icon('lightbulb')} Need a starter?</p>
          <div class="starter-chips">
            ${STARTERS.map((s) => `<button type="button" data-starter="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
          </div>
        </div>
      </div>

      <div class="card-elev post-form-card">
        <h2>3. Add your details</h2>
        <div class="form-grid">
          <div class="field">
            <label for="post-name">Your display name</label>
            <input class="input" id="post-name" value="${escapeHtml(p.name)}" maxlength="40" />
          </div>
          <div class="field">
            <label for="post-class">Class</label>
            <select class="select" id="post-class">
              <option value="">No specific class</option>
              ${classOptions
                .filter(Boolean)
                .map((c) => `<option value="${c}"${p.classLevel === c ? ' selected' : ''}>${c}</option>`)
                .join('')}
            </select>
          </div>
          <div class="field">
            <label for="post-subject">Subject</label>
            <select class="select" id="post-subject">
              <option value="">Any subject</option>
              ${Data.subjects.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="post-tags">Tags (comma-separated, max 6)</label>
            <input class="input" id="post-tags" placeholder="e.g. uce, revision, biology" />
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-ghost" id="post-cancel">Cancel</button>
        <button type="submit" class="btn-primary">${icon('send')} Publish post</button>
      </div>
    </form>`;
}

/* ============================================================
   VIEWS — POST DETAIL
   ============================================================ */

function viewPostDetail({ id }) {
  const post = Blog.get(id);
  if (!post) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon('inbox')}</div>
        <h3>Post not found</h3>
        <p>This post may have been removed by its author.</p>
        <a class="btn-primary" href="#/blog" data-link>Back to discussions</a>
      </div>`;
  }

  const decorated = decoratePost(post);
  const cat = categoryById(post.category);
  const comments = Blog.listComments(post.id);
  const isMine = post.author_name === profile().name;

  return `
    <div class="post-detail">
      <a class="back-link" href="#/blog" data-link>${icon('arrowLeft')} Back</a>

      <article class="card-elev post-detail-card">
        <div class="post-meta-row">
          <span class="chip ${cat.chip}">${icon(cat.icon)} ${escapeHtml(post.category)}</span>
          ${post.subject ? `<span class="chip chip-neutral">${escapeHtml(post.subject)}</span>` : ''}
          ${post.class_level ? `<span class="chip chip-neutral">${escapeHtml(post.class_level.toUpperCase())}</span>` : ''}
          <span class="ts">${escapeHtml(relativeTime(post.created_at))}</span>
        </div>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="post-excerpt" style="margin-top:.5rem;font-size:.8125rem">
          by <strong style="color:hsl(var(--foreground))">${escapeHtml(post.author_name)}</strong>
        </p>
        <div class="post-body">${escapeHtml(post.body)}</div>
        ${
          post.tags.length
            ? `<div class="post-tags">${post.tags.map((t) => `<span>#${escapeHtml(t)}</span>`).join('')}</div>`
            : ''
        }
        <div class="post-foot" style="margin-top:1.25rem;padding-top:1rem;border-top:1px solid hsl(var(--border))">
          <button data-like="${escapeHtml(post.id)}" class="${decorated.liked_by_me ? 'is-liked' : ''}">
            ${icon('heart')}<span class="count">${decorated.likes_count}</span> likes
          </button>
          <span>${icon('comment')}<span class="count">${decorated.comments_count}</span> comments</span>
          ${
            isMine
              ? `<button data-delete-post="${escapeHtml(post.id)}" style="margin-left:auto;color:hsl(var(--destructive))">
                   ${icon('trash')} Delete
                 </button>`
              : ''
          }
        </div>
      </article>

      <div class="card-elev" style="padding:1.25rem;margin-top:1rem">
        <h2 class="section-title">Comments</h2>
        ${
          comments.length
            ? `<div class="comment-list">
                ${comments
                  .map(
                    (c) => `
                  <div class="comment">
                    <div class="comment-head">
                      <b>${escapeHtml(c.author_name)}</b>
                      <small>${escapeHtml(relativeTime(c.created_at))}</small>
                    </div>
                    <p>${escapeHtml(c.body)}</p>
                  </div>`
                  )
                  .join('')}
               </div>`
            : '<p class="muted" style="font-size:.875rem;margin-top:.75rem">No comments yet. Start the conversation.</p>'
        }
        <form class="comment-form" id="comment-form">
          <input class="input" id="comment-body" placeholder="Add a comment…" maxlength="800" required />
          <button class="btn-primary" type="submit">${icon('send')} Post</button>
        </form>
      </div>
    </div>`;
}

/* ============================================================
   VIEWS — BOOKMARKS / HISTORY
   ============================================================ */

function resourceRows(list, emptyTitle, emptyBody) {
  if (!list.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon('bookmark')}</div>
        <h3>${escapeHtml(emptyTitle)}</h3>
        <p>${escapeHtml(emptyBody)}</p>
        <a class="btn-primary" href="#/library" data-link>Browse the library</a>
      </div>`;
  }

  return `
    <div class="list-rows">
      ${list
        .map(
          (r) => `
        <div class="list-row">
          <div class="lr-main">
            <b>${escapeHtml(r.title)}</b>
            <small>${escapeHtml(r.subject)} · ${escapeHtml(r.class.toUpperCase())} · ${escapeHtml(r.type)}</small>
          </div>
          <button class="btn-ghost" data-remove-bookmark="${escapeHtml(r.id)}" title="Remove bookmark">${icon('trash')}</button>
          <button class="btn-secondary" data-resource="${escapeHtml(r.id)}">Open</button>
        </div>`
        )
        .join('')}
    </div>`;
}

function viewBookmarks() {
  const list = Bookmarks.list();
  return `
    <div class="page-head">
      <h1>Bookmarks</h1>
      <p>${list.length} saved resource${list.length === 1 ? '' : 's'}. Saved on this device — no account needed.</p>
    </div>
    ${resourceRows(list, 'No bookmarks yet', 'Tap the bookmark icon on any resource to save it here for later.')}`;
}

function viewHistory() {
  const list = History.list();
  return `
    <div class="page-head" style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap">
      <div>
        <h1>Recently viewed</h1>
        <p>${list.length} resource${list.length === 1 ? '' : 's'} opened on this device.</p>
      </div>
      ${list.length ? `<button class="btn-secondary" id="clear-history">${icon('trash')} Clear history</button>` : ''}
    </div>
    ${
      list.length
        ? `<div class="list-rows">
            ${list
              .map(
                (r) => `
              <div class="list-row">
                <div class="lr-main">
                  <b>${escapeHtml(r.title)}</b>
                  <small>${escapeHtml(r.subject)} · ${escapeHtml(r.class.toUpperCase())} · viewed ${escapeHtml(relativeTime(r.viewed_at))}</small>
                </div>
                <button class="btn-secondary" data-resource="${escapeHtml(r.id)}">Open</button>
              </div>`
              )
              .join('')}
           </div>`
        : `<div class="empty-state">
             <div class="empty-icon">${icon('clock')}</div>
             <h3>Nothing viewed yet</h3>
             <p>Resources you open in the library show up here so you can pick up where you left off.</p>
             <a class="btn-primary" href="#/library" data-link>Browse the library</a>
           </div>`
    }`;
}

/* ============================================================
   VIEWS — STUDY SPACE
   ============================================================ */

function viewStudySpace() {
  const study = Study.get();
  const p = profile();

  if (!study) {
    return `
      <div class="page-head">
        <h1>Study Space</h1>
        <p>Choose a class and the subjects you are working on. The library remembers your setup and keeps things focused.</p>
      </div>
      <form class="card-elev form-card" id="study-setup">
        <div class="field" style="margin-bottom:1rem">
          <label for="study-class">Your class</label>
          <select class="select" id="study-class" required>
            <option value="">Choose a class…</option>
            ${Data.classes.map((c) => `<option value="${c.id}">${c.short} — ${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="margin-bottom:1.25rem">
          <label>Subjects</label>
          <div class="check-grid" id="study-subjects"></div>
        </div>
        <div style="display:flex;gap:.6rem;flex-wrap:wrap">
          <button class="btn-primary" type="submit">${icon('check')} Save study space</button>
          <a class="btn-secondary" href="#/library" data-link>Browse all resources</a>
        </div>
      </form>`;
  }

  const cls = classById(study.class);
  const entries = Object.entries(Data.classSubjects[study.class] || {});
  const filtered = study.subjects.length
    ? entries.filter(([s]) => study.subjects.includes(s))
    : entries;
  const total = filtered.reduce((sum, [, n]) => sum + n, 0);

  return `
    <div class="page-head" style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap">
      <div>
        <p class="kicker">${icon('sparkle')} Your focused shelf</p>
        <h1 style="margin-top:.35rem">${escapeHtml(cls ? cls.short : study.class)} study space</h1>
        <p>${study.subjects.length} subject${study.subjects.length === 1 ? '' : 's'} · ${formatCount(total)} resources in focus.</p>
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <a class="btn-primary" href="#/library?class=${escapeHtml(study.class)}" data-link>Open my shelf</a>
        <button class="btn-secondary" id="study-reset">Reset</button>
      </div>
    </div>

    <div class="subject-grid">
      ${
        filtered.length
          ? filtered
              .sort((a, b) => b[1] - a[1])
              .map(
                ([subject, count]) => `
          <a class="subject-card" href="#/library?class=${escapeHtml(study.class)}&subject=${encodeURIComponent(subject)}" data-link>
            <b>${escapeHtml(subject)}</b>
            <small>${formatCount(count)} resources</small>
          </a>`
              )
              .join('')
          : '<div class="empty-state"><h3>No subjects selected</h3><p>Reset and pick the subjects you are revising.</p></div>'
      }
    </div>`;
}

/* ============================================================
   VIEWS — AI STUDY BUDDY
   ============================================================ */

function viewAssistant() {
  return `
    <div class="page-head">
      <h1>Study Buddy</h1>
      <p>A small, on-device helper that answers from the library contents. No account, no data leaves this page.</p>
    </div>

    <div class="card-elev" style="padding:1.5rem;max-width:44rem">
      <div class="field" style="margin-bottom:1rem">
        <label for="buddy-input">Ask a question</label>
        <textarea class="textarea" id="buddy-input" style="min-height:6rem"
          placeholder="e.g. Give me a 7-day revision plan for UCE Mathematics"></textarea>
      </div>
      <div style="display:flex;gap:.6rem;flex-wrap:wrap">
        <button class="btn-primary" id="buddy-send">${icon('sparkle')} Ask the buddy</button>
        <button class="btn-secondary" data-buddy-suggestion="past papers">Find past papers</button>
        <button class="btn-secondary" data-buddy-suggestion="revision plan">Build a revision plan</button>
      </div>
      <div id="buddy-answer" style="margin-top:1.25rem"></div>
    </div>

    <div class="card-elev" style="padding:1.25rem;max-width:44rem;margin-top:1rem">
      <h2 class="section-title" style="margin-bottom:.75rem">Try one of these</h2>
      <div class="starter-chips">
        ${[
          'What subjects have the most past papers?',
          'Show me S6 Mathematics resources',
          'How many UCE mock papers are there?',
          'Which subject should I revise first for UACE?',
        ]
          .map((q) => `<button type="button" data-buddy-suggestion="${escapeHtml(q)}">${escapeHtml(q)}</button>`)
          .join('')}
      </div>
    </div>`;
}

/** A tiny keyword-driven assistant over the local catalogue. */
function buddyAnswer(question) {
  const q = question.toLowerCase();
  const results = [];

  if (/revision plan|timetable|study plan|7-day|week/.test(q)) {
    const cls = (q.match(/\bs([1-6])\b/) || [])[1];
    const pool = cls
      ? Data.resources.filter((r) => r.class === `s${cls}`)
      : Data.resources;
    const bySubject = new Map();
    pool.forEach((r) => bySubject.set(r.subject, (bySubject.get(r.subject) || 0) + 1));
    const top = [...bySubject.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    results.push(
      `<p>Here is a focused plan based on what the library actually holds${cls ? ` for S${cls}` : ''}:</p>
       <ol style="margin:.6rem 0 0;padding-left:1.1rem;list-style:decimal;font-size:.875rem;line-height:1.8">
         ${top
           .map(
             ([subject, count], i) =>
               `<li><strong>Days ${i * 2 + 1}–${i * 2 + 2}:</strong> ${escapeHtml(subject)} — ${formatCount(count)} resources available. Start with past papers, then layer on lesson notes.</li>`
           )
           .join('')}
       </ol>
       <p style="margin-top:.6rem;font-size:.8125rem;color:hsl(var(--muted-foreground))">
         Aim for one past paper per session under timed conditions, then mark it and note the weak topic.
       </p>`
    );
  }

  if (/paper|past paper|mock|uce|uace|uneb/.test(q)) {
    const cls = (q.match(/\bs([1-6])\b/) || [])[1];
    const term = /uce/.test(q) ? 'UCE' : /uace/.test(q) ? 'UACE' : /uneb/.test(q) ? 'UNEB' : null;
    let pool = Data.resources.filter((r) => r.type === 'Past Papers');
    if (cls) pool = pool.filter((r) => r.class === `s${cls}`);
    if (term) pool = pool.filter((r) => r.term === term);
    const sample = pool.slice(0, 6);
    results.push(
      `<p>Found <strong>${formatCount(pool.length)}</strong> past paper${pool.length === 1 ? '' : 's'}${term ? ` tagged ${term}` : ''}${cls ? ` for S${cls}` : ''}. Here are a few:</p>
       <ul style="margin:.6rem 0 0;padding-left:1.1rem;list-style:disc;font-size:.875rem;line-height:1.8">
         ${sample.map((r) => `<li>${escapeHtml(r.title)} — ${escapeHtml(r.subject)}</li>`).join('')}
       </ul>`
    );
  }

  if (/subject|revise|revision|first/.test(q)) {
    const bySubject = new Map();
    Data.resources.forEach((r) => bySubject.set(r.subject, (bySubject.get(r.subject) || 0) + 1));
    const top = [...bySubject.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    results.push(
      `<p>The library is deepest in these subjects:</p>
       <ul style="margin:.6rem 0 0;padding-left:1.1rem;list-style:disc;font-size:.875rem;line-height:1.8">
         ${top.map(([s, n]) => `<li>${escapeHtml(s)} — ${formatCount(n)} resources</li>`).join('')}
       </ul>`
    );
  }

  if (!results.length) {
    const terms = [...new Set(Data.resources.map((r) => r.title.split(/\s+/)[0]))].slice(0, 8);
    results.push(
      `<p>I can help with past papers, revision plans, and subject counts. The library holds ${formatCount(Data.resources.length)} resources across ${Data.subjects.length} subjects.</p>
       <p style="margin-top:.5rem;font-size:.8125rem;color:hsl(var(--muted-foreground))">Try asking about “past papers for S4”, “UCE mock papers”, or “build a revision plan”.</p>`
    );
    void terms;
  }

  return results.join('<hr style="margin:1rem 0;border-color:hsl(var(--border))">');
}

/* ============================================================
   VIEWS — PROFILE & SETTINGS
   ============================================================ */

function viewProfile() {
  const p = profile();
  const theme = document.documentElement.dataset.theme || 'light';

  return `
    <div class="page-head">
      <h1>Profile &amp; Settings</h1>
      <p>Everything here is stored on this device only. No account, no server, no tracking.</p>
    </div>

    <div class="card-elev form-card">
      <h2 class="section-title" style="margin-bottom:1rem">Your details</h2>
      <div class="field" style="margin-bottom:1rem">
        <label for="profile-name">Display name</label>
        <input class="input" id="profile-name" value="${escapeHtml(p.name)}" maxlength="40" />
        <small class="muted" style="font-size:.75rem">Shown on your posts in Discussions.</small>
      </div>
      <div class="field" style="margin-bottom:1rem">
        <label for="profile-class">Your class</label>
        <select class="select" id="profile-class">
          <option value="">No specific class</option>
          ${Data.classes.map((c) => `<option value="${c.short}"${p.classLevel === c.short ? ' selected' : ''}>${c.short} — ${c.label}</option>`).join('')}
        </select>
      </div>
      <div class="field" style="margin-bottom:1.25rem">
        <label for="profile-subjects">Subjects you are revising</label>
        <div class="check-grid" id="profile-subjects">
          ${Data.subjects
            .map(
              (s) => `
            <label class="check-item ${p.subjects.includes(s) ? 'is-checked' : ''}">
              <input type="checkbox" value="${escapeHtml(s)}"${p.subjects.includes(s) ? ' checked' : ''} />
              <span>${escapeHtml(s)}</span>
            </label>`
            )
            .join('')}
        </div>
      </div>
      <button class="btn-primary" id="profile-save">${icon('check')} Save profile</button>
    </div>

    <div class="card-elev form-card" style="margin-top:1rem">
      <h2 class="section-title" style="margin-bottom:.5rem">Appearance</h2>
      <div class="setting-row">
        <div>
          <b>Dark theme</b>
          <small>Switch between light and dark for your study session.</small>
        </div>
        <label class="switch">
          <input type="checkbox" id="theme-switch"${theme === 'dark' ? ' checked' : ''} />
          <i></i>
        </label>
      </div>
    </div>

    <div class="card-elev form-card" style="margin-top:1rem">
      <h2 class="section-title" style="margin-bottom:.5rem">Your library data</h2>
      <div class="setting-row">
        <div>
          <b>Bookmarks</b>
          <small>${Bookmarks.list().length} saved resource${Bookmarks.list().length === 1 ? '' : 's'}.</small>
        </div>
        <a class="btn-secondary" href="#/bookmarks" data-link>Open</a>
      </div>
      <div class="setting-row">
        <div>
          <b>Recently viewed</b>
          <small>${History.list().length} resource${History.list().length === 1 ? '' : 's'} in history.</small>
        </div>
        <a class="btn-secondary" href="#/history" data-link>Open</a>
      </div>
      <div class="setting-row">
        <div>
          <b>Discussion posts</b>
          <small>${Blog.list().length} post${Blog.list().length === 1 ? '' : 's'} authored on this device.</small>
        </div>
        <a class="btn-secondary" href="#/blog" data-link>Open</a>
      </div>
      <div class="setting-row">
        <div>
          <b>Clear all local data</b>
          <small>Removes bookmarks, history, posts and settings from this device. This cannot be undone.</small>
        </div>
        <button class="btn-secondary" id="clear-data" style="color:hsl(var(--destructive))">Clear all local data</button>
      </div>
    </div>`;
}

/* ============================================================
   EVENT WIRING
   ============================================================ */

function openResource(id) {
  const resource = resourceById(id);
  if (!resource) {
    showToast('Resource not found.');
    return;
  }
  History.push(resource);
  $('#reader-title').textContent = resource.title;
  $('#reader-meta').textContent = `${resource.subject} · ${resource.class.toUpperCase()} · ${resource.type}`;
  $('#reader-desc').textContent = resource.description || 'No description provided.';
  const open = $('#reader-open');
  open.href = resource.url;
  open.dataset.resourceId = resource.id;
  const bookmarkBtn = $('#reader-bookmark');
  bookmarkBtn.textContent = Bookmarks.has(resource.id) ? 'Remove bookmark' : 'Save bookmark';
  openModal('reader-modal');
}

function wireEvents() {
  /* hash links */
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-link]');
    if (link) {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#/')) {
        event.preventDefault();
        closeSidebar();
        navigate(href.slice(1));
      }
    }
  });

  /* global delegated actions */
  document.addEventListener('click', (event) => {
    const target = event.target;

    const closeBtn = target.closest('[data-close-modal]');
    if (closeBtn) {
      closeModal(closeBtn.dataset.closeModal);
      return;
    }

    if (target.closest('.modal') && !target.closest('.modal-card')) {
      closeModal(target.closest('.modal').id);
      return;
    }

    const resourceEl = target.closest('[data-resource]');
    if (resourceEl) {
      openResource(resourceEl.dataset.resource);
      return;
    }

    /* bookmark toggle from inside the reader modal */
    if (target.closest('#reader-bookmark')) {
      const id = $('#reader-open').dataset.resourceId;
      const resource = id ? resourceById(id) : null;
      if (resource) {
        const saved = Bookmarks.toggle(resource);
        $('#reader-bookmark').textContent = saved ? 'Remove bookmark' : 'Save bookmark';
        showToast(saved ? 'Saved to bookmarks.' : 'Removed from bookmarks.');
      }
      return;
    }

    const bookmarkEl = target.closest('[data-bookmark]');
    if (bookmarkEl) {
      const resource = resourceById(bookmarkEl.dataset.bookmark);
      if (resource) {
        const saved = Bookmarks.toggle(resource);
        showToast(saved ? 'Saved to bookmarks.' : 'Removed from bookmarks.');
        rerenderIfLibrary();
      }
      return;
    }

    const removeBookmark = target.closest('[data-remove-bookmark]');
    if (removeBookmark) {
      Bookmarks.remove(removeBookmark.dataset.removeBookmark);
      showToast('Bookmark removed.');
      handleRoute();
      return;
    }

    const likeEl = target.closest('[data-like]');
    if (likeEl) {
      const updated = Blog.toggleLike(likeEl.dataset.like);
      if (updated) {
        renderRoutePreservingScroll();
      } else {
        showToast('Could not update like.');
      }
      return;
    }

    const deletePost = target.closest('[data-delete-post]');
    if (deletePost) {
      if (window.confirm('Delete this post permanently?')) {
        Blog.remove(deletePost.dataset.deletePost);
        showToast('Post deleted.');
        navigate('/blog');
      }
      return;
    }

    const categoryBtn = target.closest('[data-category]');
    if (categoryBtn) {
      const { query } = parseHash();
      const next = new URLSearchParams(query);
      if (categoryBtn.dataset.category === 'all') next.delete('category');
      else next.set('category', categoryBtn.dataset.category);
      const qs = next.toString();
      navigate(`/blog${qs ? `?${qs}` : ''}`);
      return;
    }

    const sortBtn = target.closest('[data-sort]');
    if (sortBtn) {
      const { query } = parseHash();
      const next = new URLSearchParams(query);
      next.set('sort', sortBtn.dataset.sort);
      navigate(`/library?${next.toString()}`);
      return;
    }

    const pageBtn = target.closest('[data-page]');
    if (pageBtn) {
      const { query } = parseHash();
      const next = new URLSearchParams(query);
      next.set('page', pageBtn.dataset.page);
      navigate(`/library?${next.toString()}`);
      return;
    }

    const starter = target.closest('[data-starter]');
    if (starter) {
      const title = $('#post-title');
      const body = $('#post-body');
      if (title && !title.value) title.value = starter.dataset.starter;
      else if (body) body.value = starter.dataset.starter;
      return;
    }

    const catOption = target.closest('[data-cat]');
    if (catOption) {
      $$('#cat-grid .cat-option').forEach((el) => el.classList.toggle('is-active', el === catOption));
      const meta = categoryById(catOption.dataset.cat);
      const desc = $('#cat-desc');
      if (desc) desc.textContent = meta.desc;
      return;
    }

    const suggestion = target.closest('[data-buddy-suggestion]');
    if (suggestion) {
      const input = $('#buddy-input');
      const suggestionText = suggestion.dataset.buddySuggestion;
      if (suggestionText === 'past papers' || suggestionText === 'revision plan') {
        input.value = suggestionText === 'past papers'
          ? 'Show me UCE mock papers'
          : 'Give me a 7-day revision plan';
      } else {
        input.value = suggestionText;
      }
      $('#buddy-answer').innerHTML = `<div class="card-elev" style="padding:1rem;font-size:.875rem;line-height:1.7">${buddyAnswer(input.value)}</div>`;
      return;
    }

    if (target.closest('#buddy-send')) {
      const input = $('#buddy-input');
      const question = input.value.trim();
      if (!question) {
        showToast('Ask a question first.');
        return;
      }
      $('#buddy-answer').innerHTML = `<div class="card-elev" style="padding:1rem;font-size:.875rem;line-height:1.7">${buddyAnswer(question)}</div>`;
      return;
    }

    if (target.closest('#post-cancel')) {
      navigate('/blog');
      return;
    }

    if (target.closest('#clear-history')) {
      History.clear();
      showToast('History cleared.');
      handleRoute();
      return;
    }

    if (target.closest('#clear-data')) {
      if (window.confirm('Clear all bookmarks, history, posts and settings on this device?')) {
        Object.values(KEY).forEach((key) => localStorage.removeItem(key));
        showToast('Local data cleared.');
        setTheme('light');
        handleRoute();
      }
      return;
    }

    if (target.closest('#study-reset')) {
      Study.clear();
      showToast('Study space reset.');
      handleRoute();
      return;
    }

    if (target.closest('#profile-save')) {
      const name = $('#profile-name').value.trim() || 'BCK Learner';
      const classLevel = $('#profile-class').value;
      const subjects = $$('#profile-subjects input:checked').map((el) => el.value);
      saveProfile({ name, classLevel, subjects });
      showToast('Profile saved.');
      refreshTopbar();
      handleRoute();
      return;
    }
  });

  /* theme */
  document.addEventListener('change', (event) => {
    if (event.target.id === 'theme-switch') {
      setTheme(event.target.checked ? 'dark' : 'light');
    }
  });
  $('#theme-toggle').addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  /* global search */
  const searchInput = $('#global-search');
  searchInput.addEventListener(
    'input',
    debounce((event) => renderGlobalSearch(event.target.value), 160)
  );
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      searchInput.value = '';
      renderGlobalSearch('');
      searchInput.blur();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.topbar-search')) {
      $('#search-results').hidden = true;
    }
  });

  /* library filters */
  document.addEventListener('input', (event) => {
    if (event.target.id === 'lib-search') {
      const { query } = parseHash();
      const next = new URLSearchParams(query);
      next.set('q', event.target.value);
      next.delete('page');
      replaceQuery(`/library?${next.toString()}`);
    }
    if (event.target.id === 'blog-search') {
      const { query } = parseHash();
      const next = new URLSearchParams(query);
      next.set('q', event.target.value);
      replaceQuery(`/blog${next.toString() ? `?${next.toString()}` : ''}`);
    }
  });

  document.addEventListener('change', (event) => {
    const map = {
      'filter-class': 'class',
      'filter-subject': 'subject',
      'filter-type': 'type',
      'filter-term': 'term',
    };
    const key = map[event.target.id];
    if (key) {
      const { query } = parseHash();
      const next = new URLSearchParams(query);
      if (event.target.value === 'all') next.delete(key);
      else next.set(key, event.target.value);
      next.delete('page');
      replaceQuery(`/library?${next.toString()}`);
    }
  });

  /* post form */
  document.addEventListener('submit', (event) => {
    if (event.target.id === 'post-form') {
      event.preventDefault();
      const title = $('#post-title').value.trim();
      const body = $('#post-body').value.trim();
      if (!title || !body) {
        showToast('Add a title and some text first.');
        return;
      }
      const activeCat = $('#cat-grid .cat-option.is-active');
      const tags = $('#post-tags')
        .value.split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean)
        .slice(0, 6);
      const post = Blog.create({
        title,
        body,
        author_name: $('#post-name').value.trim() || 'BCK Learner',
        category: activeCat ? activeCat.dataset.cat : 'discussion',
        subject: $('#post-subject').value || null,
        class_level: $('#post-class').value || null,
        tags,
      });
      showToast('Post published.');
      navigate(`/blog/${encodeURIComponent(post.id)}`);
      return;
    }

    if (event.target.id === 'comment-form') {
      event.preventDefault();
      const input = $('#comment-body');
      const text = input.value.trim();
      if (!text) return;
      const { path } = parseHash();
      const postId = decodeURIComponent(path.split('/').pop());
      Blog.addComment(postId, text, profile().name);
      input.value = '';
      showToast('Comment added.');
      handleRoute();
      return;
    }

    if (event.target.id === 'study-setup') {
      event.preventDefault();
      const classId = $('#study-class').value;
      if (!classId) {
        showToast('Choose a class first.');
        return;
      }
      const subjects = $$('#study-subjects input:checked').map((el) => el.value);
      Study.save({ class: classId, subjects, saved_at: new Date().toISOString() });
      showToast('Study space saved.');
      handleRoute();
      return;
    }
  });

  /* title counter */
  document.addEventListener('input', (event) => {
    if (event.target.id === 'post-title') {
      const counter = $('#title-count');
      if (counter) counter.textContent = `${event.target.value.length}/140`;
    }
  });

  /* profile subject checkbox styling */
  document.addEventListener('change', (event) => {
    const input = event.target.closest('#profile-subjects input');
    if (input) input.closest('.check-item').classList.toggle('is-checked', input.checked);
  });

  /* study space subject list depends on chosen class */
  document.addEventListener('change', (event) => {
    if (event.target.id === 'study-class') {
      const classId = event.target.value;
      const host = $('#study-subjects');
      if (!host) return;
      const subjects = Object.keys(Data.classSubjects[classId] || {});
      host.innerHTML = subjects.length
        ? subjects
            .map(
              (s) => `
          <label class="check-item">
            <input type="checkbox" value="${escapeHtml(s)}" />
            <span>${escapeHtml(s)}</span>
          </label>`
            )
            .join('')
        : '<p class="muted" style="font-size:.8125rem">Choose a class to see its subjects.</p>';
    }
  });

  /* keyboard shortcut: "/" focuses search */
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      event.preventDefault();
      searchInput.focus();
    }
  });

  /* sidebar */
  $('#menu-btn').addEventListener('click', openSidebar);
  $('#sidebar-close').addEventListener('click', closeSidebar);
  $('#sidebar-scrim').addEventListener('click', closeSidebar);
}

function replaceQuery(path) {
  const target = `#${path}`;
  if (window.location.hash === target) return;
  window.history.replaceState({}, '', target);
  handleRoute();
}

function renderRoutePreservingScroll() {
  const scroll = window.scrollY;
  handleRoute().then(() => window.scrollTo({ top: scroll }));
}

function rerenderIfLibrary() {
  if (parseHash().path === '/library') handleRoute();
}

function openSidebar() {
  $('#sidebar').classList.add('is-open');
  $('#sidebar-scrim').hidden = false;
}

function closeSidebar() {
  $('#sidebar').classList.remove('is-open');
  $('#sidebar-scrim').hidden = true;
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  writeStore(KEY.theme, theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0d14' : '#2B5D3A');
}

function refreshTopbar() {
  const p = profile();
  const chip = $('#topbar-class');
  const label = chip ? chip.querySelector('span') : null;
  if (label) label.textContent = p.classLevel || '—';
  if (chip) chip.classList.toggle('is-empty', !p.classLevel);
  const avatar = $('#avatar-btn');
  if (avatar) {
    avatar.textContent = (p.name || 'BCK')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}

/* ============================================================
   BOOT
   ============================================================ */

async function init() {
  const storedTheme = readStore(KEY.theme, null);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

  wireEvents();
  refreshTopbar();

  window.addEventListener('hashchange', handleRoute);

  try {
    await loadData();
  } catch (error) {
    $('#view-host').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon('inbox')}</div>
        <h3>Library unavailable</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>`;
    return;
  }

  await handleRoute();
}

init();
