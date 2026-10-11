import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
const base=process.env.ANALYTICS_TEST_URL || 'http://localhost:5181';
if(!new URL(base).hostname.match(/^(localhost|127\.0\.0\.1)$/))throw new Error('This test writes synthetic visits. Use localhost only.');
const evidence=process.env.EVIDENCE_DIR || resolve('../hailey-beauty-evidence');
await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || undefined,args:['--no-sandbox']});
const ua='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';
try {
  const admin=await browser.newContext({viewport:{width:1440,height:1050},userAgent:ua});
  await admin.route(/tiktok|ttwstatic/,route=>route.abort());
  const page=await admin.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/analytics/');
  await page.locator('#dashboard-view').waitFor({state:'visible'});
  assert.equal((await page.request.get(base+'/api/analytics')).status(),200);
  assert.equal(await page.locator('input[type=password]').count(),0);
  const before=await (await page.request.get(base+'/api/analytics?days=7')).json();
  const visitor=await browser.newContext({userAgent:ua,reducedMotion:'reduce'});
  const site=await visitor.newPage();
  await site.route(/tiktok|ttwstatic/,route=>route.abort());
  const sent=site.waitForResponse(r=>r.url().endsWith('/api/analytics/event') && r.status()===204);
  await site.goto(base+'/?utm_source=analytics-verification',{waitUntil:'domcontentloaded'});await sent;
  const booking=site.locator('[data-booking-link]').first();
  // Prevent leaving the local test. The tracker still receives real DOM click events.
  await site.evaluate(()=>document.addEventListener('click',event=>{if(event.target.closest('[data-booking-link]'))event.preventDefault();}));
  for(let i=0;i<2;i++){const clicked=site.waitForResponse(r=>r.url().endsWith('/api/analytics/event')&&r.status()===204);await booking.click();await clicked;}
  const reload=site.waitForResponse(r=>r.url().endsWith('/api/analytics/event')&&r.status()===204);await site.reload({waitUntil:'domcontentloaded'});await reload;
  await page.locator('#refresh-button').click();
  await page.waitForFunction(()=>!document.querySelector('#refresh-button').disabled);
  const after=await (await page.request.get(base+'/api/analytics?days=7')).json();
  assert.equal(after.totals.pageviews,before.totals.pageviews+2);
  assert.equal(after.totals.bookingClicks,before.totals.bookingClicks+2);
  assert.equal(after.totals.visitors,before.totals.visitors+(before.totals.visitors===0?1:0));
  assert.equal(await page.locator('#pageviews-value').textContent(),String(after.totals.pageviews));
  assert.equal(await page.locator('#bookings-value').textContent(),String(after.totals.bookingClicks));
  await page.screenshot({path:evidence+'/analytics-dashboard-desktop.png',fullPage:true});
  await page.locator('#range').selectOption('1');await page.waitForFunction(()=>!document.querySelector('#range').disabled);
  const today=await (await page.request.get(base+'/api/analytics?days=1')).json();assert.equal(today.series.length,1);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:evidence+'/analytics-dashboard-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.reload();await page.locator('#dashboard-view').waitFor({state:'visible'});
  assert.equal((await (await page.request.get(base+'/api/analytics')).json()).totals.pageviews,after.totals.pageviews);
  // Only first-party dashboard JavaScript is under test; third-party social embeds are unrelated.
  assert.deepEqual(errors,[]);
  console.log('PASS: public access without password, two real views counted once each, daily visitor dedupe, two booking clicks, filters, dashboard views excluded, mobile layout.');
} finally {await browser.close();}
