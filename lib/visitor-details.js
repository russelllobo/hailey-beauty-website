export function boundedText(value, maximum=120, fallback='Unknown') {
  if(typeof value!=='string')return fallback;
  const text=value.trim().replace(/[\x00-\x1f\x7f]/g,'').slice(0,maximum);
  return text || fallback;
}

export function locationDetails(cf={}) {
  return {city:boundedText(cf.city,80),region:boundedText(cf.region,80),
    network:boundedText(cf.asOrganization,120),timezone:boundedText(cf.timezone,80)};
}

export function browserDetails(ua) {
  const browsers=[
    ['Microsoft Edge',/(?:Edg|EdgA|EdgiOS)\/([\d.]+)/],['Opera',/(?:OPR|Opera)\/([\d.]+)/],
    ['Samsung Internet',/SamsungBrowser\/([\d.]+)/],['Firefox',/(?:Firefox|FxiOS)\/([\d.]+)/],
    ['Chrome',/(?:Chrome|CriOS)\/([\d.]+)/],['Safari',/Version\/([\d.]+).*Safari/]
  ];
  let browser='Unknown',browserVersion='';
  for(const [name,pattern] of browsers){const match=ua.match(pattern);if(match){browser=name;browserVersion=match[1].replace(/(?:\.0)+$/,'');break;}}
  if(/Instagram/i.test(ua))browser='Instagram browser';
  else if(/FBAN|FBAV/i.test(ua))browser='Facebook browser';
  let os='Unknown',osVersion='';
  if(/(?:iPhone|iPad|iPod)/i.test(ua)) {os='iOS';osVersion=ua.match(/(?:CPU(?: iPhone)? OS|iPhone OS) ([\d_]+)/)?.[1]?.replaceAll('_','.') || '';}
  else if(/Android/i.test(ua)){os='Android';const version=ua.match(/Android ([\d.]+)/)?.[1];osVersion=/Android 10; K\)/.test(ua)?'':version || '';}
  else if(/Windows NT/i.test(ua)){os='Windows';const version=ua.match(/Windows NT ([\d.]+)/)?.[1];osVersion=({'10.0':'10 or 11','6.3':'8.1','6.2':'8','6.1':'7'})[version] || version || '';}
  else if(/CrOS/.test(ua)){os='ChromeOS';osVersion=ua.match(/CrOS \S+ ([\d.]+)/)?.[1] || '';}
  else if(/Macintosh|Mac OS X/.test(ua)){os='macOS';const version=ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replaceAll('_','.');osVersion=version==='10.15.7'?'':version || '';}
  else if(/Linux/.test(ua))os='Linux';
  return {browser,browserVersion,os,osVersion};
}

export function dimensions(value) {
  if(!value || !Number.isInteger(value.width) || !Number.isInteger(value.height) || value.width<1 || value.height<1 || value.width>32768 || value.height>32768)return 'Unknown';
  return `${value.width} × ${value.height}`;
}

export function campaignValue(value) {
  return typeof value==='string' && /^[\p{L}\p{N} ._+-]{1,100}$/u.test(value)?value:'';
}

export function referrerHost(value) {
  try {return new URL(value).hostname.toLowerCase().replace(/^www\./,'');}catch{return '';}
}

export function clientDetails(body) {
  return {screen:dimensions(body.screen),viewport:dimensions(body.viewport),
    language:typeof body.language==='string' && /^[A-Za-z0-9-]{2,35}$/.test(body.language)?body.language:'Unknown',
    timezone:typeof body.timezone==='string' && /^[A-Za-z0-9_+/-]{1,80}$/.test(body.timezone)?body.timezone:'Unknown',
    medium:campaignValue(body.medium),campaign:campaignValue(body.campaign),referrer:referrerHost(body.referrer)};
}
