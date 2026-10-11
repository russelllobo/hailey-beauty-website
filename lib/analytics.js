import {clientDetails} from './visitor-details.js';
const encoder = new TextEncoder();
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', ...headers
  }});
}

export function configured(env) {
  return Boolean(env.ANALYTICS_DB && env.ANALYTICS_SECRET?.length >= 32 && env.SITE_HOSTS);
}

export function sameOrigin(request, env) {
  const supplied = request.headers.get('Origin');
  const destination = new URL(request.url);
  if (supplied === destination.origin) return true;
  if (!env?.SITE_HOSTS || !supplied) return false;
  try {
    const origin = new URL(supplied);
    const hosts = env.SITE_HOSTS.split(',').map(host => host.trim());
    return supplied === origin.origin && origin.protocol === destination.protocol && hosts.includes(origin.host) && hosts.includes(destination.host);
  } catch { return false; }
}

export async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(signed), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function equalSecret(a, b) {
  const key = await crypto.subtle.importKey('raw', encoder.encode('hailey-constant-time-comparison'), {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(a));
  return crypto.subtle.verify('HMAC', key, signature, encoder.encode(b));
}

export function parseEvent(body) {
  if (!body || typeof body.eventId !== 'string' || typeof body.pageviewId !== 'string' || !UUID.test(body.eventId) || !UUID.test(body.pageviewId)) return null;
  if (!['pageview', 'booking_click'].includes(body.type)) return null;
  if (!['/', '/index.html'].includes(body.path)) return null;
  if (body.referrer !== undefined && (typeof body.referrer !== 'string' || body.referrer.length > 2048)) return null;
  if (body.source !== undefined && (typeof body.source !== 'string' || body.source.length > 80)) return null;
  return {eventId: body.eventId, pageviewId: body.pageviewId, type: body.type, path: '/', referrer: body.referrer || '', source: body.source || '', details:clientDetails(body)};
}

export function trafficSource(event, hosts) {
  if (/^[\p{L}\p{N} ._+-]{1,80}$/u.test(event.source)) return event.source;
  try {
    const host = new URL(event.referrer).hostname.toLowerCase().replace(/^www\./, '');
    if (hosts.some(site => site.split(':')[0].replace(/^www\./, '') === host)) return 'Direct';
    return host || 'Direct';
  } catch { return 'Direct'; }
}

export function deviceType(ua) {
  if (/ipad|tablet|kindle|silk|android(?!.*mobile)/i.test(ua)) return 'Tablet';
  return /iphone|ipod|android|mobile/i.test(ua) ? 'Mobile' : 'Desktop';
}

export function isBot(request) {
  const ua = request.headers.get('User-Agent') || '';
  return !ua || /bot|crawler|spider|headless|preview|lighthouse|uptime|monitor|curl|wget|python|facebookexternalhit/i.test(ua) || request.cf?.botManagement?.verifiedBot === true || (request.cf?.botManagement?.score !== undefined && request.cf.botManagement.score < 30);
}

export function dateRange(days, now = new Date()) {
  const end = Math.floor(now.getTime() / 1000);
  const startDate = new Date(now);
  startDate.setUTCHours(0,0,0,0);
  startDate.setUTCDate(startDate.getUTCDate() - days + 1);
  return {days, start: startDate.toISOString(), end: now.toISOString(), timezone:'UTC', startSeconds: Math.floor(startDate.getTime()/1000), endSeconds:end};
}

export function fillSeries(rows, range) {
  const byDate = new Map(rows.map(row => [row.date, row]));
  return Array.from({length:range.days}, (_, offset) => {
    const date = new Date((range.startSeconds + offset * 86400)*1000).toISOString().slice(0,10);
    return byDate.get(date) || {date, visitors:0, pageviews:0, bookingClicks:0};
  });
}

export async function statistics(db, days, now = new Date()) {
  const range=dateRange(days,now);
  const start=range.startSeconds,end=range.endSeconds;
  const breakdowns={sources:'source',countries:'country',devices:'device',pages:'path',cities:'city',regions:'region',browsers:'browser',operatingSystems:'os',languages:'language',screens:'screen',timezones:'timezone',networks:'network',campaigns:'campaign'};
  const queries=[
    db.prepare(`SELECT COUNT(DISTINCT CASE WHEN type='pageview' THEN visitor_key END) AS visitors,
      COALESCE(SUM(type='pageview'),0) AS pageviews, COALESCE(SUM(type='booking_click'),0) AS bookingClicks
      FROM analytics_events WHERE received_at BETWEEN ? AND ?`).bind(start,end),
    db.prepare('SELECT COUNT(DISTINCT visitor_key) AS count FROM analytics_events WHERE received_at BETWEEN ? AND ?').bind(end-300,end),
    db.prepare(`SELECT date(received_at,'unixepoch') AS date,
      COUNT(DISTINCT CASE WHEN type='pageview' THEN visitor_key END) AS visitors,
      SUM(type='pageview') AS pageviews, SUM(type='booking_click') AS bookingClicks
      FROM analytics_events WHERE received_at BETWEEN ? AND ? GROUP BY date ORDER BY date`).bind(start,end),
    db.prepare('SELECT key,value FROM analytics_meta'),
    ...Object.entries(breakdowns).map(([name,column])=>db.prepare(`SELECT ${column} AS label,COUNT(*) AS count FROM analytics_events WHERE type='pageview' AND received_at BETWEEN ? AND ? ${['sources','countries','devices','pages'].includes(name)?'':"AND detailed=1"} ${['sources','countries','devices','pages'].includes(name)?'':`AND ${column} NOT IN ('','Unknown')`} GROUP BY ${column} ORDER BY count DESC,label LIMIT 20`).bind(start,end)),
    db.prepare(`WITH recent AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY visitor_key ORDER BY received_at DESC,event_id DESC) AS position
      FROM analytics_events WHERE received_at BETWEEN ? AND ?
    ), totals AS (
      SELECT visitor_key, MIN(received_at) AS first_seen, MAX(received_at) AS last_seen,
        SUM(type='pageview') AS pageviews, SUM(type='booking_click') AS bookingClicks
      FROM recent GROUP BY visitor_key HAVING SUM(type='pageview')>0
    ) SELECT substr(r.visitor_key,1,8) AS id, t.first_seen, t.last_seen, t.pageviews,t.bookingClicks,
      r.country,r.city,r.region,r.device,r.browser,r.browser_version AS browserVersion,
      r.os,r.os_version AS osVersion,r.screen,r.viewport,r.language,r.timezone,r.network,
      r.source,r.medium,r.campaign,r.referrer,r.detailed
      FROM recent r JOIN totals t USING(visitor_key) WHERE r.position=1
      ORDER BY t.last_seen DESC,id LIMIT 50`).bind(start,end)
  ];
  const results=await db.batch(queries);
  const meta=Object.fromEntries(results[3].results.map(row=>[row.key,row.value]));
  const {startSeconds,endSeconds,...publicRange}=range;
  const output={range:publicRange,trackingSince:meta.tracking_since || null,detailsSince:meta.details_since || null,
    totals:{...results[0].results[0],activeVisitors:results[1].results[0].count},
    series:meta.tracking_since?fillSeries(results[2].results,range).filter(point=>point.date>=meta.tracking_since.slice(0,10)):[]};
  Object.keys(breakdowns).forEach((name,index)=>{output[name]=results[index+4].results;});
  output.recentVisitors=results[4+Object.keys(breakdowns).length].results.map(({first_seen,last_seen,...row})=>({...row,
    firstSeen:new Date(first_seen*1000).toISOString(),lastSeen:new Date(last_seen*1000).toISOString()}));
  return output;
}

export async function proxyMetadata(request,env,now=Math.floor(Date.now()/1000)) {
  const raw=request.headers.get('X-Hailey-Metadata');
  const signature=request.headers.get('X-Hailey-Signature');
  if(!raw || raw.length>2048 || !/^[a-f0-9]{64}$/.test(signature || ''))return null;
  let metadata;
  try{metadata=JSON.parse(raw);}catch{return null;}
  if(!Number.isInteger(metadata.timestamp) || Math.abs(now-metadata.timestamp)>60 ||
    !/^[a-f0-9]{64}$/.test(metadata.visitor || '') || !/^[a-f0-9]{64}$/.test(metadata.client || '') ||
    typeof metadata.visitor!=='string' || typeof metadata.client!=='string' || typeof metadata.bot!=='boolean' ||
    typeof metadata.country!=='string' || !/^(?:[A-Z]{2}|Unknown)$/.test(metadata.country))return null;
  try{const origin=new URL(metadata.origin);if(origin.protocol!=='https:' || origin.origin!==metadata.origin || !env.SITE_HOSTS.split(',').includes(origin.host))return null;}catch{return null;}
  if(metadata.geo && (typeof metadata.geo!=='object' || Array.isArray(metadata.geo) || ['city','region','network','timezone'].some(key=>typeof metadata.geo[key]!=='string' || metadata.geo[key].length>120)))return null;
  const expected=await hmac(env.ANALYTICS_SECRET,`proxy:${raw}`);
  return await equalSecret(signature,expected)?metadata:null;
}
