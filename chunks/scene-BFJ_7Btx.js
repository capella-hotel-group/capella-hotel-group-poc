import {
  T as gt,
  S as pt,
  R as et,
  M as Q,
  P as J,
  a as K,
  C as Yt,
  W as At,
  O as Xt,
  b as xt,
  V as G,
  c as yt,
} from './three.js';
/*! v1.0.0 | h58f2a9f9*/ async function mt(t) {
  const e = await new Promise((r, l) => {
    const h = new gt();
    ((h.crossOrigin = 'anonymous'), h.load(t, r, void 0, l));
  });
  ((e.colorSpace = pt), (e.wrapS = et), (e.wrapT = et));
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
async function q(t, e, s, a, g = !1) {
  const { texture: r, imgAspect: l, updateCoverUV: h } = await mt(t);
  h(s);
  const X = new Q({ map: r, transparent: !0, depthTest: !1, depthWrite: !1, wireframe: g }),
    M = new J(2, 2, 32, 32),
    p = M.attributes.position,
    i = p.count,
    c = new Float32Array(i),
    A = new Float32Array(i);
  for (let o = 0; o < i; o++) ((c[o] = p.getX(o)), (A[o] = p.getY(o)));
  let I = 1 / 0,
    E = -1 / 0,
    v = 1 / 0,
    Y = -1 / 0;
  for (let o = 0; o < i; o++)
    (c[o] < I && (I = c[o]), c[o] > E && (E = c[o]), A[o] < v && (v = A[o]), A[o] > Y && (Y = A[o]));
  const x = new Float32Array(i);
  for (let o = 0; o < i; o++) x[o] = c[o] === I || c[o] === E || A[o] === v || A[o] === Y ? 0 : 1;
  const D = new Float32Array(i),
    Z = new Float32Array(i),
    b = new K(M, X);
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
      dispX: D,
      dispY: Z,
      borderMask: x,
      onResize: (o) => {
        ((b.scale.x = o), h(o));
      },
    }
  );
}
function nt(t, e, s) {
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
    c = new Yt(p);
  c.colorSpace = pt;
  function A() {
    const n = p.width,
      S = p.height;
    i.clearRect(0, 0, n, S);
    const N = a.getBoundingClientRect(),
      k = n / 2;
    if (t && t.textContent?.trim()) {
      const y = nt(t, N, h);
      ((i.font = y.font), (i.fillStyle = y.color), (i.textAlign = 'center'), (i.textBaseline = 'middle'));
      const T = y.textContent.split(/\n/),
        _ = parseFloat(y.font) * 1.1,
        W = y.y - ((T.length - 1) * _) / 2;
      for (let w = 0; w < T.length; w++) i.fillText(T[w], k, W + w * _);
    }
    if (e && e.textContent?.trim()) {
      const y = nt(e, N, h);
      ((i.font = y.font), (i.fillStyle = y.color), (i.textAlign = 'center'), (i.textBaseline = 'middle'));
      const T = y.textContent.split(/\n/),
        _ = parseFloat(y.font) * 1.3,
        W = y.y - ((T.length - 1) * _) / 2;
      for (let w = 0; w < T.length; w++) i.fillText(T[w], k, W + w * _);
    }
    c.needsUpdate = !0;
  }
  const I = new Q({ map: c, transparent: !0, depthTest: !1, depthWrite: !1 }),
    E = new J(2, 2, 64, 64),
    v = E.attributes.position,
    Y = v.count,
    x = new Float32Array(Y),
    D = new Float32Array(Y),
    Z = new Float32Array(Y);
  for (let n = 0; n < Y; n++) ((x[n] = v.getX(n)), (D[n] = v.getY(n)), (Z[n] = v.getZ(n)));
  let b = 1 / 0,
    o = -1 / 0,
    H = 1 / 0,
    C = -1 / 0;
  for (let n = 0; n < Y; n++)
    (x[n] < b && (b = x[n]), x[n] > o && (o = x[n]), D[n] < H && (H = D[n]), D[n] > C && (C = D[n]));
  const R = new Float32Array(Y);
  for (let n = 0; n < Y; n++) R[n] = x[n] === b || x[n] === o || D[n] === H || D[n] === C ? 0 : 1;
  const F = new Float32Array(Y),
    O = new Float32Array(Y),
    u = new Float32Array(Y),
    L = new K(E, I);
  return (
    (L.scale.x = g),
    (L.renderOrder = 4),
    s.add(L),
    A(),
    {
      mesh: L,
      posAttr: v,
      restX: x,
      restY: D,
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
        L.scale.x = n;
        const S = a.clientWidth,
          N = a.clientHeight;
        ((p.width = S * h), (p.height = N * h), A());
      },
    }
  );
}
function st(t) {
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
function wt(t) {
  for (let e = 0; e < t.vertCount; e++) {
    const s = Math.sin(t.advAngle + t.fgSeeds[e]) * t.fgAmplitude;
    ((t.dispX[e] = (s + t.smoothDeltaX * t.fgPointerStrength) * t.borderMask[e]),
      (t.dispY[e] = t.smoothDeltaY * t.fgPointerStrength * t.borderMask[e]),
      t.posAttr.setXYZ(e, t.restX[e] + t.dispX[e], t.restY[e] + t.dispY[e], 0));
  }
  t.posAttr.needsUpdate = !0;
}
function ot(t) {
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
function rt(t) {
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
const it = 0.2,
  at = 0.18,
  vt = 0.032,
  Dt = 1e-4,
  lt = 0.8,
  ct = 0.3,
  dt = 0.08,
  Rt = 0.015,
  St = 0.03,
  ht = 0.45,
  Mt = 0.06,
  ut = 1.2,
  bt = Math.PI * 0.7;
let B = null,
  j = null,
  z = null,
  $ = null,
  ft = null;
function Tt() {
  (B !== null && (cancelAnimationFrame(B), (B = null)),
    j?.disconnect(),
    (j = null),
    z && $ && ($.removeEventListener('pointermove', z), (z = null), ($ = null)),
    ft?.remove(),
    (ft = null));
}
async function It(t, e) {
  const s = new At({ canvas: t, antialias: !0, alpha: !0 });
  s.setPixelRatio(window.devicePixelRatio);
  const a = t.parentElement ?? t,
    g = a.clientWidth,
    r = a.clientHeight;
  s.setSize(g, r, !1);
  const l = g / r,
    h = new Xt(-l, l, 1, -1, -10, 10);
  h.position.z = 1;
  const X = new xt(),
    M = e.advance ? 4 : 64,
    p = new J(2, 2, M, M),
    i = p.attributes.position,
    c = i.count,
    A = new Float32Array(c),
    I = new Float32Array(c),
    E = new Float32Array(c);
  for (let f = 0; f < c; f++) ((A[f] = i.getX(f)), (I[f] = i.getY(f)), (E[f] = i.getZ(f)));
  const v = new Float32Array(c),
    Y = new Float32Array(c),
    x = new Float32Array(c),
    { texture: D, updateCoverUV: Z } = await mt(e.imageUrl);
  Z(l);
  const b = new Q({ map: D }),
    o = new K(p, b);
  ((o.scale.x = l), X.add(o));
  const H = [];
  let C = null,
    R = null,
    F = null,
    O = null,
    u = null;
  if (e.advance) {
    const f = [];
    (e.decorLeftUrl &&
      f.push(
        q(e.decorLeftUrl, X, l, 1, !1).then((d) => {
          ((d.mesh.visible = !0), (C = d), H.push(d));
        }),
      ),
      e.decorRightUrl &&
        f.push(
          q(e.decorRightUrl, X, l, 2, !1).then((d) => {
            ((d.mesh.visible = !0), (R = d), H.push(d));
          }),
        ),
      e.foregroundUrl &&
        f.push(
          q(e.foregroundUrl, X, l, 3, !1).then((d) => {
            ((d.mesh.visible = !0), (F = d), H.push(d), (O = new Float32Array(d.vertCount)));
            for (let m = 0; m < d.vertCount; m++) O[m] = ((d.restX[m] + 1) / 2) * (Math.PI * 0.5);
          }),
        ),
      await Promise.all(f),
      (u = Ct(e.headingEl ?? null, e.taglineEl ?? null, X, a, l)),
      u && t.closest('.lighting-interaction')?.classList.add('lighting-interaction--text-swapped'));
  }
  const L = new G(0, 0),
    U = new G(0, 0),
    n = new G(0, 0),
    S = new G(0, 0);
  let N = 0,
    k = 0;
  const y = new yt();
  let T = 0,
    _ = 0,
    W = !1,
    w = !1;
  (($ = a),
    (z = (f) => {
      const d = a.getBoundingClientRect();
      ((N = f.clientX - d.left), (k = f.clientY - d.top));
      const m = (N / d.width) * 2 - 1,
        P = -(k / d.height) * 2 + 1;
      (S.set(m, P), (U.x += m - L.x), (U.y += P - L.y), L.set(m, P));
    }),
    a.addEventListener('pointermove', z));
  let V = 0;
  function tt() {
    B = requestAnimationFrame(tt);
    const f = vt,
      d = Dt;
    ((n.x = (n.x + U.x) * (1 - f)),
      (n.y = (n.y + U.y) * (1 - f)),
      U.set(0, 0),
      Math.abs(n.x) < d && (n.x = 0),
      Math.abs(n.y) < d && (n.y = 0));
    const m = Math.sqrt(n.x * n.x + n.y * n.y);
    if (e.advance)
      ((V += Rt),
        C &&
          st({
            posAttr: C.posAttr,
            restX: C.restX,
            restY: C.restY,
            vertCount: C.vertCount,
            dispX: C.dispX,
            dispY: C.dispY,
            borderMask: C.borderMask,
            anchorX: -1,
            anchorY: 0,
            advAngle: V,
            phaseOffset: 0,
            sinAmplitude: dt,
            smoothDeltaX: n.x,
            smoothDeltaY: n.y,
            pointerStrength: ht,
            hitLocalX: S.x,
            hitLocalY: S.y,
            pointerInfluenceRadius: ut,
          }),
        R &&
          st({
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
            phaseOffset: bt,
            sinAmplitude: dt,
            smoothDeltaX: n.x,
            smoothDeltaY: n.y,
            pointerStrength: ht,
            hitLocalX: S.x,
            hitLocalY: S.y,
            pointerInfluenceRadius: ut,
          }),
        F &&
          O &&
          wt({
            posAttr: F.posAttr,
            restX: F.restX,
            restY: F.restY,
            vertCount: F.vertCount,
            dispX: F.dispX,
            dispY: F.dispY,
            borderMask: F.borderMask,
            fgSeeds: O,
            advAngle: V,
            fgAmplitude: St,
            smoothDeltaX: n.x,
            smoothDeltaY: n.y,
            fgPointerStrength: Mt,
          }),
        u &&
          (m > 1e-4 &&
            ((u.hasActiveDisplacement = !0),
            ot({
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
              influenceRadius: it,
              displacementStrength: at,
              zFactor: ct,
            })),
          u.hasActiveDisplacement &&
            (u.hasActiveDisplacement = rt({
              posAttr: u.posAttr,
              vertCount: u.vertCount,
              restX: u.restX,
              restY: u.restY,
              restZ: u.restZ,
              dispX: u.dispX,
              dispY: u.dispY,
              dispZ: u.dispZ,
              springDamping: lt,
            }))));
    else {
      y.setFromCamera(S, h);
      const P = y.intersectObject(o);
      (P.length > 0 && ((T = P[0].point.x / o.scale.x), (_ = P[0].point.y), (W = !0)),
        W &&
          m > 1e-4 &&
          ((w = !0),
          ot({
            vertCount: c,
            restX: A,
            restY: I,
            dispX: v,
            dispY: Y,
            dispZ: x,
            hitLocalX: T,
            hitLocalY: _,
            smoothDeltaX: n.x,
            smoothDeltaY: n.y,
            sMag: m,
            influenceRadius: it,
            displacementStrength: at,
            zFactor: ct,
          })),
        w &&
          (w = rt({
            posAttr: i,
            vertCount: c,
            restX: A,
            restY: I,
            restZ: E,
            dispX: v,
            dispY: Y,
            dispZ: x,
            springDamping: lt,
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
    tt());
}
export { Tt as cleanupScene, It as initScene };
