import{d as R,V as H,W as z,O as k,b as V,P as T,e as O,M as C,a as E,E as L,f as F}from"./three.js";/*! v1.0.0 | h87aea472*/const G=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,A=`
uniform sampler2D tDiffuse;
uniform vec2 uPointerUV;
uniform float uInfluenceRadius;
uniform float uMaxShift;
uniform float uEnergy;
varying vec2 vUv;

void main() {
  vec2 delta = vUv - uPointerUV;
  float dist = length(delta);

  // Radial direction from pointer to current pixel; zero-safe
  vec2 dir = dist > 0.0001 ? delta / dist : vec2(0.0);

  // distFactor: 0 at pointer, 1 at influenceRadius (clamped beyond)
  float distFactor = clamp(dist / uInfluenceRadius, 0.0, 1.0);

  float shiftMag = uMaxShift * distFactor * uEnergy;

  vec4 sC = texture2D(tDiffuse, vUv);                   // center  (original)
  vec4 sO = texture2D(tDiffuse, vUv + dir * shiftMag);  // outward sample
  vec4 sI = texture2D(tDiffuse, vUv - dir * shiftMag);  // inward  sample

  // Default tint colors.
  vec3 cyanColor   = vec3(0.24, 0.82, 1.28) + sO.rgb;
  vec3 violetColor = vec3(0.88, 0.12, 0.68) + sI.rgb;

  // Tint factor: 0 at the pointer or when energy == 0;
  // grows toward 1 as the pixel moves outward to the influence boundary.
  // t == shiftMag / uMaxShift, written out so GLSL avoids a division.
  float t = distFactor * uEnergy;

  // Outward sample blends toward cyan as t increases.
  // Inward sample blends toward violet as t increases.
  // When shiftMag == 0 → sO == sI == sC and t == 0 → collapse to original.
  vec3 outTinted = mix(sO.rgb, cyanColor,   t * 0.16);
  vec3 inTinted  = mix(sI.rgb, violetColor, t * 0.16);

  // Chromatic split: G from cyan (outward) side, R from violet (inward) side,
  // B is shared between both tints via a 50/50 blend.
  float r = inTinted.r;
  float g = outTinted.g;
  float b = mix(inTinted.b, outTinted.b, 0.5);

  gl_FragColor = vec4(r, g, b, sC.a);
}
`;class N extends R{constructor(t=.6,e=.008){super({uniforms:{tDiffuse:{value:null},uPointerUV:{value:null},uInfluenceRadius:{value:t},uMaxShift:{value:e},uEnergy:{value:0}},vertexShader:G,fragmentShader:A}),this.uniforms.uPointerUV.value={x:.5,y:.5}}update(t,e){this.uniforms.uPointerUV.value=t,this.uniforms.uEnergy.value=e}}function q(P,t,e,r,a,i,c,m,f,o){const n=P.attributes.position;if(!n)return;const d=n.count,s=Math.hypot(f,o);if(s<.001){for(let l=0;l<d;l++)n.setXYZ(l,t[l*3],t[l*3+1],0);n.needsUpdate=!0;return}const v=Math.tanh(s/15),h=1/s,g=f*h,y=-o*h,p=m*v;for(let l=0;l<d;l++){const u=t[l*3],x=t[l*3+1],w=u+a,W=x+i,I=w-e,S=W-r,b=Math.sqrt(I*I+S*S);if(b<c){const Y=1-b/c,X=p*Y;n.setXYZ(l,u+g*X,x+y*X,0)}else n.setXYZ(l,u,x,0)}n.needsUpdate=!0}class j{constructor(t){this.canvas=null,this.renderer=null,this.camera=null,this.composer=null,this.rgbShiftPass=null,this.planes=[],this.pointerNDX=0,this.pointerNDY=0,this.pointerUV=new H(.5,.5),this.pointerWorldX=0,this.pointerWorldY=0,this.animationId=null,this.resizeObserver=null,this.pointerHandler=null,this.columnsContainer=null,this.animate=()=>{this.animationId=requestAnimationFrame(this.animate);const e=this.controller.scrollEnergy,r=this.controller.currentScrollDx,a=this.controller.currentScrollDy,i=this.controller.currentOffsetY,c=this.controller.currentItemOffsetY,m=this.controller.currentGlobalOffsetX,f=this.controller.currentColLogicalX;for(const o of this.planes){const n=o.colIndex,d=o.itemIndex,s=m+f[n],v=i[n]??0,h=c[n]?.[d]??0,g=v+h,y=o.baseX+s,p=o.baseY-g;o.mesh.position.set(y,p,0),q(o.mesh.geometry,o.restPositions,this.pointerWorldX,this.pointerWorldY,y,p,this.deformRadius,this.deformStrength,r,a)}e>=.001?this.rgbShiftPass?.update(this.pointerUV,e):this.rgbShiftPass?.update(this.pointerUV,0),this.composer?.render()},this.block=t.block,this.columns=t.columns,this.controller=t.controller,this.deformRadius=t.deformRadius,this.deformStrength=t.deformStrength}async init(){this.columnsContainer=this.block.querySelector(".panding-gallery-columns");const t=this.block.clientWidth,e=this.block.clientHeight,r=document.createElement("canvas");r.style.cssText="position:absolute;inset:0;pointer-events:none;",this.canvas=r,this.block.insertBefore(r,this.block.firstChild);const a=new z({canvas:r,antialias:!0,alpha:!0});a.setPixelRatio(1),a.setSize(t,e,!1),this.renderer=a;const i=new k(-t/2,t/2,e/2,-e/2,-1e3,1e3);i.position.z=1,this.camera=i;const c=new V,m=10,f=this.columns[0]?.offsetWidth??0;this.planes=[];const o=[];for(let s=0;s<this.columns.length;s++){const h=this.columns[s].children,g=s*(f+m);let y=0;for(let p=0;p<h.length;p++){const l=h[p],u=l.querySelector("img"),x=f,w=l.offsetHeight,W=g+x/2-t/2,I=-(y+w/2-e/2),S=new T(x,w,8,8);let b;if(u&&u.complete&&u.naturalWidth>0){const M=new O(u);M.needsUpdate=!0,b=new C({map:M})}else u?(b=new C({transparent:!0}),o.push({planeInfo:null,src:u.src,material:b})):b=new C({transparent:!0});const Y=new E(S,b);Y.position.set(W,I,0),c.add(Y);const X=new Float32Array(S.attributes.position.array),D={mesh:Y,baseX:W,baseY:I,colIndex:s,itemIndex:p,restPositions:X};this.planes.push(D);const U=o.at(-1);U&&U.planeInfo===null&&(U.planeInfo=D),y+=w+m}}for(const{planeInfo:s,src:v}of o){const h=new Image;h.crossOrigin="anonymous",h.onload=()=>{const g=new O(h);g.needsUpdate=!0,s.mesh.material.map=g,s.mesh.material.transparent=!1,s.mesh.material.needsUpdate=!0},h.src=v}const n=new L(a);n.setSize(t,e),n.addPass(new F(c,i));const d=new N;n.addPass(d),this.composer=n,this.rgbShiftPass=d}start(){this.columnsContainer&&(this.columnsContainer.style.visibility="hidden"),this.pointerHandler=t=>{const e=this.block.getBoundingClientRect(),r=e.width,a=e.height,i=t.clientX-e.left,c=t.clientY-e.top;this.pointerNDX=i/r*2-1,this.pointerNDY=-(c/a*2-1),this.pointerUV.set(i/r,1-c/a),this.pointerWorldX=this.pointerNDX*(r/2),this.pointerWorldY=this.pointerNDY*(a/2)},this.block.addEventListener("pointermove",this.pointerHandler),this.resizeObserver=new ResizeObserver(()=>this.onResize()),this.resizeObserver.observe(this.block),this.animate()}cleanup(){this.animationId!==null&&(cancelAnimationFrame(this.animationId),this.animationId=null),this.resizeObserver?.disconnect(),this.resizeObserver=null,this.pointerHandler&&(this.block.removeEventListener("pointermove",this.pointerHandler),this.pointerHandler=null),this.columnsContainer&&(this.columnsContainer.style.visibility="");for(const{mesh:t}of this.planes){t.geometry.dispose();const e=t.material;e.map?.dispose(),e.dispose()}this.planes=[],this.renderer?.dispose(),this.renderer=null,this.canvas?.remove(),this.canvas=null}onResize(){const t=this.block.clientWidth,e=this.block.clientHeight;if(!this.renderer||!this.camera||!this.composer)return;this.renderer.setSize(t,e,!1),this.composer.setSize(t,e),this.camera.left=-t/2,this.camera.right=t/2,this.camera.top=e/2,this.camera.bottom=-e/2,this.camera.updateProjectionMatrix();const r=10,a=this.columns[0]?.offsetWidth??0;for(const i of this.planes){const c=this.columns[i.colIndex],m=c.children[i.itemIndex];if(!m)continue;const f=a,o=m.offsetHeight,n=i.colIndex*(a+r);let d=0;for(let s=0;s<i.itemIndex;s++){const v=c.children[s];d+=v.offsetHeight+r}i.baseX=n+f/2-t/2,i.baseY=-(d+o/2-e/2)}}}export{j as ImmersiveScene};
