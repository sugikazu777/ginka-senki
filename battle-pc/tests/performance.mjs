import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1900,height:900}});await page.goto('http://127.0.0.1:4174/?debug=1');await page.waitForFunction(()=>window.battleDebug);await page.waitForTimeout(3500);console.log(await page.evaluate(()=>{const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {fps:window.battleDebug.snapshot().fps,renderer:gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),heap:performance.memory?.usedJSHeapSize,texture:gl.getParameter(gl.MAX_TEXTURE_SIZE)}}));await browser.close();
