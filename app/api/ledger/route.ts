import { env } from 'cloudflare:workers';
export const dynamic = 'force-dynamic';
const db = () => (env as any).DB;
const json = (data: any, status=200, extra: any={}) => Response.json(data,{status,headers:{'Cache-Control':'no-store',...extra}});
const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const hash = async (password: string, salt: string) => { const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']); const bytes=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256); return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join(''); };
async function user(req: Request) { const token=req.headers.get('cookie')?.match(/(?:^|; )cafe_session=([a-f0-9-]+)/)?.[1]; if(!token)return null; return db().prepare('SELECT u.username,u.role FROM sessions s JOIN users u ON u.username=s.username WHERE s.token=? AND s.expires>? AND u.active=1').bind(token,Date.now()).first(); }
export async function GET(req: Request) { try { const u=await user(req); if(!u)return json({user:null},401); const day=new URL(req.url).searchParams.get('day')||today(); if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return json({error:'Ngày không hợp lệ'},400); if(u.role!=='owner'&&day!==today())return json({error:'Nhân viên chỉ xem ngày hiện tại'},403); const r=await db().prepare('SELECT * FROM records WHERE day=? ORDER BY created DESC').bind(day).all(); const c=await db().prepare('SELECT * FROM closings WHERE day=? ORDER BY created DESC').bind(day).all(); const team=u.role==='owner'?(await db().prepare('SELECT username,role,active FROM users ORDER BY username').all()).results:[]; return json({user:u,records:r.results,closings:c.results,team}); }catch {return json({error:'Không đọc được dữ liệu. Vui lòng thử lại.'},500);} }
export async function POST(req: Request) { try {
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Yêu cầu không hợp lệ'},403);
 const b: any=await req.json();
 if(b.action==='login') {
   if(typeof b.username!=='string'||typeof b.password!=='string'||b.password.length>128)return json({error:'Thông tin đăng nhập không hợp lệ'},400);
   const attemptKey=b.username.slice(0,30)+':'+(req.headers.get('cf-connecting-ip')||'shared');
   const attempt=await db().prepare('SELECT count,until FROM attempts WHERE key=?').bind(attemptKey).first();
   if(attempt&&attempt.until>Date.now()&&attempt.count>=10)return json({error:'Đăng nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.'},429);
   await db().prepare('INSERT INTO attempts(key,count,until) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN until<? THEN 1 ELSE count+1 END,until=CASE WHEN until<? THEN excluded.until ELSE until END').bind(attemptKey,Date.now()+900000,Date.now(),Date.now()).run();
   if(b.username==='chuquan' && (env as any).OWNER_INITIAL_PASSWORD && b.password===(env as any).OWNER_INITIAL_PASSWORD) { const salt=crypto.randomUUID(); await db().prepare('INSERT OR IGNORE INTO users (username,hash,salt,role,active) VALUES (?,?,?,?,1)').bind('chuquan',await hash(b.password,salt),salt,'owner').run(); }
   const u=await db().prepare('SELECT * FROM users WHERE username=? AND active=1').bind(b.username).first();
   if(!u||await hash(b.password,u.salt)!==u.hash)return json({error:'Sai tài khoản hoặc mật khẩu'},401);
   await db().prepare('DELETE FROM attempts WHERE key=?').bind(attemptKey).run();
   const token=crypto.randomUUID(); await db().prepare('INSERT INTO sessions(token,username,expires) VALUES(?,?,?)').bind(token,u.username,Date.now()+12*3600000).run();
   return json({ok:true},200,{'Set-Cookie':`cafe_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`});
 }
 const u=await user(req); if(!u)return json({error:'Vui lòng đăng nhập'},401);
 if(b.action==='logout') {const token=req.headers.get('cookie')?.match(/cafe_session=([a-f0-9-]+)/)?.[1]; await db().prepare('DELETE FROM sessions WHERE token=?').bind(token||'').run(); return json({ok:true},200,{'Set-Cookie':'cafe_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});}
 if(b.action==='password'||b.action==='staff') {
   if(b.action==='staff'&&u.role!=='owner')return json({error:'Chỉ chủ quán được tạo tài khoản'},403);
   const name=b.action==='password'?u.username:String(b.username||'').trim().toLowerCase();
   if(!/^[a-z0-9_]{3,30}$/.test(name)||typeof b.password!=='string'||b.password.length<10||b.password.length>128)return json({error:'Tài khoản 3–30 ký tự a-z, số hoặc _. Mật khẩu ít nhất 10 ký tự.'},400);
   const salt=crypto.randomUUID(); const h=await hash(b.password,salt);
   if(b.action==='password') {const old=await db().prepare('SELECT * FROM users WHERE username=?').bind(name).first(); if(await hash(String(b.current||''),old.salt)!==old.hash)return json({error:'Mật khẩu hiện tại chưa đúng'},400); await db().batch([db().prepare('UPDATE users SET hash=?,salt=? WHERE username=?').bind(h,salt,name),db().prepare('DELETE FROM sessions WHERE username=?').bind(name)]);}
   else {const exists=await db().prepare('SELECT username FROM users WHERE username=?').bind(name).first(); if(exists)return json({error:'Tài khoản đã tồn tại'},400); await db().prepare('INSERT INTO users(username,hash,salt,role,active) VALUES(?,?,?,?,1)').bind(name,h,salt,'staff').run();}
   return json({ok:true});
 }
 if(b.action==='disable') {if(u.role!=='owner'||b.username==='chuquan')return json({error:'Không được phép'},403); await db().batch([db().prepare('UPDATE users SET active=0 WHERE username=? AND role=?').bind(b.username,'staff'),db().prepare('DELETE FROM sessions WHERE username=?').bind(b.username)]);return json({ok:true});}
 const day=today(), created=new Date().toISOString();
 if(b.action==='record') {if(!['income','expense'].includes(b.type)||!['cash','transfer'].includes(b.method)||!Number.isSafeInteger(b.amount)||b.amount<=0||b.amount>100000000||typeof b.note!=='string'||b.note.trim().length<1||b.note.length>250||!/^[-a-f0-9]{36}$/.test(b.id||''))return json({error:'Vui lòng nhập số tiền nguyên dương và nội dung (tối đa 250 ký tự)'},400); await db().prepare('INSERT OR IGNORE INTO records(id,day,type,method,amount,note,username,created) VALUES(?,?,?,?,?,?,?,?)').bind(b.id,day,b.type,b.method,b.amount,b.note.trim(),u.username,created).run();return json({ok:true});}
 if(b.action==='close') {if(![b.opening,b.actual].every(x=>Number.isSafeInteger(x)&&x>=0&&x<=100000000))return json({error:'Số tiền két không hợp lệ'},400); const sum=await db().prepare("SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END),0) AS net FROM records WHERE day=? AND method='cash'").bind(day).first(); await db().prepare('INSERT INTO closings(id,day,opening,actual,expected,username,created) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),day,b.opening,b.actual,b.opening+sum.net,u.username,created).run();return json({ok:true});}
 return json({error:'Thao tác không hỗ trợ'},400);
 }catch {return json({error:'Không lưu được. Hãy kiểm tra kết nối và thử lại.'},500);} }

