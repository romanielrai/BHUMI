import fs from 'fs';
import path from 'path';

const CONFIG_FILE_PATH = path.resolve(__dirname, '../prisma/configs.json');

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
  crmConnected: {
    gohighlevel: boolean;
    hubspot: boolean;
    salesforce: boolean;
  };
  kbEntries: { q: string; a: string }[];
  publisherNote: string;
}

const defaultConfigs: SystemConfigs = {
  openaiApiKey: process.env.OPENAI_API_KEY || 'mock-key',
  openaiModel: 'gpt-4o-mini',
  openaiTemperature: 0.3,
  systemPrompt: `You are a warm, consultative, high-ticket sales specialist for AI Growth Systems — a premium enterprise AI automation agency.

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
- Qualify leads by asking about their business type and current call volume
- Guide conversations toward booking a demo consultation (redirect them to Book Demo page)
- Be concise, professional, and results-focused
- Keep responses under 150 words. Be conversational, not robotic.`,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || 'ACmock',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || 'mocktoken',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '+15550199',
  elevenLabsApiKey: 'mock-eleven-labs-key',
  voiceProfile: 'Rachel',
  crmConnected: {
    gohighlevel: true,
    hubspot: false,
    salesforce: false
  },
  kbEntries: [
    { q: 'What is the setup time?', a: 'AI receptionist setup is live within 48 hours.' },
    { q: 'Is there a contract?', a: 'All packages are month-to-month with no long-term contract.' }
  ],
  publisherNote: 'Delivery Agent Note: Integrated ServiceTitan. AI Callback rules successfully live.'
};

let activeConfigs: SystemConfigs = { ...defaultConfigs };

// Load configurations on import
try {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    const rawData = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(rawData);
    activeConfigs = { ...defaultConfigs, ...parsed };
    console.log('Successfully loaded persisted server configurations.');
  } else {
    // Write defaults
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(defaultConfigs, null, 2), 'utf-8');
    console.log('Created new default configs.json file.');
  }
} catch (error) {
  console.error('Failed to load or initialize server configurations:', error);
}

export function getConfigs(): SystemConfigs {
  return activeConfigs;
}

export function updateConfigs(updates: Partial<SystemConfigs>): SystemConfigs {
  activeConfigs = {
    ...activeConfigs,
    ...updates,
    crmConnected: updates.crmConnected 
      ? { ...activeConfigs.crmConnected, ...updates.crmConnected }
      : activeConfigs.crmConnected
  };

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(activeConfigs, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to persist server configurations:', error);
  }

  return activeConfigs;
}
