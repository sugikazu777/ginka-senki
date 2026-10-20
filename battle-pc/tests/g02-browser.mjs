import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here=path.dirname(fileURLToPath(import.meta.url));
const evidence=path.resolve(here,'../evidence/g02-20261019');
fs.mkdirSync(evidence,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1920,height:855},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.BATTLE_URL||'http://127.0.0.1:4173/';
const shot=async name=>page.screenshot({path:path.join(evidence,name),animations:'disabled'});
const state=()=>page.evaluate(()=>window.battleDebug.snapshot());
const signature=s=>JSON.stringify({phase:s.phase,round:s.round,result:s.result,active:s.active,selected:s.selected,units:s.units.map(({id,x,y,hp,exp,done,moved})=>({id,x,y,hp,exp,done,moved}))});
const tileAt=(s,x,y)=>{const t=s.tiles.find(t=>t.x===x&&t.y===y);assert.ok(t,`logical tile (${x},${y}) is present`);return t};
const inspectTile=async(x,y,expected)=>{const s=await state(),t=tileAt(s,x,y);await page.mouse.move(t.screen.x,t.screen.y);await page.mouse.click(t.screen.x,t.screen.y);const text=await page.locator('#g02-info').innerText();assert.match(text,new RegExp(`\\(${x}, ${y}\\) \\/ H${t.h}`));if(expected)assert.ok(text.includes(expected),`${text} should contain ${expected}`);return{text,t}};

try{
 await page.goto(`${base}?debug=1`);await page.waitForFunction(()=>window.battleDebug);await page.waitForTimeout(500);assert.equal(await page.locator('#g02-panel').isVisible(),false,'normal play hides diagnostic UI');await shot('00-normal-battle.png');
 await page.goto(`${base}?debug=1&g02=1`);await page.waitForFunction(()=>window.battleDebug);await page.waitForTimeout(700);assert.equal(await page.locator('#g02-panel').isVisible(),true);let initial=await state();const expectedPass=initial.tiles.filter(t=>t.walk).length,expectedBlocked=initial.tiles.length-expectedPass;assert.equal(initial.tiles.length,80);assert.equal(new Set(initial.tiles.map(t=>t.h)).size,3);assert.equal(await page.locator('#g02-count').innerText(),`${initial.tiles.length}マス · 通行可能 ${expectedPass} / 不可 ${expectedBlocked}`);assert.equal(await page.locator('#move').isEnabled(),false);assert.equal(await page.locator('#mission').isEnabled(),false);await shot('01-all-heights-passability-and-feet.png');
 const baseline=signature(initial);const bridge=await inspectTile(3,4,'石橋');assert.equal(bridge.t.type,'bridge');assert.equal(bridge.t.walk,true);await shot('02-stone-bridge-3-4.png');
 const bank=await inspectTile(2,3,'川・水面');assert.equal(bank.t.type,'water');assert.equal(bank.t.walk,false);await shot('03-river-water-2-3.png');const land=await inspectTile(3,3,'草地');assert.equal(land.t.walk,true);await shot('04-riverbank-land-3-3.png');
 const step1=await inspectTile(3,2,'H1');const step2=await inspectTile(4,0,'H2');assert.equal(step1.t.h,1);assert.equal(step2.t.h,2);assert.equal(step2.t.walk,true);await shot('05-height-steps-h1-h2.png');
 await page.getByRole('button',{name:'診断表示を隠す'}).click();assert.equal(await page.getByRole('button',{name:'診断表示を表示'}).isVisible(),true);assert.equal(signature(await state()),baseline,'hiding overlays must not advance battle state');await page.getByRole('button',{name:'診断表示を表示'}).click();
 const slider=page.locator('#g02-opacity'),sliderBox=await slider.boundingBox();assert.ok(sliderBox);const setOpacity=async value=>page.mouse.click(sliderBox.x+sliderBox.width*value/100,sliderBox.y+sliderBox.height/2);await setOpacity(0);await shot('07-background-only.png');await setOpacity(62);
 await page.locator('#g02-label-mode').selectOption('hover');await inspectTile(4,0,'H2');assert.equal(await page.locator('#g02-label-mode').inputValue(),'hover');await page.locator('#g02-label-mode').selectOption('all');
 await page.keyboard.press('w');await page.keyboard.press('a');await page.keyboard.press('m');assert.equal(await page.locator('#wait').isEnabled(),false);assert.equal(signature(await state()),baseline,'keyboard and command inputs must not change battle state during diagnosis');
 const enemyUnit=initial.units.find(u=>u.name==='敵剣士');assert.ok(enemyUnit);await page.mouse.click(enemyUnit.screen.x,enemyUnit.screen.y-50);const unitInfo=await page.locator('#g02-info').innerText();assert.ok(unitInfo.includes('通常操作の選択先: 人物「敵剣士」'),unitInfo);assert.equal(signature(await state()),baseline,'unit selection inspection must not affect battle');await shot('06-character-hit-target.png');
 const pref=await state();await page.locator('#zoom-in').click();await page.waitForTimeout(80);let zoomed=await state();assert.ok(zoomed.zoom>pref.zoom);const zoomBridge=tileAt(zoomed,3,4);await page.mouse.move(zoomBridge.screen.x,zoomBridge.screen.y);await page.mouse.click(zoomBridge.screen.x,zoomBridge.screen.y);assert.match(await page.locator('#g02-info').innerText(),/\(3, 4\) \/ H0/);assert.equal(signature(await state()),baseline);await page.mouse.move(1150,470);await page.mouse.down();await page.mouse.move(1200,510,{steps:8});await page.mouse.up();const panned=await state();assert.ok(panned.pan.x!==zoomed.pan.x||panned.pan.y!==zoomed.pan.y);const pannedBridge=tileAt(panned,3,4);await page.mouse.move(pannedBridge.screen.x,pannedBridge.screen.y);await page.mouse.click(pannedBridge.screen.x,pannedBridge.screen.y);assert.match(await page.locator('#g02-info').innerText(),/\(3, 4\) \/ H0/);assert.equal(signature(await state()),baseline);await shot('08-zoom-pan-hit-match.png');
 await page.getByRole('button',{name:'診断を終了して戦闘へ戻る'}).click();assert.equal(await page.locator('#g02-panel').isVisible(),false);assert.equal(await page.locator('#move').isEnabled(),true);assert.equal(signature(await state()),baseline,'ending diagnosis resumes the identical battle state');assert.ok((await page.url()).includes('debug=1')&&!new URL(page.url()).searchParams.has('g02'));await shot('09-normal-play-resumed.png');
 assert.deepEqual(errors,[],'browser console has no page errors');
 const result={viewport:'1920x855',tiles:initial.tiles.length,passable:expectedPass,blocked:expectedBlocked,heights:[...new Set(initial.tiles.map(t=>t.h))].sort(),bridge:bridge.text,riverbank:bank.text,land:land.text,unitHit:unitInfo.split('\n').filter(x=>x.includes('通常操作の選択先'))[0],footAnchorUnits:initial.units.length,stateUnchangedAcrossDiagnostic:true,zoom:zoomed.zoom,pan:panned.pan,pageErrors:errors,evidence};fs.writeFileSync(path.join(evidence,'g02-browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await browser.close()}
