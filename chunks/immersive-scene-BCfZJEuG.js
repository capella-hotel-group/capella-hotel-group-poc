import{d as z,V as M,W as O,O as k,b as V,P as C,e as X,M as P,a as E,E as L,f as F}from"./three.js";/*! v1.0.0 | hbb68c4f1*/const G=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,N=`
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

  // Red   — unchanged
  float r = texture2D(tDiffuse, vUv).r;
  // Green — shifted outward (away from pointer)
  float g = texture2D(tDiffuse, vUv + dir * shiftMag).g;
  // Blue  — shifted inward  (toward pointer)
  float b = texture2D(tDiffuse, vUv - dir * shiftMag).b;

  float a = texture2D(tDiffuse, vUv).a;

  gl_FragColor = vec4(r, g, b, a);
}
`;class q extends z{constructor(t=.4,e=.006){super({uniforms:{tDiffuse:{value:null},uPointerUV:{value:null},uInfluenceRadius:{value:t},uMaxShift:{value:e},uEnergy:{value:0}},vertexShader:G,fragmentShader:N}),this.uniforms.uPointerUV.value={x:.5,y:.5}}update(t,e){this.uniforms.uPointerUV.value=t,this.uniforms.uEnergy.value=e}}function A(x,t,e,i,o,s,h,r){if(r<.001)return;const a=x.attributes.position;if(!a)return;const u=a.count;for(let l=0;l<u;l++){const f=a.getX(l)+i,n=a.getY(l)+o,m=f-t,c=n-e,d=Math.sqrt(m*m+c*c);let g=0;if(d<s){const p=d/s;g=h*p*r}a.setZ(l,g)}a.needsUpdate=!0}class T{constructor(t){this.canvas=null,this.renderer=null,this.camera=null,this.composer=null,this.rgbShiftPass=null,this.planes=[],this.pointerNDX=0,this.pointerNDY=0,this.pointerUV=new M(.5,.5),this.pointerWorldX=0,this.pointerWorldY=0,this.animationId=null,this.resizeObserver=null,this.pointerHandler=null,this.columnsContainer=null,this.animate=()=>{this.animationId=requestAnimationFrame(this.animate);const e=this.controller.scrollEnergy,i=this.controller.currentOffsetY,o=this.controller.currentItemOffsetY,s=this.controller.currentGlobalOffsetX,h=this.controller.currentColLogicalX;for(const r of this.planes){const a=r.colIndex,u=r.itemIndex,l=s+h[a],f=i[a]??0,n=o[a]?.[u]??0,m=f+n,c=r.baseX+l,d=r.baseY-m;r.mesh.position.set(c,d,0),A(r.mesh.geometry,this.pointerWorldX,this.pointerWorldY,c,d,this.deformRadius,this.deformStrength,e)}e>=.001?this.rgbShiftPass?.update(this.pointerUV,e):this.rgbShiftPass?.update(this.pointerUV,0),this.composer?.render()},this.block=t.block,this.columns=t.columns,this.controller=t.controller,this.deformRadius=t.deformRadius,this.deformStrength=t.deformStrength}async init(){this.columnsContainer=this.block.querySelector(".panding-gallery-columns");const t=this.block.clientWidth,e=this.block.clientHeight,i=document.createElement("canvas");i.style.cssText="position:absolute;inset:0;pointer-events:none;",this.canvas=i,this.block.insertBefore(i,this.block.firstChild);const o=new O({canvas:i,antialias:!0,alpha:!0});o.setPixelRatio(window.devicePixelRatio),o.setSize(t,e,!1),this.renderer=o;const s=new k(-t/2,t/2,e/2,-e/2,-1e3,1e3);s.position.z=1,this.camera=s;const h=new V,r=10,a=this.columns[0]?.offsetWidth??0;this.planes=[];const u=[];for(let n=0;n<this.columns.length;n++){const c=this.columns[n].children,d=n*(a+r);let g=0;for(let p=0;p<c.length;p++){const S=c[p],v=S.querySelector("img"),U=a,y=S.offsetHeight,W=d+U/2-t/2,Y=-(g+y/2-e/2),H=new C(U,y,8,8);let b;if(v&&v.complete&&v.naturalWidth>0){const R=new X(v);R.needsUpdate=!0,b=new P({map:R})}else v?(b=new P({transparent:!0}),u.push({planeInfo:null,src:v.src,material:b})):b=new P({transparent:!0});const w=new E(H,b);w.position.set(W,Y,0),h.add(w);const D={mesh:w,baseX:W,baseY:Y,colIndex:n,itemIndex:p};this.planes.push(D);const I=u.at(-1);I&&I.planeInfo===null&&(I.planeInfo=D),g+=y+r}}for(const{planeInfo:n,src:m}of u){const c=new Image;c.crossOrigin="anonymous",c.onload=()=>{const d=new X(c);d.needsUpdate=!0,n.mesh.material.map=d,n.mesh.material.transparent=!1,n.mesh.material.needsUpdate=!0},c.src=m}const l=new L(o);l.addPass(new F(h,s));const f=new q;l.addPass(f),this.composer=l,this.rgbShiftPass=f}start(){this.columnsContainer&&(this.columnsContainer.style.visibility="hidden"),this.pointerHandler=t=>{const e=this.block.getBoundingClientRect(),i=e.width,o=e.height,s=t.clientX-e.left,h=t.clientY-e.top;this.pointerNDX=s/i*2-1,this.pointerNDY=-(h/o*2-1),this.pointerUV.set(s/i,1-h/o),this.pointerWorldX=this.pointerNDX*(i/2),this.pointerWorldY=this.pointerNDY*(o/2)},this.block.addEventListener("pointermove",this.pointerHandler),this.resizeObserver=new ResizeObserver(()=>this.onResize()),this.resizeObserver.observe(this.block),this.animate()}cleanup(){this.animationId!==null&&(cancelAnimationFrame(this.animationId),this.animationId=null),this.resizeObserver?.disconnect(),this.resizeObserver=null,this.pointerHandler&&(this.block.removeEventListener("pointermove",this.pointerHandler),this.pointerHandler=null),this.columnsContainer&&(this.columnsContainer.style.visibility="");for(const{mesh:t}of this.planes){t.geometry.dispose();const e=t.material;e.map?.dispose(),e.dispose()}this.planes=[],this.renderer?.dispose(),this.renderer=null,this.canvas?.remove(),this.canvas=null}onResize(){const t=this.block.clientWidth,e=this.block.clientHeight;if(!this.renderer||!this.camera||!this.composer)return;this.renderer.setSize(t,e,!1),this.composer.setSize(t,e),this.camera.left=-t/2,this.camera.right=t/2,this.camera.top=e/2,this.camera.bottom=-e/2,this.camera.updateProjectionMatrix();const i=10,o=this.columns[0]?.offsetWidth??0;for(const s of this.planes){const h=this.columns[s.colIndex],r=h.children[s.itemIndex];if(!r)continue;const a=o,u=r.offsetHeight,l=s.colIndex*(o+i);let f=0;for(let n=0;n<s.itemIndex;n++){const m=h.children[n];f+=m.offsetHeight+i}s.baseX=l+a/2-t/2,s.baseY=-(f+u/2-e/2)}}}export{T as ImmersiveScene};
