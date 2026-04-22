import { p as u } from '../../chunks/dompurify.js';
/*! v1.0.0 | he5c73ca3*/ function E(l) {
  const t = [...l.children],
    o = t[0]?.firstElementChild?.textContent?.trim() ?? '',
    s = t[1]?.firstElementChild?.textContent?.trim() ?? '',
    i = t[2]?.querySelector('picture') ?? null,
    r = t[3]?.firstElementChild ?? null,
    m = t[4]?.querySelector('a') ?? null,
    d = m?.getAttribute('href') ?? '',
    p = m?.textContent?.trim() ?? '',
    a = document.createElement('div');
  if (((a.className = 'about-capella-header'), o)) {
    const e = document.createElement('h2');
    ((e.className = 'about-capella-heading'), (e.textContent = o), a.append(e));
  }
  if (s) {
    const e = document.createElement('p');
    ((e.className = 'about-capella-subtitle'), (e.textContent = s), a.append(e));
  }
  const c = document.createElement('div');
  ((c.className = 'about-capella-image'), i && c.append(i));
  const n = document.createElement('div');
  if (((n.className = 'about-capella-synopsis'), r)) {
    const e = document.createElement('div');
    ((e.className = 'about-capella-body'),
      (e.innerHTML = u.sanitize(r.innerHTML, { USE_PROFILES: { html: !0 } })),
      n.append(e));
  }
  if (d) {
    const e = document.createElement('a');
    ((e.className = 'about-capella-cta'), (e.href = d), (e.textContent = p), n.append(e));
  }
  l.replaceChildren(a, c, n);
}
export { E as default };
