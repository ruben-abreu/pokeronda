'use client';
import {useState} from 'react';
import {ArrowUpRight,Coffee,Mail,MessageSquare,X} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {community} from '@/lib/community';

export function CommunityLinks(){
 const [message,setMessage]=useState('');
 const hasEmail=Boolean(community.feedbackEmail);
 const hasForm=Boolean(community.feedbackFormUrl);
 const mailto=`mailto:${community.feedbackEmail}?subject=${encodeURIComponent('Sugestão · PokeRonda')}&body=${encodeURIComponent(message.trim())}`;
 return <nav className="community-links" aria-label="Apoiar e melhorar a PokeRonda">
  {community.coffeeUrl?<a className="community-link" href={community.coffeeUrl} target="_blank" rel="noopener noreferrer"><Coffee size={16}/>Paga-me um café<ArrowUpRight size={13}/></a>:<Dialog><DialogTrigger className="community-link"><Coffee size={16}/>Paga-me um café</DialogTrigger><DialogContent className="community-dialog" showCloseButton={false}><CloseDialog/><DialogHeader><span className="community-dialog-icon"><Coffee size={22}/></span><DialogTitle>Um café para a PokeRonda.</DialogTitle><DialogDescription>Obrigado por quereres apoiar o projeto. A página de apoio estará disponível em breve.</DialogDescription></DialogHeader></DialogContent></Dialog>}
  <Dialog><DialogTrigger className="community-link"><MessageSquare size={16}/>Sugerir uma melhoria</DialogTrigger><DialogContent className="community-dialog" showCloseButton={false}><CloseDialog/><DialogHeader><span className="community-dialog-icon"><MessageSquare size={22}/></span><DialogTitle>O que podemos melhorar?</DialogTitle><DialogDescription>Uma ideia, algo que falta ou um problema que encontraste. A tua sugestão ajuda a melhorar a agenda.</DialogDescription></DialogHeader>
   {hasForm?<Button className="community-submit" render={<a href={community.feedbackFormUrl} target="_blank" rel="noopener noreferrer"/>}>Abrir formulário<ArrowUpRight size={16}/></Button>:<div className="feedback-form"><label htmlFor="feedback-message">A tua sugestão</label><Textarea id="feedback-message" placeholder="Era útil poder…" value={message} onChange={event=>setMessage(event.target.value)} maxLength={2000} rows={5} aria-describedby="feedback-help"/><div className="feedback-meta"><span>{hasEmail?'Não precisas de criar uma conta.':'O envio de sugestões estará disponível em breve.'}</span><span>{message.length}/2000</span></div><Button className="community-submit" disabled={!hasEmail||!message.trim()} render={hasEmail&&message.trim()?<a href={mailto}/>:undefined}><Mail size={16}/>{hasEmail?'Continuar no email':'Envio disponível em breve'}</Button><p id="feedback-help" className="feedback-help">{hasEmail?'Abre a tua app de email. A sugestão só é enviada quando confirmares lá.':'Este texto ainda não será enviado.'}</p></div>}
  </DialogContent></Dialog>
 </nav>;
}
function CloseDialog(){return <DialogClose className="community-close" aria-label="Fechar"><X size={18}/></DialogClose>}
