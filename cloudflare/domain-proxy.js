import {locationDetails} from '../lib/visitor-details.js';
import {hmac,isBot} from '../lib/analytics.js';
const UPSTREAM_ORIGIN='https://hailey-beauty.pages.dev';
export default {
  async fetch(request,env) {
    try {
      const incomingUrl=new URL(request.url);
      if(['/whatsapp','/whatsapp/'].includes(incomingUrl.pathname))return new Response(null,{status:302,headers:{Location:'https://wa.me/message/SMSXCZW2PJLBN1','Cache-Control':'no-store'}});
      const upstreamUrl=new URL(incomingUrl.pathname+incomingUrl.search,UPSTREAM_ORIGIN);
      const forwarded=new Request(upstreamUrl,request);
      forwarded.headers.delete('X-Hailey-Metadata');
      forwarded.headers.delete('X-Hailey-Signature');
      if(incomingUrl.pathname.startsWith('/api/analytics') && env.ANALYTICS_SECRET) {
        const now=Math.floor(Date.now()/1000);
        const ip=request.headers.get('CF-Connecting-IP');
        const ua=request.headers.get('User-Agent') || '';
        const day=new Date(now*1000).toISOString().slice(0,10);
        const metadata=JSON.stringify({timestamp:now,
          visitor:await hmac(env.ANALYTICS_SECRET,`visitor:${day}:${ip}:${ua}`),
          client:await hmac(env.ANALYTICS_SECRET,`login:${ip}`),
          country:request.cf?.country || 'Unknown',geo:locationDetails(request.cf),bot:isBot(request),origin:incomingUrl.origin});
        forwarded.headers.set('X-Hailey-Metadata',metadata);
        forwarded.headers.set('X-Hailey-Signature',await hmac(env.ANALYTICS_SECRET,`proxy:${metadata}`));
      }
      const response=await fetch(forwarded);
      return new Response(response.body,response);
    } catch(error) {
      console.error('Pages origin request failed',error.message);
      return new Response('The website is temporarily unavailable.',{status:502,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
    }
  }
};
