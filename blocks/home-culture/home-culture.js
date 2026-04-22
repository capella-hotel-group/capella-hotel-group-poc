import { p as N } from '../../chunks/dompurify.js';
/*! v1.0.0 | he6aefb03*/ function S(m) {
  const r = [...m.children],
    s = r[0]?.firstElementChild?.textContent?.trim() ?? '',
    a = r[1]?.firstElementChild?.textContent?.trim() ?? '',
    u = r[2]?.firstElementChild ?? null,
    n = document.createElement('div');
  if (((n.className = 'home-culture-header'), s)) {
    const e = document.createElement('h2');
    ((e.className = 'home-culture-heading'), (e.textContent = s), n.append(e));
  }
  if (a) {
    const e = document.createElement('p');
    ((e.className = 'home-culture-subtitle'), (e.textContent = a), n.append(e));
  }
  if (u) {
    const e = document.createElement('div');
    ((e.className = 'home-culture-intro'),
      (e.innerHTML = N.sanitize(u.innerHTML, { USE_PROFILES: { html: !0 } })),
      n.append(e));
  }
  const y = ['type1', 'type2', 'type3'],
    d = [];
  (y.forEach((e, v) => {
    const p = r[3 + v];
    if (!p) return;
    const i = [...p.children],
      h = i[0]?.textContent?.trim() ?? '',
      E = i[1]?.querySelector('picture') ?? null,
      f = i[2]?.querySelector('picture') ?? null,
      x = [...i].reverse().find((t) => !t.querySelector('picture')) ?? null,
      C = x?.firstElementChild ?? x ?? null,
      c = document.createElement('div');
    c.className = `home-culture-item home-culture-item--${e}`;
    const o = document.createElement('div');
    if (((o.className = 'home-culture-img1'), E && o.append(E), c.append(o), f)) {
      const t = document.createElement('div');
      ((t.className = 'home-culture-img2'), t.append(f), c.append(t));
    }
    const l = document.createElement('div');
    if (((l.className = 'home-culture-content'), h)) {
      const t = document.createElement('h3');
      ((t.className = 'home-culture-item-title'), (t.textContent = h), l.append(t));
    }
    if (C) {
      const t = document.createElement('div');
      ((t.className = 'home-culture-richtext'),
        (t.innerHTML = N.sanitize(C.innerHTML, { USE_PROFILES: { html: !0 } })),
        l.append(t));
    }
    (c.append(l), d.push(c));
  }),
    m.replaceChildren(n, ...d));
}
export { S as default };
