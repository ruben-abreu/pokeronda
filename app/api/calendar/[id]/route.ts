import { getFeed } from '@/lib/feed';
import { calendarFile } from '@/lib/calendar';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const identifier=id.replace(/\.ics$/,'');
 if(!/^[a-zA-Z0-9-]{1,80}$/.test(identifier))return new Response('Evento inválido',{status:400});
 const feed=await getFeed();const event=feed.events.find(e=>e.id===identifier);
 if(!event)return new Response('Este evento já não está disponível. Atualiza a agenda.',{status:404});
 return new Response(calendarFile(event),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':`attachment; filename="pokeronda-${event.date}-${identifier}.ics"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
