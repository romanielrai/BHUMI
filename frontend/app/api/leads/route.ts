import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, json } from '@/lib/auth';

function parseSlotToDate(slot: string): Date {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const slotLower = slot.toLowerCase();
  let targetDayIndex = days.findIndex(day => slotLower.includes(day));
  if (targetDayIndex === -1) targetDayIndex = 1;
  let daysDiff = targetDayIndex - now.getDay();
  if (daysDiff <= 0) daysDiff += 7;
  const targetDate = new Date(now.getTime() + daysDiff * 24 * 60 * 60 * 1000);
  let hour = 10, minute = 0;
  const match = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    hour = parseInt(match[1]);
    minute = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  }
  targetDate.setHours(hour, minute, 0, 0);
  return targetDate;
}

// POST /api/leads — create a lead (public, used by contact/book-demo forms)
export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, business, source, clientId } = await req.json();
    if (!name || !email) return json({ error: 'Name and email are required' }, 400);

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || '',
        business: business || '',
        source: source || 'Web Form',
        status: 'NEW',
        clientId: clientId || 'client-default',
      },
    });

    if (source && (source.startsWith('Demo Booking') || source.includes('Demo'))) {
      try {
        const slotText = source.replace(/Demo Booking\s*[-–]\s*/i, '').trim();
        const scheduledAt = parseSlotToDate(slotText);
        await prisma.appointment.create({
          data: {
            clientId: lead.clientId || 'client-default',
            leadId: lead.id,
            title: `AI Consultation: ${lead.name} (${lead.business || 'New Lead'})`,
            scheduledAt: scheduledAt.toISOString(),
            status: 'PENDING',
            notes: `Auto-scheduled from site demo booking form. Slot: ${slotText}`,
          },
        });
      } catch (err) {
        console.error('Failed to auto-create appointment:', err);
      }
    }

    return json({ lead });
  } catch (err: any) {
    console.error('Lead creation error:', err);
    return json({ error: 'An error occurred while creating the lead' }, 500);
  }
}

// GET /api/leads — list leads (requires auth)
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || undefined;
    const leads = await prisma.lead.findMany({
      where: clientId ? { clientId } : {},
      orderBy: { createdAt: 'desc' },
    });
    return json({ leads });
  } catch (err: any) {
    return json({ error: 'Failed to fetch leads' }, 500);
  }
}
