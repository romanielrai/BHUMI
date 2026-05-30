import { Router } from 'express';
import { OpenAI } from 'openai';
import { prisma } from '../prisma';

const router = Router();
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.warn('WARNING: OPENAI_API_KEY is not defined. Chatbot will run in SIMULATION mode.');
}
const client = new OpenAI({ apiKey: openaiKey || 'mock-key' });

const serviceContext = `AI Growth Systems provides enterprise AI receptionist, missed call recovery, lead reactivation, and appointment setter services. Pricing packages include Starter, Growth, and Dominance tiers with guarantees for live setup, qualified appointments, revenue recovery, and ROI. The AI assistant should act as a high-ticket sales representative, qualify leads, book appointments, and support objections.`;

router.post('/conversation', async (req, res) => {
  const { sessionId, messages, lead, clientId } = req.body;
  let answer = '';

  if (openaiKey && openaiKey !== 'your-openai-api-key') {
    try {
      const prompt = `${serviceContext}\nUser context: ${JSON.stringify({ lead, clientId })}`;
      const formattedMessages = (messages ?? []).map((m: any) => ({
        role: m.role,
        content: m.text || m.content || ''
      }));
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          ...formattedMessages
        ],
        temperature: 0.18,
        max_tokens: 600
      });
      answer = response.choices?.[0]?.message?.content ?? '';
    } catch (error) {
      console.error('[OpenAI Error] API call failed, falling back to simulation:', error);
    }
  }

  if (!answer) {
    const lastUserMessage = [...(messages ?? [])].reverse().find(m => m.role === 'user')?.text?.toLowerCase() ?? '';
    if (lastUserMessage.includes('price') || lastUserMessage.includes('cost') || lastUserMessage.includes('pricing') || lastUserMessage.includes('tier')) {
      answer = `AI Growth Systems offers tailored packages designed for high ROI:
• **Starter Package**: 24/7 AI Receptionist & basic Missed Call Recovery.
• **Growth Package (Most Popular)**: Consultative voice agent, smart lead qualification, and CRM scheduling.
• **Dominance Package**: Custom enterprise setup, bespoke agent voices, omni-channel campaigns, and guaranteed meeting quotas.

Would you like me to guide you to the right plan for your business?`;
    } else if (lastUserMessage.includes('book') || lastUserMessage.includes('schedule') || lastUserMessage.includes('demo') || lastUserMessage.includes('consult')) {
      answer = `I'd love to help you book a one-on-one session! Our architects will design a custom voice-agent workflow specifically for your industry.

You can instantly schedule a time using the **Book Demo** link at the top, or simply tell me your preferred day and time!`;
    } else {
      answer = `Hi there! I am your AI growth specialist. I can walk you through how our 24/7 AI Receptionists, Missed Call Recovery, and automated Appointment Setters work to capture and close more pipeline for your business.

Are you looking to reactivate dormant leads, or handle inbound customer intake?`;
    }
  }

  await prisma.chatbotLog.create({
    data: {
      sessionId: sessionId ?? 'session-unknown',
      role: 'assistant',
      message: answer,
      metadata: { source: openaiKey ? 'openai' : 'simulation' }
    }
  });

  res.json({ answer });
});

export default router;
