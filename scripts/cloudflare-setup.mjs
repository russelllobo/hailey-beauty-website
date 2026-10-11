import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {homedir} from 'node:os';
import {spawnSync} from 'node:child_process';
const account='ac5cf54d4a48e8651a5ebe5727ff7ab4';
const projectName='hailey-beauty';
const credentialsPath=`${homedir()}/.config/hailey-beauty-analytics.json`;
await mkdir(`${homedir()}/.config`,{recursive:true});
let credentials;
try {credentials=JSON.parse(await readFile(credentialsPath,'utf8'));}
catch(error){
  if(error.code!=='ENOENT')throw error;
  credentials={secret:randomBytes(32).toString('hex')};
  await writeFile(credentialsPath,JSON.stringify(credentials)+'\n',{mode:0o600,flag:'wx'});
}
if(credentials.secret?.length<32)throw new Error('Stored analytics credentials are invalid.');
let token=process.env.CLOUDFLARE_API_TOKEN;
if(!token) {
  for(const file of [`${homedir()}/.config/.wrangler/config/default.toml`,`${homedir()}/.wrangler/config/default.toml`]) {
    try {const contents=await readFile(file,'utf8');token=contents.match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1];if(token)break;}catch{}
  }
}
if(!token)throw new Error('Run npx wrangler login --device first, or set CLOUDFLARE_API_TOKEN.');
const api=async(path,method='GET',body)=>{
  const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const data=await response.json();
  if(!response.ok || !data.success)throw new Error(`Cloudflare ${method} ${path}: ${data.errors?.map(error=>error.message).join('; ') || response.status}`);
  return data.result;
};
const project=await api(`/accounts/${account}/pages/projects/${projectName}`);
const databases=await api(`/accounts/${account}/d1/database?per_page=100`);
let database=databases.find(item=>item.name==='hailey-beauty-analytics');
if(!database)database=await api(`/accounts/${account}/d1/database`,'POST',{name:'hailey-beauty-analytics'});
const config=JSON.parse(await readFile('wrangler.jsonc','utf8'));
const domains=[...new Set([`${projectName}.pages.dev`,...(project.domains || []),...(config.vars.SITE_HOSTS || '').split(',').filter(Boolean)])];
config.d1_databases[0].database_id=database.uuid;
config.vars.SITE_HOSTS=domains.join(',');
await writeFile('wrangler.jsonc',JSON.stringify(config,null,2)+'\n');
const migration=spawnSync('npx',['wrangler','d1','migrations','apply','ANALYTICS_DB','--remote'],{stdio:'inherit',env:{...process.env,CLOUDFLARE_ACCOUNT_ID:account}});
if(migration.status!==0)throw new Error('Remote D1 migration failed.');
await api(`/accounts/${account}/pages/projects/${projectName}`,'PATCH',{
  build_config:{...project.build_config,build_command:'npm run build',destination_dir:'.dist'},
  deployment_configs:{production:{
    env_vars:{SITE_HOSTS:{type:'plain_text',value:domains.join(',')},ANALYTICS_PASSWORD:null,ANALYTICS_SECRET:{type:'secret_text',value:credentials.secret}},
    d1_databases:{ANALYTICS_DB:{id:database.uuid}}
  }}
});
await api(`/accounts/${account}/workers/scripts/hailey-beauty-domain-proxy/secrets`,'PUT',{name:'ANALYTICS_SECRET',text:credentials.secret,type:'secret_text'});
console.log(JSON.stringify({project:projectName,database:database.name,domains,dashboardUrls:domains.map(domain=>`https://${domain}/analytics/`)},null,2));
