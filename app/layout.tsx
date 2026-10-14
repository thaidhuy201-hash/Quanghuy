import './globals.css';
import InstallApp from './install-app';
export const metadata = { title: '52 Cafe • Sổ thu chi', description: 'Ghi thu chi, chốt két và xem doanh thu của 52 Cafe.', manifest:'/manifest.webmanifest', appleWebApp:{capable:true,title:'52 Cafe',statusBarStyle:'default'}, icons:{icon:'/icons/icon-192.png',apple:'/icons/icon-192.png'} };
export const viewport={themeColor:'#254d3f',width:'device-width',initialScale:1};
export default function Layout({children}: {children: React.ReactNode}) { return <html lang="vi"><body>{children}<InstallApp/></body></html>; }
