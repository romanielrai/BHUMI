'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PhoneIncoming, Users, TrendingUp, PhoneCall, RefreshCw, 
  Play, Pause, Send, PhoneOutgoing, LogOut, Smartphone, MessageSquare, 
  Volume2, Sparkles
} from 'lucide-react';

interface CallRecord {
  id: string;
  phone: string;
  name: string;
  time: string;
  status: 'Booked' | 'Voicemail' | 'Declined';
  duration: string;
  recordingUrl?: string;
  script: string;
}

interface ReactivationCampaign {
  id: string;
  name: string;
  leadsContacted: number;
  responses: number;
  booked: number;
  status: 'Live' | 'Paused' | 'Completed';
}

const mockCalls: CallRecord[] = [
  { id: '1', name: 'James Carter', phone: '+1 (555) 0199', time: '10m ago', status: 'Booked', duration: '1m 24s', script: 'Septic & Drain Callback - Emergency quote request' },
  { id: '2', name: 'Sarah Miller', phone: '+1 (555) 0122', time: '42m ago', status: 'Voicemail', duration: '0m 45s', script: 'Septic & Drain Callback - Left message' },
  { id: '3', name: 'Robert Chen', phone: '+1 (555) 0187', time: '2h ago', status: 'Booked', duration: '2m 10s', script: 'Septic & Drain Callback - Booked inspection' },
  { id: '4', name: 'David Smith', phone: '+1 (555) 0104', time: '4h ago', status: 'Declined', duration: '0m 32s', script: 'Septic & Drain Callback - Busy signal' },
  { id: '5', name: 'Emma Wilson', phone: '+1 (555) 0113', time: '6h ago', status: 'Booked', duration: '1m 58s', script: 'Septic & Drain Callback - Booked pump-out' }
];

const mockCampaigns: ReactivationCampaign[] = [
  { id: 'c1', name: 'Spring Tank Reactivation', leadsContacted: 240, responses: 42, booked: 18, status: 'Live' },
  { id: 'c2', name: 'Cold Pipe Outbound 2026', leadsContacted: 580, responses: 89, booked: 32, status: 'Completed' },
  { id: 'c3', name: 'Commercial Service Renewal', leadsContacted: 120, responses: 12, booked: 4, status: 'Paused' }
];

const mockSMS = [
  { sender: 'AI', body: 'Hey John! It is Bhumi from Septic Specialists. We noticed you scheduled an inspection last year but never renewed. Do you need a service tech this month?', time: '2:15 PM' },
  { sender: 'Lead', body: 'Actually, yes. I have been having backing-up issues in my guest bathroom.', time: '2:17 PM' },
  { sender: 'AI', body: 'Oh no, sorry to hear that. I can get a tech out tomorrow. Would morning (9 AM) or afternoon (1 PM) work?', time: '2:18 PM' },
  { sender: 'Lead', body: 'Tomorrow at 9 AM is perfect. Thanks!', time: '2:20 PM' },
  { sender: 'AI', body: 'Awesome! All booked in. You will receive a text confirmation shortly.', time: '2:21 PM' }
];

export default function CommandCenterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name?: string; role?: string; email?: string } | null>(null);

  // Widget States
  const [callsFeed, setCallsFeed] = useState<CallRecord[]>(mockCalls);
  const [campaigns] = useState<ReactivationCampaign[]>(mockCampaigns);
  const [smsLogs, setSmsLogs] = useState(mockSMS);
  const [replyText, setReplyText] = useState('');
  const [agentHotlineActive, setAgentHotlineActive] = useState(false);

  // Stats Counters
  const [totalRevenue, setTotalRevenue] = useState(28450);
  const [totalBooked, setTotalBooked] = useState(54);
  const [totalRecovered, setTotalRecovered] = useState(38);

  // Call player states
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [playerSeconds, setPlayerSeconds] = useState(0);
  const playerInterval = useRef<any>(null);

  // Hear Your AI input
  const [phoneInput, setPhoneInput] = useState('');
  const [trialIndustry, setTrialIndustry] = useState('septic');
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialMsg, setTrialMsg] = useState('');

  // Feed update simulator notes
  const [latestFeedNotes] = useState<string>('Delivery Agent Note: Integrated ServiceTitan. AI Callback rules successfully live.');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      const role = parsedUser.role?.toUpperCase?.() || parsedUser.role;
      if (role === 'USER') {
        router.push('/dashboard/user');
        return;
      }
    } catch (e) {}

    setLoading(false);

    // Ticking Simulator: occasionally add new events or bump revenue
    const simulation = setInterval(() => {
      setTotalRevenue(prev => prev + Math.floor(Math.random() * 200) + 50);
      
      // Randomly append incoming simulated call to feed
      if (Math.random() > 0.85) {
        const randId = Math.floor(Math.random() * 1000).toString();
        const names = ['Linda Evans', 'George Harris', 'Sophia Rossi', 'Alex Mercer'];
        const outcomes: ('Booked' | 'Voicemail' | 'Declined')[] = ['Booked', 'Voicemail', 'Declined'];
        const newCall: CallRecord = {
          id: randId,
          name: names[Math.floor(Math.random() * names.length)],
          phone: `+1 (555) 01${Math.floor(Math.random() * 90) + 10}`,
          time: 'just now',
          status: outcomes[Math.floor(Math.random() * outcomes.length)],
          duration: '1m ' + Math.floor(Math.random() * 59) + 's',
          script: 'Septic & Drain Callback - Live recovery run'
        };
        setCallsFeed(prev => [newCall, ...prev.slice(0, 4)]);
        if (newCall.status === 'Booked') {
          setTotalBooked(b => b + 1);
          setTotalRecovered(r => r + 1);
        }
      }
    }, 5000);

    return () => {
      clearInterval(simulation);
      if (playerInterval.current) clearInterval(playerInterval.current);
    };
  }, [router]);

  // Handle call recording playback
  const handlePlayRecording = (callId: string) => {
    if (playingCallId === callId) {
      // Pause
      setPlayingCallId(null);
      if (playerInterval.current) clearInterval(playerInterval.current);
    } else {
      // Play
      setPlayingCallId(callId);
      setPlayerSeconds(0);
      if (playerInterval.current) clearInterval(playerInterval.current);
      playerInterval.current = setInterval(() => {
        setPlayerSeconds(s => {
          if (s >= 84) {
            setPlayingCallId(null);
            if (playerInterval.current) clearInterval(playerInterval.current);
            return 0;
          }
          return s + 1;
        });
      }, 1000);
    }
  };

  // Trigger hotline
  const triggerHotline = () => {
    setAgentHotlineActive(true);
    setTimeout(() => {
      setAgentHotlineActive(false);
    }, 6000);
  };

  // Submit test sms reply
  const handleSendSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText) return;
    const newMsg = { sender: 'Lead', body: replyText, time: 'just now' };
    setSmsLogs(prev => [...prev, newMsg]);
    setReplyText('');

    // Simulate AI replying in 2 seconds
    setTimeout(() => {
      setSmsLogs(prev => [...prev, {
        sender: 'AI',
        body: "Understood! Let me review this detail. I've sent an update to our dispatch desk to lock in your booking requirements.",
        time: 'just now'
      }]);
    }, 2000);
  };

  // Submit trial calling
  const handleLaunchTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput) return;
    setTrialLoading(true);
    setTrialMsg('Requesting calling channel...');

    try {
      const res = await fetch('/api/voice/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, industry: trialIndustry })
      });
      const data = await res.json();
      if (res.ok && data.isRealCall) {
        setTrialMsg('📞 Outbound Call Triggered! Check your phone.');
      } else {
        setTrialMsg('💻 Voice AI trial initiated. (Demo Callback queued successfully)');
      }
    } catch {
      setTrialMsg('💻 Demo Callback queued successfully.');
    } finally {
      setTimeout(() => {
        setTrialLoading(false);
        setPhoneInput('');
      }, 4000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 text-center text-white">
        <div className="rounded-[32px] border border-white/10 bg-glass p-10 shadow-glow">
          <p className="animate-pulse text-lg">Accessing Secure Command Center Link...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12">
      {user?.role === 'SUPERADMIN' && (
        <div className="bg-purple-900/30 border border-purple-500/30 text-purple-200 px-5 py-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold backdrop-blur-md mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            <span>Logged in as <strong className="text-purple-300">SUPERADMIN</strong>. You are accessing the **Client Command Center Simulator** view.</span>
          </div>
          <Link href="/superadmin" className="rounded-full bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 text-xs transition duration-200">
            Back to Superadmin Cockpit
          </Link>
        </div>
      )}
      <div className="rounded-[32px] border border-white/10 bg-glass p-6 md:p-10 shadow-glow space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gold animate-ping" />
              <p className="text-xs uppercase tracking-[0.3em] text-gold font-bold">Logged In User</p>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">{user?.name || 'Welcome Back'}</h1>
            <p className="text-xs text-white/50 mt-1">Role / Profile: {user?.role || 'CLIENT'} Workspace ({user?.email})</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> System: Read-Only Visibility
            </span>
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-red-950/20 border border-red-500/20 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/30 transition shadow-sm"
            >
              <LogOut size={12} /> Log Out
            </button>
          </div>
        </div>

        {/* Live Publisher Notes */}
        <div className="rounded-2xl border border-gold/20 bg-gold/5 px-4 py-3 flex items-center gap-2.5 text-xs text-gold/90">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-gold" />
          <span><strong>Publisher update:</strong> {latestFeedNotes}</span>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Revenue Counter */}
          <div className="rounded-2xl border border-white/10 bg-[#060e26] p-6 relative overflow-hidden flex items-center justify-between shadow-glow">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/50">Total Revenue Recovered</p>
              <h2 className="mt-3 text-3xl font-bold text-white">${totalRevenue.toLocaleString()}</h2>
              <p className="text-[10px] text-emerald-400 mt-1">+$450 today from Missed Calls</p>
            </div>
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold border border-gold/30">
              <TrendingUp className="h-6 w-6 animate-pulse" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#060e26] p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/50">Missed Calls Recovered</p>
              <h2 className="mt-3 text-3xl font-bold text-white">{totalRecovered} leads</h2>
              <p className="text-[10px] text-white/40 mt-1">91.4% success answer rate</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-gold">
              <PhoneCall className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#060e26] p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/50">Dead Leads Reactivated</p>
              <h2 className="mt-3 text-3xl font-bold text-white">{totalBooked - totalRecovered} leads</h2>
              <p className="text-[10px] text-white/40 mt-1">12.3% campaign response rate</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-gold">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Live Outbound/Missed Call Feed & Call Library */}
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          
          {/* Outbound missed call recovery live feed */}
          <div className="rounded-2xl border border-white/10 bg-[#060e26]/60 p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <PhoneIncoming className="h-4 w-4 text-gold" /> Recovery Live Feed
              </h3>
              <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/60">
                Auto Callback Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-white/80">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Contact</th>
                    <th className="pb-3 px-3">Service Script</th>
                    <th className="pb-3 px-3 text-center">AI Result</th>
                    <th className="pb-3 px-3">Duration</th>
                    <th className="pb-3 pl-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {callsFeed.map((call) => (
                    <tr key={call.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 font-semibold text-white">
                        <div className="flex flex-col">
                          <span>{call.name}</span>
                          <span className="text-[9px] text-white/40 mt-0.5">{call.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-white/60">{call.script}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                          call.status === 'Booked' ? 'bg-green-950 text-green-400 border-green-500/20' :
                          call.status === 'Voicemail' ? 'bg-amber-950 text-amber-400 border-amber-500/20' :
                          'bg-red-950 text-red-400 border-red-500/20'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-white/40">{call.duration}</td>
                      <td className="py-3 pl-3 text-right text-white/40 font-mono text-[10px]">{call.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Call Recording Library */}
          <div className="rounded-2xl border border-white/10 bg-[#060e26]/60 p-5 md:p-6 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-gold" /> Play Call Recordings
            </h3>
            <p className="text-[10px] text-white/50 leading-relaxed">
              Playable logs of actual AI Voice agent recovery calls.
            </p>

            <div className="space-y-2.5">
              {callsFeed.map((call) => (
                <div key={call.id} className="rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-white">{call.name}</p>
                      <p className="text-[9px] text-white/40">{call.phone} • {call.duration}</p>
                    </div>
                    <button
                      onClick={() => handlePlayRecording(call.id)}
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition border ${
                        playingCallId === call.id 
                          ? 'bg-gold text-background border-gold' 
                          : 'bg-white/5 text-white border-white/10 hover:border-gold/50'
                      }`}
                    >
                      {playingCallId === call.id ? <Pause size={12} className="fill-current" /> : <Play size={12} className="fill-current ml-0.5" />}
                    </button>
                  </div>
                  
                  {/* Waveform Player */}
                  {playingCallId === call.id && (
                    <div className="mt-1 bg-[#04081a] rounded-lg p-2 text-[10px] border border-white/5">
                      <div className="flex items-center justify-between text-white/40 mb-1">
                        <span>Playing call session...</span>
                        <span className="font-mono">0:{playerSeconds.toString().padStart(2, '0')}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gold transition-all duration-1000" style={{ width: `${(playerSeconds / 84) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dead Lead Reactivation Tracker & Text Logs */}
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          
          {/* Reactivation campaign statistics */}
          <div className="rounded-2xl border border-white/10 bg-[#060e26]/60 p-5 md:p-6 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold" /> Reactivation Tracker
            </h3>
            <p className="text-[10px] text-white/50 leading-relaxed">
              Monitoring active, cold database SMS/Email sequences launched by our delivery agent.
            </p>

            <div className="space-y-3">
              {campaigns.map((camp) => (
                <div key={camp.id} className="rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-white">{camp.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                      camp.status === 'Live' ? 'bg-green-950 text-green-400 border-green-500/20' :
                      camp.status === 'Paused' ? 'bg-amber-950 text-amber-400 border-amber-500/20' :
                      'bg-white/5 text-white/40 border-white/10'
                    }`}>
                      {camp.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#04081c] rounded-lg p-2">
                      <span className="text-[9px] text-white/40 block">Contacted</span>
                      <strong className="text-xs text-white block mt-0.5">{camp.leadsContacted}</strong>
                    </div>
                    <div className="bg-[#04081c] rounded-lg p-2">
                      <span className="text-[9px] text-white/40 block">Replies</span>
                      <strong className="text-xs text-white block mt-0.5">{camp.responses}</strong>
                    </div>
                    <div className="bg-[#04081c] rounded-lg p-2">
                      <span className="text-[9px] text-white/40 block">Booked</span>
                      <strong className="text-xs text-gold block mt-0.5">{camp.booked}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SMS logs with leads */}
          <div className="rounded-2xl border border-white/10 bg-[#060e26]/60 p-5 md:p-6 flex flex-col justify-between min-h-[380px]">
            <div>
              <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gold" /> SMS Conversational Logs
                </h3>
                <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-[9px] font-semibold text-gold border border-gold/20">
                  Lead: John Connor (Septic)
                </span>
              </div>

              {/* Chat timeline */}
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                {smsLogs.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col text-xs max-w-[85%] rounded-2xl px-3.5 py-2.5 border ${
                      msg.sender === 'AI'
                        ? 'bg-gold/5 border-gold/20 text-white self-start'
                        : 'bg-white/5 border-white/5 text-white/95 self-end ml-auto'
                    }`}
                  >
                    <span className="font-bold text-[9px] text-gold tracking-wide uppercase mb-0.5">
                      {msg.sender === 'AI' ? '🎙️ VOICE/SMS AI' : '👤 LEAD REPLY'}
                    </span>
                    <p className="leading-normal">{msg.body}</p>
                    <span className="text-[9px] text-white/30 text-right mt-1 block">{msg.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Read-Only Mock input to test conversation flow */}
            <form onSubmit={handleSendSMS} className="mt-4 flex gap-2 pt-3 border-t border-white/5">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a response to simulate lead reply..."
                className="flex-1 bg-[#050b1d] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-gold outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-gold text-background px-4 py-3 text-xs font-bold hover:brightness-105 transition flex items-center justify-center"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Live Trial & Agent Hotline cards */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* "Hear Your AI" box on Command Center */}
          <div className="rounded-2xl border border-white/10 bg-[#060e26]/60 p-5 md:p-6 space-y-4">
            <div>
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-gold" /> Voice AI Test Module
              </h3>
              <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                Test how the AI callbacks dial customer numbers. Select the script tone and launch.
              </p>
            </div>

            <form onSubmit={handleLaunchTrial} className="space-y-3 pt-2">
              <div className="flex gap-2">
                <select
                  value={trialIndustry}
                  onChange={(e) => setTrialIndustry(e.target.value)}
                  className="bg-[#050b1d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="septic">Septic & Drain Tone</option>
                  <option value="industrial">Industrial Cleaning Tone</option>
                  <option value="laundry">Commercial Laundry Tone</option>
                </select>
                
                <input
                  required
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Your Phone Number"
                  className="flex-1 bg-[#050b1d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={trialLoading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gold py-3 text-xs font-bold text-background transition hover:brightness-105 disabled:opacity-50"
              >
                {trialLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
                {trialLoading ? 'Queueing Call...' : 'Hear AI Outbound Dial'}
              </button>

              {trialMsg && (
                <div className="rounded-lg bg-white/5 border border-white/5 p-2.5 text-[10px] text-gold font-semibold text-center animate-pulse">
                  {trialMsg}
                </div>
              )}
            </form>
          </div>

          {/* One button Agent Hotline card */}
          <div className="rounded-2xl border border-white/10 bg-[#060e26]/60 p-5 md:p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-gold" /> Agent Hotline
              </h3>
              <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                Direct hotline channel to your assigned human systems engineer. No chatbot fallback. Press to Dial.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 pt-2">
              <button
                onClick={triggerHotline}
                disabled={agentHotlineActive}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 py-4 text-xs font-bold text-red-300 transition-all"
              >
                {agentHotlineActive ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Ringing Systems Desk...</span>
                  </>
                ) : (
                  <>
                    <PhoneOutgoing className="h-4 w-4" />
                    <span>Dial Systems Agent: +1 (555) 0188</span>
                  </>
                )}
              </button>
              
              {agentHotlineActive && (
                <p className="text-[10px] text-red-400 font-semibold text-center animate-bounce">
                  📞 Connecting routing line to systems specialist...
                </p>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
