import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Taniej — porównuj mądrzej',description:'Polska wyszukiwarka cen, promocji i koszyka zakupowego. Ceny ze źródłami i datą sprawdzenia.',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg',apple:'/apple-touch-icon.png'},appleWebApp:{capable:true,statusBarStyle:'default',title:'Taniej'}};
export const viewport: Viewport={themeColor:'#f7f6f2',width:'device-width',initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pl"><body>{children}</body></html>}
