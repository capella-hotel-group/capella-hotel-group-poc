import {
  T as Yt,
  S as mt,
  R as nt,
  M as J,
  P as K,
  a as tt,
  C as At,
  W as Xt,
  O as xt,
  b as yt,
  V as G,
  c as wt,
} from './three.js';
import { d as q } from './lighting-interaction-w7WKHs84.js';
import './aem-core.js';
import '../scripts/scripts.js';
/*! v1.0.0 | h0713d685*/ async function gt(t) {
  const e = await new Promise((r, l) => {
    const h = new Yt();
    ((h.crossOrigin = 'anonymous'), h.load(t, r, void 0, l));
  });
  ((e.colorSpace = mt), (e.wrapS = nt), (e.wrapT = nt));
  const s = e.image,
    a = s.naturalWidth > 0 ? s.naturalWidth / s.naturalHeight : 1;
  function g(r) {
    if (r > a) {
      const l = a / r;
      (e.repeat.set(1, l), e.offset.set(0, (1 - l) / 2));
    } else {
      const l = r / a;
      (e.repeat.set(l, 1), e.offset.set((1 - l) / 2, 0));
    }
    e.needsUpdate = !0;
  }
  return { texture: e, imgAspect: a, updateCoverUV: g };
}
async function Q(t, e, s, a, g = !1) {
  const { texture: r, imgAspect: l, updateCoverUV: h } = await gt(t);
  h(s);
  const X = new J({ map: r, transparent: !0, depthTest: !1, depthWrite: !1, wireframe: g }),
    M = new K(2, 2, 32, 32),
    p = M.attributes.position,
    i = p.count,
    c = new Float32Array(i),
    A = new Float32Array(i);
  for (let o = 0; o < i; o++) ((c[o] = p.getX(o)), (A[o] = p.getY(o)));
  let I = 1 / 0,
    L = -1 / 0,
    D = 1 / 0,
    Y = -1 / 0;
  for (let o = 0; o < i; o++)
    (c[o] < I && (I = c[o]), c[o] > L && (L = c[o]), A[o] < D && (D = A[o]), A[o] > Y && (Y = A[o]));
  const x = new Float32Array(i);
  for (let o = 0; o < i; o++) x[o] = c[o] === I || c[o] === L || A[o] === D || A[o] === Y ? 0 : 1;
  const v = new Float32Array(i),
    Z = new Float32Array(i),
    b = new tt(M, X);
  return (
    (b.scale.x = s),
    (b.renderOrder = a),
    e.add(b),
    {
      mesh: b,
      posAttr: p,
      restX: c,
      restY: A,
      vertCount: i,
      dispX: v,
      dispY: Z,
      borderMask: x,
      onResize: (o) => {
        ((b.scale.x = o), h(o));
      },
    }
  );
}
function st(t, e, s) {
  const a = t.getBoundingClientRect();
  let g = t;
  for (; g.firstElementChild; ) g = g.firstElementChild;
  const r = getComputedStyle(g),
    l = parseFloat(r.fontSize),
    h = r.fontFamily,
    X = r.fontWeight,
    M = r.color,
    p = `${X} ${l * s}px ${h}`,
    i = (a.top - e.top + a.height / 2) * s,
    c = t.textContent?.trim() ?? '';
  return { y: i, font: p, color: M, textContent: c };
}
function Ct(t, e, s, a, g) {
  const r = t?.textContent?.trim() ?? '',
    l = e?.textContent?.trim() ?? '';
  if (!r && !l) return null;
  const h = window.devicePixelRatio,
    X = a.clientWidth,
    M = a.clientHeight,
    p = document.createElement('canvas');
  ((p.width = X * h), (p.height = M * h));
  const i = p.getContext('2d'),
    c = new At(p);
  c.colorSpace = mt;
  function A() {
    const n = p.width,
      S = p.height;
    i.clearRect(0, 0, n, S);
    const N = a.getBoundingClientRect(),
      k = n / 2;
    if (t && t.textContent?.trim()) {
      const y = st(t, N, h);
      ((i.font = y.font), (i.fillStyle = y.color), (i.textAlign = 'center'), (i.textBaseline = 'middle'));
      const T = y.textContent.split(/\n/),
        _ = parseFloat(y.font) * 1.1,
        W = y.y - ((T.length - 1) * _) / 2;
      for (let C = 0; C < T.length; C++) i.fillText(T[C], k, W + C * _);
    }
    if (e && e.textContent?.trim()) {
      const y = st(e, N, h);
      ((i.font = y.font), (i.fillStyle = y.color), (i.textAlign = 'center'), (i.textBaseline = 'middle'));
      const T = y.textContent.split(/\n/),
        _ = parseFloat(y.font) * 1.3,
        W = y.y - ((T.length - 1) * _) / 2;
      for (let C = 0; C < T.length; C++) i.fillText(T[C], k, W + C * _);
    }
    c.needsUpdate = !0;
  }
  const I = new J({ map: c, transparent: !0, depthTest: !1, depthWrite: !1 }),
    L = new K(2, 2, 64, 64),
    D = L.attributes.position,
    Y = D.count,
    x = new Float32Array(Y),
    v = new Float32Array(Y),
    Z = new Float32Array(Y);
  for (let n = 0; n < Y; n++) ((x[n] = D.getX(n)), (v[n] = D.getY(n)), (Z[n] = D.getZ(n)));
  let b = 1 / 0,
    o = -1 / 0,
    H = 1 / 0,
    w = -1 / 0;
  for (let n = 0; n < Y; n++)
    (x[n] < b && (b = x[n]), x[n] > o && (o = x[n]), v[n] < H && (H = v[n]), v[n] > w && (w = v[n]));
  const R = new Float32Array(Y);
  for (let n = 0; n < Y; n++) R[n] = x[n] === b || x[n] === o || v[n] === H || v[n] === w ? 0 : 1;
  const F = new Float32Array(Y),
    O = new Float32Array(Y),
    u = new Float32Array(Y),
    E = new tt(L, I);
  return (
    (E.scale.x = g),
    (E.renderOrder = 4),
    s.add(E),
    A(),
    {
      mesh: E,
      posAttr: D,
      restX: x,
      restY: v,
      restZ: Z,
      vertCount: Y,
      dispX: F,
      dispY: O,
      dispZ: u,
      borderMask: R,
      hasActiveDisplacement: !1,
      texture: c,
      repaint: A,
      onResize: (n) => {
        E.scale.x = n;
        const S = a.clientWidth,
          N = a.clientHeight;
        ((p.width = S * h), (p.height = N * h), A());
      },
    }
  );
}
function ot(t) {
  const e = t.sinAmplitude * Math.sin(t.advAngle + t.phaseOffset),
    s = Math.sin(e),
    a = Math.cos(e),
    g = t.pointerInfluenceRadius * t.pointerInfluenceRadius;
  for (let r = 0; r < t.vertCount; r++) {
    const l = t.restX[r] - t.anchorX,
      h = t.restY[r] - t.anchorY,
      X = l * (a - 1) - h * s,
      M = l * s + h * (a - 1),
      p = t.restX[r] - t.hitLocalX,
      i = t.restY[r] - t.hitLocalY,
      c = Math.exp(-(p * p + i * i) / g);
    ((t.dispX[r] = (X + t.smoothDeltaX * t.pointerStrength * c) * t.borderMask[r]),
      (t.dispY[r] = (M + t.smoothDeltaY * t.pointerStrength * c) * t.borderMask[r]),
      t.posAttr.setXYZ(r, t.restX[r] + t.dispX[r], t.restY[r] + t.dispY[r], 0));
  }
  t.posAttr.needsUpdate = !0;
}
function Dt(t) {
  for (let e = 0; e < t.vertCount; e++) {
    const s = Math.sin(t.advAngle + t.fgSeeds[e]) * t.fgAmplitude;
    ((t.dispX[e] = (s + t.smoothDeltaX * t.fgPointerStrength) * t.borderMask[e]),
      (t.dispY[e] = t.smoothDeltaY * t.fgPointerStrength * t.borderMask[e]),
      t.posAttr.setXYZ(e, t.restX[e] + t.dispX[e], t.restY[e] + t.dispY[e], 0));
  }
  t.posAttr.needsUpdate = !0;
}
function rt(t) {
  const e = t.influenceRadius * t.influenceRadius;
  for (let s = 0; s < t.vertCount; s++) {
    const a = t.restX[s] - t.hitLocalX,
      g = t.restY[s] - t.hitLocalY,
      r = a * a + g * g,
      l = Math.exp(-r / (2 * e));
    ((t.dispX[s] += t.smoothDeltaX * t.displacementStrength * l),
      (t.dispY[s] += t.smoothDeltaY * t.displacementStrength * l),
      (t.dispZ[s] += t.sMag * t.displacementStrength * t.zFactor * l));
  }
}
function it(t) {
  let e = !1;
  for (let s = 0; s < t.vertCount; s++)
    ((t.dispX[s] *= t.springDamping),
      (t.dispY[s] *= t.springDamping),
      (t.dispZ[s] *= t.springDamping),
      Math.abs(t.dispX[s]) < 1e-5 ? (t.dispX[s] = 0) : (e = !0),
      Math.abs(t.dispY[s]) < 1e-5 ? (t.dispY[s] = 0) : (e = !0),
      Math.abs(t.dispZ[s]) < 1e-5 ? (t.dispZ[s] = 0) : (e = !0),
      t.posAttr.setXYZ(s, t.restX[s] + t.dispX[s], t.restY[s] + t.dispY[s], t.restZ[s] + t.dispZ[s]));
  return ((t.posAttr.needsUpdate = !0), e);
}
const at = 0.2,
  lt = 0.18,
  vt = 0.032,
  Rt = 1e-4,
  ct = 0.8,
  dt = 0.3,
  ht = 0.08,
  St = 0.015,
  Mt = 0.03,
  ut = 0.45,
  bt = 0.06,
  ft = 1.2,
  Ft = Math.PI * 0.7;
let B = null,
  j = null,
  z = null,
  $ = null,
  pt = null;
function Pt() {
  (B !== null && (cancelAnimationFrame(B), (B = null)),
    j?.disconnect(),
    (j = null),
    z && $ && ($.removeEventListener('pointermove', z), (z = null), ($ = null)),
    pt?.remove(),
    (pt = null));
}
async function Ht(t, e) {
  const s = new Xt({ canvas: t, antialias: !0, alpha: !0 });
  s.setPixelRatio(window.devicePixelRatio);
  const a = t.parentElement ?? t,
    g = a.clientWidth,
    r = a.clientHeight;
  s.setSize(g, r, !1);
  const l = g / r,
    h = new xt(-l, l, 1, -1, -10, 10);
  h.position.z = 1;
  const X = new yt(),
    M = e.advance ? 4 : 64,
    p = new K(2, 2, M, M),
    i = p.attributes.position,
    c = i.count,
    A = new Float32Array(c),
    I = new Float32Array(c),
    L = new Float32Array(c);
  for (let f = 0; f < c; f++) ((A[f] = i.getX(f)), (I[f] = i.getY(f)), (L[f] = i.getZ(f)));
  const D = new Float32Array(c),
    Y = new Float32Array(c),
    x = new Float32Array(c),
    { texture: v, updateCoverUV: Z } = await gt(e.imageUrl);
  Z(l);
  const b = new J({ map: v }),
    o = new tt(p, b);
  ((o.scale.x = l), X.add(o));
  const H = [];
  let w = null,
    R = null,
    F = null,
    O = null,
    u = null;
  if (e.advance) {
    const f = [];
    (e.decorLeftUrl &&
      f.push(
        Q(e.decorLeftUrl, X, l, 1, !1).then((d) => {
          ((d.mesh.visible = q.showDecorLeft), (w = d), H.push(d));
        }),
      ),
      e.decorRightUrl &&
        f.push(
          Q(e.decorRightUrl, X, l, 2, !1).then((d) => {
            ((d.mesh.visible = q.showDecorRight), (R = d), H.push(d));
          }),
        ),
      e.foregroundUrl &&
        f.push(
          Q(e.foregroundUrl, X, l, 3, !1).then((d) => {
            ((d.mesh.visible = q.showForeground), (F = d), H.push(d), (O = new Float32Array(d.vertCount)));
            for (let m = 0; m < d.vertCount; m++) O[m] = ((d.restX[m] + 1) / 2) * (Math.PI * 0.5);
          }),
        ),
      await Promise.all(f),
      (u = Ct(e.headingEl ?? null, e.taglineEl ?? null, X, a, l)),
      u && t.closest('.lighting-interaction')?.classList.add('lighting-interaction--text-swapped'));
  }
  const E = new G(0, 0),
    U = new G(0, 0),
    n = new G(0, 0),
    S = new G(0, 0);
  let N = 0,
    k = 0;
  const y = new wt();
  let T = 0,
    _ = 0,
    W = !1,
    C = !1;
  (($ = a),
    (z = (f) => {
      const d = a.getBoundingClientRect();
      ((N = f.clientX - d.left), (k = f.clientY - d.top));
      const m = (N / d.width) * 2 - 1,
        P = -(k / d.height) * 2 + 1;
      (S.set(m, P), (U.x += m - E.x), (U.y += P - E.y), E.set(m, P));
    }),
    a.addEventListener('pointermove', z));
  let V = 0;
  function et() {
    B = requestAnimationFrame(et);
    const f = vt,
      d = Rt;
    ((n.x = (n.x + U.x) * (1 - f)),
      (n.y = (n.y + U.y) * (1 - f)),
      U.set(0, 0),
      Math.abs(n.x) < d && (n.x = 0),
      Math.abs(n.y) < d && (n.y = 0));
    const m = Math.sqrt(n.x * n.x + n.y * n.y);
    if (e.advance)
      ((V += St),
        w &&
          ot({
            posAttr: w.posAttr,
            restX: w.restX,
            restY: w.restY,
            vertCount: w.vertCount,
            dispX: w.dispX,
            dispY: w.dispY,
            borderMask: w.borderMask,
            anchorX: -1,
            anchorY: 0,
            advAngle: V,
            phaseOffset: 0,
            sinAmplitude: ht,
            smoothDeltaX: n.x,
            smoothDeltaY: n.y,
            pointerStrength: ut,
            hitLocalX: S.x,
            hitLocalY: S.y,
            pointerInfluenceRadius: ft,
          }),
        R &&
          ot({
            posAttr: R.posAttr,
            restX: R.restX,
            restY: R.restY,
            vertCount: R.vertCount,
            dispX: R.dispX,
            dispY: R.dispY,
            borderMask: R.borderMask,
            anchorX: 1,
            anchorY: 0,
            advAngle: V,
            phaseOffset: Ft,
            sinAmplitude: ht,
            smoothDeltaX: n.x,
            smoothDeltaY: n.y,
            pointerStrength: ut,
            hitLocalX: S.x,
            hitLocalY: S.y,
            pointerInfluenceRadius: ft,
          }),
        F &&
          O &&
          Dt({
            posAttr: F.posAttr,
            restX: F.restX,
            restY: F.restY,
            vertCount: F.vertCount,
            dispX: F.dispX,
            dispY: F.dispY,
            borderMask: F.borderMask,
            fgSeeds: O,
            advAngle: V,
            fgAmplitude: Mt,
            smoothDeltaX: n.x,
            smoothDeltaY: n.y,
            fgPointerStrength: bt,
          }),
        u &&
          (m > 1e-4 &&
            ((u.hasActiveDisplacement = !0),
            rt({
              vertCount: u.vertCount,
              restX: u.restX,
              restY: u.restY,
              dispX: u.dispX,
              dispY: u.dispY,
              dispZ: u.dispZ,
              hitLocalX: S.x,
              hitLocalY: S.y,
              smoothDeltaX: n.x,
              smoothDeltaY: n.y,
              sMag: m,
              influenceRadius: at,
              displacementStrength: lt,
              zFactor: dt,
            })),
          u.hasActiveDisplacement &&
            (u.hasActiveDisplacement = it({
              posAttr: u.posAttr,
              vertCount: u.vertCount,
              restX: u.restX,
              restY: u.restY,
              restZ: u.restZ,
              dispX: u.dispX,
              dispY: u.dispY,
              dispZ: u.dispZ,
              springDamping: ct,
            }))));
    else {
      y.setFromCamera(S, h);
      const P = y.intersectObject(o);
      (P.length > 0 && ((T = P[0].point.x / o.scale.x), (_ = P[0].point.y), (W = !0)),
        W &&
          m > 1e-4 &&
          ((C = !0),
          rt({
            vertCount: c,
            restX: A,
            restY: I,
            dispX: D,
            dispY: Y,
            dispZ: x,
            hitLocalX: T,
            hitLocalY: _,
            smoothDeltaX: n.x,
            smoothDeltaY: n.y,
            sMag: m,
            influenceRadius: at,
            displacementStrength: lt,
            zFactor: dt,
          })),
        C &&
          (C = it({
            posAttr: i,
            vertCount: c,
            restX: A,
            restY: I,
            restZ: L,
            dispX: D,
            dispY: Y,
            dispZ: x,
            springDamping: ct,
          })));
    }
    s.render(X, h);
  }
  ((j = new ResizeObserver(() => {
    const f = a.clientWidth,
      d = a.clientHeight;
    s.setSize(f, d, !1);
    const m = f / d;
    ((h.left = -m), (h.right = m), h.updateProjectionMatrix(), (o.scale.x = m), Z(m));
    for (const P of H) P.onResize(m);
    u?.onResize(m);
  })),
    j.observe(a),
    et());
}
export { Pt as cleanupScene, Ht as initScene };
