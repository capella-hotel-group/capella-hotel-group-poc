import { p as f } from '../../chunks/dompurify.js';
/*! v1.0.0 | h41252baf*/ function N(m) {
  const n = [...m.children],
    r = n[0]?.firstElementChild?.textContent?.trim() ?? '',
    s = n[1]?.firstElementChild?.textContent?.trim() ?? '',
    a = n[2]?.firstElementChild ?? null,
    o = document.createElement('div');
  if (((o.className = 'home-culture-header'), r)) {
    const e = document.createElement('h2');
    ((e.className = 'home-culture-heading'), (e.textContent = r), o.append(e));
  }
  if (s) {
    const e = document.createElement('p');
    ((e.className = 'home-culture-subtitle'), (e.textContent = s), o.append(e));
  }
  if (a) {
    const e = document.createElement('div');
    ((e.className = 'home-culture-intro'),
      (e.innerHTML = f.sanitize(a.innerHTML, { USE_PROFILES: { html: !0 } })),
      o.append(e));
  }
  const y = [
    { type: 'type1', titleRow: 3, img1Row: 4, img2Row: 5, bodyRow: 6 },
    { type: 'type2', titleRow: 7, img1Row: 8, img2Row: null, bodyRow: 9 },
    { type: 'type3', titleRow: 10, img1Row: 11, img2Row: 12, bodyRow: 13 },
  ].map(({ type: e, titleRow: R, img1Row: w, img2Row: u, bodyRow: C }) => {
    const d = n[R]?.firstElementChild?.textContent?.trim() ?? '',
      p = n[w]?.querySelector('picture') ?? null,
      h = u !== null ? (n[u]?.querySelector('picture') ?? null) : null,
      E = n[C]?.firstElementChild ?? null,
      i = document.createElement('div');
    i.className = `home-culture-item home-culture-item--${e}`;
    const l = document.createElement('div');
    if (((l.className = 'home-culture-img1'), p && l.append(p), i.append(l), h)) {
      const t = document.createElement('div');
      ((t.className = 'home-culture-img2'), t.append(h), i.append(t));
    }
    const c = document.createElement('div');
    if (((c.className = 'home-culture-content'), d)) {
      const t = document.createElement('h3');
      ((t.className = 'home-culture-item-title'), (t.textContent = d), c.append(t));
    }
    if (E) {
      const t = document.createElement('div');
      ((t.className = 'home-culture-richtext'),
        (t.innerHTML = f.sanitize(E.innerHTML, { USE_PROFILES: { html: !0 } })),
        c.append(t));
    }
    return (i.append(c), i);
  });
  m.replaceChildren(o, ...y);
}
export { N as default };
