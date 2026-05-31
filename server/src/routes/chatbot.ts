import { Router } from 'express';
import { OpenAI } from 'openai';
import { prisma } from '../prisma';

const router = Router();
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.warn('WARNING: OPENAI_API_KEY is not defined. Chatbot will run in SIMULATION mode.');
}
const client = new OpenAI({ apiKey: openaiKey || 'mock-key' });

const systemPrompt = `You are a high-ticket AI sales consultant for AI Growth Systems — a premium enterprise AI automation agency.

COMPANY SERVICES:
1. AI Receptionist & Appointment Setter – 24/7 inbound call answering, lead qualification, appointment booking, weekly reporting. Live within 48 hours.
2. Missed Call Recovery – AI callback within 10 seconds of any missed call, automated SMS, email alerts, CRM integration.
3. Dead Lead Reactivation – AI email/SMS campaigns to revive cold contacts with lead scoring and revenue recovery reporting.

PRICING PACKAGES:
- Starter ($1,497/mo): AI receptionist, custom scripts, weekly reports, email support
- Growth ($2,997/mo): Everything in Starter + missed call recovery, SMS follow-ups, CRM integration, bi-weekly strategy calls
- Dominance ($5,997/mo): Everything in Growth + dead lead reactivation, unlimited contacts, brand-trained voice, dedicated success manager

GUARANTEES:
- Live AI agent setup within 48 hours
- Missed calls recovered within 10 seconds
- Dedicated onboarding and campaign management
- Full ROI reporting dashboard

YOUR ROLE:
- Act as a warm, consultative, high-ticket sales specialist
- Qualify leads by asking about their business type and current call volume
- Address objections confidently (e.g., "We already have staff" → explain 24/7 coverage and cost savings)
- Guide conversations toward booking a demo consultation
- Be concise, professional, and results-focused
- Never make up services or features not listed above
- When asked to book, direct them to the Book Demo page

Keep responses under 150 words. Be conversational, not robotic.`;

router.post('/conversation', async (req, res) => {
  const { sessionId, messages, lead, clientId } = req.body;
  let answer = '';

  if (openaiKey && openaiKey !== 'your-openai-api-key' && openaiKey !== 'mock-key') {
    try {
      const formattedMessages = (messages ?? []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text || m.content || ''
      }));
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedMessages
        ],
        temperature: 0.3,
        max_tokens: 250
      });
      answer = response.choices?.[0]?.message?.content ?? '';
    } catch (error) {
      console.error('[OpenAI Error] API call failed, falling back to simulation:', error);
    }
  }

  // ── Simulation mode: company-scripted responses ──
  if (!answer) {
    const last = [...(messages ?? [])].reverse().find(m => m.role === 'user')?.text?.toLowerCase() ?? '';

    if (last.includes('price') || last.includes('cost') || last.includes('pricing') || last.includes('tier') || last.includes('package') || last.includes('plan')) {
      answer = `We have three tailored packages:\n\n• **Starter ($1,497/mo)** — 24/7 AI receptionist, custom scripts, weekly reports\n• **Growth ($2,997/mo)** — Everything + missed call recovery, CRM integration, strategy calls\n• **Dominance ($5,997/mo)** — Full suite + dead lead reactivation, unlimited contacts, dedicated manager\n\nMost clients start on Growth and see a positive ROI within 30 days. Which sounds closest to what you need?`;

    } else if (last.includes('guarantee') || last.includes('roi') || last.includes('result') || last.includes('work')) {
      answer = `Great question. Every client gets:\n\n✓ Live AI agent setup within **48 hours**\n✓ Missed calls recovered in under **10 seconds**\n✓ Full ROI reporting dashboard\n✓ Dedicated onboarding manager\n\nWe've helped service businesses recover thousands in lost revenue monthly. Would you like a demo tailored to your industry?`;

    } else if (last.includes('book') || last.includes('schedule') || last.includes('demo') || last.includes('consult') || last.includes('appointment') || last.includes('call')) {
      answer = `Absolutely — I'd love to get you booked in! Our team will design a custom AI workflow for your specific business.\n\nClick the **Book Demo** button at the top of the page to pick a time that works for you. The session is 30 minutes via Zoom and completely free.\n\nWhat industry are you in? That'll help us prepare the right demo.`;

    } else if (last.includes('miss') || last.includes('call recovery') || last.includes('missed call')) {
      answer = `Our **Missed Call Recovery** system texts back any missed caller within 10 seconds — automatically. The AI continues the conversation, qualifies the lead, and books them while you're busy.\n\nFor most businesses, this alone recovers 15–30% of lost leads per month. Is missed call recovery something you're currently struggling with?`;

    } else if (last.includes('reactivat') || last.includes('dead lead') || last.includes('old lead') || last.includes('cold')) {
      answer = `Our **Dead Lead Reactivation** campaigns use AI-written email and SMS sequences to re-engage contacts who went cold — often recovering $5k–$20k in pipeline per campaign.\n\nWe handle the copywriting, scheduling, and lead scoring for you. How large is your current inactive contact list?`;

    } else if (last.includes('receptionist') || last.includes('inbound') || last.includes('answer') || last.includes('phone')) {
      answer = `Our **AI Receptionist** answers every inbound call 24/7 — after hours, weekends, holidays — using a custom script trained on your services.\n\nIt qualifies callers, books appointments directly into your calendar, and sends you a weekly performance report. Most clients go live within 48 hours.\n\nWould you like to see a live call demo?`;

    } else if (last.includes('hello') || last.includes('hi') || last.includes('hey') || last.includes('start') || last === '') {
      answer = `Hello! Welcome to AI Growth Systems. I'm your AI growth consultant.\n\nI can help you with:\n• Pricing and package details\n• How our AI receptionist and missed call recovery works\n• Booking a free consultation\n• ROI guarantees\n\nWhat brings you here today?`;

    } else {
      answer = `Thanks for reaching out! AI Growth Systems specialises in AI receptionists, missed call recovery, and lead reactivation for service businesses.\n\nCould you tell me a bit more about your business and what you're looking to solve? That'll help me point you in the right direction — or I can book you a free 30-minute strategy call with our team.`;
    }
  }

  await prisma.chatbotLog.create({
    data: {
      sessionId: sessionId ?? 'session-unknown',
      role: 'assistant',
      message: answer,
      metadata: { source: openaiKey && openaiKey !== 'mock-key' ? 'openai' : 'simulation' }
    }
  });

  res.json({ answer });
});

export default router;
