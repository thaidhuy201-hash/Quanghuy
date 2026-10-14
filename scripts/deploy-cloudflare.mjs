import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const configPath='dist/server/wrangler.json';
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
config.name='cafe52';
config.account_id='2e4a3eb1b2789b1bb4d26f600b9dea56';
config.d1_databases=[{binding:'DB',database_name:'cafe52-ledger',database_id:'81764bf2-1519-4d5a-a699-92cc7560964c',migrations_dir:'../../drizzle'}];
config.keep_vars=true;
fs.writeFileSync(configPath,JSON.stringify(config,null,2));
for(const args of [['d1','migrations','apply','DB','--remote','--config',configPath],['deploy','--config',configPath]]){
 const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{stdio:'inherit',env:process.env});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}
