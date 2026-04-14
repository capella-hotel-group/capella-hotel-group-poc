import { moveInstrumentation as r } from '../../scripts/scripts.js';
import '../../chunks/aem-core.js';
/*! v1.0.0 | h01c795a1*/ async function o(c) {
  const i = document.createElement('ul');
  ((i.className = 'activities-list'),
    [...c.children].forEach((n) => {
      const t = document.createElement('li');
      ((t.className = 'activities-item'),
        r(n, t),
        [...n.children].forEach((a, m) => {
          if (m === 0 && a.querySelector('picture')) {
            const e = document.createElement('div');
            ((e.className = 'activities-item-image'), e.append(...a.children), t.append(e));
          } else {
            const e = document.createElement('div');
            ((e.className = 'activities-item-body'), e.append(...a.children), t.append(e));
          }
        }),
        i.append(t));
    }),
    c.replaceChildren(i));
}
export { o as default };
