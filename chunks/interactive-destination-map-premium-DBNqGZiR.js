import { moveInstrumentation as e } from '../scripts/scripts.js';
import { n as t, t as n } from './layers-Bmz_p1Me.js';
function r(e, t) {
  try {
    document.dispatchEvent(new CustomEvent(e, { detail: t, bubbles: !0 }));
  } catch {}
}
function i(e, t) {
  r(`interactive_map_view`, { event: `interactive_map_view`, componentId: e, layerId: t });
}
function a(e, t, n, i) {
  r(`map_layer_change`, { event: `map_layer_change`, componentId: e, fromLayerId: t, toLayerId: n, trigger: i });
}
function o(e, t, n, i, a) {
  r(`map_hotspot_select`, {
    event: `map_hotspot_select`,
    componentId: e,
    layerId: t,
    hotspotId: n,
    hotspotCategory: i,
    interactionType: a,
  });
}
function s(e, t, n) {
  r(`map_popup_open`, { event: `map_popup_open`, componentId: e, layerId: t, hotspotId: n });
}
function c(e, t, n) {
  r(`map_cta_click`, { event: `map_cta_click`, componentId: e, layerId: t, hotspotId: n });
}
function l(e, t = 400) {
  let n;
  return (i, a) => {
    (clearTimeout(n),
      (n = setTimeout(() => {
        r(`map_zoom`, { event: `map_zoom`, componentId: e, layerId: i, scale: Math.round(a * 100) / 100 });
      }, t)));
  };
}
function u(e, t, n) {
  return Math.min(n, Math.max(t, e));
}
function d(e, t, n) {
  return {
    x: e.worldLeft + (t / 100) * (e.worldRight - e.worldLeft),
    y: e.worldTop + (n / 100) * (e.worldBottom - e.worldTop),
  };
}
function f(e, t) {
  let n = e.worldRight - e.worldLeft,
    r = e.worldBottom - e.worldTop;
  return {
    xPercent: u(n === 0 ? 0 : ((t.x - e.worldLeft) / n) * 100, 0, 100),
    yPercent: u(r === 0 ? 0 : ((t.y - e.worldTop) / r) * 100, 0, 100),
  };
}
function p(e, t, n) {
  let r = (n.x - e.translateX) / e.scale,
    i = (n.y - e.translateY) / e.scale;
  return {
    xPercent: u(t.width === 0 ? 0 : (r / t.width) * 100, 0, 100),
    yPercent: u(t.height === 0 ? 0 : (i / t.height) * 100, 0, 100),
  };
}
function m(e, t) {
  return e.width === 0 || e.height === 0 ? 1 : Math.max(t.width / e.width, t.height / e.height);
}
function h(e, t, n) {
  let r = Math.max(e.scale, m(t, n)),
    i = t.width * r,
    a = t.height * r;
  return {
    translateX: i <= n.width ? (n.width - i) / 2 : u(e.translateX, n.width - i, 0),
    translateY: a <= n.height ? (n.height - a) / 2 : u(e.translateY, n.height - a, 0),
    scale: r,
  };
}
function g(e, t, n, r, i) {
  let a = (n / 100) * e.width,
    o = (r / 100) * e.height;
  return h({ translateX: t.width / 2 - a * i, translateY: t.height / 2 - o * i, scale: i }, e, t);
}
function ee(e, t, n, r, i) {
  return g(e, t, n, r, i);
}
function _(e, t, n, r, i, a, o) {
  let s = u(n, r, i),
    c = (t.x - e.translateX) / e.scale,
    l = (t.y - e.translateY) / e.scale;
  return h({ translateX: t.x - c * s, translateY: t.y - l * s, scale: s }, a, o);
}
function v(e, t, n, r, i) {
  return h({ translateX: e.translateX + t, translateY: e.translateY + n, scale: e.scale }, r, i);
}
var y = 4,
  b = 40,
  x = 1.2;
function te(e, t) {
  let n = new Map(),
    r = !1,
    i = 0;
  function a(t, n) {
    let r = e.getBoundingClientRect();
    return { x: t - r.left, y: n - r.top };
  }
  function o() {
    let e = [...n.values()];
    return e.length < 2 ? 0 : Math.hypot(e[0].x - e[1].x, e[0].y - e[1].y);
  }
  function s() {
    let e = [...n.values()];
    return { x: (e[0].x + e[1].x) / 2, y: (e[0].y + e[1].y) / 2 };
  }
  function c(t) {
    t.target?.closest(`.interactive-destination-map-marker`) ||
      (e.setPointerCapture(t.pointerId),
      n.set(t.pointerId, a(t.clientX, t.clientY)),
      (r = !1),
      n.size === 2 && (i = o()));
  }
  function l(e) {
    if (!n.has(e.pointerId)) return;
    let c = n.get(e.pointerId),
      l = a(e.clientX, e.clientY);
    if ((n.set(e.pointerId, l), n.size >= 2)) {
      let n = o(),
        r = s();
      if (i > 0 && n > 0) {
        let a = t.getTransform(),
          o = n / i,
          { min: s, max: c } = t.getZoomRange(),
          l = _(a, r, a.scale * o, s, c, t.getContentSize(), t.getViewportSize());
        (t.onTransform(l), e.preventDefault());
      }
      i = n;
      return;
    }
    let u = l.x - c.x,
      d = l.y - c.y;
    if (!r) {
      if (Math.hypot(u, d) < y) return;
      ((r = !0), t.onPanStart?.());
    }
    e.preventDefault();
    let f = v(t.getTransform(), u, d, t.getContentSize(), t.getViewportSize());
    t.onTransform(f);
  }
  function u(e) {
    (n.delete(e.pointerId), n.size < 2 && (i = 0), n.size === 0 && r && ((r = !1), t.onPanEnd?.()));
  }
  function d(e) {
    e.preventDefault();
    let n = t.getTransform(),
      r = a(e.clientX, e.clientY),
      i = e.deltaY < 0 ? 1.1 : 1 / 1.1,
      { min: o, max: s } = t.getZoomRange(),
      c = _(n, r, n.scale * i, o, s, t.getContentSize(), t.getViewportSize());
    t.onTransform(c);
  }
  function f(e) {
    let n = t.getTransform(),
      r = t.getViewportSize(),
      i = t.getContentSize(),
      { min: a, max: o } = t.getZoomRange();
    switch (e.key) {
      case `ArrowUp`:
        (e.preventDefault(), t.onTransform(v(n, 0, b, i, r)));
        break;
      case `ArrowDown`:
        (e.preventDefault(), t.onTransform(v(n, 0, -40, i, r)));
        break;
      case `ArrowLeft`:
        (e.preventDefault(), t.onTransform(v(n, b, 0, i, r)));
        break;
      case `ArrowRight`:
        (e.preventDefault(), t.onTransform(v(n, -40, 0, i, r)));
        break;
      case `+`:
      case `=`:
        (e.preventDefault(), t.onTransform(_(n, { x: r.width / 2, y: r.height / 2 }, n.scale * x, a, o, i, r)));
        break;
      case `-`:
      case `_`:
        (e.preventDefault(), t.onTransform(_(n, { x: r.width / 2, y: r.height / 2 }, n.scale / x, a, o, i, r)));
        break;
      default:
        break;
    }
  }
  return (
    e.addEventListener(`pointerdown`, c),
    e.addEventListener(`pointermove`, l),
    e.addEventListener(`pointerup`, u),
    e.addEventListener(`pointercancel`, u),
    e.addEventListener(`wheel`, d, { passive: !1 }),
    e.addEventListener(`keydown`, f),
    function () {
      (e.removeEventListener(`pointerdown`, c),
        e.removeEventListener(`pointermove`, l),
        e.removeEventListener(`pointerup`, u),
        e.removeEventListener(`pointercancel`, u),
        e.removeEventListener(`wheel`, d),
        e.removeEventListener(`keydown`, f));
    }
  );
}
function ne(e, t) {
  let n = document.createElement(`dialog`);
  n.className = `interactive-destination-map-dialog`;
  let r = `idm-dialog-title-${Math.random().toString(36).slice(2, 8)}`,
    i = `idm-dialog-desc-${Math.random().toString(36).slice(2, 8)}`;
  (n.setAttribute(`aria-labelledby`, r), n.setAttribute(`aria-describedby`, i));
  let a = document.createElement(`button`);
  ((a.type = `button`),
    (a.className = `interactive-destination-map-dialog-close`),
    a.setAttribute(`aria-label`, `Close`));
  let o = document.createElement(`img`);
  ((o.src = `${window.hlx.codeBasePath}/icons/map-close.svg`),
    (o.alt = ``),
    (o.width = 16),
    (o.height = 16),
    (o.loading = `lazy`),
    a.append(o),
    a.addEventListener(`click`, () => n.close()));
  let s = document.createElement(`div`);
  ((s.className = `interactive-destination-map-dialog-body`), n.append(a, s));
  let c = null;
  (n.addEventListener(`close`, () => {
    (e(c), c?.focus(), (c = null));
  }),
    n.addEventListener(`click`, (e) => {
      e.target === n && n.close();
    }));
  function l(e) {
    s.replaceChildren();
    let n = document.createElement(`div`);
    if (((n.className = `interactive-destination-map-dialog-thumb`), e.thumbnail?.src)) {
      let t = document.createElement(`img`);
      ((t.loading = `lazy`),
        (t.alt = e.thumbnail.alt || ``),
        t.addEventListener(`error`, () => n.classList.add(`interactive-destination-map-dialog-thumb--error`)),
        (t.src = e.thumbnail.src),
        n.append(t));
    }
    let a = document.createElement(`div`);
    ((a.className = `interactive-destination-map-dialog-thumb-overlay`), n.append(a));
    let o = document.createElement(`h3`);
    ((o.id = r),
      (o.className = `interactive-destination-map-dialog-title`),
      (o.textContent = e.title || e.label),
      n.append(o),
      s.append(n));
    let c = document.createElement(`div`);
    if (((c.className = `interactive-destination-map-dialog-content`), e.category.trim())) {
      let t = document.createElement(`p`);
      ((t.className = `interactive-destination-map-dialog-category`), (t.textContent = e.category), c.append(t));
    }
    let l = document.createElement(`div`);
    l.className = `interactive-destination-map-dialog-content-main`;
    let u = document.createElement(`p`);
    if (
      ((u.id = i),
      (u.className = `interactive-destination-map-dialog-description`),
      (u.textContent = e.description),
      l.append(u),
      e.ctaText.trim() && e.ctaLink.trim())
    ) {
      let n = document.createElement(`div`);
      n.className = `interactive-destination-map-dialog-actions`;
      let r = document.createElement(`a`);
      ((r.className = `interactive-destination-map-dialog-action-link`),
        (r.href = e.ctaLink),
        (r.textContent = e.ctaText),
        r.addEventListener(`click`, () => t(e)),
        n.append(r),
        l.append(n));
    }
    (c.append(l), s.append(c));
  }
  function u(e, t) {
    ((c = t), l(e), typeof n.showModal == `function` ? n.showModal() : (n.setAttribute(`open`, ``), n.focus()));
  }
  function d() {
    n.open && n.close();
  }
  return { dialog: n, open: u, close: d };
}
function re(e) {
  return {
    activeLayerId: e.layerId,
    activeHotspotId: null,
    scale: e.scale,
    translateX: e.translateX,
    translateY: e.translateY,
    focalX: e.focalX,
    focalY: e.focalY,
    navigationHistory: [],
    loadedLayerIds: new Set([e.layerId]),
    activePointers: new Map(),
    isDragging: !1,
    isTransitioning: !1,
    dialogTrigger: null,
  };
}
function S(e, t) {
  ((e.scale = t.scale), (e.translateX = t.translateX), (e.translateY = t.translateY));
}
function ie(e, t, n, r, i) {
  ((e.activeLayerId = t), (e.focalX = r), (e.focalY = i), S(e, n), e.loadedLayerIds.add(t));
}
function ae(e, t) {
  e.activeHotspotId = t;
}
function oe(e, t) {
  e.navigationHistory.push(t);
}
function se(e) {
  return e.navigationHistory.pop();
}
function C(e, t) {
  e.dialogTrigger = t;
}
function ce(e, t) {
  e.isDragging = t;
}
function le(e, t) {
  e.isTransitioning = t;
}
function ue(e, t) {
  ((e.activeLayerId = t.layerId),
    (e.activeHotspotId = null),
    (e.scale = t.scale),
    (e.translateX = t.translateX),
    (e.translateY = t.translateY),
    (e.focalX = t.focalX),
    (e.focalY = t.focalY),
    (e.navigationHistory = []),
    (e.isDragging = !1),
    (e.isTransitioning = !1),
    (e.dialogTrigger = null));
}
var w = `(prefers-reduced-motion: reduce)`,
  T = 450,
  de = 1.6;
function E() {
  return typeof window.matchMedia == `function` && window.matchMedia(w).matches;
}
function D(e) {
  return new Promise((t) => {
    setTimeout(t, e);
  });
}
function fe(e) {
  return e.complete
    ? Promise.resolve()
    : typeof e.decode == `function`
      ? e.decode().catch(() => new Promise((t) => e.addEventListener(`load`, () => t(), { once: !0 })))
      : new Promise((t) => {
          (e.addEventListener(`load`, () => t(), { once: !0 }), e.addEventListener(`error`, () => t(), { once: !0 }));
        });
}
function O(e, t, n) {
  let r = document.createElement(`button`);
  ((r.type = `button`), (r.className = `interactive-destination-map-control ${n}`), r.setAttribute(`aria-label`, t));
  let i = document.createElement(`img`);
  return (
    (i.src = `${window.hlx.codeBasePath}/icons/${e}.svg`),
    (i.alt = ``),
    (i.width = 20),
    (i.height = 20),
    (i.loading = `lazy`),
    r.append(i),
    r
  );
}
async function k(r) {
  let { content: h, viewport: v, liveRegion: y } = r,
    { config: b, layers: x, hotspots: w } = h,
    k = x.find((e) => e.layerId === b.defaultLayerId);
  if (!k) return;
  let A = k;
  v.replaceChildren();
  let j = new Map(x.map((e) => [e.layerId, e])),
    M = new Map();
  w.forEach((e) => {
    let t = M.get(e.layerId) ?? [];
    (t.push(e), M.set(e.layerId, t));
  });
  let N = document.createElement(`div`);
  ((N.className = `interactive-destination-map-stage-host`),
    N.setAttribute(`role`, `group`),
    N.setAttribute(`aria-roledescription`, `Interactive map`),
    N.setAttribute(`aria-label`, b.heading || `Interactive destination map`),
    (N.tabIndex = 0));
  let P = O(`map-back`, `Back to previous view`, `interactive-destination-map-back`);
  P.hidden = !0;
  let F = document.createElement(`div`);
  F.className = `interactive-destination-map-controls`;
  let I = O(`zoom-in`, `Zoom in`, `interactive-destination-map-zoom-in`),
    L = O(`zoom-out`, `Zoom out`, `interactive-destination-map-zoom-out`),
    pe = O(`map-reset`, `Reset map`, `interactive-destination-map-reset-btn`);
  (F.append(I, L, pe), v.append(N, P, F));
  let R = {
      layerId: k.layerId,
      scale: b.defaultZoom || k.defaultZoom,
      translateX: 0,
      translateY: 0,
      focalX: b.defaultFocalX ?? k.defaultFocalX,
      focalY: b.defaultFocalY ?? k.defaultFocalY,
    },
    z = re(R),
    B = null,
    V = new Map(),
    H = ne(
      (e) => {
        C(z, null);
        let t = B;
        if (((B = null), t)) {
          let e = V.get(z.activeLayerId);
          e && ((e.style.transitionDuration = `${E() ? 0 : T}ms`), K(e, t), S(z, t), q());
        }
        e && e.focus();
      },
      (e) => c(b.analyticsComponentId, z.activeLayerId, e.hotspotId),
    );
  v.append(H.dialog);
  let U = l(b.analyticsComponentId);
  function W() {
    return { width: N.clientWidth, height: N.clientHeight };
  }
  function G(e) {
    return { width: e.offsetWidth, height: e.offsetHeight };
  }
  function K(e, t) {
    (e.style.setProperty(`--idm-x`, `${t.translateX}px`),
      e.style.setProperty(`--idm-y`, `${t.translateY}px`),
      e.style.setProperty(`--idm-scale`, String(t.scale)));
  }
  function me(e) {
    ((y.textContent = ``), y.getBoundingClientRect(), (y.textContent = e));
  }
  function q() {
    let e = j.get(z.activeLayerId),
      t = e ? V.get(e.layerId) : void 0,
      n = e ? Math.max(e.minZoom, t ? m(G(t), W()) : e.minZoom) : 0;
    (I.toggleAttribute(`disabled`, !e || z.scale >= e.maxZoom),
      L.toggleAttribute(`disabled`, !e || z.scale <= n),
      (P.hidden = z.navigationHistory.length === 0));
  }
  function J() {
    if (!z.activeHotspotId) return;
    let e = N.querySelector(`.interactive-destination-map-marker[data-hotspot-id="${z.activeHotspotId}"]`);
    (e?.classList.remove(`interactive-destination-map-marker--active`), e?.setAttribute(`aria-pressed`, `false`));
  }
  function Y(r) {
    let i = V.get(r.layerId);
    if (i) return i;
    let a = document.createElement(`div`);
    ((a.className = `interactive-destination-map-stage-layer`),
      (a.dataset.layerId = r.layerId),
      a.setAttribute(`aria-hidden`, `true`));
    let o = n(r, r.layerId === A.layerId);
    (a.append(o), r.layerId === A.layerId && e(r.sourceRow, o));
    let s = document.createElement(`div`);
    return (
      (s.className = `interactive-destination-map-markers`),
      (M.get(r.layerId) ?? []).forEach((e) => {
        let n = t(e);
        (n.setAttribute(`aria-pressed`, e.hotspotId === z.activeHotspotId ? `true` : `false`),
          e.hotspotId === z.activeHotspotId && n.classList.add(`interactive-destination-map-marker--active`),
          n.addEventListener(`click`, (t) => {
            let r = t.detail === 0 ? `keyboard` : `pointer`;
            _e(e, n, r);
          }),
          s.append(n));
      }),
      a.append(s),
      N.append(a),
      V.set(r.layerId, a),
      z.loadedLayerIds.add(r.layerId),
      a
    );
  }
  async function X(e, t, n = {}) {
    let r = j.get(e);
    if (!r || z.isTransitioning || e === z.activeLayerId) return;
    let i = z.activeLayerId,
      o = V.get(i);
    (t !== `back` &&
      t !== `reset` &&
      oe(z, { layerId: i, transform: { translateX: z.translateX, translateY: z.translateY, scale: z.scale } }),
      le(z, !0));
    let s = Y(r),
      c = s.querySelector(`img`);
    c && (await fe(c));
    let l = W(),
      u = G(s),
      m;
    if (n.explicitTransform) m = n.explicitTransform;
    else if (n.focalXPercent != null && n.focalYPercent != null)
      m = g(u, l, n.focalXPercent, n.focalYPercent, n.zoom ?? r.defaultZoom);
    else if (o) {
      let e = j.get(i),
        t = G(o),
        a = p({ translateX: z.translateX, translateY: z.translateY, scale: z.scale }, t, {
          x: l.width / 2,
          y: l.height / 2,
        }),
        s = f(r, e ? d(e, a.xPercent, a.yPercent) : { x: 0, y: 0 });
      m = g(u, l, s.xPercent, s.yPercent, n.zoom ?? r.defaultZoom);
    } else m = g(u, l, r.defaultFocalX, r.defaultFocalY, r.defaultZoom);
    let h = E() ? 0 : T;
    (K(s, m),
      (s.style.transitionDuration = `${h}ms`),
      o && (o.style.transitionDuration = `${h}ms`),
      s.classList.add(`interactive-destination-map-stage-layer--active`),
      s.setAttribute(`aria-hidden`, `false`),
      o &&
        o !== s &&
        (o.classList.remove(`interactive-destination-map-stage-layer--active`), o.setAttribute(`aria-hidden`, `true`)),
      h > 0 && (await D(h)),
      J(),
      ie(z, e, m, r.defaultFocalX, r.defaultFocalY),
      ae(z, null),
      le(z, !1),
      q(),
      me(`Now viewing ${r.title}`),
      a(b.analyticsComponentId, i, e, t));
  }
  function he(e) {
    let t = j.get(e.layerId),
      n = V.get(e.layerId);
    if (!t || !n) return;
    B ||= { translateX: z.translateX, translateY: z.translateY, scale: z.scale };
    let r = W(),
      i = g(
        G(n),
        r,
        e.targetFocalX ?? e.xPercent,
        e.targetFocalY ?? e.yPercent,
        u(e.targetZoom ?? z.scale * de, t.minZoom, t.maxZoom),
      );
    ((n.style.transitionDuration = `${E() ? 0 : T}ms`), K(n, i), S(z, i), q(), U(e.layerId, i.scale), Z());
  }
  let ge = 0;
  async function _e(e, t, n) {
    let r = ++ge;
    if (
      (J(),
      ae(z, e.hotspotId),
      t.classList.add(`interactive-destination-map-marker--active`),
      t.setAttribute(`aria-pressed`, `true`),
      o(b.analyticsComponentId, z.activeLayerId, e.hotspotId, e.category, n),
      e.targetLayerId)
    ) {
      await X(e.targetLayerId, `hotspot`, {
        focalXPercent: e.targetFocalX ?? void 0,
        focalYPercent: e.targetFocalY ?? void 0,
        zoom: e.targetZoom ?? void 0,
      });
      return;
    }
    (he(e),
      C(z, t),
      await D(E() ? 0 : T),
      r === ge && (H.open(e, t), s(b.analyticsComponentId, z.activeLayerId, e.hotspotId)));
  }
  function Z() {
    let e = j.get(z.activeLayerId);
    if (!(!e || z.isTransitioning)) {
      if (z.scale >= e.enterChildZoomThreshold) {
        let t = V.get(e.layerId),
          n = t ? G(t) : null,
          r = n
            ? p({ translateX: z.translateX, translateY: z.translateY, scale: z.scale }, n, {
                x: W().width / 2,
                y: W().height / 2,
              })
            : { xPercent: 50, yPercent: 50 },
          i = d(e, r.xPercent, r.yPercent),
          a = x.find((t) => {
            if (t.parentLayerId !== e.layerId) return !1;
            let n = f(t, i);
            return n.xPercent > 0 && n.xPercent < 100 && n.yPercent > 0 && n.yPercent < 100;
          });
        if (a) {
          X(a.layerId, `zoom`);
          return;
        }
      }
      e.parentLayerId &&
        Number.isFinite(e.exitChildZoomThreshold) &&
        z.scale <= e.exitChildZoomThreshold &&
        X(e.parentLayerId, `zoom`);
    }
  }
  te(N, {
    getTransform: () => ({ translateX: z.translateX, translateY: z.translateY, scale: z.scale }),
    getContentSize: () => {
      let e = V.get(z.activeLayerId);
      return e ? G(e) : { width: 0, height: 0 };
    },
    getViewportSize: W,
    getZoomRange: () => {
      let e = j.get(z.activeLayerId);
      return { min: e?.minZoom ?? b.minZoom, max: e?.maxZoom ?? b.maxZoom };
    },
    onTransform: (e) => {
      let t = V.get(z.activeLayerId);
      t && ((t.style.transitionDuration = `0ms`), K(t, e), S(z, e), q(), U(z.activeLayerId, e.scale), Z());
    },
    onPanStart: () => {
      (ce(z, !0), N.classList.add(`interactive-destination-map-stage-host--dragging`));
    },
    onPanEnd: () => {
      (ce(z, !1), N.classList.remove(`interactive-destination-map-stage-host--dragging`));
    },
  });
  function ve(e) {
    let t = V.get(z.activeLayerId),
      n = j.get(z.activeLayerId);
    if (!t || !n) return;
    let r = W(),
      i = G(t),
      a = { translateX: z.translateX, translateY: z.translateY, scale: z.scale },
      o = _(a, { x: r.width / 2, y: r.height / 2 }, a.scale * e, n.minZoom, n.maxZoom, i, r);
    ((t.style.transitionDuration = `${E() ? 0 : 200}ms`), K(t, o), S(z, o), q(), U(z.activeLayerId, o.scale), Z());
  }
  (I.addEventListener(`click`, () => ve(1.4)),
    L.addEventListener(`click`, () => ve(1 / 1.4)),
    pe.addEventListener(`click`, () => void ye()),
    P.addEventListener(`click`, () => {
      let e = se(z);
      e && X(e.layerId, `back`, { explicitTransform: e.transform });
    }));
  async function ye() {
    ((B = null), H.close(), J());
    let e = z.activeLayerId,
      t = Y(A),
      n = t.querySelector(`img`);
    n && (await fe(n));
    let r = g(G(t), W(), R.focalX, R.focalY, R.scale),
      i = E() ? 0 : T;
    ((t.style.transitionDuration = `${i}ms`),
      K(t, r),
      t.classList.add(`interactive-destination-map-stage-layer--active`),
      t.setAttribute(`aria-hidden`, `false`),
      V.forEach((e, t) => {
        t !== A.layerId &&
          ((e.style.transitionDuration = `${i}ms`),
          e.classList.remove(`interactive-destination-map-stage-layer--active`),
          e.setAttribute(`aria-hidden`, `true`));
      }),
      i > 0 && (await D(i)),
      ue(z, R),
      S(z, r),
      q(),
      me(`Map reset to the default view.`),
      a(b.analyticsComponentId, e, A.layerId, `reset`));
  }
  let Q = W(),
    be = new ResizeObserver(() => {
      let e = W(),
        t = V.get(z.activeLayerId);
      if (t && (e.width !== Q.width || e.height !== Q.height)) {
        let n = G(t),
          r = p({ translateX: z.translateX, translateY: z.translateY, scale: z.scale }, n, {
            x: Q.width / 2,
            y: Q.height / 2,
          }),
          i = ee(n, e, r.xPercent, r.yPercent, z.scale);
        (K(t, i), S(z, i));
      }
      Q = e;
    });
  be.observe(N);
  let xe = new MutationObserver(() => {
    document.contains(r.block) || (be.disconnect(), xe.disconnect());
  });
  xe.observe(document.body, { childList: !0, subtree: !0 });
  let $ = Y(k),
    Se = g(G($), W(), R.focalX, R.focalY, R.scale);
  (K($, Se),
    $.classList.add(`interactive-destination-map-stage-layer--active`),
    $.setAttribute(`aria-hidden`, `false`),
    S(z, Se),
    q(),
    i(b.analyticsComponentId, k.layerId),
    r.block.querySelector(`.interactive-destination-map-list`)?.setAttribute(`hidden`, ``));
}
export { k as default };
