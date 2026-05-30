/**
 * Design Wiki — app.js
 * Fetches data from the design-wiki content repo and renders the UI.
 *
 * DATA_BASE_URL can point to:
 *   - Local sibling repo: '../design-wiki'
 *   - GitHub raw:         'https://raw.githubusercontent.com/abhicodbase/design-wiki/main'
 */
const DATA_BASE_URL = '../design-wiki';
// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const state = {
  topics: [],
  filtered: [],
  activeCategory: 'All',
  searchQuery: '',
  bookmarks: new Set(JSON.parse(localStorage.getItem('dw_bookmarks') || '[]')),
  currentTopic: null,
};
// ─────────────────────────────────────────────
// DOM REFS (filled after DOMContentLoaded)
// ─────────────────────────────────────────────
let $ = {};
// ─────────────────────────────────────────────
// BOOTSTRAP
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  cacheDOM();
  initTheme();
  bindGlobalEvents();
  await loadTopics();
});
function cacheDOM() {
  $ = {
    listView: document.getElementById('list-view'),
    detailView: document.getElementById('detail-view'),
    topicGrid: document.getElementById('topic-grid'),
    filterRow: document.getElementById('filter-row'),
    searchInput: document.getElementById('search-input'),
    resultsCount: document.getElementById('results-count'),
    themeToggle: document.getElementById('theme-toggle'),
    topicCount: document.getElementById('topic-count'),
    // Detail view elements
    detailBack: document.getElementById('detail-back'),
    detailBookmark: document.getElementById('detail-bookmark'),
    detailCategory: document.getElementById('detail-category'),
    detailTitle: document.getElementById('detail-title'),
    detailMeta: document.getElementById('detail-meta'),
    detailTags: document.getElementById('detail-tags'),
    detailSections: document.getElementById('detail-sections'),
  };
}
// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('dw_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('dw_theme', theme);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}
// ─────────────────────────────────────────────
// GLOBAL EVENTS
// ─────────────────────────────────────────────
function bindGlobalEvents() {
  $.themeToggle.addEventListener('click', toggleTheme);
  $.searchInput.addEventListener('input', onSearch);
  $.detailBack.addEventListener('click', showListView);
  $.detailBookmark.addEventListener('click', () => {
    if (state.currentTopic) toggleBookmark(state.currentTopic.id, $.detailBookmark);
  });
}
// ─────────────────────────────────────────────
// DATA LOADING
// ─────────────────────────────────────────────
async function loadTopics() {
  showLoading();
  try {
    const resp = await fetch(`${DATA_BASE_URL}/index.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    state.topics = data.topics;
    state.filtered = [...state.topics];
    buildCategoryFilters(data.categories);
    renderGrid();
    updateTopicCount();
  } catch (err) {
    showError(err);
  }
}
async function loadTopicDetail(topicMeta) {
  try {
    const resp = await fetch(`${DATA_BASE_URL}/${topicMeta.file}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch {
    // Fallback: construct a partial detail from the index metadata
    return {
      ...topicMeta,
      overview: topicMeta.summary,
      keyPoints: [],
      concepts: [],
      tools: [],
      tradeoffs: '',
      interviewTips: [],
    };
  }
}
// ─────────────────────────────────────────────
// FILTER & SEARCH
// ─────────────────────────────────────────────
function buildCategoryFilters(categories) {
  $.filterRow.innerHTML = '';
  const allBtn = createFilterBtn('All', true);
  $.filterRow.appendChild(allBtn);
  (categories || []).forEach(cat => {
    const btn = createFilterBtn(cat, false);
    $.filterRow.appendChild(btn);
  });
}
function createFilterBtn(label, isActive) {
  const btn = document.createElement('button');
  btn.className = 'filter-btn' + (isActive ? ' active' : '');
  btn.textContent = label;
  btn.dataset.category = label;
  btn.addEventListener('click', () => onCategoryFilter(label));
  return btn;
}
function onCategoryFilter(category) {
  state.activeCategory = category;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.category === category);
  });
  applyFilters();
}
function onSearch(e) {
  state.searchQuery = e.target.value.trim().toLowerCase();
  applyFilters();
}
function applyFilters() {
  let results = state.topics;
  if (state.activeCategory !== 'All') {
    results = results.filter(t => t.category === state.activeCategory);
  }
  if (state.searchQuery) {
    results = results.filter(t =>
      t.title.toLowerCase().includes(state.searchQuery) ||
      t.summary.toLowerCase().includes(state.searchQuery) ||
      (t.tags || []).some(tag => tag.includes(state.searchQuery))
    );
  }
  state.filtered = results;
  renderGrid();
}
// ─────────────────────────────────────────────
// RENDER: GRID
// ─────────────────────────────────────────────
function renderGrid() {
  $.topicGrid.innerHTML = '';
  if (state.filtered.length === 0) {
    $.topicGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>No topics match your search. Try a different keyword or category.</p>
      </div>`;
    $.resultsCount.innerHTML = 'No results found';
    return;
  }
  $.resultsCount.innerHTML = `Showing <strong>${state.filtered.length}</strong> of ${state.topics.length} topics`;
  state.filtered.forEach(topic => {
    const card = createTopicCard(topic);
    $.topicGrid.appendChild(card);
  });
}
function createTopicCard(topic) {
  const isSaved = state.bookmarks.has(topic.id);
  const diffClass = topic.difficulty.toLowerCase();
  const card = document.createElement('article');
  card.className = 'topic-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Open ${topic.title}`);
  card.dataset.id = topic.id;
  card.innerHTML = `
    <div class="card-top">
      <span class="card-category-tag">${escHtml(topic.category)}</span>
      <button class="bookmark-btn ${isSaved ? 'saved' : ''}"
              aria-label="${isSaved ? 'Remove bookmark' : 'Add bookmark'}"
              data-id="${escHtml(topic.id)}">
        ${isSaved ? '★' : '☆'}
      </button>
    </div>
    <div class="card-title">${escHtml(topic.title)}</div>
    <div class="card-summary">${escHtml(topic.summary)}</div>
    <div class="card-footer">
      <span class="difficulty-badge ${diffClass}">${escHtml(topic.difficulty)}</span>
      <span class="read-time">⏱ ${topic.readTime} min read</span>
    </div>
  `;
  // Click anywhere on card (except bookmark) → open detail
  card.addEventListener('click', (e) => {
    if (e.target.closest('.bookmark-btn')) return;
    openDetail(topic);
  });
  // Keyboard
  card.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.bookmark-btn')) {
      e.preventDefault();
      openDetail(topic);
    }
  });
  // Bookmark button
  const bmBtn = card.querySelector('.bookmark-btn');
  bmBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBookmark(topic.id, bmBtn);
  });
  return card;
}
// ─────────────────────────────────────────────
// BOOKMARKS
// ─────────────────────────────────────────────
function toggleBookmark(id, btn) {
  if (state.bookmarks.has(id)) {
    state.bookmarks.delete(id);
    btn.textContent = '☆';
    btn.classList.remove('saved');
    btn.setAttribute('aria-label', 'Add bookmark');
  } else {
    state.bookmarks.add(id);
    btn.textContent = '★';
    btn.classList.add('saved');
    btn.setAttribute('aria-label', 'Remove bookmark');
  }
  persistBookmarks();
  // Also sync the detail bookmark btn if this topic is open
  if (state.currentTopic?.id === id) {
    syncDetailBookmarkBtn();
  }
}
function persistBookmarks() {
  localStorage.setItem('dw_bookmarks', JSON.stringify([...state.bookmarks]));
}
// ─────────────────────────────────────────────
// DETAIL VIEW
// ─────────────────────────────────────────────
async function openDetail(topicMeta) {
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Show detail, hide list
  $.listView.classList.add('hidden');
  $.detailView.classList.add('visible');
  // Immediately render with meta data, then enrich with full data
  state.currentTopic = topicMeta;
  renderDetailShell(topicMeta);
  const fullTopic = await loadTopicDetail(topicMeta);
  state.currentTopic = fullTopic;
  renderDetailFull(fullTopic);
}
function renderDetailShell(meta) {
  $.detailCategory.textContent = meta.category;
  $.detailTitle.textContent = meta.title;
  $.detailMeta.innerHTML = `
    <span class="difficulty-badge ${meta.difficulty.toLowerCase()}">${escHtml(meta.difficulty)}</span>
    <span class="read-time">⏱ ${meta.readTime} min read</span>
  `;
  $.detailTags.innerHTML = '';
  $.detailSections.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  syncDetailBookmarkBtn();
}
function renderDetailFull(topic) {
  // Tags
  $.detailTags.innerHTML = (topic.tags || [])
    .map(tag => `<span class="tag-pill">#${escHtml(tag)}</span>`)
    .join('');
  // Sections
  let html = '';
  // Overview
  if (topic.overview) {
    html += `
      <div class="detail-section">
        <div class="section-label">Overview</div>
        <p class="section-text">${escHtml(topic.overview)}</p>
      </div>`;
  }
  // Key Points
  if (topic.keyPoints?.length) {
    html += `
      <div class="detail-section">
        <div class="section-label">Key Points</div>
        <ul class="key-points">
          ${topic.keyPoints.map(p => `<li>${escHtml(p)}</li>`).join('')}
        </ul>
      </div>`;
  }
  // Concepts
  if (topic.concepts?.length) {
    html += `
      <div class="detail-section">
        <div class="section-label">Core Concepts</div>
        <div class="concept-grid">
          ${topic.concepts.map(c => `
            <div class="concept-box">
              <div class="concept-name">${escHtml(c.name)}</div>
              <div class="concept-desc">${escHtml(c.description)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }
  // Tools
  if (topic.tools?.length) {
    html += `
      <div class="detail-section">
        <div class="section-label">Tools & Technologies</div>
        <div class="tools-grid">
          ${topic.tools.map(t => `
            <div class="tool-box">
              <div class="tool-name">${escHtml(t.name)}</div>
              <div class="tool-desc">${escHtml(t.description)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }
  // Trade-offs
  if (topic.tradeoffs) {
    html += `
      <div class="detail-section">
        <div class="section-label">Trade-offs</div>
        <div class="tradeoffs-box">
          <div class="box-label">⚖️ Consider</div>
          <p>${escHtml(topic.tradeoffs)}</p>
        </div>
      </div>`;
  }
  // Interview Tips
  if (topic.interviewTips?.length) {
    html += `
      <div class="detail-section">
        <div class="section-label">Interview Tips</div>
        <div class="tips-box">
          <div class="box-label">Interview Ready</div>
          <ul class="tips-list">
            ${topic.interviewTips.map(tip => `<li>${escHtml(tip)}</li>`).join('')}
          </ul>
        </div>
      </div>`;
  }
  $.detailSections.innerHTML = html;
}
function syncDetailBookmarkBtn() {
  if (!state.currentTopic) return;
  const isSaved = state.bookmarks.has(state.currentTopic.id);
  $.detailBookmark.textContent = isSaved ? '★' : '☆';
  $.detailBookmark.classList.toggle('saved', isSaved);
}
function showListView() {
  $.detailView.classList.remove('visible');
  $.listView.classList.remove('hidden');
  state.currentTopic = null;
}
// ─────────────────────────────────────────────
// LOADING / ERROR STATES
// ─────────────────────────────────────────────
function showLoading() {
  $.topicGrid.innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton" style="width:70px;height:18px;"></div>
      <div class="skeleton" style="height:20px;width:60%;"></div>
      <div class="skeleton" style="height:14px;"></div>
      <div class="skeleton" style="height:14px;width:80%;"></div>
      <div class="skeleton" style="height:14px;width:60%;margin-top:4px;"></div>
    </div>`).join('');
  $.resultsCount.textContent = 'Loading…';
}
function showError(err) {
  $.topicGrid.innerHTML = `
    <div class="error-state" style="grid-column:1/-1">
      <div class="error-icon">⚠️</div>
      <h3>Failed to load topics</h3>
      <p>Could not fetch data from the design-wiki repository.</p>
      <p style="margin-top:6px;font-size:12px;opacity:0.7">${err.message}</p>
      <button class="retry-btn" onclick="loadTopics()">Try Again</button>
    </div>`;
  $.resultsCount.textContent = 'Error';
}
function updateTopicCount() {
  if ($.topicCount) $.topicCount.textContent = state.topics.length;
}
// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
