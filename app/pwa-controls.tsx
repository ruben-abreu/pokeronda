'use client';
import {useI18n} from '@/lib/i18n';
import {useEffect,useState} from 'react';
import {Download, Share, WifiOff} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
type InstallPrompt=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
export function PwaControls(){
 const {t}=useI18n();
 const [prompt,setPrompt]=useState<InstallPrompt|null>(null);
 const [installed,setInstalled]=useState(false);const [offline,setOffline]=useState(false);const [local,setLocal]=useState(false);const [open,setOpen]=useState(false);
 useEffect(()=>{
  const display=window.matchMedia('(display-mode: standalone)');
  const sync=()=>setInstalled(display.matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone));
  const network=()=>setOffline(!navigator.onLine);
  const available=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPrompt);};
  const done=()=>{setInstalled(true);setPrompt(null);setOpen(false);};
  sync();network();setLocal(location.protocol!=='https:');
  display.addEventListener('change',sync);window.addEventListener('online',network);window.addEventListener('offline',network);window.addEventListener('beforeinstallprompt',available);window.addEventListener('appinstalled',done);
  if(process.env.NODE_ENV==='production'&&'serviceWorker' in navigator&&window.isSecureContext){void navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{});}
  return()=>{display.removeEventListener('change',sync);window.removeEventListener('online',network);window.removeEventListener('offline',network);window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',done);};
 },[]);
 return <>{offline&&<span className="offline-indicator" role="status"><WifiOff size={15}/> {t("Sem ligação")}</span>}{!installed&&<Dialog open={open} onOpenChange={setOpen}><DialogTrigger className="install-button" aria-label={t("Instalar app")}><Download size={16}/><span>{t("Instalar app")}</span></DialogTrigger><DialogContent className="install-dialog"><DialogHeader><DialogTitle>{t("A PokeRonda, sempre à mão.")}</DialogTitle><DialogDescription>{t("Adiciona a agenda ao ecrã principal. Abre como uma app e consulta a última lista guardada, mesmo sem ligação.")}</DialogDescription></DialogHeader>{local&&<p className="install-notice">{t("Esta é a versão local no Mac. Para instalar no telemóvel, será preciso abrir a agenda num endereço HTTPS acessível nesse dispositivo.")}</p>}{prompt?<button className="install-primary" onClick={async()=>{try{await prompt.prompt();await prompt.userChoice;}finally{setPrompt(null);}}}><Download size={17}/> {t("Instalar neste dispositivo")}</button>:<div className="install-steps"><h3>iPhone · Safari</h3><p>{t("Abre esta página no Safari, toca em")} <Share size={15}/> <strong>{t("Partilhar")}</strong> {t("e escolhe")} <strong>{t("Adicionar ao ecrã principal")}</strong>{t(". Se aparecer, ativa")} <strong>{t("Abrir como app web")}</strong>.</p><h3>Android · Chrome</h3><p>{t("Abre o menu ⋮ e escolhe")} <strong>{t("Instalar app")}</strong> {t("ou")} <strong>{t("Adicionar ao ecrã principal")}</strong>.</p></div>}<p className="install-footnote">{t("A lista atualiza quando abres a app com ligação. A primeira visita e as opções de calendário precisam de internet.")}</p></DialogContent></Dialog>}</>;
}
