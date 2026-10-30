import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true});
  const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
  await page.addInitScript(()=>{
    const NativeAudio=window.Audio;
    window.__players=[];
    window.Audio=class extends NativeAudio {constructor(...args){super(...args);window.__players.push(this);}};
  });
  await page.goto(process.env.BRISA_URL || 'http://localhost:5174');
  const metadata=await page.evaluate(async()=>Promise.all(['sigh','box','slow','body','478','ground','muscle','mindful','kind'].map(id=>new Promise((resolve,reject)=>{
    const audio=new Audio(`/voices/${id}.mp3`);
    audio.onloadedmetadata=()=>resolve({id,duration:audio.duration});
    audio.onerror=()=>reject(new Error(`Invalid MP3: ${id}`));
  }))));
  for(const audio of metadata) assert.ok(audio.duration>35&&audio.duration<55,JSON.stringify(audio));
  await page.getByRole('button',{name:'Comenzar 1 minuto',exact:true}).click();
  await page.getByRole('button',{name:'Comenzar mi pausa'}).click();
  await page.getByRole('button',{name:'Pausar guía',exact:true}).waitFor();
  await page.waitForTimeout(1200);
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'0','Exercise clock must wait for introduction');
  assert.equal(await page.evaluate(()=>window.__players.some(p=>p.src.endsWith('/voices/sigh.mp3')&&!p.paused&&p.currentTime>0)),true);
  await page.getByRole('button',{name:'Pausar guía',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.__players.every(p=>p.paused)),true);
  await page.getByRole('button',{name:'Continuar guía',exact:true}).click();
  await page.getByRole('button',{name:'Pausar guía',exact:true}).waitFor();
  await page.screenshot({path:'test-results/voice-intro-mobile.png'});
  // Reach the actual audio end quickly while retaining the browser's natural ended event.
  await page.evaluate(()=>{const audio=window.__players.find(p=>p.src.endsWith('/voices/sigh.mp3')&&!p.paused);audio.currentTime=audio.duration-0.2;});
  await page.getByRole('button',{name:'Pausar',exact:true}).waitFor();
  await page.waitForTimeout(1200);
  assert.ok(Number(await page.getByRole('progressbar').getAttribute('aria-valuenow'))>0);
  await page.getByRole('button',{name:'Salir de la sesión'}).click();
  assert.equal(await page.evaluate(()=>window.__players.every(p=>p.paused)),true);
  await page.getByRole('button',{name:'Comenzar 1 minuto',exact:true}).click();
  await page.getByRole('button',{name:'Comenzar mi pausa'}).click();
  await page.getByRole('button',{name:'Saltar introducción y comenzar'}).click();
  await page.getByRole('button',{name:'Pausar',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.__players.filter(p=>p.src.includes('/voices/')).every(p=>p.paused)),true);
  assert.deepEqual(errors,[]);
  console.log('Voices OK: nine decodable MP3s, frozen exercise clock during narration, pause/resume, natural end, skip and exit.');
} finally {await browser.close();}
