import {chromium} from 'playwright-core';
import {mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'public/captures');
mkdirSync(out,{recursive:true});
const base=process.env.OATHLINE_CAPTURE_URL || 'http://127.0.0.1:3000';
const executable=process.env.CHROMIUM_PATH;
const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const shots=[['home','/'],['mandate','/mandate'],['replay','/replay'],['receipts','/receipts/demo'],['verify','/verify?demo=1'],['surface','/surface']];
for(const [name,path] of shots){
  await page.goto(base+path,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  if(name==='home') await page.getByText('Permission is not a mandate.').scrollIntoViewIfNeeded();
  if(name==='mandate') {
    await page.locator('input[type="datetime-local"]').fill('2026-09-08T21:30');
    await page.getByRole('button',{name:'Sign mandate locally'}).click();
    await page.getByText('Live TOML · SIGNED').waitFor();
    await page.getByText('Live English translation').scrollIntoViewIfNeeded();
  }
  if(name==='verify') await page.getByText('CHAIN VALID').waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({path:resolve(out,`${name}.png`),fullPage:false});
  console.log(`Captured ${path}`);
}
await browser.close();
