import { kindLabels, type Tournament } from './events';
function escapeICS(value:string){return value.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
function fold(line:string){const chunks:string[]=[];let part='';let bytes=0;for(const char of line){const size=new TextEncoder().encode(char).length;if(bytes+size>75){chunks.push(part);part=' ';bytes=1;}part+=char;bytes+=size;}chunks.push(part);return chunks.join('\r\n');}
export function startUTC(event:Tournament):Date {
 const local=`${event.date}T${event.time||'00:00'}:00`;
 const target=Date.parse(local+'Z');let value=target;
 const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:event.timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 for(let i=0;i<3;i++) { const p=Object.fromEntries(fmt.formatToParts(new Date(value)).map(x=>[x.type,x.value])); const observed=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`); value+=target-observed; }
 return new Date(value);
}
const stamp=(d:Date)=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
const nextDate=(date:string)=>new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10).replaceAll('-','');
export function calendarDescription(e:Tournament){return `${e.name}\n${kindLabels[e.kind]} · Pokémon ${e.game}\n${e.time?'Reserva inicial de 1 hora. A duração real e o horário devem ser confirmados com a loja.':'Hora e duração por confirmar com a loja.'}\nFonte: ${e.url||'https://www.pokedata.ovh/events/'}\nAdicionado através da PokeRonda. Alterações posteriores não são sincronizadas com este evento.`;}
export function calendarFile(e:Tournament, now=new Date()):string {
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PokeRonda//Eventos Portugal//PT','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:${escapeICS(e.id)}@proxima-ronda.pt`,`DTSTAMP:${stamp(now)}`];
 if(e.time){const start=startUTC(e);lines.push(`DTSTART:${stamp(start)}`,`DTEND:${stamp(new Date(start.getTime()+3600000))}`);}else lines.push(`DTSTART;VALUE=DATE:${e.date.replaceAll('-','')}`,`DTEND;VALUE=DATE:${nextDate(e.date)}`);
 lines.push(`SUMMARY:${escapeICS(`${kindLabels[e.kind]} ${e.game} · ${e.shop}`)}`,`LOCATION:${escapeICS([e.shop,e.address||e.city,e.district,'Portugal'].join(', '))}`,`DESCRIPTION:${escapeICS(calendarDescription(e))}`);
 if(e.url)lines.push(`URL:${e.url}`);
 lines.push('STATUS:CONFIRMED','END:VEVENT','END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
}
export function googleCalendarUrl(e:Tournament){
 const start=startUTC(e); const dates=e.time?`${stamp(start)}/${stamp(new Date(start.getTime()+3600000))}`:`${e.date.replaceAll('-','')}/${nextDate(e.date)}`;
 const p=new URLSearchParams({action:'TEMPLATE',text:`${kindLabels[e.kind]} ${e.game} · ${e.shop}`,dates,ctz:e.timezone,details:calendarDescription(e),location:[e.shop,e.address||e.city,e.district,'Portugal'].join(', ')});
 return 'https://calendar.google.com/calendar/render?'+p.toString();
}
