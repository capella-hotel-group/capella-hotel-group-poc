import { g as r } from '../../chunks/aem-DZ1mBJFq.js';
import { loadFragment as f } from '../fragment/fragment.js';
import '../../scripts/scripts.js';
/*! v1.0.0 | t1775716378024*/ async function c(e) {
  const o = r('footer'),
    a = o ? new URL(o, window.location.href).pathname : '/footer',
    t = await f(a);
  if (!t) return;
  e.textContent = '';
  const n = document.createElement('div');
  for (; t.firstElementChild; ) n.append(t.firstElementChild);
  e.append(n);
}
export { c as default };
