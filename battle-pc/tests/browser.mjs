import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1900,height:900},deviceScaleFactor:1});
process.on('uncaughtException',async e=>{console.error(e);try{await page.screenshot({path:'evidence/failure.png'});console.error(JSON.stringify(await page.evaluate(()=>window.battleDebug?.snapshot())))}catch{}await browser.close();process.exit(1)});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const started=Date.now();await page.goto(process.env.BATTLE_URL||'http://127.0.0.1:4173/?debug=1');await page.waitForFunction(()=>window.battleDebug);const loadMs=Date.now()-started;
const state=()=>page.evaluate(()=>window.battleDebug.snapshot());
const idle=()=>page.waitForFunction(()=>{const s=window.battleDebug.snapshot();return !s.busy&&(s.phase==='ally'||s.result)});
const shot=name=>page.screenshot({path:`evidence/${name}.png`});
async function tileClick(x,y){const s=await state(),t=s.tiles.find(t=>t.x===x&&t.y===y);await page.mouse.click(t.screen.x,t.screen.y);}
async function move(x,y){await page.locator('#move').click();await tileClick(x,y);await tileClick(x,y);await idle();}
async function attack(id){await page.locator('#attack').click();let s=await state(),e=s.units[id];await page.mouse.click(e.screen.x,e.screen.y-30);await page.mouse.click(e.screen.x,e.screen.y-30);await idle()}
await shot('01-initial');
await page.getByRole('button',{name:'リリアを選択'}).click();assert.equal(await page.locator('#move').isDisabled(),true);
await page.getByRole('button',{name:'フィオナを選択'}).click();
await move(3,7);let s=await state();assert.deepEqual([s.units[2].x,s.units[2].y],[3,7]);assert.ok(s.units[2].moved);
await page.locator('#wait').click();await idle();s=await state();assert.equal(s.active,0);
await page.locator('#move').click();await tileClick(3,3);await shot('02-lilia-path');await tileClick(3,3);await idle();s=await state();assert.deepEqual([s.units[0].x,s.units[0].y],[3,3]);
await page.locator('#attack').click();await page.mouse.click(s.units[4].screen.x,s.units[4].screen.y-30);await shot('03-attack-preview');await page.mouse.click(s.units[4].screen.x,s.units[4].screen.y-30);await idle();s=await state();assert.equal(s.units[4].hp,14);assert.equal(s.units[0].exp,10);await shot('04-hp-after-attack');
// Finish the mission exclusively through rendered controls and pointer input.
let actions=0;const turns=[];
while(!(s=await state()).result&&actions++<75){await idle();s=await state();if(s.result)break;const a=s.units[s.active],enemies=s.units.filter(u=>u.side==='enemy'&&u.hp>0);turns.push({round:s.round,actor:a.name,hp:a.hp});console.log('ACTION',actions,'round',s.round,a.name,a.x,a.y,'enemyHP',enemies.map(e=>e.hp));
 if(s.selected!==a.id)await page.getByRole('button',{name:`${a.name}を選択`}).click();
 const distance=(p,q)=>Math.abs(p.x-q.x)+Math.abs(p.y-q.y);
 const candidates=s.reachable.map(k=>{const [x,y]=k.split(',').map(Number);return{x,y}});
 let best={x:a.x,y:a.y,score:-Infinity};
 for(const p of candidates){let score=-Math.min(...enemies.map(e=>Math.max(0,distance(p,e)-a.rmax)))*12;const targets=enemies.filter(e=>distance(p,e)>=a.rmin&&distance(p,e)<=a.rmax);if(targets.length)score+=100+Math.max(...targets.map(e=>Math.min(e.hp,Math.max(1,a.atk-e.def))*4+(e.hp<=a.atk-e.def?70:0)));score-=enemies.reduce((n,e)=>n+(distance(p,e)>=e.rmin&&distance(p,e)<=e.rmax?Math.max(1,e.atk-a.def):0),0)*1.2;score-=distance(a,p)*.1;if(score>best.score)best={...p,score}}
 if(!a.moved&&(best.x!==a.x||best.y!==a.y)){
 await move(best.x,best.y);s=await state();
 // A tall sprite may cover the center of a destination. Try the clear right half of its diamond.
 if(!s.units[a.id].moved){await page.getByRole('button',{name:`${a.name}を選択`}).click();await page.locator('#move').click();const t=s.tiles.find(t=>t.x===best.x&&t.y===best.y);await page.mouse.click(t.screen.x+30,t.screen.y);await page.mouse.click(t.screen.x+30,t.screen.y);await idle();s=await state()}
 }
 const actor=s.units[a.id];const targets=enemies.filter(e=>distance(actor,e)>=a.rmin&&distance(actor,e)<=a.rmax).sort((e,f)=>(e.hp<=a.atk-e.def?-100:0)+e.hp-((f.hp<=a.atk-f.def?-100:0)+f.hp));
 if(targets.length){await attack(targets[0].id);const after=await state();if(after.active===a.id&&!after.result){await page.locator('#wait').click();await idle()}}
 else {await page.locator('#wait').click();await idle()}
}
s=await state();await shot('05-result');assert.equal(s.result,'win',JSON.stringify(s));assert.ok(s.round>=2);assert.ok(s.units.some(u=>u.side==='ally'&&u.hp<u.max));assert.ok(s.units.some(u=>u.exp>=30));
await page.locator('#again').click();await idle();await page.mouse.move(1000,450);await page.mouse.wheel(0,-250);await page.waitForTimeout(120);assert.ok((await state()).zoom>1);await page.mouse.move(1000,450);await page.mouse.down();await page.mouse.move(1100,500,{steps:8});await page.mouse.up();assert.ok(Math.abs((await state()).pan.x)>5);await page.locator('#recenter').click();assert.equal((await state()).zoom,1);
await page.locator('#mission').selectOption('capture');assert.equal((await state()).units.length,7);await page.locator('#mission').selectOption('escort');assert.equal((await state()).units.length,8);await page.locator('#mission').selectOption('wipe');
await page.locator('#help').click();assert.equal(await page.locator('#help-dialog').isVisible(),true);await page.locator('#close-help').click();
for(const size of [{width:1536,height:864},{width:1280,height:720},{width:2560,height:1080}]){await page.setViewportSize(size);await page.waitForTimeout(200);await shot(`responsive-${size.width}x${size.height}`);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
await page.setViewportSize({width:1900,height:900});await page.waitForTimeout(1100);const final=await state();await shot('06-final');
assert.deepEqual(errors,[]);fs.writeFileSync('evidence/browser-results.json',JSON.stringify({passed:true,loadMs,fps:final.fps,actions,winRound:s.round,remainingHP:s.units.map(u=>({name:u.name,hp:u.hp,exp:u.exp})),viewports:['1900x900','1536x864','1280x720','2560x1080'],errors,turns},null,2));console.log(JSON.stringify({passed:true,loadMs,fps:final.fps,actions,winRound:s.round,errors}));await browser.close();
