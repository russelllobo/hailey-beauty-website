import {configured, hmac, json, sameOrigin, sessionCookie, sessionToken, validPassword, proxyMetadata} from '../../../lib/analytics.js';
export async function onRequestPost({request,env}) {
  if (!configured(env)) return json({error:'Analytics is not configured yet.'},503);
  if (!sameOrigin(request,env)) return json({error:'Origin not allowed.'},403);
  let password;
  try {const text=await request.text();if(text.length>1024)return json({error:'Invalid password.'},400);password=JSON.parse(text).password;} catch {return json({error:'Invalid password.'},400);}
  const now=Math.floor(Date.now()/1000);
  const proxy=await proxyMetadata(request,env);
  const clientKey=proxy?.client || await hmac(env.ANALYTICS_SECRET,`login:${request.headers.get('CF-Connecting-IP') || 'local'}`);
  const attempt=await env.ANALYTICS_DB.prepare(`INSERT INTO analytics_login_attempts (client_key,window_start,attempts) VALUES (?,?,1)
    ON CONFLICT(client_key) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END, window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END RETURNING attempts`).bind(clientKey,now,now-900,now-900).first();
  if(attempt.attempts>8)return json({error:'Too many attempts. Try again in 15 minutes.'},429,{'Retry-After':'900'});
  if(!await validPassword(password,env))return json({error:'Incorrect password.'},401);
  await env.ANALYTICS_DB.prepare('DELETE FROM analytics_login_attempts WHERE client_key=?').bind(clientKey).run();
  return json({ok:true},200,{'Set-Cookie':sessionCookie(await sessionToken(env,now))});
}
