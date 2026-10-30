import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport:{width:390,height:844} });
const page = await context.newPage(); page.setDefaultTimeout(15000);
await page.goto('http://localhost:5175');
await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once:true})); });
await page.getByRole('button',{name:'Abrir ajustes'}).click();
await page.getByRole('button',{name:'Guardar música sin conexión'}).click();
await page.getByText('Las cuatro pistas están guardadas para escuchar sin conexión.').waitFor();
await page.getByRole('button',{name:'Cerrar panel'}).click(); await page.getByRole('dialog').waitFor({state:'hidden'});
await context.setOffline(true);
await page.reload();
await page.getByRole('heading',{name:'Baja el ritmo.'}).waitFor();
const media = await page.evaluate(async () => { const response = await fetch('/audio/chills.mp3', {headers:{Range:'bytes=0-1023'}}); return {status:response.status,size:(await response.arrayBuffer()).byteLength, range:response.headers.get('content-range')}; });
assert.equal(media.status,206); assert.equal(media.size,1024); assert.ok(media.range.startsWith('bytes 0-1023/'));
const voices = await page.evaluate(async () => Promise.all(['sigh','box','slow','body','478','ground','muscle','mindful','kind'].map(async id => {
  const response = await fetch(`/voices/${id}.mp3`, {headers:{Range:'bytes=0-1023'}});
  return {id,status:response.status,size:(await response.arrayBuffer()).byteLength};
})));
for (const voice of voices) { assert.equal(voice.status,206,voice.id); assert.equal(voice.size,1024,voice.id); }
await page.getByRole('button',{name:'Prácticas',exact:true}).click();
assert.equal(await page.locator('.practice-card').count(),9);
await page.screenshot({path:'test-results/offline-practices.png',fullPage:true});
await browser.close(); console.log('Offline OK: app reload, library, music and all nine voice MP3 range responses without network.');
