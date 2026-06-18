import { json } from '@/lib/auth';

export async function GET() {
  return json({ status: 'ok', timestamp: new Date().toISOString() });
}
