'use client';
import {useEffect,useState} from 'react';
export default function InstallApp(){
 const [prompt,setPrompt]=useState<any>(null),[show,setShow]=useState(false);
 useEffect(()=>{if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{}); const standalone=window.matchMedia('(display-mode: standalone)').matches||(navigator as any).standalone;setShow(!standalone&&!sessionStorage.getItem('52-install-dismissed'));const onPrompt=(e:Event)=>{e.preventDefault();setPrompt(e);};const onInstalled=()=>setShow(false);window.addEventListener('beforeinstallprompt',onPrompt);window.addEventListener('appinstalled',onInstalled);return()=>{window.removeEventListener('beforeinstallprompt',onPrompt);window.removeEventListener('appinstalled',onInstalled);};},[]);
 if(!show)return null;
 return <div className="install-app"><strong>Cài 52 Cafe trên điện thoại</strong><p>{prompt?'Thêm biểu tượng để mở sổ quán nhanh hơn.':'iPhone: Safari → Chia sẻ → Thêm vào MH chính. Android: menu ⋮ → Cài đặt ứng dụng / Thêm vào màn hình chính.'}</p><div>{prompt&&<button className="primary" onClick={async()=>{await prompt.prompt();const result=await prompt.userChoice;if(result.outcome==='accepted')setShow(false);setPrompt(null);}}>Cài ứng dụng</button>}<button className="secondary" onClick={()=>{sessionStorage.setItem('52-install-dismissed','1');setShow(false);}}>Để sau</button></div></div>;
}
