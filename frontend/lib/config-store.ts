// In-memory config store for Next.js serverless environment
// (replaces the file-system-based config-store.ts from the Express backend)

export interface SystemConfigs {
  openaiApiKey: string;
  openaiModel: string;
  openaiTemperature: number;
  systemPrompt: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  elevenLabsApiKey: string;
  voiceProfile: string;
  crmConnected: { gohighlevel: boolean; hubspot: boolean; salesforce: boolean };
  kbEntries: { q: string; a: string }[];
  publisherNote: string;
}

const defaultConfigs: SystemConfigs = {
  openaiApiKey: process.env.OPENAI_API_KEY || 'mock-key',
  openaiModel: 'gpt-4o-mini',
  openaiTemperature: 0.3,
  systemPrompt: `You are a warm, consultative, high-ticket sales specialist for AI Growth Systems — a premium enterprise AI automation agency.

COMPANY SERVICES:
1. AI Receptionist & Appointment Setter – 24/7 inbound call answering, lead qualification, appointment booking, weekly reporting.
2. Missed Call Recovery – AI callback within 10 seconds of any missed call, automated SMS, email alerts, CRM integration.
3. Dead Lead Reactivation – AI email/SMS campaigns to revive cold contacts with lead scoring and revenue recovery reporting.

PRICING PACKAGES:
- Starter ($1,497/mo): AI receptionist, custom scripts, weekly reports, email support
- Growth ($2,997/mo): Everything in Starter + missed call recovery, SMS follow-ups, CRM integration, bi-weekly strategy calls
- Dominance ($5,997/mo): Everything in Growth + dead lead reactivation, unlimited contacts, brand-trained voice, dedicated success manager

YOUR ROLE:
- Qualify leads by asking about their business type and current call volume
- Guide conversations toward booking a demo consultation
- Be concise, professional, and results-focused
- Keep responses under 150 words. Be conversational, not robotic.`,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || 'ACmock',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || 'mocktoken',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '+15550199',
  elevenLabsApiKey: 'mock-eleven-labs-key',
  voiceProfile: 'Rachel',
  crmConnected: { gohighlevel: true, hubspot: false, salesforce: false },
  kbEntries: [
    { q: 'What is the setup time?', a: 'AI receptionist setup is live within 48 hours.' },
    { q: 'Is there a contract?', a: 'All packages are month-to-month with no long-term contract.' },
  ],
  publisherNote: 'Delivery Agent Note: Integrated ServiceTitan. AI Callback rules successfully live.',
};

// Use globalThis to persist across hot reloads in dev
const g = globalThis as any;
if (!g.__configs) g.__configs = { ...defaultConfigs };

export function getConfigs(): SystemConfigs {
  return g.__configs;
}

export function updateConfigs(updates: Partial<SystemConfigs>): SystemConfigs {
  g.__configs = {
    ...g.__configs,
    ...updates,
    crmConnected: updates.crmConnected
      ? { ...g.__configs.crmConnected, ...updates.crmConnected }
      : g.__configs.crmConnected,
  };
  return g.__configs;
}

let apiCallCount = 0;
export function incrementApiCallCount() { apiCallCount++; }
export function getApiCallCount() { return apiCallCount; }
