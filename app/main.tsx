import { createRoot } from 'react-dom/client';
import Agenda from './agenda';
import fallback from '../public/data/fallback.json';
import type { Feed } from '@/lib/events';
import './fonts.css';
import './globals.css';
// Prepared once at build time; React runs only on the visitor's device.
createRoot(document.getElementById('root')!).render(<Agenda initialFeed={fallback as Feed} />);
