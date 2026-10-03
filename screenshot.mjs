// usage: node screenshot.mjs http://localhost:3000 [label] [width] [height] [--viewport]
import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'node:fs/promises';

const [url = 'http://localhost:3000', label = '', width = '1440', height = '900'] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const viewportOnly = process.argv.includes('--viewport');
const dir = 'temporary screenshots';
await mkdir(dir, { recursive: true });
const nums = (await readdir(dir)).map(f => +(f.match(/^screenshot-(\d+)/)?.[1] ?? 0));
const n = Math.max(0, ...nums) + 1;
const out = `${dir}/screenshot-${n}${label ? '-' + label : ''}.png`;

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
const page = await browser.newPage();
await page.setViewport({ width: +width, height: +height, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
// scroll through so scroll-triggered reveals fire, then return to top
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += +height * 0.6) { await page.evaluate(y => window.scrollTo(0, y), y); await new Promise(r => setTimeout(r, 120)); }
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: out, fullPage: !viewportOnly });
await browser.close();
console.log(out);
