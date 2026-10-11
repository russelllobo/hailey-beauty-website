import {authenticated, configured, json, statistics} from '../../lib/analytics.js';
export async function onRequestGet({request,env}) {
  if (!configured(env)) return json({error:'Analytics is not configured yet.'},503);
  if (!await authenticated(request,env)) return json({error:'Please sign in.'},401);
  const raw = new URL(request.url).searchParams.get('days') || '7';
  if (!['1','7','30','90'].includes(raw)) return json({error:'Choose 1, 7, 30 or 90 days.'},400);
  try { return json(await statistics(env.ANALYTICS_DB,Number(raw))); }
  catch(error) { console.error('Analytics query failed',error.message); return json({error:'Could not load analytics. Try again.'},503); }
}
