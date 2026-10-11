import {sameOrigin, json, sessionCookie} from '../../../lib/analytics.js';
export async function onRequestPost({request,env}) {
  if(!sameOrigin(request,env))return json({error:'Origin not allowed.'},403);
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store','Set-Cookie':sessionCookie('',0)}});
}
