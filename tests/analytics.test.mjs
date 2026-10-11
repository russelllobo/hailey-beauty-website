import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {onRequestPost as collect} from '../functions/api/analytics/event.js';
import {onRequestGet as stats} from '../functions/api/analytics.js';
import {dateRange,fillSeries,hmac,sameOrigin,proxyMetadata} from '../lib/analytics.js';

function setup() {
  const sql=new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../migrations/0001_analytics.sql',import.meta.url),'utf8'));
  sql.exec(readFileSync(new URL('../migrations/0002_visitor_details.sql',import.meta.url),'utf8'));
  function statement(query,values=[]) {
    return {bind(...args){return statement(query,args)},async first(){return sql.prepare(query).get(...values) || null},async run(){return sql.prepare(query).run(...values)},async all(){return {results:sql.prepare(query).all(...values)}}};
  }
  const db={prepare:statement,async batch(statements){const results=[];sql.exec('BEGIN');try{for(const statement of statements)results.push(await statement.all());sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}}};
  return {env:{ANALYTICS_DB:db,ANALYTICS_SECRET:'test-secret-never-use-in-production-12345',SITE_HOSTS:'localhost:5181'},sql};
}
function request(path,body,{ip='192.0.2.1',ua='Mozilla/5.0 Chrome/130.0 Safari/537.36',origin='http://localhost:5181',cookie='',country='GB'}={}) {
  const req=new Request('http://localhost:5181'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'User-Agent':ua,'CF-Connecting-IP':ip,'Cookie':cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  Object.defineProperty(req,'cf',{value:{country}});
  return req;
}
function event(type='pageview',pageviewId=randomUUID()){return {eventId:randomUUID(),pageviewId,type,path:'/',referrer:'https://www.google.com/search?private=email@example.org',source:''}}
async function context(handler,env,req){const pending=[];const res=await handler({request:req,env,waitUntil:p=>pending.push(p)});await Promise.all(pending);return res}

test('real collection counts page views, daily visitors and every booking click; retries do not inflate totals',async()=>{
  const {env,sql}=setup();
  const first=event();
  assert.equal((await context(collect,env,request('/api/analytics/event',first))).status,204);
  await context(collect,env,request('/api/analytics/event',first));
  await context(collect,env,request('/api/analytics/event',{...first,eventId:randomUUID()}));
  await context(collect,env,request('/api/analytics/event',event()));
  const click=event('booking_click',first.pageviewId);
  await context(collect,env,request('/api/analytics/event',click));
  await context(collect,env,request('/api/analytics/event',click));
  await context(collect,env,request('/api/analytics/event',event('booking_click',first.pageviewId)));
  await context(collect,env,request('/api/analytics/event',event(),{ip:'192.0.2.2',ua:'Mozilla/5.0 iPhone Mobile',country:'FR'}));
  const response=await stats({env,request:request('/api/analytics?days=7',undefined)});
  assert.equal(response.status,200);
  const data=await response.json();
  assert.deepEqual(data.totals,{visitors:2,pageviews:3,bookingClicks:2,activeVisitors:2});
  assert.deepEqual(data.sources,[{label:'google.com',count:3}]);
  assert.deepEqual(data.devices,[{label:'Desktop',count:2},{label:'Mobile',count:1}]);
  assert.deepEqual(data.countries,[{label:'GB',count:2},{label:'FR',count:1}]);
  assert.equal(data.series.length,1);
  assert.equal(data.series.reduce((sum,day)=>sum+day.pageviews,0),3);
  const stored=JSON.stringify(sql.prepare('SELECT * FROM analytics_events').all());
  assert.ok(!stored.includes('192.0.2.1'));
  assert.ok(!stored.includes('email@example.org'));
});

test('rejects unrelated origins, malformed events, crawlers',async()=>{
  const {env,sql}=setup();
  assert.equal((await context(collect,env,request('/api/analytics/event',event(),{origin:'https://attacker.test'}))).status,403);
  assert.equal((await context(collect,env,request('/api/analytics/event',{...event(),type:'purchase'}))).status,400);
  assert.equal((await context(collect,env,request('/api/analytics/event',{...event(),eventId:[randomUUID()]}))).status,400);
  assert.equal((await context(collect,env,request('/api/analytics/event',{...event(),pageviewId:[randomUUID()]}))).status,400);
  assert.equal((await context(collect,env,request('/api/analytics/event',{...event(),path:'/analytics/'}))).status,400);
  assert.equal((await context(collect,env,request('/api/analytics/event',event(),{ua:'Googlebot'}))).status,204);
  assert.equal(sql.prepare('SELECT count(*) AS count FROM analytics_events').get().count,0);
});

test('dashboard is public without cookies or a password, validates dates and reports missing configuration',async()=>{
  const {env}=setup();
  const response=await stats({env,request:request('/api/analytics')});
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).totals,{visitors:0,pageviews:0,bookingClicks:0,activeVisitors:0});
  assert.equal(response.headers.get('Set-Cookie'),null);
  assert.equal((await stats({env:{},request:request('/api/analytics')})).status,503);
  assert.equal((await stats({env,request:request('/api/analytics?days=1000')})).status,400);
});

test('UTC ranges include today and no future dates; daily identities rotate; empty series reports literal zeroes',async()=>{
  const range=dateRange(7,new Date('2026-10-11T18:00:00Z'));
  assert.equal(range.start,'2026-10-05T00:00:00.000Z');
  const rows=fillSeries([],range);
  assert.equal(rows.length,7);assert.deepEqual(rows[0],{date:'2026-10-05',visitors:0,pageviews:0,bookingClicks:0});
  assert.equal(rows[6].date,'2026-10-11');
  assert.notEqual(await hmac('secret','visitor:2026-10-10:192.0.2.1:Chrome'),await hmac('secret','visitor:2026-10-11:192.0.2.1:Chrome'));
});

test('old records are deleted during collection and do not appear in selected dates',async()=>{
  const {env,sql}=setup();
  await context(collect,env,request('/api/analytics/event',event()));
  sql.prepare('UPDATE analytics_events SET received_at=?').run(Math.floor(Date.now()/1000)-91*86400);
  await context(collect,env,request('/api/analytics/event',event()));
  assert.equal(sql.prepare('SELECT count(*) AS count FROM analytics_events').get().count,1);
});

test('allows trusted custom-domain origin through the Pages proxy and rejects unrelated domains',()=>{
  const env={SITE_HOSTS:'hailey-beauty.pages.dev,haileybeauty.studio'};
  const good=new Request('https://hailey-beauty.pages.dev/api/analytics/event',{headers:{Origin:'https://haileybeauty.studio'}});
  assert.equal(sameOrigin(good,env),true);
  const bad=new Request('https://hailey-beauty.pages.dev/api/analytics/event',{headers:{Origin:'https://attacker.test'}});
  assert.equal(sameOrigin(bad,env),false);
  const insecure=new Request('https://hailey-beauty.pages.dev/api/analytics/event',{headers:{Origin:'http://haileybeauty.studio'}});
  assert.equal(sameOrigin(insecure,env),false);
});

test('proxy visitor metadata is signed, expires, and preserves distinct visitors through a shared upstream address',async()=>{
  const {env}=setup();env.SITE_HOSTS='hailey-beauty.pages.dev,haileybeauty.studio';
  const now=Math.floor(Date.now()/1000);
  const metadata=JSON.stringify({timestamp:now,visitor:'a'.repeat(64),client:'b'.repeat(64),country:'GB',bot:false,origin:'https://haileybeauty.studio'});
  const req=new Request('https://hailey-beauty.pages.dev/api/analytics/event',{headers:{'X-Hailey-Metadata':metadata,'X-Hailey-Signature':await hmac(env.ANALYTICS_SECRET,'proxy:'+metadata)}});
  assert.equal((await proxyMetadata(req,env)).visitor,'a'.repeat(64));
  assert.equal(await proxyMetadata(req,env,now+61),null);
  req.headers.set('X-Hailey-Metadata',metadata.replace('GB','FR'));
  assert.equal(await proxyMetadata(req,env),null);
});

test('detailed visits preserve signed city/network and reported browser/screen/campaign; do not invent details for old visits',async()=>{
  const {env,sql}=setup();env.SITE_HOSTS='hailey-beauty.pages.dev,haileybeauty.studio';
  const payload={...event(),source:'instagram',medium:'social',campaign:'grand_opening',screen:{width:430,height:932},viewport:{width:390,height:844},language:'en-GB',timezone:'Europe/London',city:'FAKE CLIENT LOCATION'};
  const iphone='Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Version/18.1 Mobile/15E148 Safari/604.1';
  const req=new Request('https://hailey-beauty.pages.dev/api/analytics/event',request('/api/analytics/event',payload,{ua:iphone,origin:'https://haileybeauty.studio',ip:'2a06:98c0:3600::103'}));
  const metadata=JSON.stringify({timestamp:Math.floor(Date.now()/1000),visitor:'a'.repeat(64),client:'b'.repeat(64),country:'GB',bot:false,origin:'https://haileybeauty.studio',geo:{city:'London',region:'England',network:'British Telecommunications PLC',timezone:'Europe/London'}});
  req.headers.set('X-Hailey-Metadata',metadata);req.headers.set('X-Hailey-Signature',await hmac(env.ANALYTICS_SECRET,'proxy:'+metadata));
  assert.equal((await context(collect,env,req)).status,204);
  const data=await(await stats({env,request:request('/api/analytics?days=7',undefined)})).json();
  assert.deepEqual(data.cities,[{label:'London',count:1}]);
  assert.deepEqual(data.browsers,[{label:'Safari',count:1}]);
  assert.deepEqual(data.operatingSystems,[{label:'iOS',count:1}]);
  assert.deepEqual(data.campaigns,[{label:'grand_opening',count:1}]);
  const visitor=data.recentVisitors[0];
  assert.equal(visitor.city,'London');assert.equal(visitor.region,'England');assert.equal(visitor.network,'British Telecommunications PLC');
  assert.equal(visitor.device,'Mobile');assert.equal(visitor.browserVersion,'18.1');assert.equal(visitor.osVersion,'18.1');
  assert.equal(visitor.screen,'430 × 932');assert.equal(visitor.viewport,'390 × 844');assert.equal(visitor.language,'en-GB');
  assert.equal(visitor.medium,'social');assert.equal(visitor.pageviews,1);assert.equal(visitor.bookingClicks,0);
  assert.equal(visitor.id,'aaaaaaaa');assert.equal(visitor.visitor_key,undefined);
  const old=event();sql.prepare('INSERT INTO analytics_events (event_id,pageview_id,received_at,visitor_key,type,path,source,country,device) VALUES (?,?,?,?,?,?,?,?,?)').run(old.eventId,old.pageviewId,Math.floor(Date.now()/1000),'old-visitor','pageview','/','Direct','GB','Desktop');
  const updated=await(await stats({env,request:request('/api/analytics?days=7',undefined)})).json();
  const oldVisitor=updated.recentVisitors.find(row=>row.id==='old-visi');assert.equal(oldVisitor.city,'Unknown');assert.equal(oldVisitor.detailed,0);
  assert.deepEqual(updated.cities,[{label:'London',count:1}]);
});

test('details sanitize unsupported data and do not trust reduced browser versions as exact OS versions',async()=>{
  const {clientDetails,browserDetails}=await import('../lib/visitor-details.js');
  const detail=clientDetails({screen:{width:-1,height:900},viewport:{width:390,height:844},language:'<script>',campaign:'email@example.org',referrer:'https://example.org/private-path?email=secret@example.org'});
  assert.equal(detail.screen,'Unknown');assert.equal(detail.language,'Unknown');assert.equal(detail.campaign,'');assert.equal(detail.referrer,'example.org');
  assert.deepEqual(browserDetails('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/146.0.0.0 Safari/537.36 Edg/146.0.1'),{browser:'Microsoft Edge',browserVersion:'146.0.1',os:'Windows',osVersion:'10 or 11'});
  assert.equal(browserDetails('Mozilla/5.0 (Linux; Android 10; K) Chrome/146.0.0.0 Mobile Safari/537.36').osVersion,'');
});
