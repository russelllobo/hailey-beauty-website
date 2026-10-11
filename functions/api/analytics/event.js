import {browserDetails,locationDetails} from '../../../lib/visitor-details.js';
import {configured, hmac, isBot, json, parseEvent, sameOrigin, trafficSource, deviceType, proxyMetadata} from '../../../lib/analytics.js';

export async function onRequestPost({request, env, waitUntil}) {
  if (!configured(env)) return json({error:'Tracking is not configured.'},503);
  const url = new URL(request.url);
  const hosts = env.SITE_HOSTS.split(',').map(host => host.trim());
  if (!sameOrigin(request,env) || !hosts.includes(url.host)) return json({error:'Origin not allowed.'},403);
  if (Number(request.headers.get('Content-Length')) > 4096) return json({error:'Event too large.'},413);
  const proxy = await proxyMetadata(request,env);
  if (proxy?.bot || isBot(request)) return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
  let event;
  try { const text=await request.text(); if(text.length>4096)return json({error:'Event too large.'},413); event=parseEvent(JSON.parse(text)); }
  catch { return json({error:'Invalid event.'},400); }
  if (!event) return json({error:'Invalid event.'},400);
  const now = Math.floor(Date.now()/1000);
  const ip = request.headers.get('CF-Connecting-IP');
  // Cloudflare supplies the trusted address in production. Local development uses a fixed test address.
  if ((!ip || ip === '2a06:98c0:3600::103') && !proxy && !['localhost','127.0.0.1'].includes(url.hostname)) return json({error:'Missing edge metadata.'},503);
  const ua = request.headers.get('User-Agent') || '';
  const day = new Date(now*1000).toISOString().slice(0,10);
  const visitor = proxy?.visitor || await hmac(env.ANALYTICS_SECRET, `visitor:${day}:${ip || '127.0.0.1'}:${ua}`);
  const country = proxy?.country || (/^[A-Z]{2}$/.test(request.cf?.country || '') ? request.cf.country : 'Unknown');
  const geo=proxy ? (proxy.geo || locationDetails()) : locationDetails(request.cf);
  const agent=browserDetails(ua);
  const details=event.details;
  await env.ANALYTICS_DB.prepare(`INSERT OR IGNORE INTO analytics_events (event_id,pageview_id,received_at,visitor_key,type,path,source,country,device,city,region,browser,browser_version,os,os_version,screen,viewport,language,timezone,network,medium,campaign,referrer,detailed) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`)
    .bind(event.eventId,event.pageviewId,now,visitor,event.type,event.path,trafficSource(event,hosts),country,deviceType(ua),
      geo.city,geo.region,agent.browser,agent.browserVersion,agent.os,agent.osVersion,details.screen,details.viewport,details.language,
      details.timezone==='Unknown'?geo.timezone:details.timezone,geo.network,details.medium,details.campaign,details.referrer).run();
  waitUntil(env.ANALYTICS_DB.batch([
    env.ANALYTICS_DB.prepare('DELETE FROM analytics_events WHERE received_at < ?').bind(now-90*86400)
  ]));
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
}
