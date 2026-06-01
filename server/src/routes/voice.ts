import { Router } from 'express';
import twilio from 'twilio';
import { prisma } from '../prisma';

const router = Router();
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

if (!twilioAccountSid || !twilioAuthToken) {
  console.warn('WARNING: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are not defined. Voice calls will run in SIMULATION mode.');
}

const twilioClient = twilioAccountSid && twilioAuthToken ? twilio(twilioAccountSid, twilioAuthToken) : null;

router.post('/call', async (req, res) => {
  try {
    const { to, from, clientId, leadId } = req.body;
    if (!to || !from) {
      return res.status(400).json({ error: 'Both to and from numbers are required' });
    }

    let sid = 'mock-call-sid-' + Math.random().toString(36).substring(7);
    let status = 'queued';

    if (twilioClient) {
      try {
        const call = await twilioClient.calls.create({
          url: process.env.TWILIO_CALLBACK_URL ?? 'http://demo.twilio.com/docs/voice.xml',
          to,
          from
        });
        sid = call.sid;
        status = call.status;
      } catch (error) {
        console.error('Twilio call creation error:', error);
      }
    } else {
      console.log(`[Twilio Mock] Simulating voice call from ${from} to ${to}`);
    }

    await prisma.call.create({
      data: {
        clientId: clientId || 'client-default',
        leadId: leadId || undefined,
        initiatedBy: 'system',
        durationSec: 0,
        outcome: 'initiated'
      }
    });

    res.json({ sid, status });
  } catch (error) {
    console.error('Voice call error:', error);
    res.status(500).json({ error: 'Failed to initiate voice call' });
  }
});

export default router;

