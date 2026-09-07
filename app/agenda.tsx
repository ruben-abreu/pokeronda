'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  CircleDot,
  Gamepad2,
  GalleryVerticalEnd,
  Moon,
  Sun,
  MapPin,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Star,
  Bookmark,
  Store,
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import {
  dateParts,
  filterEvents,
  kindLabels,
  todayPortugal,
  type Feed,
  type EventKind,
  type Tournament,
} from '@/lib/events';
import { Checkbox } from '@/components/ui/checkbox';
import { PwaControls } from './pwa-controls';
import { CommunityLinks } from './community-links';
import { Switch } from '@/components/ui/switch';
import {
  PREFERENCES_KEY,
  kindsForGame,
  readPreferences,
} from '@/lib/preferences';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from '@/components/ui/combobox';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { PERSONAL_KEY, readPersonal, shopOptions, shopKey, eventKey, personalFilter, monthOpen, type Personal } from '@/lib/personal';
import { googleCalendarUrl } from '@/lib/calendar';
const typeIcons = {
  challenge: Swords,
  cup: Trophy,
  prerelease: Sparkles,
  friendly: Users,
};
function CalendarButton({ event }: { event: Tournament }) {
  const ics = `/api/calendar/${encodeURIComponent(event.id)}.ics`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className='calendar-button'
        aria-label={`Adicionar ${event.shop}, ${event.date}, ao calendário`}
      >
        <CalendarPlus size={17} />
        <span>Calendário</span>
        <ChevronDown size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='calendar-menu' align='end'>
        <DropdownMenuItem render={<a href={ics} />}>
          Apple Calendar · iPhone
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={googleCalendarUrl(event)}
              target='_blank'
              rel='noopener noreferrer'
            />
          }
        >
          Google Calendar · Android
        </DropdownMenuItem>
        <DropdownMenuItem render={<a href={ics} download />}>
          Descarregar .ics
        </DropdownMenuItem>
        <p className='calendar-note'>
          {event.time
            ? 'Reserva inicial de 1 hora. Confirma a duração e o horário com a loja.'
            : 'Hora por anunciar. Será guardado como evento de dia inteiro.'}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export default function Agenda({ initialFeed }: { initialFeed: Feed }) {
  const [feed, setFeed] = useState(initialFeed);
  const [game, setGame] = useState('all');
  const [kinds, setKinds] = useState<string[]>([]);
  const [district, setDistrict] = useState('all');
  const [personal,setPersonal]=useState<Personal>(()=>readPersonal(null));
  const [favoriteView,setFavoriteView]=useState('all');
  const [mobile,setMobile]=useState(false);
  const [storageError,setStorageError]=useState(false);
  const changeDistrict=(value:string)=>{setDistrict(value);setPersonal(p=>({...p,shop:'all'}));};
  const toggleEvent=(e:Tournament)=>setPersonal(p=>({...p,events:p.events.includes(eventKey(e))?p.events.filter(id=>id!==eventKey(e)):[...p.events,eventKey(e)]}));
  const toggleShop=(e:Tournament)=>setPersonal(p=>({...p,shops:p.shops.some(shop=>shop.key===shopKey(e))?p.shops.filter(shop=>shop.key!==shopKey(e)):[...p.shops,{key:shopKey(e),name:e.shop,district:e.district,city:e.city}]}));
  useEffect(()=>{const query=window.matchMedia('(max-width: 850px)');const update=()=>setMobile(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
  const [includeFriendlies, setIncludeFriendlies] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [preferencesReady, setPreferencesReady] = useState(false);
  const changeGame = (next: string) => {
    setGame(next);
    setKinds(current => kindsForGame(next, current));
  };
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(PREFERENCES_KEY);
    } catch {}
    const saved = readPreferences(
      raw,
      window.matchMedia('(prefers-color-scheme: dark)').matches,
    );
    try{setPersonal(readPersonal(localStorage.getItem(PERSONAL_KEY)));}catch{setStorageError(true);}
    setGame(saved.game);
    setKinds(saved.kinds);
    setDistrict(saved.district);
    setTheme(saved.theme);
    setPreferencesReady(true);
  }, []);
  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ game, kinds, district, theme }),
      );
    } catch {}
  }, [game, kinds, district, theme, preferencesReady]);
  useEffect(()=>{if(!preferencesReady)return;try{localStorage.setItem(PERSONAL_KEY,JSON.stringify(personal));setStorageError(false);}catch{setStorageError(true);}},[personal,preferencesReady]);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(todayPortugal);
  const refreshing = useRef(false);
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    setLoading(true);
    try {
      const response = await fetch('/api/events', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const next = (await response.json()) as Feed;
      if (
        !Array.isArray(next.events) ||
        !Number.isFinite(Date.parse(next.fetchedAt))
      )
        throw new Error();
      setFeed(previous =>
        next.stale &&
        Date.parse(previous.fetchedAt) > Date.parse(next.fetchedAt)
          ? { ...previous, stale: true }
          : next,
      );
    } catch {
      setFeed(previous => ({ ...previous, stale: true }));
    } finally {
      refreshing.current = false;
      setLoading(false);
      setToday(todayPortugal());
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = setInterval(
      () => {
        if (!document.hidden) void refresh();
      },
      30 * 60 * 1000,
    );
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);
  const upcoming = useMemo(
    () => feed.events.filter(e => e.date >= today),
    [feed.events, today],
  );
  const events = useMemo(
    () =>
      personalFilter(filterEvents(
        feed.events,
        game,
        kinds,
        district,
        today,
        includeFriendlies,
      ), district==='all'?'all':personal.shop, favoriteView, personal),
    [feed.events, game, kinds, district, today, includeFriendlies, personal, favoriteView],
  );
  const districts = [...new Set(upcoming.map(e => e.district))].sort((a, b) =>
    a.localeCompare(b, 'pt'),
  );
  const shops=useMemo(()=>shopOptions(upcoming,district),[upcoming,district]);
  const storeItems=[{key:'all',name:'Todas as lojas',district:'',city:''},...shops];
  const selectedStore=storeItems.find(s=>s.key===personal.shop)||storeItems[0];
  useEffect(()=>{if(preferencesReady&&personal.shop!=='all'&&!shops.some(s=>s.key===personal.shop))setPersonal(p=>({...p,shop:'all'}));},[shops,preferencesReady,personal.shop]);
  const groups = events.reduce<Record<string, Tournament[]>>((acc, e) => {
    (acc[e.date.slice(0, 7)] ??= []).push(e);
    return acc;
  }, {});
  const monthKeys=Object.keys(groups);
  const isMonthOpen=(month:string)=>monthOpen(month,monthKeys[0],mobile,personal.months);
  const setAllMonths=(open:boolean)=>setPersonal(p=>({...p,months:{...p.months,...Object.fromEntries(monthKeys.map(month=>[month,open]))}}));
  const active = personal.shop!=='all'||favoriteView!=='all'||
    includeFriendlies ||
    game !== 'all' ||
    kinds.length > 0 ||
    district !== 'all';
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Record<string, unknown>,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools = [
      {
        name: 'filter_portugal_events',
        title: 'Filtrar eventos em Portugal',
        description:
          'Atualiza os filtros visíveis da agenda e devolve os eventos correspondentes. Não adiciona eventos a calendários.',
        inputSchema: {
          type: 'object',
          properties: {
            game: { type: 'string', enum: ['all', 'TCG', 'VGC'] },
            kinds: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['challenge', 'cup', 'prerelease'],
              },
            },
            district: { type: 'string' },
            shop: {type:'string'},
            favoriteView:{type:'string',enum:['all','saved','shops']},
            includeFriendlies: {
              type: 'boolean',
              description:
                'Inclui encontros casuais apenas quando true. Omitido significa false.',
            },
          },
          required: ['game', 'kinds', 'district'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute(input: unknown) {
          if (!input || typeof input !== 'object')
            throw new Error('Filtros inválidos');
          const p = input as {
            game: string;
            kinds: string[];
            district: string;
            shop?:string;
            favoriteView?:string;
            includeFriendlies?: boolean;
          };
          if (
            (p.includeFriendlies !== undefined &&
              typeof p.includeFriendlies !== 'boolean') ||
            (p.favoriteView!==undefined&&!['all','saved','shops'].includes(p.favoriteView))||
            (p.shop!==undefined&&p.shop!=='all'&&(p.district==='all'||!shopOptions(upcoming,p.district).some(s=>s.key===p.shop)))||
            !['all', 'TCG', 'VGC'].includes(p.game) ||
            !Array.isArray(p.kinds) ||
            p.kinds.some(
              k => !['challenge', 'cup', 'prerelease'].includes(k),
            ) ||
            typeof p.district !== 'string' ||
            (p.district !== 'all' && !districts.includes(p.district))
          )
            throw new Error('Filtros inválidos');
          const selectedKinds = kindsForGame(p.game, p.kinds);
          flushSync(() => {
            setGame(p.game);
            setKinds(selectedKinds);
            setDistrict(p.district);
            setPersonal(current=>({...current,shop:p.shop||'all'}));
            setFavoriteView(p.favoriteView||'all');
            setIncludeFriendlies(p.includeFriendlies === true);
          });
          return {
            events: personalFilter(filterEvents(
              feed.events,
              p.game,
              selectedKinds,
              p.district,
              today,
              p.includeFriendlies === true,
            ),p.shop||'all',p.favoriteView||'all',personal),
          };
        },
      },
      {
        name: 'read_visible_events',
        title: 'Consultar eventos visíveis',
        description:
          'Devolve os eventos da agenda com os filtros atuais e a data da última consulta à fonte.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute() {
          return {
            game,
            kinds,
            district,
            theme,
            includeFriendlies,
            shop:personal.shop, favoriteView, savedEvents:personal.events, favoriteShops:personal.shops, shops, months:monthKeys.map(month=>({month,open:isMonthOpen(month)})),
            count: events.length,
            availableKinds:
              game === 'VGC'
                ? ['challenge', 'cup']
                : ['challenge', 'cup', 'prerelease'],
            events,
            fetchedAt: feed.fetchedAt,
            stale: feed.stale,
          };
        },
      },
    ];
    for (const tool of tools) {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    }
    return () => lifecycle.abort();
  }, [game, kinds, district, theme, feed, today, includeFriendlies,personal,favoriteView,mobile]);
  return (
    <div className='app-shell'>
      <header className='topbar'>
        <div className='topbar-inner'>
          <a className='brand' href='/' aria-label='PokeRonda, início'>
            <span className='brand-icon'>
              <CircleDot size={25} />
            </span>
            <span>
              poke<span className='brand-light'>ronda</span>
              <span className='brand-period'>.</span>
            </span>
          </a>
          <span className='nav-active'>
            <CalendarDays size={17} /> Agenda de eventos
          </span>
          <div className='header-actions'>
            <PwaControls />
            <span className='country'>
              <span className='country-dot' /> Portugal
            </span>
            <label className='theme-control'>
              <Sun size={16} />
              <Switch
                aria-label='Modo escuro'
                checked={theme === 'dark'}
                onCheckedChange={checked =>
                  setTheme(checked ? 'dark' : 'light')
                }
              />
              <Moon size={16} />
            </label>
          </div>
        </div>
      </header>
      <main className='main'>
        <div className='page-heading'>
          <div>
            <div className='eyebrow'>
              <span /> PLAY! POKÉMON · PORTUGAL
            </div>
            <h1>
              O teu próximo evento<span>.</span>
            </h1>
            <p>Escolhe o evento. Prepara a estratégia. Marca o dia.</p>
          </div>
          <div className='heading-count' aria-live='polite'>
            <span>{events.length.toString().padStart(2, '0')}</span>
            <div>
              eventos
              <br />a caminho <ArrowUpRight size={16} />
            </div>
          </div>
        </div>
        <section className='filters' aria-label='Filtrar eventos'>
          <div className='filter-top'>
            <div>
              <span className='filter-label'>O TEU JOGO</span>
              <ToggleGroup
                value={[game]}
                onValueChange={v => changeGame(String(v[0] || 'all'))}
                className='game-options'
                aria-label='Jogo'
              >
                <ToggleGroupItem value='all'>Todos os jogos</ToggleGroupItem>
                <ToggleGroupItem value='TCG'>
                  <GalleryVerticalEnd size={19} /> TCG
                </ToggleGroupItem>
                <ToggleGroupItem value='VGC'>
                  <Gamepad2 size={19} /> VGC
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className='district-filter'>
              <span className='filter-label' id='district-label'>
                ONDE
              </span>
              <Select
                value={district}
                onValueChange={v => changeDistrict(v || 'all')}
              >
                <SelectTrigger
                  className='district-select'
                  aria-labelledby='district-label'
                >
                  <MapPin size={17} />
                  <SelectValue>
                    {district === 'all' ? 'Todos os distritos' : district}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos os distritos</SelectItem>
                  {districts.map(d => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='shop-filter'>
              <label className='filter-label' htmlFor='shop-search'>LOJA</label>
              <Combobox items={storeItems} value={selectedStore} itemToStringLabel={item=>item.name+(item.city&&item.city!==item.district?' · '+item.city:'')} isItemEqualToValue={(a,b)=>a.key===b.key} onValueChange={item=>setPersonal(p=>({...p,shop:item?.key||'all'}))} disabled={district==='all'}>
                <ComboboxInput id='shop-search' className='shop-search' placeholder={district==='all'?'Escolhe um distrito':'Pesquisar loja…'} disabled={district==='all'} showClear={personal.shop!=='all'}/>
                <ComboboxContent className='shop-menu'><ComboboxEmpty>Nenhuma loja encontrada.</ComboboxEmpty><ComboboxList>{item=><ComboboxItem key={item.key} value={item}><Store size={15}/><span>{item.name}{item.city&&item.city!==item.district&&<small> · {item.city}</small>}</span></ComboboxItem>}</ComboboxList></ComboboxContent>
              </Combobox>
              <span className='shop-filter-hint'>{district==='all'?'Escolhe primeiro um distrito.':`${shops.length} lojas com eventos anunciados`}</span>
            </div>
          </div>
          <div className='filter-bottom'>
            <span className='filter-label'>TIPO DE EVENTO</span>
            <ToggleGroup
              multiple
              value={kinds.length ? kinds : ['all']}
              onValueChange={v =>
                setKinds(
                  v.includes('all') && kinds.length
                    ? []
                    : kindsForGame(game, v.map(String)),
                )
              }
              className='kind-options'
              aria-label='Tipo de evento'
            >
              <ToggleGroupItem value='all' className='kind-filter all'>
                Todos
              </ToggleGroupItem>
              {(Object.keys(kindLabels) as EventKind[])
                .filter(
                  k =>
                    k !== 'friendly' && (game !== 'VGC' || k !== 'prerelease'),
                )
                .map(k => {
                  const Icon = typeIcons[k];
                  return (
                    <ToggleGroupItem
                      value={k}
                      key={k}
                      className={`kind-filter ${k}`}
                    >
                      <Icon size={16} />
                      {kindLabels[k]}
                    </ToggleGroupItem>
                  );
                })}
            </ToggleGroup>
            {active && (
              <button
                className='reset'
                onClick={() => {
                  setGame('all');
                  setKinds([]);
                  setDistrict('all');
                  setPersonal(p=>({...p,shop:'all'}));
                  setFavoriteView('all');
                  setIncludeFriendlies(false);
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>
          <div
            className={`friendly-option ${includeFriendlies ? 'is-selected' : ''}`}
          >
            <label>
              <Checkbox
                className='friendly-checkbox'
                checked={includeFriendlies}
                onCheckedChange={checked => setIncludeFriendlies(checked)}
                aria-labelledby='friendly-title'
                aria-describedby='friendly-hint'
              />
              <span className='friendly-copy'>
                <span id='friendly-title' className='friendly-title'>
                  Incluir friendlies
                </span>
                <span id='friendly-hint' className='friendly-hint'>
                  Encontros casuais de liga
                </span>
              </span>
            </label>
          </div>
        </section>
        <div
          className={`feed-status ${feed.stale && !loading ? 'is-stale' : ''}`}
          role='status'
        >
          <span className='status-dot' />
          <span>
            {loading
              ? 'A verificar os próximos eventos…'
              : `${feed.stale ? 'A mostrar a última lista disponível' : 'Verificado'} · ${new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Lisbon' }).format(new Date(feed.fetchedAt))}${feed.stale ? ' · A fonte está temporariamente indisponível.' : ' · Atualização automática'}`}
          </span>
          {feed.stale && !loading && (
            <button onClick={() => void refresh()}>Tentar novamente</button>
          )}
        </div>
        <div className='personal-toolbar'>
          <ToggleGroup value={[favoriteView]} onValueChange={value=>setFavoriteView(String(value[0]||'all'))} className='personal-views' aria-label='Mostrar favoritos'>
            <ToggleGroupItem value='all'>Todos os eventos</ToggleGroupItem>
            <ToggleGroupItem value='saved'><Bookmark size={16}/>Eventos guardados</ToggleGroupItem>
            <ToggleGroupItem value='shops'><Star size={16}/>Lojas favoritas</ToggleGroupItem>
          </ToggleGroup>
          {storageError&&<p role='status'>O navegador não permitiu guardar as alterações. Os favoritos desta sessão podem perder-se ao fechar.</p>}
          {favoriteView==='shops'&&personal.shops.length>0&&<div className='favorite-shop-list'>{personal.shops.map(shop=><span key={shop.key}>{shop.name} · {shop.city||shop.district}<button aria-label={`Remover ${shop.name}, ${shop.city||shop.district}, das favoritas`} onClick={()=>setPersonal(p=>({...p,shops:p.shops.filter(s=>s.key!==shop.key)}))}>×</button></span>)}</div>}
        </div>
        <section className='results' aria-label='Próximos eventos'>
          <div className='results-heading'>
            <h2>
              Próximos eventos <span aria-live='polite'>{events.length}</span>
            </h2>
            {monthKeys.length>0&&<div className='month-controls'><button onClick={()=>setAllMonths(false)}>Recolher meses</button><button onClick={()=>setAllMonths(true)}>Expandir meses</button></div>}
            <span className='order'>
              <CalendarDays size={15} /> Por ordem de data
            </span>
          </div>
          {events.length === 0 ? (
            <Empty className='empty'>
              <EmptyHeader>
                <CalendarDays size={35} />
                <EmptyTitle className='empty-title'>
                  {favoriteView==='saved'?'Sem eventos guardados nesta seleção.':favoriteView==='shops'?'Sem eventos das lojas favoritas nesta seleção.':'Ainda não há eventos por aqui.'}
                </EmptyTitle>
                <EmptyDescription>
                  {favoriteView==='saved'?'Usa o marcador junto ao calendário para guardar eventos.':favoriteView==='shops'?'Usa a estrela junto ao nome de uma loja para a guardar.':'Experimenta outro jogo, tipo, distrito ou loja.'}
                </EmptyDescription>
              </EmptyHeader>
              {active && (
                <button
                  className='calendar-button'
                  onClick={() => {
                    setGame('all');
                    setKinds([]);
                    setDistrict('all');
                  setPersonal(p=>({...p,shop:'all'}));
                  setFavoriteView('all');
                    setIncludeFriendlies(false);
                  }}
                >
                  Ver todos os eventos
                </button>
              )}
            </Empty>
          ) : (
            Object.entries(groups).map(([month, rows]) => (
              <Collapsible className='month-section' key={month} open={isMonthOpen(month)} onOpenChange={open=>setPersonal(p=>({...p,months:{...p.months,[month]:open}}))}>
                <h3 className='month-title'><CollapsibleTrigger className='month-heading month-toggle'>
                  <span className='month-label'>
                    {new Intl.DateTimeFormat('pt-PT', {
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'UTC',
                    }).format(new Date(month + '-15T12:00:00Z')).replace(/^./, letter => letter.toLocaleUpperCase('pt-PT'))}
                  </span>
                  <span className='month-count'>{rows.length} eventos</span>
                  <ChevronDown size={18} className={isMonthOpen(month)?'month-chevron open':'month-chevron'}/>
                </CollapsibleTrigger></h3>
                <CollapsibleContent>
                <Table className='events-table'>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DATA</TableHead>
                      <TableHead>EVENTO</TableHead>
                      <TableHead>LOJA</TableHead>
                      <TableHead>DISTRITO / LOCAL</TableHead>
                      <TableHead>PREÇO</TableHead>
                      <TableHead>
                        <span className='sr-only'>Adicionar ao calendário</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(e => {
                      const date = dateParts(e.date);
                      const Icon = typeIcons[e.kind];
                      return (
                        <TableRow key={e.id} className={`event-row ${e.kind}`}>
                          <TableCell className='date-cell'>
                            <div className='date-badge'>
                              <strong>{date.day}</strong>
                              <span>{date.month}</span>
                            </div>
                            <div className='date-time'>
                              <strong>{date.weekday}</strong>
                              <span>{e.time || 'Hora por anunciar'}</span>
                            </div>
                          </TableCell>
                          <TableCell className='type-cell'>
                            <span className={`type-badge ${e.kind}`}>
                              <Icon size={15} />
                              {kindLabels[e.kind]}
                            </span>
                            <span
                              className={`game-meta ${e.game.toLowerCase()}`}
                            >
                              {e.game === 'TCG' ? (
                                <GalleryVerticalEnd size={14} />
                              ) : (
                                <Gamepad2 size={14} />
                              )}{' '}
                              Pokémon {e.game}
                            </span>
                          </TableCell>
                          <TableCell className='shop-cell'>
                            <strong className='shop-name'>
                              <button className='save-button shop-save' aria-pressed={personal.shops.some(s=>s.key===shopKey(e))} aria-label={`${personal.shops.some(s=>s.key===shopKey(e))?'Remover':'Guardar'} loja ${e.shop}, ${e.city||e.district}, ${e.address}, nas favoritas`} onClick={()=>toggleShop(e)}><Star size={17}/></button>
                              {e.url ? (
                                <a
                                  className='source-link'
                                  href={e.url}
                                  target='_blank'
                                  rel='noreferrer'
                                >
                                  {e.shop}
                                  <ArrowUpRight size={13} />
                                </a>
                              ) : (
                                e.shop
                              )}
                            </strong>
                            <span title={e.name}>{e.name}</span>
                          </TableCell>
                          <TableCell className='location-cell'>
                            <strong>{e.district}</strong>
                            {e.city && e.city !== e.district && (
                              <span>
                                <MapPin size={13} />
                                {e.city}
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className={`price-cell ${e.price ? '' : 'price-missing'}`}
                          >
                            <span className='price-label'>Entrada</span>
                            {e.price || 'N/A'}
                          </TableCell>
                          <TableCell className='action-cell'>
                            <div className='row-actions'><button className='save-button event-save' aria-pressed={personal.events.includes(eventKey(e))} aria-label={`${personal.events.includes(eventKey(e))?'Remover dos guardados':'Guardar evento'}: ${e.shop}, ${e.date}`} onClick={()=>toggleEvent(e)}><Bookmark size={17}/></button><CalendarButton event={e} /></div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </section>
        <footer>
          <a className='footer-brand' href='/'>
            pokeronda.
          </a>
          <p>
            Eventos via{' '}
            <a
              href='https://www.pokedata.ovh/events/'
              target='_blank'
              rel='noreferrer'
            >
              Pokedata <ArrowUpRight size={12} />
            </a>{' '}
            · Confirma os detalhes com a loja.
          </p>
          <CommunityLinks />
        </footer>
      </main>
    </div>
  );
}
