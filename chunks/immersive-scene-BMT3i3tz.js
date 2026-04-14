import{d as U,V as k,W as C,O as W,b as z,P as M,M as H,a as O,T as V,E as B,e as E}from"./three.js";/*! v1.0.0 | h55eb2885*/const F=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,L=`
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
`;class N extends U{constructor(t=.4,e=.006){super({uniforms:{tDiffuse:{value:null},uPointerUV:{value:null},uInfluenceRadius:{value:t},uMaxShift:{value:e},uEnergy:{value:0}},vertexShader:F,fragmentShader:L}),this.uniforms.uPointerUV.value={x:.5,y:.5}}update(t,e){this.uniforms.uPointerUV.value=t,this.uniforms.uEnergy.value=e}}function q(g,t,e,n,s,l,a,i){if(i<.001)return;const o=g.attributes.position;if(!o)return;const d=o.count;for(let c=0;c<d;c++){const r=o.getX(c)+n,m=o.getY(c)+s,u=r-t,h=m-e,f=Math.sqrt(u*u+h*h);let b=0;if(f<l){const p=f/l;b=a*p*i}o.setZ(c,b)}o.needsUpdate=!0}const G=new V;class A{constructor(t){this.canvas=null,this.renderer=null,this.camera=null,this.composer=null,this.rgbShiftPass=null,this.planes=[],this.pointerNDX=0,this.pointerNDY=0,this.pointerUV=new k(.5,.5),this.pointerWorldX=0,this.pointerWorldY=0,this.animationId=null,this.resizeObserver=null,this.pointerHandler=null,this.columnsContainer=null,this.animate=()=>{this.animationId=requestAnimationFrame(this.animate);const e=this.controller.scrollEnergy,n=this.controller.currentOffsetY,s=this.controller.currentItemOffsetY,l=this.controller.currentGlobalOffsetX,a=this.controller.currentColLogicalX;for(const i of this.planes){const o=i.colIndex,d=i.itemIndex,c=l+a[o],r=n[o]??0,m=s[o]?.[d]??0,u=r+m,h=i.baseX+c,f=i.baseY-u;i.mesh.position.set(h,f,0),q(i.mesh.geometry,this.pointerWorldX,this.pointerWorldY,h,f,this.deformRadius,this.deformStrength,e)}e>=.001&&(this.rgbShiftPass?.update(this.pointerUV,e),this.composer?.render())},this.block=t.block,this.columns=t.columns,this.controller=t.controller,this.deformRadius=t.deformRadius,this.deformStrength=t.deformStrength}async init(){this.columnsContainer=this.block.querySelector(".panding-gallery-columns");const t=this.block.clientWidth,e=this.block.clientHeight,n=document.createElement("canvas");n.style.cssText="position:absolute;inset:0;pointer-events:none;",this.canvas=n,this.block.insertBefore(n,this.block.firstChild);const s=new C({canvas:n,antialias:!0,alpha:!0});s.setPixelRatio(window.devicePixelRatio),s.setSize(t,e,!1),this.renderer=s;const l=new W(-t/2,t/2,e/2,-e/2,-1e3,1e3);l.position.z=1,this.camera=l;const a=new z,i=this.block.getBoundingClientRect();this.planes=[];const o=[];for(let r=0;r<this.columns.length;r++){const u=this.columns[r].children;for(let h=0;h<u.length;h++){const f=u[h],p=f.querySelector("picture")?.querySelector("img"),v=f.getBoundingClientRect(),y=v.width,R=v.height,P=v.left-i.left,X=v.top-i.top,w=P+y/2-t/2,S=-(X+R/2-e/2),D=new M(y,R,8,8),I=new H({transparent:!0}),x=new O(D,I);x.position.set(w,S,0),a.add(x);const Y={mesh:x,baseX:w,baseY:S,colIndex:r,itemIndex:h};this.planes.push(Y),p?.src&&o.push({planeInfo:Y,src:p.src})}}for(const{planeInfo:r,src:m}of o)G.load(m,u=>{r.mesh.material.map=u,r.mesh.material.needsUpdate=!0},void 0,()=>{});const d=new B(s);d.addPass(new E(a,l));const c=new N;d.addPass(c),this.composer=d,this.rgbShiftPass=c}start(){this.columnsContainer&&(this.columnsContainer.style.visibility="hidden"),this.pointerHandler=t=>{const e=this.block.getBoundingClientRect(),n=e.width,s=e.height,l=t.clientX-e.left,a=t.clientY-e.top;this.pointerNDX=l/n*2-1,this.pointerNDY=-(a/s*2-1),this.pointerUV.set(l/n,1-a/s),this.pointerWorldX=this.pointerNDX*(n/2),this.pointerWorldY=this.pointerNDY*(s/2)},this.block.addEventListener("pointermove",this.pointerHandler),this.resizeObserver=new ResizeObserver(()=>this.onResize()),this.resizeObserver.observe(this.block),this.animate()}cleanup(){this.animationId!==null&&(cancelAnimationFrame(this.animationId),this.animationId=null),this.resizeObserver?.disconnect(),this.resizeObserver=null,this.pointerHandler&&(this.block.removeEventListener("pointermove",this.pointerHandler),this.pointerHandler=null),this.columnsContainer&&(this.columnsContainer.style.visibility="");for(const{mesh:t}of this.planes){t.geometry.dispose();const e=t.material;e.map?.dispose(),e.dispose()}this.planes=[],this.renderer?.dispose(),this.renderer=null,this.canvas?.remove(),this.canvas=null}onResize(){const t=this.block.clientWidth,e=this.block.clientHeight;if(!this.renderer||!this.camera||!this.composer)return;this.renderer.setSize(t,e,!1),this.composer.setSize(t,e),this.camera.left=-t/2,this.camera.right=t/2,this.camera.top=e/2,this.camera.bottom=-e/2,this.camera.updateProjectionMatrix();const n=this.block.getBoundingClientRect();for(const s of this.planes){const a=this.columns[s.colIndex].children[s.itemIndex];if(!a)continue;const i=a.getBoundingClientRect(),o=i.width,d=i.height,c=i.left-n.left,r=i.top-n.top;s.baseX=c+o/2-t/2,s.baseY=-(r+d/2-e/2)}}}export{A as ImmersiveScene};
