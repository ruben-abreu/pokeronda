'use client';
import {useI18n} from '@/lib/i18n';
import {useState} from 'react';
import {ArrowUpRight,Coffee,Mail,MessageSquare,X} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {community} from '@/lib/community';

export function CommunityLinks(){
 const {t}=useI18n();
 const [message,setMessage]=useState('');
 const hasEmail=Boolean(community.feedbackEmail);
 const hasForm=Boolean(community.feedbackFormUrl);
 const mailto=`mailto:${community.feedbackEmail}?subject=${encodeURIComponent(t("Sugestão · PokeRonda"))}&body=${encodeURIComponent(message.trim())}`;
 return <nav className="community-links" aria-label={t("Apoiar e melhorar a PokeRonda")}>
  {community.coffeeUrl?<a className="community-link" href={community.coffeeUrl} target="_blank" rel="noopener noreferrer"><Coffee size={16}/>{t("Paga-me um café")}<ArrowUpRight size={13}/></a>:<Dialog><DialogTrigger className="community-link"><Coffee size={16}/>{t("Paga-me um café")}</DialogTrigger><DialogContent className="community-dialog" showCloseButton={false}><CloseDialog/><DialogHeader><span className="community-dialog-icon"><Coffee size={22}/></span><DialogTitle>{t("Um café para a PokeRonda.")}</DialogTitle><DialogDescription>{t("Obrigado por quereres apoiar o projeto. A página de apoio estará disponível em breve.")}</DialogDescription></DialogHeader></DialogContent></Dialog>}
  <Dialog><DialogTrigger className="community-link"><MessageSquare size={16}/>{t("Sugerir uma melhoria")}</DialogTrigger><DialogContent className="community-dialog" showCloseButton={false}><CloseDialog/><DialogHeader><span className="community-dialog-icon"><MessageSquare size={22}/></span><DialogTitle>{t("O que podemos melhorar?")}</DialogTitle><DialogDescription>{t("Uma ideia, algo que falta ou um problema que encontraste. A tua sugestão ajuda a melhorar a agenda.")}</DialogDescription></DialogHeader>
   {hasForm?<Button className="community-submit" render={<a href={community.feedbackFormUrl} target="_blank" rel="noopener noreferrer"/>}>{t("Abrir formulário")}<ArrowUpRight size={16}/></Button>:<div className="feedback-form"><label htmlFor="feedback-message">{t("A tua sugestão")}</label><Textarea id="feedback-message" placeholder={t("Era útil poder…")} value={message} onChange={event=>setMessage(event.target.value)} maxLength={2000} rows={5} aria-describedby="feedback-help"/><div className="feedback-meta"><span>{hasEmail?t("Não precisas de criar uma conta."):t("O envio de sugestões estará disponível em breve.")}</span><span>{message.length}/2000</span></div><Button className="community-submit" disabled={!hasEmail||!message.trim()} render={hasEmail&&message.trim()?<a href={mailto}/>:undefined}><Mail size={16}/>{hasEmail?t("Continuar no email"):t("Envio disponível em breve")}</Button><p id="feedback-help" className="feedback-help">{hasEmail?t("Abre a tua app de email. A sugestão só é enviada quando confirmares lá."):t("Este texto ainda não será enviado.")}</p></div>}
  </DialogContent></Dialog>
 </nav>;
}
function CloseDialog(){const {t}=useI18n();return <DialogClose className="community-close" aria-label={t("Fechar")}><X size={18}/></DialogClose>}
