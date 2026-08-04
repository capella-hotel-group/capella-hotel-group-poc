import { moveInstrumentation as e } from '../../scripts/scripts.js';
async function t(t) {
  let n = [...t.children],
    r = n[0]?.firstElementChild?.textContent?.trim() ?? `Destinations`,
    i = n[1]?.querySelector(`a`)?.getAttribute(`href`) ?? `/en/`,
    a = n[2]?.firstElementChild?.textContent?.trim() ?? `Experiences`,
    o = n[3]?.querySelector(`a`)?.getAttribute(`href`) ?? `/en/experience/`,
    s = (e) => e.replace(/\/?$/, `/`),
    c = s(window.location.pathname) === s(o),
    l = document.createElement(`div`);
  ((l.className = `mode-toggle-inner`), l.setAttribute(`role`, `group`), l.setAttribute(`aria-label`, `Site mode`));
  let u = document.createElement(`button`);
  ((u.type = `button`),
    (u.className = `mode-toggle-btn${c ? `` : ` mode-toggle-btn--active`}`),
    (u.textContent = r),
    u.setAttribute(`aria-pressed`, String(!c)),
    e(n[0], u));
  let d = document.createElement(`div`);
  ((d.className = `mode-toggle-track`), d.setAttribute(`aria-hidden`, `true`));
  let f = document.createElement(`div`);
  ((f.className = `mode-toggle-indicator`),
    (f.style.transform = c ? `translateX(100%)` : `translateX(0%)`),
    d.append(f));
  let p = document.createElement(`button`);
  ((p.type = `button`),
    (p.className = `mode-toggle-btn${c ? ` mode-toggle-btn--active` : ``}`),
    (p.textContent = a),
    p.setAttribute(`aria-pressed`, String(c)),
    e(n[2], p),
    u.addEventListener(`click`, () => {
      c && (window.location.href = i);
    }),
    p.addEventListener(`click`, () => {
      c || (window.location.href = o);
    }),
    d.addEventListener(`click`, () => {
      window.location.href = c ? i : o;
    }),
    l.append(u, d, p),
    t.replaceChildren(l));
}
export { t as default };
