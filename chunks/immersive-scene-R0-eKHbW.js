import{b as e,c as t,g as n,l as r,m as i,s as a,t as o,u as s}from"./three-core.js";import{n as c,r as l,t as u}from"./three-examples.js";var d=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,f=`
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
`,p=class extends l{constructor(e=.6,t=.008){super({uniforms:{tDiffuse:{value:null},uPointerUV:{value:null},uInfluenceRadius:{value:e},uMaxShift:{value:t},uEnergy:{value:0}},vertexShader:d,fragmentShader:f}),this.uniforms.uPointerUV.value={x:.5,y:.5}}update(e,t){this.uniforms.uPointerUV.value=e,this.uniforms.uEnergy.value=t}};function m(e,t,n,r,i,a,o,s,c,l){let u=e.attributes.position;if(!u)return;let d=u.count,f=Math.hypot(c,l);if(f<.001){for(let e=0;e<d;e++)u.setXYZ(e,t[e*3],t[e*3+1],0);u.needsUpdate=!0;return}let p=Math.tanh(f/15),m=1/f,h=c*m,g=-l*m,_=s*p;for(let e=0;e<d;e++){let s=t[e*3],c=t[e*3+1],l=s+i,d=c+a,f=l-n,p=d-r,m=Math.sqrt(f*f+p*p);if(m<o){let t=_*(1-m/o);u.setXYZ(e,s+h*t,c+g*t,0)}else u.setXYZ(e,s,c,0)}u.needsUpdate=!0}var h=class{constructor(t){this.canvas=null,this.renderer=null,this.camera=null,this.composer=null,this.rgbShiftPass=null,this.planes=[],this.pointerNDX=0,this.pointerNDY=0,this.pointerUV=new e(.5,.5),this.pointerWorldX=0,this.pointerWorldY=0,this.animationId=null,this.resizeObserver=null,this.pointerHandler=null,this.columnsContainer=null,this.animate=()=>{this.animationId=requestAnimationFrame(this.animate);let e=this.controller.scrollEnergy,t=this.controller.currentScrollDx,n=this.controller.currentScrollDy,r=this.controller.currentOffsetY,i=this.controller.currentItemOffsetY,a=this.controller.currentGlobalOffsetX,o=this.controller.currentColLogicalX;for(let e of this.planes){let s=e.colIndex,c=e.itemIndex,l=a+o[s],u=(r[s]??0)+(i[s]?.[c]??0),d=e.baseX+l,f=e.baseY-u;e.mesh.position.set(d,f,0),m(e.mesh.geometry,e.restPositions,this.pointerWorldX,this.pointerWorldY,d,f,this.deformRadius,this.deformStrength,t,n)}e>=.001?this.rgbShiftPass?.update(this.pointerUV,e):this.rgbShiftPass?.update(this.pointerUV,0),this.composer?.render()},this.block=t.block,this.columns=t.columns,this.controller=t.controller,this.deformRadius=t.deformRadius,this.deformStrength=t.deformStrength}async init(){this.columnsContainer=this.block.querySelector(`.panding-gallery-columns`);let e=this.block.clientWidth,l=this.block.clientHeight,d=document.createElement(`canvas`);d.style.cssText=`position:absolute;inset:0;pointer-events:none;`,this.canvas=d,this.block.insertBefore(d,this.block.firstChild);let f=new o({canvas:d,antialias:!0,alpha:!0});f.setPixelRatio(1),f.setSize(e,l,!1),this.renderer=f;let m=new r(-e/2,e/2,l/2,-l/2,-1e3,1e3);m.position.z=1,this.camera=m;let h=new i,g=this.columns[0]?.offsetWidth??0;this.planes=[];let _=[];for(let r=0;r<this.columns.length;r++){let i=this.columns[r].children,o=r*(g+10),c=0;for(let u=0;u<i.length;u++){let d=i[u],f=d.querySelector(`img`),p=g,m=d.offsetHeight,v=o+p/2-e/2,y=-(c+m/2-l/2),b=new s(p,m,8,8),x;if(f&&f.complete&&f.naturalWidth>0){let e=new n(f);e.needsUpdate=!0,x=new t({map:e})}else f?(x=new t({transparent:!0}),_.push({planeInfo:null,src:f.src,material:x})):x=new t({transparent:!0});let S=new a(b,x);S.position.set(v,y,0),h.add(S);let C=new Float32Array(b.attributes.position.array),w={mesh:S,baseX:v,baseY:y,colIndex:r,itemIndex:u,restPositions:C};this.planes.push(w);let T=_.at(-1);T&&T.planeInfo===null&&(T.planeInfo=w),c+=m+10}}for(let{planeInfo:e,src:t}of _){let r=new Image;r.crossOrigin=`anonymous`,r.onload=()=>{let t=new n(r);t.needsUpdate=!0,e.mesh.material.map=t,e.mesh.material.transparent=!1,e.mesh.material.needsUpdate=!0},r.src=t}let v=new c(f);v.setSize(e,l),v.addPass(new u(h,m));let y=new p;v.addPass(y),this.composer=v,this.rgbShiftPass=y}start(){this.columnsContainer&&(this.columnsContainer.style.visibility=`hidden`),this.pointerHandler=e=>{let t=this.block.getBoundingClientRect(),n=t.width,r=t.height,i=e.clientX-t.left,a=e.clientY-t.top;this.pointerNDX=i/n*2-1,this.pointerNDY=-(a/r*2-1),this.pointerUV.set(i/n,1-a/r),this.pointerWorldX=this.pointerNDX*(n/2),this.pointerWorldY=this.pointerNDY*(r/2)},this.block.addEventListener(`pointermove`,this.pointerHandler),this.resizeObserver=new ResizeObserver(()=>this.onResize()),this.resizeObserver.observe(this.block),this.animate()}cleanup(){this.animationId!==null&&(cancelAnimationFrame(this.animationId),this.animationId=null),this.resizeObserver?.disconnect(),this.resizeObserver=null,this.pointerHandler&&=(this.block.removeEventListener(`pointermove`,this.pointerHandler),null),this.columnsContainer&&(this.columnsContainer.style.visibility=``);for(let{mesh:e}of this.planes){e.geometry.dispose();let t=e.material;t.map?.dispose(),t.dispose()}this.planes=[],this.renderer?.dispose(),this.renderer=null,this.canvas?.remove(),this.canvas=null}onResize(){let e=this.block.clientWidth,t=this.block.clientHeight;if(!this.renderer||!this.camera||!this.composer)return;this.renderer.setSize(e,t,!1),this.composer.setSize(e,t),this.camera.left=-e/2,this.camera.right=e/2,this.camera.top=t/2,this.camera.bottom=-t/2,this.camera.updateProjectionMatrix();let n=this.columns[0]?.offsetWidth??0;for(let r of this.planes){let i=this.columns[r.colIndex],a=i.children[r.itemIndex];if(!a)continue;let o=n,s=a.offsetHeight,c=r.colIndex*(n+10),l=0;for(let e=0;e<r.itemIndex;e++){let t=i.children[e];l+=t.offsetHeight+10}r.baseX=c+o/2-e/2,r.baseY=-(l+s/2-t/2)}}};export{h as ImmersiveScene};