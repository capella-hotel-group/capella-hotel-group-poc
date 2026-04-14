import { c as v } from '../../chunks/aem-core.js';
import { moveInstrumentation as d } from '../../scripts/scripts.js';
/*! v1.0.0 | he1c6783a*/ function b(a) {
  const n = document.createElement('ul');
  ((n.className = 'hover-effect-list'),
    [...a.children].forEach((i) => {
      const u = [...i.children],
        [p, h, o, C] = u,
        e = document.createElement('li');
      ((e.className = 'hover-effect-item'), d(i, e));
      const t = document.createElement('a');
      t.className = 'hover-effect-link';
      const m = C?.querySelector('a');
      m && (t.href = m.href);
      const c = document.createElement('div');
      ((c.className = 'hover-effect-item-bg'), c.setAttribute('aria-hidden', 'true'));
      const l = p?.querySelector('picture');
      if (l) {
        const s = l.querySelector('img');
        if (s) {
          const g = h?.textContent?.trim() ?? '',
            f = v(s.src, g, !1, [{ width: '750' }]);
          (d(l, f), c.append(f));
        }
      }
      const r = document.createElement('span');
      ((r.className = 'hover-effect-item-label'),
        (r.textContent = o?.querySelector('p')?.textContent?.trim() ?? o?.textContent?.trim() ?? ''),
        t.append(c, r),
        e.append(t),
        n.append(e));
    }),
    a.replaceChildren(n));
}
export { b as default };
