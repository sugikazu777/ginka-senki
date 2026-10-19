const backgroundUrl='/assets/bridge-garden.png';
const liliaUrl='/assets/unit-lilia.png';
const grassUrl='/assets/grass.jpg';
const wallUrl='/assets/wall.jpg';

const heights=[40,48,56] as const;
const root=document.querySelector<HTMLElement>('#candidates')!;
const viewBox={x:876,y:72,w:608,h:477};
// H1 is the unchanged local ground reference; only the H1→H2 lift is compared.
const project=(x:number,y:number,h:number,step:number)=>({x:1008+x*78-y*88,y:145+x*35+y*43-14-(h-1)*step});
const point=(p:{x:number;y:number})=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`;
const poly=(points:{x:number;y:number}[])=>points.map(point).join(' ');
const cell=(x:number,y:number,h:number,step:number)=>[
  project(x-.5,y-.5,h,step),project(x+.5,y-.5,h,step),
  project(x+.5,y+.5,h,step),project(x-.5,y+.5,h,step)
];
const unitLow=()=>project(4,2,1,0);
const unitHigh=(step:number)=>project(4,1,2,step);
function card(step:number){
  const id=`terrace-${step}`,upper=cell(4.5,.5,2,step),lower=cell(4.5,.5,1,step),frontTop=[upper[3],upper[2]],frontBottom=[lower[3],lower[2]],westTop=[upper[0],upper[3]],westBottom=[lower[0],lower[3]];
  const low=unitLow(),high=unitHigh(step);
  const svg=`<svg class="scene" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}" role="img" aria-label="高さ${step}pxのテラス比較">
    <defs>
      <pattern id="grass-${step}" width="190" height="150" patternUnits="userSpaceOnUse"><image href="${grassUrl}" width="190" height="150" preserveAspectRatio="xMidYMid slice"/></pattern>
      <pattern id="wall-${step}" width="88" height="66" patternUnits="userSpaceOnUse"><image href="${wallUrl}" width="88" height="66" preserveAspectRatio="xMidYMid slice"/></pattern>
      <clipPath id="upper-clip-${step}"><polygon points="${poly(upper)}"/></clipPath>
    </defs>
    <image href="${backgroundUrl}" x="0" y="0" width="1824" height="864" preserveAspectRatio="none"/>
    <polygon points="${poly(frontBottom.concat([...frontTop].reverse()))}" fill="url(#wall-${step})" stroke="#443e33" stroke-width="2"/>
    <polygon points="${poly(westBottom.concat([...westTop].reverse()))}" fill="url(#wall-${step})" stroke="#39392f" stroke-width="2"/>
    <polygon points="${poly([frontTop[0],frontTop[1],frontBottom[1],frontBottom[0]])}" fill="url(#wall-${step})" opacity=".82"/>
    <path d="M ${point(frontTop[0])} L ${point(frontTop[1])}" stroke="#ead9ad" stroke-width="3" opacity=".72"/>
    <polygon points="${poly(upper)}" fill="url(#grass-${step})" stroke="#e5d8b0" stroke-width="2"/>
    <polygon points="${poly(upper)}" fill="#fff0c5" opacity=".13"/>
    <polygon points="${poly(lower)}" fill="none" stroke="#ecdfb7" stroke-opacity=".55" stroke-width="1.4" stroke-dasharray="5 4"/>
    <ellipse class="shadow" cx="${low.x}" cy="${low.y+3}" rx="24" ry="7" fill="#061816" opacity=".58"/>
    <image class="unit" data-unit="${id}" href="${liliaUrl}" x="${low.x-48}" y="${low.y-128}" width="96" height="128" preserveAspectRatio="xMidYMax meet"/>
    <polygon class="walk-hit" data-walk="${id}" aria-label="テラスを移動" points="${poly(upper)}"/>
    <polygon class="walk-hit" data-walk="${id}" aria-label="下段を移動" points="${poly(cell(4,2,1,0))}"/>
  </svg>`;
  return `<section class="candidate" data-height="${step}" aria-label="${step}ピクセル案"><h2>${step}px <small>${step===48?'第一候補':'比較候補'}</small></h2>${svg}<div class="hint" id="hint-${step}"><strong>隣接する上面をクリック</strong>してリリアを1段上へ。下段マスをクリックすると戻ります。</div></section>`;
}

root.innerHTML=heights.map(card).join('');

function moveLilia(svg:SVGSVGElement,step:number){
  const id=`terrace-${step}`,image=svg.querySelector<SVGImageElement>(`[data-unit="${id}"]`)!;
  const shadow=svg.querySelector<SVGEllipseElement>('.shadow')!,hint=document.querySelector<HTMLElement>(`#hint-${step}`)!;
  const onTop=image.dataset.level==='top',from=onTop?unitHigh(step):unitLow(),to=onTop?unitLow():unitHigh(step),start=performance.now(),duration=720;
  image.dataset.level=onTop?'low':'top';hint.innerHTML=onTop?'<strong>リリアが1段下へ移動しました。</strong> H2 → H1':'<strong>リリアが1段上へ移動しました。</strong> H1 → H2';
  const tick=(now:number)=>{const t=Math.min(1,(now-start)/duration),e=t*t*(3-2*t),x=from.x+(to.x-from.x)*e,y=from.y+(to.y-from.y)*e;image.setAttribute('x',String(x-48));image.setAttribute('y',String(y-128));shadow.setAttribute('cx',String(x));shadow.setAttribute('cy',String(y+3));if(t<1)requestAnimationFrame(tick)};
  requestAnimationFrame(tick);
}

for(const step of heights){
  const svg=root.querySelector<SVGSVGElement>(`[aria-label="高さ${step}pxのテラス比較"]`)!;
  svg.querySelectorAll(`[data-walk="terrace-${step}"]`).forEach(target=>target.addEventListener('click',()=>moveLilia(svg,step)));
  svg.querySelector(`[data-unit="terrace-${step}"]`)!.addEventListener('click',()=>moveLilia(svg,step));
}

const finishedHost=document.querySelector<HTMLElement>('#finished-scene')!;
const finishedHint=document.querySelector<HTMLElement>('#finished-hint')!;
const finishedPoint=(p:{x:number;y:number})=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`;
const finishedPoly=(points:{x:number;y:number}[])=>points.map(finishedPoint).join(' ');
const finishedCell=(x:number,y:number,z:number,step:number)=>[
  project(x-.5,y-.5,z,step),project(x+.5,y-.5,z,step),project(x+.5,y+.5,z,step),project(x-.5,y+.5,z,step)
];
let finishedRise=1;
let finishedBusy=false;
let finishedTop=false;
function renderFinished(){
  const step=56,topZ=finishedRise,upper=finishedCell(4.5,.5,topZ,step),ground=finishedCell(4.5,.5,0,step);
  const backFace=[ground[0],ground[1],upper[1],upper[0]],eastFace=[ground[1],ground[2],upper[2],upper[1]],frontFace=[ground[2],ground[3],upper[3],upper[2]],westFace=[ground[3],ground[0],upper[0],upper[3]];
  const lower=project(4.5,1.5,0,step),raised=project(4.5,.5,topZ,step),lowCell=finishedCell(4.5,1.5,0,step),unit=finishedTop?raised:lower,shadowY=unit.y+2;
  const shadow=`<ellipse class="soft-shadow" cx="${unit.x}" cy="${shadowY}" rx="23" ry="7" fill="#071b16" opacity=".6"/>`;
  const sprite=`<image class="person" href="${liliaUrl}" x="${unit.x-48}" y="${unit.y-128}" width="96" height="128" preserveAspectRatio="xMidYMax meet"/>`;
  const lowPerson=!finishedTop?`${shadow}${sprite}`:'';
  const highPerson=finishedTop?`${shadow}${sprite}`:'';
  const surfaces=`<polygon points="${finishedPoly(backFace)}" fill="url(#stone-wall)"/><polygon points="${finishedPoly(westFace)}" fill="url(#stone-wall)"/><polygon points="${finishedPoly(eastFace)}" fill="url(#stone-wall)"/><polygon points="${finishedPoly(frontFace)}" fill="url(#stone-wall)"/>`;
  const clickAreas=`<polygon class="click-area" data-finish-click data-cell-height="${topZ}" points="${finishedPoly(upper)}"/><polygon class="click-area" data-finish-click data-cell-height="0" points="${finishedPoly(lowCell)}"/>`;
  finishedHost.innerHTML=`<svg class="finished-scene" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}" role="img" aria-label="石造テラス56px仕上げ案">
    <defs>
      <pattern id="grass-top" width="180" height="140" patternUnits="userSpaceOnUse"><image href="${grassUrl}" width="180" height="140" preserveAspectRatio="xMidYMid slice"/></pattern>
      <pattern id="stone-top" width="136" height="92" patternUnits="userSpaceOnUse"><image href="${wallUrl}" width="136" height="92" preserveAspectRatio="xMidYMid slice"/><rect width="136" height="92" fill="#c3b58d" opacity=".28"/><path d="M0 30H136M46 0V30M102 30V61M20 61V92M0 61H136" stroke="#655e4e" stroke-opacity=".3" stroke-width="1"/></pattern>
      <pattern id="stone-wall" width="150" height="108" patternUnits="userSpaceOnUse"><rect width="150" height="108" fill="#696a59"/><image href="${wallUrl}" width="150" height="108" preserveAspectRatio="xMidYMid slice" opacity=".8"/><rect width="150" height="108" fill="#887e5f" opacity=".28"/></pattern>
      <pattern id="stone-inlay" width="86" height="62" patternUnits="userSpaceOnUse"><path d="M0 31L43 0 86 31 43 62Z" fill="none" stroke="#d6c7a4" stroke-opacity=".24" stroke-width="1"/><circle cx="43" cy="31" r="1.5" fill="#eee1c3" opacity=".3"/></pattern>
      <clipPath id="upper-clip"><polygon points="${finishedPoly(upper)}"/></clipPath>
      <linearGradient id="wall-light" x1="0" y1="0" x2="0.9" y2="1"><stop stop-color="#e2d4ad" stop-opacity=".26"/><stop offset=".42" stop-color="#7c785f" stop-opacity=".08"/><stop offset="1" stop-color="#172a27" stop-opacity=".54"/></linearGradient>
      <filter id="ground-blur"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <image href="${backgroundUrl}" x="0" y="0" width="1824" height="864" preserveAspectRatio="none"/>
    <ellipse cx="${project(4.5,.5,0,step).x}" cy="${project(4.5,.5,0,step).y+12}" rx="176" ry="30" fill="#0b1715" opacity=".32" filter="url(#ground-blur)"/>
    ${finishedRise===1?'':lowPerson}
    ${surfaces}
    <polygon points="${finishedPoly(frontFace)}" fill="url(#wall-light)"/>
    <polygon points="${finishedPoly(westFace)}" fill="url(#wall-light)"/>
    ${finishedRise===1?lowPerson:''}
    <g clip-path="url(#upper-clip)"><image href="${backgroundUrl}" x="0" y="${-topZ*step}" width="1824" height="864" preserveAspectRatio="none"/><rect x="0" y="0" width="1824" height="864" fill="#c4b88e" opacity=".09"/></g>
    <path d="M ${finishedPoint(upper[3])} L ${finishedPoint(upper[2])}" stroke="#eadcba" stroke-opacity=".52" stroke-width="2"/>
    ${highPerson}
    ${clickAreas}
  </svg>`;
  const svg=finishedHost.querySelector<SVGSVGElement>('svg')!;
  svg.querySelectorAll<SVGPolygonElement>('[data-finish-click]').forEach(el=>el.addEventListener('click',()=>moveFinished(Number(el.dataset.cellHeight))));
}
function moveFinished(targetHeight:number){
  if(finishedBusy)return;
  const targetTop=targetHeight===finishedRise;
  if(targetTop===finishedTop)return;
  if(finishedRise>1){finishedHint.innerHTML='<strong>2段差は一度に移動できません</strong><span>移動できる高低差は1段までです</span>';return;}
  finishedBusy=true;
  const wasTop=finishedTop,toTop=targetTop,step=56,from=wasTop?project(4.5,.5,finishedRise,step):project(4.5,1.5,0,step),to=wasTop?project(4.5,1.5,0,step):project(4.5,.5,finishedRise,step);
  const svg=finishedHost.querySelector<SVGSVGElement>('svg')!,shadow=svg.querySelector<SVGEllipseElement>('.soft-shadow');
  const currentImage=svg.querySelector<SVGImageElement>('.person');
  finishedHint.innerHTML=toTop?'<strong>1段上へ移動中</strong><span>隣接する歩行面へ移動しています</span>':'<strong>1段下へ移動中</strong><span>隣接する歩行面へ移動しています</span>';
  const start=performance.now(),duration=toTop?1100:1100;
  const tick=(now:number)=>{const t=Math.min(1,(now-start)/duration),e=t*t*(3-2*t),x=from.x+(to.x-from.x)*e,y=from.y+(to.y-from.y)*e;if(currentImage){currentImage.setAttribute('x',String(x-48));currentImage.setAttribute('y',String(y-128));}if(shadow){shadow.setAttribute('cx',String(x));shadow.setAttribute('cy',String(y+2));}if(t<1){requestAnimationFrame(tick);return;}finishedTop=toTop;finishedBusy=false;renderFinished();finishedHint.innerHTML=toTop?'<strong>リリアは1段上の面にいます</strong><span>隣の下段マスをクリックして戻ります</span>':'<strong>リリアは下段にいます</strong><span>隣の上面をクリックして上ります</span>';};
  requestAnimationFrame(tick);
}
document.querySelectorAll<HTMLButtonElement>('.height-switch button').forEach(button=>button.addEventListener('click',()=>{if(finishedBusy)return;finishedRise=Number(button.dataset.rise);finishedTop=false;document.querySelectorAll('.height-switch button').forEach(candidate=>candidate.setAttribute('aria-pressed',String(candidate===button)));renderFinished();finishedHint.innerHTML=finishedRise===1?'<strong>リリアは下段にいます</strong><span>隣接する上面をクリックして1段上へ移動</span>':'<strong>2段差は一度に移動できません</strong><span>移動できる高低差は1段までです</span>'; }));
renderFinished();
