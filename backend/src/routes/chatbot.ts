import { Router } from 'express';
import { OpenAI } from 'openai';
import { prisma } from '../prisma';
import { getConfigs } from '../config-store';

const router = Router();

router.post('/conversation', async (req, res) => {
  try {
    const { sessionId, messages } = req.body;
    let answer = '';

    const configs = getConfigs();
    const activeOpenaiKey = configs.openaiApiKey;
    
    // Check if real key is present
    const isRealKey = activeOpenaiKey && 
                      activeOpenaiKey !== 'your-openai-api-key' && 
                      activeOpenaiKey !== 'sk-your-openai-api-key-here' &&
                      activeOpenaiKey !== 'mock-key' &&
                      activeOpenaiKey.trim().length > 0;

    if (isRealKey) {
      try {
        const client = new OpenAI({ apiKey: activeOpenaiKey });
        const formattedMessages = (messages ?? []).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text || m.content || ''
        }));
        const response = await client.chat.completions.create({
          model: configs.openaiModel || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: configs.systemPrompt },
            ...formattedMessages
          ],
          temperature: configs.openaiTemperature ?? 0.3,
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

      // Check if matches any custom Q&A from trained knowledge base
      const matchedKB = (configs.kbEntries || []).find(entry => 
        last.includes(entry.q.toLowerCase()) || entry.q.toLowerCase().includes(last)
      );

      if (matchedKB) {
        answer = matchedKB.a;
      } else if (last.includes('price') || last.includes('cost') || last.includes('pricing') || last.includes('tier') || last.includes('package') || last.includes('plan')) {
        answer = `We have three packages designed for real ROI:\n\n` +
                 `• **Starter** ($1,497/mo): 24/7 AI receptionist, custom scripts, and weekly reports.\n` +
                 `• **Growth** ($2,997/mo): Adds missed call recovery, CRM integration, and bi-weekly strategy calls (Our most popular!).\n` +
                 `• **Dominance** ($5,997/mo): Includes everything, plus dead lead reactivation and a dedicated success manager.\n\n` +
                 `Most clients see a full return on investment within 30 days. Which sounds like the right fit for your business?`;

      } else if (last.includes('guarantee') || last.includes('roi') || last.includes('result') || last.includes('work') || last.includes('worth')) {
        answer = `Every client gets our **Revenue Growth Guarantee**:\n\n` +
                 `1. **48-Hour Live Setup**: Your AI agent is live and taking calls in 2 days.\n` +
                 `2. **10-Second Call Recovery**: Recover missed callers instantly via automated text-back.\n` +
                 `3. **Full Analytics Dashboard**: Track every dollar recovered in real-time.\n\n` +
                 `We regularly help service businesses recover **$2,000 - $8,000+** in lost revenue per month. Would you like to see a custom ROI estimate?`;

      } else if (last.includes('book') || last.includes('schedule') || last.includes('demo') || last.includes('consult') || last.includes('appointment') || last.includes('call')) {
        answer = `Absolutely! I can help you schedule a free consultation:\n\n` +
                 `• **Format**: 30-minute Zoom call\n` +
                 `• **Outcome**: A custom AI automation blueprint designed specifically for your business\n\n` +
                 `Just click the **Book Demo** button at the top of the page to pick your slot. What industry are you in? We'll prepare relevant demo cases for you.`;

      } else if (last.includes('miss') || last.includes('call recovery') || last.includes('missed call')) {
        answer = `Our **Missed Call Recovery** system works automatically:\n\n` +
                 `• **Instant Text-Back**: Triggered within 10 seconds of a missed call.\n` +
                 `• **Lead Qualification**: The AI chat agent qualifies customer needs in real time.\n` +
                 `• **Auto-Booking**: Integrates with your calendar to book appointments instantly.\n\n` +
                 `On average, this recovers **15% to 30%** of otherwise lost leads. Are you currently losing business due to missed calls?`;

      } else if (last.includes('reactivat') || last.includes('dead lead') || last.includes('old lead') || last.includes('cold')) {
        answer = `Our **Dead Lead Reactivation** campaigns re-engage cold contacts:\n\n` +
                 `• **AI-Written Sequences**: Custom SMS and email templates that sound completely human.\n` +
                 `• **Turnkey Management**: We handle copy, scheduling, scoring, and CRM sync.\n` +
                 `• **Proven Results**: Typical campaigns recover **$5,000 to $20,000+** in dormant pipeline.\n\n` +
                 `How many inactive contacts do you currently have in your database?`;

      } else if (last.includes('receptionist') || last.includes('inbound') || last.includes('answer') || last.includes('phone')) {
        answer = `Our **24/7 AI Receptionist** handles inbound calls around the clock:\n\n` +
                 `• **Always On**: Answers after hours, weekends, and holidays.\n` +
                 `• **Custom Training**: Trained on your exact services, pricing, and FAQ.\n` +
                 `• **Calendar Booking**: Books jobs directly into your booking system (ServiceTitan, Housecall Pro, etc.).\n\n` +
                 `Would you like to hear a live audio demo of this in action?`;

      } else if (last.includes('hello') || last.includes('hi') || last.includes('hey') || last.includes('start') || last === '') {
        answer = `Hello, welcome to AI Growth Systems! I'm your AI growth consultant. I can walk you through our pricing, explain how our AI receptionist and missed call recovery works, or help you book a free consultation. What brings you here today?`;

      } else {
        answer = `Thanks for reaching out! AI Growth Systems specialises in AI receptionists, missed call recovery, and lead reactivation for service businesses. Could you tell me a bit more about what you're looking to solve? Or I can book you a free 30-minute strategy call with our team right now.`;
      }
    }

    await prisma.chatbotLog.create({
      data: {
        sessionId: sessionId ?? 'session-unknown',
        role: 'assistant',
        message: answer,
        metadata: JSON.stringify({ source: isRealKey ? 'openai' : 'simulation' })
      }
    });

    res.json({ answer });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'An error occurred processing your message' });
  }
});

export default router;
