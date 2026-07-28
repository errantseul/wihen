const buttons = document.querySelectorAll('#nav button');
const panels = document.querySelectorAll('.panel');

function showPanel(name){
  panels.forEach(p => p.classList.toggle('active', p.id === name));
  buttons.forEach(b => b.classList.toggle('active', b.dataset.panel === name));
  document.querySelector('.frame').scrollIntoView({behavior:'smooth', block:'start'});

  // reset pricelist ke tampilan kategori tiap kali tab pricelist dibuka
  if (name === 'pricelist' && PRICELIST_DATA){
    pricelistState = { view: 'categories', catIdx: null, subIdx: null, itemIdx: null };
    renderPricelist();
  }
}

buttons.forEach(btn => {
  btn.addEventListener('click', () => showPanel(btn.dataset.panel));
});

function copyFormat(){
  const text = document.getElementById('formatText').innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.copy-btn');
    const original = btn.textContent;
    btn.textContent = 'tersalin!';
    setTimeout(() => { btn.textContent = original; }, 1500);
  });
}

/* ========================================================
   PRICELIST — sistem drill-down: kategori > app list > harga
   ======================================================== */

let PRICELIST_DATA = null;
let pricelistState = { view: 'categories', catIdx: null, subIdx: null, itemIdx: null };

const SUBCAT_COLORS = ['c1', 'c2', 'c3']; // dirotasi per subkategori

function colorClass(i){
  return SUBCAT_COLORS[i % SUBCAT_COLORS.length];
}

function renderPricelist(){
  const root = document.getElementById('pricelist-app');
  if (!root) return;
  root.innerHTML = '';

  if (pricelistState.view === 'categories'){
    root.appendChild(buildCategoryList());
  } else if (pricelistState.view === 'subcategory'){
    root.appendChild(buildCategoryDetail());
  } else if (pricelistState.view === 'item'){
    root.appendChild(buildItemDetail());
  }
}

// VIEW 1: daftar kategori besar (App Premium, Topup Game, dst)
function buildCategoryList(){
  const frag = document.createDocumentFragment();

  const list = document.createElement('div');
  list.className = 'cat-list';

  PRICELIST_DATA.categories.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'cat-list-btn';
    btn.innerHTML = `
      <span class="cat-list-icon">${cat.icon}</span>
      <span class="cat-list-name">${cat.name}</span>
      <span class="cat-list-arrow">›</span>
    `;
    btn.addEventListener('click', () => {
      pricelistState = { view: 'subcategory', catIdx: i, subIdx: null, itemIdx: null };
      renderPricelist();
    });
    list.appendChild(btn);
  });

  frag.appendChild(list);

  const hint = document.createElement('div');
  hint.className = 'contact-hint';
  hint.innerHTML = `
    <span class="hearts">♡ ♡ ♡</span>
    belum nemu yang dicari? <a href="#">chat kami yuk</a>
  `;
  frag.appendChild(hint);

  return frag;
}

// VIEW 2: isi 1 kategori — subkategori + pill nama app/produk
function buildCategoryDetail(){
  const cat = PRICELIST_DATA.categories[pricelistState.catIdx];
  const container = document.createElement('div');

  container.appendChild(buildBackButton('‹ kembali', () => {
    pricelistState = { view: 'categories', catIdx: null, subIdx: null, itemIdx: null };
    renderPricelist();
  }));

  const catTitle = document.createElement('div');
  catTitle.className = 'cat-detail-title';
  catTitle.innerHTML = `${cat.icon} ${cat.name}`;
  container.appendChild(catTitle);

  cat.subcategories.forEach((sub, si) => {
    const block = document.createElement('div');
    block.className = 'subcat-block';

    const label = document.createElement('div');
    label.className = `subcat-label ${colorClass(si)}`;
    label.innerHTML = `${sub.icon} ${sub.name}`;
    block.appendChild(label);

    const pillWrap = document.createElement('div');
    pillWrap.className = 'app-pill-wrap';

    sub.items.forEach((item, ii) => {
      const pill = document.createElement('button');
      pill.className = `app-pill ${colorClass(si)}`;
      pill.textContent = item.name;
      pill.addEventListener('click', () => {
        pricelistState = { view: 'item', catIdx: pricelistState.catIdx, subIdx: si, itemIdx: ii };
        renderPricelist();
      });
      pillWrap.appendChild(pill);
    });

    block.appendChild(pillWrap);
    container.appendChild(block);
  });

  return container;
}

// VIEW 3: detail harga 1 item, lengkap dengan tombol kembali
function buildItemDetail(){
  const cat = PRICELIST_DATA.categories[pricelistState.catIdx];
  const sub = cat.subcategories[pricelistState.subIdx];
  const item = sub.items[pricelistState.itemIdx];

  const container = document.createElement('div');

  container.appendChild(buildBackButton('‹ kembali', () => {
    pricelistState = { view: 'subcategory', catIdx: pricelistState.catIdx, subIdx: null, itemIdx: null };
    renderPricelist();
  }));

  const subLabel = document.createElement('div');
  subLabel.className = `subcat-label ${colorClass(pricelistState.subIdx)}`;
  subLabel.innerHTML = `${sub.icon} ${sub.name}`;
  container.appendChild(subLabel);

  const card = document.createElement('div');
  card.className = 'item-detail-card';

  const title = document.createElement('div');
  title.className = 'item-detail-title';
  title.textContent = item.name;
  card.appendChild(title);

  const rows = document.createElement('div');
  rows.className = 'item-detail-rows';
  item.prices.forEach(p => {
    const row = document.createElement('div');
    row.className = 'price-row';
    row.innerHTML = `<span>${p.label}</span><b>${p.price}</b>`;
    rows.appendChild(row);
  });
  card.appendChild(rows);

  container.appendChild(card);
  return container;
}

function buildBackButton(label, onClick){
  const btn = document.createElement('button');
  btn.className = 'back-btn';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function loadPricelist(){
  const loadingEl = document.getElementById('pricelist-loading');

  fetch('data.json')
    .then(res => {
      if (!res.ok) throw new Error('gagal memuat data.json');
      return res.json();
    })
    .then(data => {
      PRICELIST_DATA = data;
      if (loadingEl) loadingEl.style.display = 'none';
      renderPricelist();
    })
    .catch(err => {
      console.error(err);
      if (loadingEl) loadingEl.textContent = 'gagal memuat data produk. buka halaman ini lewat Live Server ya!';
    });
}

document.addEventListener('DOMContentLoaded', loadPricelist);