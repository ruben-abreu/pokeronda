import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
const sans = Geist({ variable:'--font-geist-sans', subsets:['latin'] });
const mono = Geist_Mono({ variable:'--font-geist-mono', subsets:['latin'] });
export const viewport: Viewport = {width:'device-width',initialScale:1,themeColor:'#152235'};
export const metadata: Metadata = { title:'PokeRonda · Eventos Pokémon em Portugal', description:'Encontra League Challenges, Cups e pré-releases de Pokémon TCG e VGC em Portugal. Escolhe o teu próximo evento e adiciona-o ao calendário.', applicationName:'PokeRonda', manifest:'/manifest.webmanifest', appleWebApp:{capable:true,title:'PokeRonda',statusBarStyle:'default'}, icons:{icon:'/favicon.svg',apple:'/apple-touch-icon.png'} };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-PT"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
