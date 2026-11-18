const API = location.port === '5000' ? '' : 'http://localhost:5000';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

const money = (n) => 'GH₵ ' + Number(n).toLocaleString();

async function api(path, opts) {
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function toast(msg, ok = true) {
  const t = document.createElement('div');
  t.className = 'toast ' + (ok ? 'ok' : 'err');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function carCard(c) {
  const photo = esc(c.photo || 'https://placehold.co/600x400/16161a/d90429?text=No+photo');
  return `<a class="card" href="listing.html?id=${c.id}">
    <img src="${photo}" alt="${esc(c.title)}">
    <div class="body">
      <h3>${esc(c.title)}</h3>
      <p>${c.year} · ${esc(c.fuel_type)} · ${Number(c.mileage).toLocaleString()} km</p>
      <p class="price">${money(c.price)}</p>
      <p>${esc(c.dealer_name)} · ${esc(c.location || '')}</p>
    </div></a>`;
}