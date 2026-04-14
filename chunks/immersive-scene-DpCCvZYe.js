import{d as z,V as O,W as k,O as V,b as C,P as E,e as H,M as P,a as F,E as L,f as G}from"./three.js";/*! v1.0.0 | hf3b3d328*/const A=`
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
`;class q extends z{constructor(t=.4,e=.01){super({uniforms:{tDiffuse:{value:null},uPointerUV:{value:null},uInfluenceRadius:{value:t},uMaxShift:{value:e},uEnergy:{value:0}},vertexShader:A,fragmentShader:N}),this.uniforms.uPointerUV.value={x:.5,y:.5}}update(t,e){this.uniforms.uPointerUV.value=t,this.uniforms.uEnergy.value=e}}function B(W,t,e,r,a,o,c,f,m,i){const n=W.attributes.position;if(!n)return;const d=n.count,s=Math.hypot(m,i);if(s<.001){for(let l=0;l<d;l++)n.setXYZ(l,t[l*3],t[l*3+1],0);n.needsUpdate=!0;return}const v=Math.tanh(s/15),h=1/s,g=m*h,x=-i*h,p=f*v;for(let l=0;l<d;l++){const u=t[l*3],y=t[l*3+1],w=u+a,X=y+o,I=w-e,S=X-r,b=Math.sqrt(I*I+S*S);if(b<c){const Y=1-b/c,U=p*Y;n.setXYZ(l,u+g*U,y+x*U,0)}else n.setXYZ(l,u,y,0)}n.needsUpdate=!0}class j{constructor(t){this.canvas=null,this.renderer=null,this.camera=null,this.composer=null,this.rgbShiftPass=null,this.planes=[],this.pointerNDX=0,this.pointerNDY=0,this.pointerUV=new O(.5,.5),this.pointerWorldX=0,this.pointerWorldY=0,this.animationId=null,this.resizeObserver=null,this.pointerHandler=null,this.columnsContainer=null,this.animate=()=>{this.animationId=requestAnimationFrame(this.animate);const e=this.controller.scrollEnergy,r=this.controller.currentScrollDx,a=this.controller.currentScrollDy,o=this.controller.currentOffsetY,c=this.controller.currentItemOffsetY,f=this.controller.currentGlobalOffsetX,m=this.controller.currentColLogicalX;for(const i of this.planes){const n=i.colIndex,d=i.itemIndex,s=f+m[n],v=o[n]??0,h=c[n]?.[d]??0,g=v+h,x=i.baseX+s,p=i.baseY-g;i.mesh.position.set(x,p,0),B(i.mesh.geometry,i.restPositions,this.pointerWorldX,this.pointerWorldY,x,p,this.deformRadius,this.deformStrength,r,a)}e>=.001?this.rgbShiftPass?.update(this.pointerUV,e):this.rgbShiftPass?.update(this.pointerUV,0),this.composer?.render()},this.block=t.block,this.columns=t.columns,this.controller=t.controller,this.deformRadius=t.deformRadius,this.deformStrength=t.deformStrength}async init(){this.columnsContainer=this.block.querySelector(".panding-gallery-columns");const t=this.block.clientWidth,e=this.block.clientHeight,r=document.createElement("canvas");r.style.cssText="position:absolute;inset:0;pointer-events:none;",this.canvas=r,this.block.insertBefore(r,this.block.firstChild);const a=new k({canvas:r,antialias:!0,alpha:!0});a.setPixelRatio(1),a.setSize(t,e,!1),this.renderer=a;const o=new V(-t/2,t/2,e/2,-e/2,-1e3,1e3);o.position.z=1,this.camera=o;const c=new C,f=10,m=this.columns[0]?.offsetWidth??0;this.planes=[];const i=[];for(let s=0;s<this.columns.length;s++){const h=this.columns[s].children,g=s*(m+f);let x=0;for(let p=0;p<h.length;p++){const l=h[p],u=l.querySelector("img"),y=m,w=l.offsetHeight,X=g+y/2-t/2,I=-(x+w/2-e/2),S=new E(y,w,8,8);let b;if(u&&u.complete&&u.naturalWidth>0){const R=new H(u);R.needsUpdate=!0,b=new P({map:R})}else u?(b=new P({transparent:!0}),i.push({planeInfo:null,src:u.src,material:b})):b=new P({transparent:!0});const Y=new F(S,b);Y.position.set(X,I,0),c.add(Y);const U=new Float32Array(S.attributes.position.array),M={mesh:Y,baseX:X,baseY:I,colIndex:s,itemIndex:p,restPositions:U};this.planes.push(M);const D=i.at(-1);D&&D.planeInfo===null&&(D.planeInfo=M),x+=w+f}}for(const{planeInfo:s,src:v}of i){const h=new Image;h.crossOrigin="anonymous",h.onload=()=>{const g=new H(h);g.needsUpdate=!0,s.mesh.material.map=g,s.mesh.material.transparent=!1,s.mesh.material.needsUpdate=!0},h.src=v}const n=new L(a);n.setSize(t,e),n.addPass(new G(c,o));const d=new q;n.addPass(d),this.composer=n,this.rgbShiftPass=d}start(){this.columnsContainer&&(this.columnsContainer.style.visibility="hidden"),this.pointerHandler=t=>{const e=this.block.getBoundingClientRect(),r=e.width,a=e.height,o=t.clientX-e.left,c=t.clientY-e.top;this.pointerNDX=o/r*2-1,this.pointerNDY=-(c/a*2-1),this.pointerUV.set(o/r,1-c/a),this.pointerWorldX=this.pointerNDX*(r/2),this.pointerWorldY=this.pointerNDY*(a/2)},this.block.addEventListener("pointermove",this.pointerHandler),this.resizeObserver=new ResizeObserver(()=>this.onResize()),this.resizeObserver.observe(this.block),this.animate()}cleanup(){this.animationId!==null&&(cancelAnimationFrame(this.animationId),this.animationId=null),this.resizeObserver?.disconnect(),this.resizeObserver=null,this.pointerHandler&&(this.block.removeEventListener("pointermove",this.pointerHandler),this.pointerHandler=null),this.columnsContainer&&(this.columnsContainer.style.visibility="");for(const{mesh:t}of this.planes){t.geometry.dispose();const e=t.material;e.map?.dispose(),e.dispose()}this.planes=[],this.renderer?.dispose(),this.renderer=null,this.canvas?.remove(),this.canvas=null}onResize(){const t=this.block.clientWidth,e=this.block.clientHeight;if(!this.renderer||!this.camera||!this.composer)return;this.renderer.setSize(t,e,!1),this.composer.setSize(t,e),this.camera.left=-t/2,this.camera.right=t/2,this.camera.top=e/2,this.camera.bottom=-e/2,this.camera.updateProjectionMatrix();const r=10,a=this.columns[0]?.offsetWidth??0;for(const o of this.planes){const c=this.columns[o.colIndex],f=c.children[o.itemIndex];if(!f)continue;const m=a,i=f.offsetHeight,n=o.colIndex*(a+r);let d=0;for(let s=0;s<o.itemIndex;s++){const v=c.children[s];d+=v.offsetHeight+r}o.baseX=n+m/2-t/2,o.baseY=-(d+i/2-e/2)}}}export{j as ImmersiveScene};
