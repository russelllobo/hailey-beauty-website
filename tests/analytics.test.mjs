import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {onRequestPost as collect} from '../functions/api/analytics/event.js';
import {onRequestPost as login} from '../functions/api/analytics/login.js';
import {onRequestPost as logout} from '../functions/api/analytics/logout.js';
import {onRequestGet as stats} from '../functions/api/analytics.js';
import {authenticated,sessionToken,dateRange,fillSeries,hmac,sameOrigin,proxyMetadata} from '../lib/analytics.js';

function setup() {
  const sql=new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../migrations/0001_analytics.sql',import.meta.url),'utf8'));
  function statement(query,values=[]) {
    return {bind(...args){return statement(query,args)},async first(){return sql.prepare(query).get(...values) || null},async run(){return sql.prepare(query).run(...values)},async all(){return {results:sql.prepare(query).all(...values)}}};
  }
  const db={prepare:statement,async batch(statements){const results=[];sql.exec('BEGIN');try{for(const statement of statements)results.push(await statement.all());sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}}};
  return {env:{ANALYTICS_DB:db,ANALYTICS_SECRET:'test-secret-never-use-in-production-12345',ANALYTICS_PASSWORD:'local-test-password-12345',SITE_HOSTS:'localhost:5181'},sql};
}
function request(path,body,{ip='192.0.2.1',ua='Mozilla/5.0 Chrome/130.0 Safari/537.36',origin='http://localhost:5181',cookie='',country='GB'}={}) {
  const req=new Request('http://localhost:5181'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'User-Agent':ua,'CF-Connecting-IP':ip,'Cookie':cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  Object.defineProperty(req,'cf',{value:{country}});
  return req;
}
function event(type='pageview',pageviewId=randomUUID()){return {eventId:randomUUID(),pageviewId,type,path:'/',referrer:'https://www.google.com/search?private=email@example.org',source:''}}
async function context(handler,env,req){const pending=[];const res=await handler({request:req,env,waitUntil:p=>pending.push(p)});await Promise.all(pending);return res}
async function signIn(env){const res=await context(login,env,request('/api/analytics/login',{password:env.ANALYTICS_PASSWORD}));assert.equal(res.status,200);return res.headers.get('Set-Cookie').split(';')[0]}

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
  const cookie=await signIn(env);
  const response=await stats({env,request:request('/api/analytics?days=7',undefined,{cookie})});
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

test('rejects unrelated origins, malformed events, crawlers and signed-in owner visits',async()=>{
  const {env,sql}=setup();
  assert.equal((await context(collect,env,request('/api/analytics/event',event(),{origin:'https://attacker.test'}))).status,403);
  assert.equal((await context(collect,env,request('/api/analytics/event',{...event(),type:'purchase'}))).status,400);
  assert.equal((await context(collect,env,request('/api/analytics/event',{...event(),eventId:[randomUUID()]}))).status,400);
  assert.equal((await context(collect,env,request('/api/analytics/event',{...event(),pageviewId:[randomUUID()]}))).status,400);
  assert.equal((await context(collect,env,request('/api/analytics/event',{...event(),path:'/analytics/'}))).status,400);
  assert.equal((await context(collect,env,request('/api/analytics/event',event(),{ua:'Googlebot'}))).status,204);
  const cookie=await signIn(env);
  assert.equal((await context(collect,env,request('/api/analytics/event',event(),{cookie}))).status,204);
  assert.equal(sql.prepare('SELECT count(*) AS count FROM analytics_events').get().count,0);
});

test('dashboard auth fails closed, session signatures cannot be tampered with, expired sessions fail',async()=>{
  const {env}=setup();
  assert.equal((await stats({env,request:request('/api/analytics')})).status,401);
  const token=await sessionToken(env);
  assert.equal(await authenticated(request('/api/analytics',undefined,{cookie:`hailey_analytics=${token}`}),env),true);
  assert.equal(await authenticated(request('/api/analytics',undefined,{cookie:`hailey_analytics=${token.slice(0,-1)}${token.endsWith('a')?'b':'a'}`}),env),false);
  const expired=await sessionToken(env,Math.floor(Date.now()/1000)-86401);
  assert.equal(await authenticated(request('/api/analytics',undefined,{cookie:`hailey_analytics=${expired}`}),env),false);
  assert.equal((await stats({env:{},request:request('/api/analytics')})).status,503);
  assert.equal((await context(login,env,request('/api/analytics/login',{password:env.ANALYTICS_PASSWORD},{origin:'https://attacker.test'}))).status,403);
  const cookie=await signIn(env);
  assert.equal((await stats({env,request:request('/api/analytics?days=1000',undefined,{cookie})})).status,400);
  const out=await context(logout,env,request('/api/analytics/logout',{}));
  assert.equal(out.status,204);assert.match(out.headers.get('Set-Cookie'),/Max-Age=0/);
});

test('limits failed password guesses',async()=>{
  const {env}=setup();
  for(let i=0;i<8;i++)assert.equal((await context(login,env,request('/api/analytics/login',{password:'wrong'}))).status,401);
  assert.equal((await context(login,env,request('/api/analytics/login',{password:'wrong'}))).status,429);
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
