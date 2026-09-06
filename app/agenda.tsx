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
      filterEvents(
        feed.events,
        game,
        kinds,
        district,
        today,
        includeFriendlies,
      ),
    [feed.events, game, kinds, district, today, includeFriendlies],
  );
  const districts = [...new Set(upcoming.map(e => e.district))].sort((a, b) =>
    a.localeCompare(b, 'pt'),
  );
  const groups = events.reduce<Record<string, Tournament[]>>((acc, e) => {
    (acc[e.date.slice(0, 7)] ??= []).push(e);
    return acc;
  }, {});
  const active =
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
            includeFriendlies?: boolean;
          };
          if (
            (p.includeFriendlies !== undefined &&
              typeof p.includeFriendlies !== 'boolean') ||
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
            setIncludeFriendlies(p.includeFriendlies === true);
          });
          return {
            events: filterEvents(
              feed.events,
              p.game,
              selectedKinds,
              p.district,
              today,
              p.includeFriendlies === true,
            ),
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
  }, [game, kinds, district, theme, feed, today, includeFriendlies]);
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
                onValueChange={v => setDistrict(v || 'all')}
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
        <section className='results' aria-label='Próximos eventos'>
          <div className='results-heading'>
            <h2>
              Próximos eventos <span aria-live='polite'>{events.length}</span>
            </h2>
            <span className='order'>
              <CalendarDays size={15} /> Por ordem de data
            </span>
          </div>
          {events.length === 0 ? (
            <Empty className='empty'>
              <EmptyHeader>
                <CalendarDays size={35} />
                <EmptyTitle className='empty-title'>
                  Ainda não há eventos por aqui.
                </EmptyTitle>
                <EmptyDescription>
                  Não há eventos anunciados para esta seleção. Experimenta outro
                  jogo, tipo ou distrito.
                </EmptyDescription>
              </EmptyHeader>
              {active && (
                <button
                  className='calendar-button'
                  onClick={() => {
                    setGame('all');
                    setKinds([]);
                    setDistrict('all');
                    setIncludeFriendlies(false);
                  }}
                >
                  Ver todos os eventos
                </button>
              )}
            </Empty>
          ) : (
            Object.entries(groups).map(([month, rows]) => (
              <div className='month-section' key={month}>
                <div className='month-heading'>
                  <h3>
                    {new Intl.DateTimeFormat('pt-PT', {
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'UTC',
                    }).format(new Date(month + '-15T12:00:00Z'))}
                  </h3>
                  <span>{rows.length} eventos</span>
                  <div />
                </div>
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
                            <strong>
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
                            <CalendarButton event={e} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
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
