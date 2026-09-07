const state = { manifest: null };

function $(sel) { return document.querySelector(sel); }

function openDrawer(open) {
  $('#drawer').classList.toggle('open', open);
  $('#backdrop').classList.toggle('show', open);
}

function setActive(route) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });
}

function navButton({ route, kicker, sum }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-item';
  btn.dataset.route = route;
  btn.innerHTML = `<span class="kicker">${kicker}</span><span class="sum">${sum}</span>`;
  btn.addEventListener('click', () => {
    location.hash = route;
    openDrawer(false);
  });
  return btn;
}

async function loadManifest() {
  const res = await fetch('data/manifest.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('manifest ' + res.status);
  return res.json();
}

function homeHTML(m) {
  const dailies = (m.dailies || []).slice(0, 5).map(d =>
    `<a class="row" href="#daily/${d.id}"><span class="date">${d.date}</span><span class="txt">${d.summary || d.title}</span></a>`
  ).join('');
  const events = (m.events || []).map(e =>
    `<a class="row" href="#event/${e.id}"><span class="date">${e.status || 'tracking'}</span><span class="txt">${e.title}</span></a>`
  ).join('');
  return `
  <div class="hero">
    <h2>AI Intelligence Radar</h2>
    <p>面向智能体互联网与 Work/Agent 引擎的技术情报站。事实与判断分区，国内外双轨，宁缺毋滥。</p>
    <div class="pill-row">
      <span class="pill">新闻</span>
      <span class="pill">话题热议</span>
      <span class="pill">开源雷达</span>
      <span class="pill">每日 08:00 更新</span>
    </div>
  </div>
  <div class="grid-2">
    <div class="tile"><h3>怎么读</h3><p>点左上角菜单（手机）或左侧目录（电脑）选择某日日报 / 持续事件。完整正文在本站，不靠聊天刷屏。</p></div>
    <div class="tile"><h3>中立性</h3><p>优先可核验一手来源；不编造热度数字；判断区单独标注，不与事实混写。</p></div>
    <div class="tile"><h3>国际信源</h3><p>X · GitHub · Hugging Face · Hacker News / Reddit 等公开页。</p></div>
    <div class="tile"><h3>国内信源</h3><p>机器之心 · 量子位 · 新智元 · 知乎 · V2EX · 掘金 · 即刻 · 小红书等公开页。</p></div>
  </div>
  <div class="section"><h2>最近日报</h2><div class="bar"></div></div>
  <div class="card list-card">${dailies || '<p>暂无</p>'}</div>
  <div class="section"><h2>持续跟踪</h2><div class="bar"></div></div>
  <div class="card list-card">${events || '<p>暂无</p>'}</div>
  <div class="footer-note">站点仓库公开维护 · GitHub Pages</div>`;
}

async function render(route) {
  const content = $('#content');
  setActive(route.split('/')[0] === 'daily' || route.split('/')[0] === 'event' ? route : route);
  // highlight exact route
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });

  if (!route || route === 'home') {
    $('#topTitle').textContent = 'AI Intelligence Radar';
    $('#topSub').textContent = '概览';
    content.innerHTML = homeHTML(state.manifest);
    return;
  }

  const [kind, id] = route.split('/');
  let href = null;
  let title = route;
  if (kind === 'daily') {
    const d = (state.manifest.dailies || []).find(x => x.id === id);
    href = d?.href; title = d?.title || id;
    $('#topSub').textContent = d?.date || '日报';
  } else if (kind === 'event') {
    const e = (state.manifest.events || []).find(x => x.id === id);
    href = e?.href; title = e?.title || id;
    $('#topSub').textContent = '持续跟踪';
  }
  $('#topTitle').textContent = title;

  if (!href) {
    content.innerHTML = `<div class="card"><h3>未找到</h3><p>没有对应页面。</p></div>`;
    return;
  }

  content.innerHTML = `<div class="card"><p>加载中…</p></div>`;
  const res = await fetch(href, { cache: 'no-store' });
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const article = doc.querySelector('.article') || doc.body;
  content.innerHTML = '';
  content.appendChild(article);
}

async function main() {
  $('#menuBtn').addEventListener('click', () => openDrawer(true));
  $('#backdrop').addEventListener('click', () => openDrawer(false));

  state.manifest = await loadManifest();
  $('#updated').textContent = '更新于 ' + (state.manifest.updatedAt || '');

  const dailyBox = $('#daily-list');
  const eventBox = $('#event-list');
  dailyBox.innerHTML = '';
  eventBox.innerHTML = '';
  (state.manifest.dailies || []).forEach(d => {
    dailyBox.appendChild(navButton({
      route: 'daily/' + d.id,
      kicker: d.date,
      sum: d.summary || d.title
    }));
  });
  (state.manifest.events || []).forEach(e => {
    eventBox.appendChild(navButton({
      route: 'event/' + e.id,
      kicker: e.status || 'tracking',
      sum: e.title
    }));
  });

  const go = () => render((location.hash || '#home').slice(1) || 'home');
  window.addEventListener('hashchange', go);
  go();
}

main().catch(err => {
  $('#content').innerHTML = `<div class="card"><h3>加载失败</h3><p>${err.message}</p></div>`;
});
