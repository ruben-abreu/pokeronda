import Agenda from './agenda';
import snapshot from '@/lib/snapshot.json';
import { normalizeEvents } from '@/lib/events';
export default function Home(){return <Agenda initialFeed={{events:normalizeEvents(snapshot.events),fetchedAt:snapshot.fetchedAt,stale:true}}/>}
