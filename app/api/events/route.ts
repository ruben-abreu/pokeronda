import { getFeed } from '@/lib/feed';
export async function GET(){const feed=await getFeed();return Response.json(feed,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
