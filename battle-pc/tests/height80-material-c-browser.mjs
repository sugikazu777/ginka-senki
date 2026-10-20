import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const evidence = process.env.HEIGHT80_MATERIAL_C_EVIDENCE_DIR;
assert.ok(evidence, 'Set HEIGHT80_MATERIAL_C_EVIDENCE_DIR to a new, run-specific folder.');
assert.equal(fs.existsSync(evidence), false, `Refusing to overwrite an existing evidence folder: ${evidence}`);
fs.mkdirSync(evidence, { recursive: false });

const base = process.env.BATTLE_URL || 'http://127.0.0.1:4174/';
const urlFor = (art, tactics = 0) => `${base}?height80=1&height80-panel=1&height80-panel-open=0&height80-material=soil-rock&height80-art=${art}&height80-tactics=${tactics}&debug=1`;
const adoptedDefaultUrl = `${base}?height80=1&height80-panel=1&height80-panel-open=1&height80-material=soil-rock&height80-tactics=1&debug=1`;
const browser = await chromium.launch({ channel: 'chrome', headless: false });
const context = await browser.newContext({ viewport: { width: 1920, height: 855 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const snap = () => page.evaluate(() => window.battleDebug.snapshot());
const pendingPoint = async () => { const p = (await snap()).pending; return p ? [p.x, p.y] : null; };
const battleState = s => ({
  phase: s.phase,
  round: s.round,
  result: s.result,
  active: s.active,
  selected: s.selected,
  mode: s.mode,
  pending: s.pending,
  path: s.activePath,
  zoom: s.zoom,
  pan: s.pan,
  units: s.units.map(u => [u.id, u.x, u.y, u.hp, u.exp, u.done, u.moved]),
  terrainLift: s.terrainLift
});
const screenshot = (name, options = {}) => page.screenshot({ path: path.join(evidence, name), ...options });
const openPanel = async () => { if (await page.locator('.height80-control-body').isHidden()) await page.locator('#height80-panel-toggle').click(); };
const closePanel = async () => { if (!(await page.locator('.height80-control-body').isHidden())) await page.locator('#height80-panel-toggle').click(); };
const clickPointFor = async ([x,y]) => page.evaluate(([tx,ty]) => {
  const center = window.battleDebug.snapshot().tiles.find(t=>t.x===tx&&t.y===ty).screen;
  for(let radius=0;radius<=34;radius+=2)for(const dy of radius===0?[0]:[-radius,radius])for(let dx=-42;dx<=42;dx+=2){
    const p={x:center.x+dx,y:center.y+dy},hit=window.battleDebug.hitAtScreen(p.x,p.y);
    if(hit?.x===tx&&hit?.y===ty)return p;
  }
  return null;
},[x,y]);

await page.goto(adoptedDefaultUrl);
await page.waitForFunction(() => typeof window.battleDebug === 'object');
assert.equal(await page.locator('[data-height80-art="c"]').getAttribute('aria-pressed'), 'true', 'full-height mode defaults to adopted C when no art is specified');
assert.equal(new URL(page.url()).searchParams.get('height80-art'), 'c', 'default C is made explicit in the address bar for repeatable sharing');
await screenshot('c-adopted-default-first-open.png');
await page.reload();
await page.waitForFunction(() => typeof window.battleDebug === 'object');
assert.equal(await page.locator('[data-height80-art="c"]').getAttribute('aria-pressed'), 'true', 'reload restores C');
await screenshot('c-adopted-default-reload.png');
const newTab = await context.newPage();
await newTab.goto(adoptedDefaultUrl);
await newTab.waitForFunction(() => typeof window.battleDebug === 'object');
assert.equal(await newTab.locator('[data-height80-art="c"]').getAttribute('aria-pressed'), 'true', 'a fresh tab opens in C');
assert.equal(new URL(newTab.url()).searchParams.get('height80-art'), 'c');
await newTab.screenshot({ path: path.join(evidence, 'c-adopted-default-new-tab.png') });
await newTab.close();

await page.goto(urlFor('b', 0));
await page.waitForFunction(() => typeof window.battleDebug === 'object');
assert.equal(await page.locator('[data-height80-art="b"]').getAttribute('aria-pressed'), 'true');
const initialB = await snap();
const liftsByHeight = Object.fromEntries([0,1,2].map(h => [h,[...new Set(initialB.tiles.filter(t=>t.h===h).map(t=>initialB.terrainLift[`${t.x},${t.y}`]))]]));
assert.deepEqual(liftsByHeight, { 0:[0], 1:[80], 2:[160] });
await screenshot('b-current-grid-off-full-1920x855.png');
await screenshot('b-current-left-grass-closeup.png', { clip: { x: 250, y: 285, width: 700, height: 430 } });
await screenshot('b-current-north-terrace-closeup.png', { clip: { x: 820, y: 65, width: 850, height: 500 } });
await screenshot('b-current-front-back-units.png', { clip: { x: 330, y: 275, width: 650, height: 430 } });

await openPanel();
await page.locator('[data-height80-art="a"]').click();
assert.equal(new URL(page.url()).searchParams.get('height80-art'), 'a');
assert.equal(await page.locator('[data-height80-art="a"]').getAttribute('aria-pressed'), 'true');
await page.locator('[data-height80-art="b"]').click();
assert.equal(await page.locator('[data-height80-art="b"]').getAttribute('aria-pressed'), 'true');
const beforeCSwitch = battleState(await snap());
await page.locator('[data-height80-art="c"]').click();
assert.equal(new URL(page.url()).searchParams.get('height80-art'), 'c', 'C selection is encoded in the URL');
assert.equal(await page.locator('[data-height80-art="c"]').getAttribute('aria-pressed'), 'true');
assert.deepEqual(battleState(await snap()), beforeCSwitch, 'B to C keeps battle state, selection, camera, position and height mapping');
await screenshot('c-compare-controls-open.png', { clip: { x: 240, y: 130, width: 760, height: 150 } });
await closePanel();
await screenshot('c-adjusted-grid-off-full-1920x855.png');
await screenshot('c-adjusted-left-grass-closeup.png', { clip: { x: 250, y: 285, width: 700, height: 430 } });
await screenshot('c-adjusted-north-terrace-closeup.png', { clip: { x: 820, y: 65, width: 850, height: 500 } });
await screenshot('c-adjusted-front-back-units.png', { clip: { x: 330, y: 275, width: 650, height: 430 } });

await openPanel();
await page.locator('#height80-tactics-toggle').check();
await closePanel();
const highland = await snap();
const h1 = highland.tiles.find(t => t.x === 2 && t.y === 7 && t.walk && highland.reachable.includes('2,7'));
assert.ok(h1, 'H1 (2,7) is reachable from the normal initial setup.');
await page.mouse.click(h1.screen.x, h1.screen.y);
assert.deepEqual(await pendingPoint(), [2, 7]);
await screenshot('c-grid-on-h1-route.png');
await openPanel();
await page.locator('[data-height80-art="b"]').click();
await closePanel();
await screenshot('b-grid-on-same-h1-route.png');
const beforeRouteC = battleState(await snap());
await openPanel();
await page.locator('[data-height80-art="c"]').click();
assert.deepEqual(battleState(await snap()), beforeRouteC, 'C reselect preserves the visible route');
await closePanel();
await screenshot('c-grid-on-same-h1-route.png');

// Restart only the browser page so the movement check begins from an untouched normal initial position.
await page.goto(urlFor('c', 0));
await page.waitForFunction(() => typeof window.battleDebug === 'object');
const preZoom = await snap();
await page.locator('#zoom-in').click();
await page.locator('#zoom-in').click();
await page.mouse.move(1120, 560);
await page.mouse.down();
await page.mouse.move(1145, 578, { steps: 5 });
await page.mouse.up();
await page.waitForTimeout(250);
const postZoom = await snap();
assert.ok(postZoom.zoom > preZoom.zoom);
assert.notDeepEqual(postZoom.pan, preZoom.pan);
await screenshot('c-after-zoom-pan.png');
const movedTarget = postZoom.tiles.find(t => t.x === 2 && t.y === 7 && t.walk && postZoom.reachable.includes('2,7'));
assert.ok(movedTarget, 'H1 target remains available after zoom and pan.');
await page.mouse.click(movedTarget.screen.x, movedTarget.screen.y);
assert.deepEqual(await pendingPoint(), [2, 7]);
await page.mouse.click(movedTarget.screen.x, movedTarget.screen.y);
await page.waitForFunction(() => { const s = window.battleDebug.snapshot(); return s.undoableMoveActor !== undefined && !s.busy; }, undefined, { timeout: 5000 });
const moved = await snap();
assert.deepEqual([moved.units.find(u => u.id === moved.active).x, moved.units.find(u => u.id === moved.active).y], [2, 7]);
await screenshot('c-h1-landed.png');
await page.locator('#undo-move').click();
await page.waitForFunction(() => { const s = window.battleDebug.snapshot(); return s.undoableMoveActor === undefined && !s.busy; }, undefined, { timeout: 5000 });
const undone = await snap();
assert.deepEqual([undone.units.find(u => u.id === undone.active).x, undone.units.find(u => u.id === undone.active).y], [1, 7]);
assert.equal(undone.units.find(u => u.id === undone.active).moved, false);
await screenshot('c-move-cancel-restored.png');

const wallProbe = await page.evaluate(() => {
  const s = window.battleDebug.snapshot();
  for (const wall of s.wallPolygons) {
    if (!['0,7','1,7','2,7','1,8','2,8'].includes(`${wall.tile.x},${wall.tile.y}`)) continue;
    const p = { x: wall.poly.reduce((sum,v)=>sum+v.x,0)/wall.poly.length, y: wall.poly.reduce((sum,v)=>sum+v.y,0)/wall.poly.length };
    const screen = window.battleDebug.screenWorld(p);
    if (!window.battleDebug.hitAtScreen(screen.x,screen.y)) return { screen, tile:[wall.tile.x,wall.tile.y], side:wall.side };
  }
  return null;
});
assert.ok(wallProbe, 'An exposed left-highland sidewall center is outside floor hit selection.');
const beforeWall = battleState(await snap());
await page.mouse.click(wallProbe.screen.x, wallProbe.screen.y);
assert.deepEqual(battleState(await snap()), beforeWall, 'Sidewall click does not select or move a unit.');
await screenshot('c-sidewall-click-rejected.png');

// Debug-only probe sets a north terrace start; the climb and undo themselves use normal UI input.
await page.goto(`${urlFor('c',1)}&height80-probe=4,2`);
await page.waitForFunction(() => typeof window.battleDebug === 'object');
await page.mouse.move(1450,640);
await page.mouse.down();
await page.mouse.move(1450,700,{steps:6});
await page.mouse.up();
let northStart=await snap();
let northActor=northStart.units.find(u=>u.name==='フィオナ');
assert.equal(northStart.height80ProbeActive,true);
assert.deepEqual([northActor.x,northActor.y],[4,2]);
assert.equal(northStart.tiles.find(t=>t.x===4&&t.y===2).h,1);
assert.equal(northStart.tiles.find(t=>t.x===4&&t.y===1).h,2);
assert.ok(northStart.reachable.includes('4,1'));
await screenshot('c-north-h1-probe-start.png');
const northTarget=await clickPointFor([4,1]);
assert.ok(northTarget,'North H2 upper face has a point resolving to (4,1).');
await page.mouse.click(northTarget.x,northTarget.y);
assert.deepEqual(await pendingPoint(),[4,1]);
await screenshot('c-north-h1-h2-route-preview.png');
await page.mouse.click(northTarget.x,northTarget.y);
await page.waitForFunction(()=>window.battleDebug.snapshot().busy,undefined,{timeout:3000});
await page.waitForTimeout(90);
const northDuring=await snap();
assert.ok(northDuring.motion.some(m=>m.path.length===2),'North transition runs as one ordinary move segment.');
await screenshot('c-north-h1-h2-crossing.png');
await page.waitForFunction(()=>!window.battleDebug.snapshot().busy,undefined,{timeout:12000});
await page.waitForTimeout(80);
const northLanded=await snap();northActor=northLanded.units.find(u=>u.name==='フィオナ');
assert.deepEqual([northActor.x,northActor.y],[4,1]);
assert.equal(northActor.moved,true);
await screenshot('c-north-h2-landed.png');
await page.locator('#undo-move').click();
const northUndone=await snap();northActor=northUndone.units.find(u=>u.name==='フィオナ');
assert.deepEqual([northActor.x,northActor.y],[4,2]);
assert.equal(northActor.moved,false);
await screenshot('c-north-h1-undo-restored.png');
await page.goto(`${base}?debug=1`);
await page.waitForFunction(() => typeof window.battleDebug === 'object');
const normalDefault = await snap();
assert.equal(normalDefault.fullHeight80, false, 'ordinary battle startup does not enable the full-height experiment');
assert.equal(await page.locator('.height80-controls').count(), 0, 'ordinary battle startup has no comparison panel');
assert.equal(normalDefault.terrainLift['4,0'], 94, 'the ordinary north terrace keeps its existing local rendering height');
await screenshot('normal-default-unchanged.png');
assert.deepEqual(errors, []);

fs.writeFileSync(path.join(evidence,'results.json'), JSON.stringify({
  passed:true,
  browser:'visible external Google Chrome controlled through Playwright',
  viewport:'1920x855, deviceScaleFactor 1',
  compareUrls:{b:urlFor('b',1),c:urlFor('c',1)},
  heightMapping:liftsByHeight,
  bCInitialStateEqual:true,
  adoptedDefault:{firstOpen:'C',reload:'C',newTab:'C',height80ArtWrittenToUrl:true},
  artSwitchPreservedState:true,
  leftGrassMaterial:'B renderer retained in both B and C',
  h1Route:[2,7],
  zoomPan:{zoom:postZoom.zoom,pan:postZoom.pan},
  moveUndo:{movedTo:[2,7],restoredTo:[1,7],movedFlagRestored:false},
  sidewallClick:{rejected:true,probe:wallProbe},
  northTerraceProbe:{start:[4,2],destination:[4,1],transition:'H1→H2',routePreview:true,landed:true,undoRestored:true},
  normalDefaultPreserved:{fullHeight80:false,comparisonPanel:false,northTerraceLift:normalDefault.terrainLift['4,0']},
  errors,
  screenshots:fs.readdirSync(evidence).filter(name=>name.endsWith('.png'))
},null,2)+'\n');
await browser.close();
console.log(JSON.stringify({passed:true,evidence,bCInitialStateEqual:true,moveUndo:'passed',northTerraceH1toH2:'passed',sidewallClick:'rejected',errors},null,2));
