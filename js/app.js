async function loadManifest() {
  const res = await fetch('data/manifest.json', { cache: 'no-store' });
  return res.json();
}

function itemEl(entry, kind) {
  const a = document.createElement('a');
  a.className = 'item';
  a.href = '#' + kind + '/' + entry.id;
  a.dataset.href = entry.href;
  a.dataset.id = kind + '/' + entry.id;
  if (kind === 'daily') {
    a.innerHTML = `<span class="date">${entry.date}</span><span class="sum">${entry.summary || entry.title}</span>`;
  } else {
    a.innerHTML = `<span class="date">${entry.status || 'event'}</span><span class="sum">${entry.title}</span>`;
  }
  return a;
}

function setActive(hash) {
  document.querySelectorAll('.nav a.item').forEach(a => {
    a.classList.toggle('active', a.dataset.id === hash);
  });
}

function navigate() {
  const hash = (location.hash || '#home').slice(1);
  const frame = document.getElementById('content');
  const crumb = document.getElementById('crumb');
  setActive(hash);
  if (hash === 'home' || hash === '') {
    frame.src = 'home.html';
    crumb.textContent = '概览';
    return;
  }
  const link = document.querySelector(`.nav a.item[data-id="${hash}"]`);
  if (link) {
    frame.src = link.dataset.href;
    crumb.textContent = link.querySelector('.sum')?.textContent || hash;
  }
}

async function main() {
  const manifest = await loadManifest();
  document.getElementById('brand-sub').textContent = '更新于 ' + (manifest.updatedAt || '');
  const dailyBox = document.getElementById('daily-list');
  const eventBox = document.getElementById('event-list');
  dailyBox.innerHTML = '';
  eventBox.innerHTML = '';
  (manifest.dailies || []).forEach(d => dailyBox.appendChild(itemEl(d, 'daily')));
  (manifest.events || []).forEach(e => eventBox.appendChild(itemEl(e, 'event')));
  window.addEventListener('hashchange', navigate);
  navigate();
}

main().catch(err => {
  document.getElementById('crumb').textContent = '加载失败：' + err.message;
});
