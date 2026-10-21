(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- nav ---------- */
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks');
  const onScroll = () => nav.classList.toggle('solid', scrollY > 60 && !links.classList.contains('open'));
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const setMenu = open => {
    links.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    nav.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    onScroll();
  };
  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- scroll reveal ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('in'));

  /* ---------- seasons ---------- */
  const seasons = {
    spring: { img: 'forest', t: 'Green, loud with water', p: 'The river runs high and the forest floor wakes up. Wildflowers, waterfalls, and the fewest people of the year.', l: ['Trilliums and wild iris on the Kestrel Loop', 'Waterfall hikes at their fullest', 'Cabin rates drop 15% Sunday–Thursday'] },
    summer: { img: 'river', t: 'Long days on the water', p: 'Warm enough to swim, long enough to do it twice. Rafting, paddle boards and fiddle night on the lodge porch.', l: ['Guided rafting June–September', 'Saturday fiddle night at the lodge', 'Book early: July weekends fill by March'] },
    autumn: { img: 'mist-camp', t: 'Mist, maples and wood smoke', p: 'Mornings smell like woodsmoke and cold river. Gold in the maples, elk in the lower meadow, and quiet again.', l: ['Elk bugling in the lower meadow at dusk', 'Cider and firewood at the camp store', 'Best stargazing of the year'] },
    winter: { img: 'winter', t: 'Snow on the roofs, stove going', p: 'Cabins and Airstreams stay open with heat and cedar-scented quiet. Snowshoe from your door, then soak by the stove.', l: ['Snowshoe rentals at the lodge', 'Cabins stocked with wood and hot cocoa', 'Mid-week stays from $139'] }
  };
  const bg = $('#seasonBg'), copy = $('#seasonCopy');
  const setSeason = k => {
    const s = seasons[k];
    bg.style.backgroundImage = `url(img/${s.img}.jpg)`;
    copy.innerHTML = `<div class="fade"><h3>${s.t}</h3><p>${s.p}</p><ul>${s.l.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
    $$('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.s === k));
  };
  $$('.tabs button').forEach(b => b.addEventListener('click', () => setSeason(b.dataset.s)));
  setSeason('summer');
  $$('.tabs button').find(b => b.dataset.s === 'summer').setAttribute('aria-selected', true);

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  $$('#masonry button').forEach(b => b.addEventListener('click', () => {
    lbImg.src = b.dataset.src; lbImg.alt = b.dataset.alt; lbCap.textContent = b.dataset.alt;
    lb.hidden = false; $('#lbClose').focus();
  }));
  const closeLb = () => { lb.hidden = true; lbImg.src = ''; };
  lb.addEventListener('click', closeLb);
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeLb(); setMenu(false); } });

  /* ---------- story clock ---------- */
  const clock = $('#clock'), story = $('#weekend');
  if (clock && 'IntersectionObserver' in window) {
    const set = c => { $('#clockDay').textContent = c.dataset.day; $('#clockTime').textContent = c.dataset.time; };
    const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(e.target); }), { threshold: .55 });
    $$('.chap').forEach(c => cio.observe(c));
    new IntersectionObserver(([e]) => clock.classList.toggle('show', e.isIntersecting), { threshold: 0 }).observe(story);
  }

  /* ---------- booking ---------- */
  const STAYS = {
    cabin:     { name: 'Fir Cabin',          rate: 189, cap: 4, clean: 45, pet: 15 },
    airstream: { name: 'Silverline Airstream', rate: 165, cap: 3, clean: 45, pet: 15 },
    tipi:      { name: 'Canvas Tipi',        rate: 128, cap: 4, clean: 35, pet: 15 },
    van:       { name: 'Van & RV site',      rate: 54,  cap: 6, clean: 0,  pet: 0 },
    tent:      { name: 'Tent site',          rate: 38,  cap: 6, clean: 0,  pet: 0 }
  };
  const WEEKEND = 1.15, TAX = 0.105, WOOD = 9;
  const fType = $('#fType'), fGuests = $('#fGuests'), fIn = $('#fIn'), fOut = $('#fOut');
  const fWood = $('#fWood'), fDog = $('#fDog'), quote = $('#quote');
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const nice = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // defaults: next Friday → Sunday
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nf = new Date(today); nf.setDate(nf.getDate() + ((5 - nf.getDay() + 7) % 7 || 7));
  const ns = new Date(nf); ns.setDate(ns.getDate() + 2);
  [fIn, fOut].forEach(i => i.min = fmt(today));
  fIn.value = fmt(nf); fOut.value = fmt(ns);

  const fillGuests = () => {
    const cap = STAYS[fType.value].cap, keep = Math.min(+fGuests.value || 2, cap);
    fGuests.innerHTML = Array.from({ length: cap }, (_, i) => `<option value="${i + 1}">${i + 1} guest${i ? 's' : ''}</option>`).join('');
    fGuests.value = keep;
    $('#dogWrap').style.display = STAYS[fType.value].pet ? '' : 'none';
    $('#dogFee').textContent = STAYS[fType.value].pet ? `$${STAYS[fType.value].pet} per stay` : 'free';
    if (!STAYS[fType.value].pet) fDog.checked = false;
  };

  let valid = false;
  const calc = () => {
    const s = STAYS[fType.value];
    if (!fIn.value || !fOut.value) { quote.innerHTML = '<p class="q-empty">Pick your dates to see a price.</p>'; valid = false; return; }
    const a = parse(fIn.value), b = parse(fOut.value);
    const nights = Math.round((b - a) / 864e5);
    if (nights < 1) { quote.innerHTML = '<p class="q-warn">Leave date must be after your arrival.</p>'; valid = false; return; }
    if (nights > 14) { quote.innerHTML = '<p class="q-warn">For stays over 14 nights, email us and we&rsquo;ll set up a long-stay rate.</p>'; valid = false; return; }

    let base = 0, wk = 0;
    for (let i = 0; i < nights; i++) {
      const d = new Date(a); d.setDate(d.getDate() + i);
      const weekend = d.getDay() === 5 || d.getDay() === 6;
      base += weekend ? Math.round(s.rate * WEEKEND) : s.rate;
      if (weekend) wk++;
    }
    const lodging = base, cleaning = s.clean, wood = fWood.checked ? WOOD * nights : 0, pet = fDog.checked ? s.pet : 0;
    const tax = Math.round((lodging + cleaning) * TAX * 100) / 100;
    const total = lodging + cleaning + wood + pet + tax;
    const minStay = s.clean > 0 && wk > 0 && nights < 2;
    valid = !minStay;

    const row = (l, v) => `<div class="row"><span>${l}</span><span>${v}</span></div>`;
    quote.innerHTML =
      `<p style="margin-bottom:8px"><strong>${s.name}</strong> · ${nice(a)} → ${nice(b)}</p>` +
      row(`${nights} night${nights > 1 ? 's' : ''}${wk ? ` (${wk} weekend)` : ''}`, money(lodging)) +
      (cleaning ? row('Cleaning fee', money(cleaning)) : '') +
      (wood ? row('Firewood', money(wood)) : '') +
      (pet ? row('Dog fee', money(pet)) : '') +
      row('Lodging tax (10.5%)', money(tax)) +
      row('Estimated total', money(total)).replace('class="row"', 'class="row total"') +
      (minStay ? '<p class="q-warn" style="margin-top:10px">Weekend stays in cabins, tipis and trailers have a 2-night minimum.</p>' : '');
  };

  fType.addEventListener('change', () => { fillGuests(); calc(); });
  [fIn, fOut, fWood, fDog, fGuests].forEach(el => el.addEventListener('change', calc));
  fIn.addEventListener('change', () => {
    fOut.min = fIn.value;
    if (fOut.value <= fIn.value) { const d = parse(fIn.value); d.setDate(d.getDate() + 2); fOut.value = fmt(d); calc(); }
  });
  fillGuests(); calc();

  // choosing a stay from the cards
  const pick = (type, scroll = true) => {
    fType.value = type; fillGuests(); calc();
    if (scroll) $('#book').scrollIntoView({ behavior: 'smooth' });
  };
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => pick(b.dataset.pick)));

  // request submit (demo)
  $('#bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#fName'), email = $('#fEmail'), sent = $('#sent');
    [name, email].forEach(i => i.classList.remove('err'));
    const okEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value);
    if (!name.value.trim()) name.classList.add('err');
    if (!okEmail) email.classList.add('err');
    if (!name.value.trim() || !okEmail || !valid) {
      sent.hidden = false; sent.style.background = '#f6e1d8'; sent.style.color = '#7a2f10';
      sent.textContent = !valid ? 'Please check your dates above.' : 'Please add your name and a valid email.';
      return;
    }
    sent.style.background = ''; sent.style.color = '';
    sent.hidden = false;
    sent.textContent = `Thanks, ${name.value.trim().split(' ')[0]}! Your request for the ${STAYS[fType.value].name} is in. We'd reply to ${email.value} within a day. (Demo only: nothing was sent.)`;
    e.target.reset();
    fIn.value = fmt(nf); fOut.value = fmt(ns); fillGuests(); calc();
  });

  /* ---------- newsletter ---------- */
  $('#news').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#nEmail').value, m = $('#nMsg');
    m.textContent = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? 'You’re on the list. See you by the fire.' : 'That email doesn’t look quite right.';
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) e.target.reset();
  });
})();
