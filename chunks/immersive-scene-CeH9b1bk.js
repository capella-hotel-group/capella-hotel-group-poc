import{d as W,V as H,W as z,O as M,b as O,P as k,e as U,M as w,a as V,E as C,f as E}from"./three.js";/*! v1.0.0 | h8e7ebefa*/const L=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,F=`
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
`;class N extends W{constructor(e=.4,t=.006){super({uniforms:{tDiffuse:{value:null},uPointerUV:{value:null},uInfluenceRadius:{value:e},uMaxShift:{value:t},uEnergy:{value:0}},vertexShader:L,fragmentShader:F}),this.uniforms.uPointerUV.value={x:.5,y:.5}}update(e,t){this.uniforms.uPointerUV.value=e,this.uniforms.uEnergy.value=t}}function q(b,e,t,s,a,n,h,r){if(r<.001)return;const i=b.attributes.position;if(!i)return;const f=i.count;for(let o=0;o<f;o++){const m=i.getX(o)+s,u=i.getY(o)+a,l=m-e,d=u-t,c=Math.sqrt(l*l+d*d);let p=0;if(c<n){const g=c/n;p=h*g*r}i.setZ(o,p)}i.needsUpdate=!0}class G{constructor(e){this.canvas=null,this.renderer=null,this.camera=null,this.composer=null,this.rgbShiftPass=null,this.planes=[],this.pointerNDX=0,this.pointerNDY=0,this.pointerUV=new H(.5,.5),this.pointerWorldX=0,this.pointerWorldY=0,this.animationId=null,this.resizeObserver=null,this.pointerHandler=null,this.columnsContainer=null,this.animate=()=>{this.animationId=requestAnimationFrame(this.animate);const t=this.controller.scrollEnergy,s=this.controller.currentOffsetY,a=this.controller.currentItemOffsetY,n=this.controller.currentGlobalOffsetX,h=this.controller.currentColLogicalX;for(const r of this.planes){const i=r.colIndex,f=r.itemIndex,o=n+h[i],m=s[i]??0,u=a[i]?.[f]??0,l=m+u,d=r.baseX+o,c=r.baseY-l;r.mesh.position.set(d,c,0),q(r.mesh.geometry,this.pointerWorldX,this.pointerWorldY,d,c,this.deformRadius,this.deformStrength,t)}t>=.001?this.rgbShiftPass?.update(this.pointerUV,t):this.rgbShiftPass?.update(this.pointerUV,0),this.composer?.render()},this.block=e.block,this.columns=e.columns,this.controller=e.controller,this.deformRadius=e.deformRadius,this.deformStrength=e.deformStrength}async init(){this.columnsContainer=this.block.querySelector(".panding-gallery-columns");const e=this.block.clientWidth,t=this.block.clientHeight,s=document.createElement("canvas");s.style.cssText="position:absolute;inset:0;pointer-events:none;",this.canvas=s,this.block.insertBefore(s,this.block.firstChild);const a=new z({canvas:s,antialias:!0,alpha:!0});a.setPixelRatio(window.devicePixelRatio),a.setSize(e,t,!1),this.renderer=a;const n=new M(-e/2,e/2,t/2,-t/2,-1e3,1e3);n.position.z=1,this.camera=n;const h=new O;this.planes=[];const r=[];for(let o=0;o<this.columns.length;o++){const u=this.columns[o].children;for(let l=0;l<u.length;l++){const d=u[l],c=d.querySelector("img"),p=d.offsetWidth,g=d.offsetHeight,X=d.offsetLeft,D=d.offsetTop,I=X+p/2-e/2,S=-(D+g/2-t/2),R=new k(p,g,8,8);let v;if(c&&c.complete&&c.naturalWidth>0){const P=new U(c);P.needsUpdate=!0,v=new w({map:P})}else c?(v=new w({transparent:!0}),r.push({planeInfo:null,src:c.src,material:v})):v=new w({transparent:!0});const x=new V(R,v);x.position.set(I,S,0),h.add(x);const Y={mesh:x,baseX:I,baseY:S,colIndex:o,itemIndex:l};this.planes.push(Y);const y=r.at(-1);y&&y.planeInfo===null&&(y.planeInfo=Y)}}for(const{planeInfo:o,src:m}of r){const u=new Image;u.crossOrigin="anonymous",u.onload=()=>{const l=new U(u);l.needsUpdate=!0,o.mesh.material.map=l,o.mesh.material.transparent=!1,o.mesh.material.needsUpdate=!0},u.src=m}const i=new C(a);i.addPass(new E(h,n));const f=new N;i.addPass(f),this.composer=i,this.rgbShiftPass=f}start(){this.columnsContainer&&(this.columnsContainer.style.visibility="hidden"),this.pointerHandler=e=>{const t=this.block.getBoundingClientRect(),s=t.width,a=t.height,n=e.clientX-t.left,h=e.clientY-t.top;this.pointerNDX=n/s*2-1,this.pointerNDY=-(h/a*2-1),this.pointerUV.set(n/s,1-h/a),this.pointerWorldX=this.pointerNDX*(s/2),this.pointerWorldY=this.pointerNDY*(a/2)},this.block.addEventListener("pointermove",this.pointerHandler),this.resizeObserver=new ResizeObserver(()=>this.onResize()),this.resizeObserver.observe(this.block),this.animate()}cleanup(){this.animationId!==null&&(cancelAnimationFrame(this.animationId),this.animationId=null),this.resizeObserver?.disconnect(),this.resizeObserver=null,this.pointerHandler&&(this.block.removeEventListener("pointermove",this.pointerHandler),this.pointerHandler=null),this.columnsContainer&&(this.columnsContainer.style.visibility="");for(const{mesh:e}of this.planes){e.geometry.dispose();const t=e.material;t.map?.dispose(),t.dispose()}this.planes=[],this.renderer?.dispose(),this.renderer=null,this.canvas?.remove(),this.canvas=null}onResize(){const e=this.block.clientWidth,t=this.block.clientHeight;if(!(!this.renderer||!this.camera||!this.composer)){this.renderer.setSize(e,t,!1),this.composer.setSize(e,t),this.camera.left=-e/2,this.camera.right=e/2,this.camera.top=t/2,this.camera.bottom=-t/2,this.camera.updateProjectionMatrix();for(const s of this.planes){const n=this.columns[s.colIndex].children[s.itemIndex];if(!n)continue;const h=n.offsetWidth,r=n.offsetHeight,i=n.offsetLeft,f=n.offsetTop;s.baseX=i+h/2-e/2,s.baseY=-(f+r/2-t/2)}}}}export{G as ImmersiveScene};
