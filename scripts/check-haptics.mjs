import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport:{width:390,height:844}});
  await page.addInitScript(() => {
    window.__pulses = [];
    Object.defineProperty(navigator, 'vibrate', {configurable:true, value:pattern=>{
      window.__pulses.push(pattern); return window.__acceptVibration !== false;
    }});
  });
  await page.goto(process.env.BRISA_URL || 'http://localhost:5174');
  await page.getByRole('button',{name:'Abrir ajustes'}).click();
  await page.getByRole('switch',{name:'Vibración suave',exact:true}).check();
  await page.waitForTimeout(700);
  const pulses = await page.evaluate(()=>window.__pulses);
  const index = pulses.findLastIndex(p=>Array.isArray(p));
  assert.deepEqual(pulses[index],[250,150,250]);
  assert.ok(!pulses.slice(index+1).includes(0),'Enabling haptics must not immediately cancel its preview');
  await page.getByRole('button',{name:'Probar vibración',exact:true}).click();
  await page.getByText(/Prueba enviada: dos pulsos/).waitFor();
  await page.evaluate(()=>window.__acceptVibration=false);
  await page.getByRole('button',{name:'Probar vibración',exact:true}).click();
  await page.getByText(/El navegador rechazó la vibración/).waitFor();
  await page.getByRole('switch',{name:'Vibración suave',exact:true}).uncheck();
  assert.equal(await page.evaluate(()=>window.__pulses.at(-1)),0);
  console.log('Haptics OK: preview survives state change, retry, rejected API feedback and explicit cancellation. Physical hardware requires a phone.');
} finally { await browser.close(); }
