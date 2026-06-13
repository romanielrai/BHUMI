'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Users, CreditCard, Brain, Phone, FileText,
  Activity, Database, MessageSquare, Server, ShieldAlert, ArrowLeft, RefreshCw, LogOut,
  X, Plus, Trash2, PhoneIncoming, TrendingUp, PhoneCall, Play, Pause, Send, PhoneOutgoing, 
  Smartphone, Volume2, Sparkles, CheckCircle, AlertCircle, Building, Lock, Key, Clock, Sliders, Upload, Link2, AlertTriangle, PlayCircle, CalendarDays
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

interface Client {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  plan: string;
  industry: string;
  revenueBracket: string;
  status: string;
}

interface SaMetricData {
  totalUsers: number;
  activeClients: number;
  totalLeads: number;
  apiCallsToday: number;
}

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone: string;
  business: string;
  status: string;
  source: string;
  createdAt: string;
}

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

const initialClients: Client[] = [
  { id: 'client-default', companyName: 'Septic & Drain Specialists', contactName: 'John Doe', contactEmail: 'john@example.com', contactPhone: '555-0188', plan: 'DOMINANCE', industry: 'Septic & Drain', revenueBracket: '$5M–$15M', status: 'ACTIVE' },
  { id: 'client-2', companyName: 'Industrial Jetting Corp', contactName: 'Sarah Miller', contactEmail: 'sarah@jetting.com', contactPhone: '555-0144', plan: 'GROWTH', industry: 'Industrial Cleaning', revenueBracket: '$8M–$40M', status: 'ACTIVE' },
  { id: 'client-3', companyName: 'Northeast Hospital Linen', contactName: 'David Chen', contactEmail: 'dchen@hospital-linen.com', contactPhone: '555-0199', plan: 'STARTER', industry: 'Commercial Laundry', revenueBracket: '$5M–$25M', status: 'ACTIVE' }
];

const tabDefinitions: Record<string, { label: string; icon: React.ReactNode }> = {
  'cockpit': { label: 'System Cockpit', icon: <ShieldAlert size={14} /> },
  'clients': { label: 'Client Manager', icon: <Users size={14} /> },
  'voice': { label: 'AI Voice Builder', icon: <Sliders size={14} /> },
  'engine': { label: 'Missed Call Feed', icon: <PhoneCall size={14} /> },
  'reactivation': { label: 'Reactivation', icon: <Upload size={14} /> },
  'coach': { label: 'AI Coach & Scoring', icon: <Sparkles size={14} /> },
  'crm': { label: 'CRM Sync', icon: <Link2 size={14} /> },
  'inbox': { label: 'Internal Inbox', icon: <MessageSquare size={14} /> },
  'leads': { label: 'Leads & Analytics', icon: <Activity size={14} /> },
  'voice-test': { label: 'Voice AI Test', icon: <Volume2 size={14} /> },
  'sms-chat': { label: 'SMS Chat Logs', icon: <MessageSquare size={14} /> }
};

export default function UnifiedDashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name?: string; role?: string; email?: string } | null>(null);
  const [userRole, setUserRole] = useState<string>('USER');

  // Navigation tab controls
  const [activeTab, setActiveTab] = useState<string>('leads');
  const [allowedTabs, setAllowedTabs] = useState<string[]>(['leads', 'voice-test', 'sms-chat']);

  // --- GENERAL APP DATA STATES ---
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [callsFeed, setCallsFeed] = useState<CallRecord[]>([]);
  const [campaigns] = useState<ReactivationCampaign[]>(mockCampaigns);
  const [smsLogs, setSmsLogs] = useState(mockSMS);
  const [replyText, setReplyText] = useState('');
  const [agentHotlineActive, setAgentHotlineActive] = useState(false);
  const [latestFeedNotes, setLatestFeedNotes] = useState<string>('Delivery Agent Note: Integrated ServiceTitan. AI Callback rules successfully live.');

  // User/Client Stats Tickers
  const [totalRevenue, setTotalRevenue] = useState(28450);
  const [totalBooked, setTotalBooked] = useState(54);
  const [totalRecovered, setTotalRecovered] = useState(38);
  const [totalLeadsGenerated, setTotalLeadsGenerated] = useState(120);
  const [totalCallsAnswered, setTotalCallsAnswered] = useState(90);

  // Outbound Dial Test Form
  const [phoneInput, setPhoneInput] = useState('');
  const [trialIndustry, setTrialIndustry] = useState('septic');
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialMsg, setTrialMsg] = useState('');

  // Call record player
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [playerSeconds, setPlayerSeconds] = useState(0);
  const playerInterval = useRef<any>(null);

  // --- ADMIN TAB STATES ---
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', plan: 'GROWTH', industry: 'Septic & Drain', revenueBracket: '$5M–$15M' });
  const [selectedVoiceIndustry, setSelectedVoiceIndustry] = useState('septic');
  const [callScript, setCallScript] = useState(`[Niche: Septic & Drain Callback Script]
- Trigger: Outbound dial within 10 seconds of a missed call.
- Introduction: "Hey there! This is the callback assistant for Septic Specialists. We saw we just missed a call from this number a few seconds ago and wanted to get right back to you. Did we catch you at a good time?"`);
  const [scriptSaved, setScriptSaved] = useState(false);
  const [agentListeningId, setAgentListeningId] = useState<string | null>(null);
  const [takeOverActiveId, setTakeOverActiveId] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploadStatus, setCsvUploadStatus] = useState('');
  const [selectedCampaignTemplate, setSelectedCampaignTemplate] = useState('septic-stale');
  const [reactivationLogs, setReactivationLogs] = useState([
    { id: 'l1', campaign: 'Spring Pump-out Campaign', contacted: 140, replies: 18, bookings: 6, date: '2026-06-06' }
  ]);
  const [publisherNote, setPublisherNote] = useState('');
  const [publisherStatus, setPublisherStatus] = useState('');
  const [inboxReplyText, setInboxReplyText] = useState('');
  const [selectedInboxId, setSelectedInboxId] = useState<string | null>('in1');
  const inboxMessages = [
    { id: 'in1', clientName: 'Linda Harris', phone: '+1 (555) 0134', message: 'I need a tech tomorrow morning. Standard drain cleaning.', date: '10:14 AM', type: 'SMS' },
    { id: 'in2', clientName: 'Hospital Route Desk', phone: '+1 (555) 0199', message: 'Can we schedule double delivery on Tuesday?', date: '9:45 AM', type: 'SMS' }
  ];

  // --- COACH TAB STATES ---
  const [callsList, setCallsList] = useState<any[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  // --- SUPERADMIN MODAL & DATA STATES ---
  const [saMetrics, setSaMetrics] = useState<SaMetricData | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [configs, setConfigs] = useState<any>({
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    openaiTemperature: 0.3,
    systemPrompt: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    elevenLabsApiKey: '',
    voiceProfile: '',
    crmConnected: { gohighlevel: false, hubspot: false, salesforce: false }
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', roleName: 'USER' });
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // 1. Fetch user metrics and leads
      const metricsRes = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        if (data.metrics) {
          setTotalBooked(data.metrics.appointmentsBooked ?? 54);
          setTotalRecovered(data.metrics.recoveredLeads ?? 38);
          setTotalLeadsGenerated(data.metrics.leadsGenerated ?? 120);
          setTotalCallsAnswered(data.metrics.callsAnswered ?? 90);
          if (data.metrics.publisherNote) {
            setLatestFeedNotes(data.metrics.publisherNote);
          }
        }
      }

      const leadsRes = await fetch('/api/leads?clientId=client-default', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads ?? []);
        
        const apiLeads = data.leads ?? [];
        if (apiLeads.length > 0) {
          const mappedCalls: CallRecord[] = apiLeads.slice(0, 5).map((lead: any, index: number) => {
            const diffMs = Date.now() - new Date(lead.createdAt).getTime();
            const diffMins = Math.floor(diffMs / 60000);
            let timeText = 'just now';
            if (diffMins > 0) {
              if (diffMins < 60) {
                timeText = `${diffMins}m ago`;
              } else {
                const diffHours = Math.floor(diffMins / 60);
                timeText = `${diffHours}h ago`;
              }
            }
            let mappedStatus: 'Booked' | 'Voicemail' | 'Declined' = 'Voicemail';
            if (lead.status === 'BOOKED') mappedStatus = 'Booked';
            else if (lead.status === 'LOST') mappedStatus = 'Declined';
            return {
              id: lead.id || String(index),
              name: lead.name,
              phone: lead.phone,
              time: timeText,
              status: mappedStatus,
              duration: '1m ' + (15 + (index * 7) % 45) + 's',
              script: `${lead.source} - ${lead.business}`
            };
          });
          setCallsFeed(mappedCalls);
        }
      }

      // 2. Fetch admin data
      const role = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).role?.toUpperCase() : 'USER';
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        const clientsRes = await fetch('/api/admin/clients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.clients ?? []);
          setClientsList(data.clients ?? []);
        }

        const callsRes = await fetch('/api/admin/calls', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (callsRes.ok) {
          const data = await callsRes.json();
          setCallsList(data.calls ?? []);
          if (data.calls?.length > 0) {
            setSelectedCallId(data.calls[0].id);
          }
        }

        const configsRes = await fetch('/api/admin/configs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (configsRes.ok) {
          const data = await configsRes.json();
          if (data.systemPrompt) {
            setCallScript(data.systemPrompt);
          }
          if (data.voiceScript) {
            setSelectedVoiceIndustry(data.voiceScript);
          }
        }
      }

      // 3. Fetch superadmin data
      if (role === 'SUPERADMIN') {
        const saMetricsRes = await fetch('/api/dashboard/superadmin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (saMetricsRes.ok) {
          const data = await saMetricsRes.json();
          setSaMetrics(data.metrics);
        }

        const saConfigsRes = await fetch('/api/superadmin/configs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (saConfigsRes.ok) {
          const data = await saConfigsRes.json();
          setConfigs(data.configs);
        }

        const saHealthRes = await fetch('/api/superadmin/system-health', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (saHealthRes.ok) {
          const data = await saHealthRes.json();
          setHealthData(data);
        }
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, []);

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
      setUserRole(role);

      // Define tab layouts dynamically
      if (role === 'SUPERADMIN') {
        setAllowedTabs(['cockpit', 'clients', 'voice', 'engine', 'reactivation', 'coach', 'crm', 'inbox', 'leads']);
        setActiveTab('cockpit');
      } else if (role === 'ADMIN') {
        setAllowedTabs(['clients', 'voice', 'engine', 'reactivation', 'coach', 'crm', 'inbox', 'leads']);
        setActiveTab('clients');
      } else {
        setAllowedTabs(['leads', 'voice-test', 'sms-chat']);
        setActiveTab('leads');
      }

      fetchDashboardData();
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }

    // Ticker simulation
    const simulation = setInterval(() => {
      setTotalRevenue(prev => prev + Math.floor(Math.random() * 200) + 50);
    }, 8000);

    return () => {
      clearInterval(simulation);
      if (playerInterval.current) clearInterval(playerInterval.current);
    };
  }, [router, fetchDashboardData]);

  // --- PLAY RECORDINGS ---
  const handlePlayRecording = (callId: string) => {
    if (playingCallId === callId) {
      setPlayingCallId(null);
      if (playerInterval.current) clearInterval(playerInterval.current);
    } else {
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

  // --- DIAL AI TRIAL OUTBOUND ---
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

  // --- SMS SIMULATION ---
  const handleSendSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText) return;
    const newMsg = { sender: 'Lead', body: replyText, time: 'just now' };
    setSmsLogs(prev => [...prev, newMsg]);
    setReplyText('');

    setTimeout(() => {
      setSmsLogs(prev => [...prev, {
        sender: 'AI',
        body: "Understood! Let me review this detail. I've sent an update to our dispatch desk to lock in your booking requirements.",
        time: 'just now'
      }]);
    }, 2000);
  };

  // --- MANUAL OUTBOUND HOTLINE RING ---
  const triggerHotline = () => {
    setAgentHotlineActive(true);
    setTimeout(() => {
      setAgentHotlineActive(false);
    }, 6000);
  };

  // --- ADMIN ACTIONS ---
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newClient)
      });
      if (res.ok) {
        fetchDashboardData();
        setShowAddClient(false);
        setNewClient({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', plan: 'GROWTH', industry: 'Septic & Drain', revenueBracket: '$5M–$15M' });
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to onboard client');
      }
    } catch (err) {
      console.error('Error creating client:', err);
    }
  };

  const handleToggleSuspend = async (clientId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const newStatus = client.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error suspending/activating client:', err);
    }
  };

  const handleSaveScript = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          voiceScript: selectedVoiceIndustry,
          systemPrompt: callScript
        })
      });
      if (res.ok) {
        setScriptSaved(true);
        setTimeout(() => setScriptSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving script configuration:', err);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setCsvUploadStatus('Uploading lead records...');
      setTimeout(() => {
        setCsvUploadStatus(`Successfully parsed ${file.name} - 150 contacts detected.`);
      }, 1500);
    }
  };

  const handleLaunchCampaign = () => {
    if (!csvFile) {
      alert('Please upload a lead CSV first.');
      return;
    }
    const newCamp = {
      id: 'l-' + (reactivationLogs.length + 1),
      campaign: selectedCampaignTemplate === 'septic-stale' ? 'Septic Reactivation Run' : 'Laundry Commercial Outreach',
      contacted: 150,
      replies: 0,
      bookings: 0,
      date: new Date().toISOString().split('T')[0]
    };
    setReactivationLogs(prev => [newCamp, ...prev]);
    setCsvFile(null);
    setCsvUploadStatus('Campaign launched! Sequence active.');
    setTimeout(() => setCsvUploadStatus(''), 4000);
  };

  const handlePublishNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisherNote) return;
    setPublisherStatus('Pushing update note to Command Center feed...');
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ publisherNote })
      });
      if (res.ok) {
        setPublisherStatus('Published! Command Center dashboard notes updated.');
        setPublisherNote('');
        setTimeout(() => setPublisherStatus(''), 3000);
      } else {
        setPublisherStatus('Failed to publish update.');
      }
    } catch (err) {
      setPublisherStatus('Network error publishing update.');
    }
  };

  const handleInboxReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboxReplyText) return;
    setInboxReplyText('');
    alert('Agent reply successfully sent to customer cell number.');
  };

  // --- SUPERADMIN MODAL LOADER ---
  const loadModuleData = async (moduleId: string) => {
    const token = localStorage.getItem('token') || '';
    if (!token) return;

    if (moduleId === 'user-management') {
      try {
        const res = await fetch('/api/superadmin/users', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUsersList(data.users || []);
        }
      } catch (e) { console.error(e); }
    } else if (moduleId === 'audit-logs') {
      try {
        const res = await fetch('/api/superadmin/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data.logs || []);
        }
      } catch (e) { console.error(e); }
    } else if (moduleId === 'conversation-logs') {
      try {
        const res = await fetch('/api/superadmin/conversation-logs', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setChatLogs(data.logs || []);
        }
      } catch (e) { console.error(e); }
    } else if (moduleId === 'subscription-billing') {
      try {
        const res = await fetch('/api/admin/clients', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setClientsList(data.clients || []);
        }
      } catch (e) { console.error(e); }
    } else if (moduleId === 'system-health' || moduleId === 'server-status') {
      try {
        const res = await fetch('/api/superadmin/system-health', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setHealthData(data);
        }
      } catch (e) { console.error(e); }
    }
  };

  const openModule = (moduleId: string) => {
    setActiveModal(moduleId);
    loadModuleData(moduleId);
  };

  const closeModule = () => {
    setActiveModal(null);
    setSelectedSession(null);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setShowAddUserModal(false);
        setNewUser({ email: '', password: '', name: '', roleName: 'USER' });
        loadModuleData('user-management');
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add user');
      }
    } catch (err) {
      alert('Network error adding user');
    }
  };

  const handleToggleSuspendUser = async (u: any) => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`/api/superadmin/users/${u.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ suspended: !u.suspended })
      });
      if (res.ok) {
        loadModuleData('user-management');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ roleName: newRole })
      });
      if (res.ok) {
        loadModuleData('user-management');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadModuleData('user-management');
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveConfigs = async (updates: Partial<typeof configs>) => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch('/api/superadmin/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateClientPlan = async (clientId: string, newPlan: string) => {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan: newPlan })
      });
      if (res.ok) {
        loadModuleData('subscription-billing');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <main className="mx-auto mt-32 max-w-xl px-6 pb-24 text-center text-white">
        <div className="rounded-[32px] border border-white/10 bg-glass p-10 shadow-glow">
          <p className="animate-pulse text-sm text-white/60">Launching unified systems control console...</p>
        </div>
      </main>
    );
  }

  const superAdminModules = [
    { id: 'user-management', icon: <Users className="h-5 w-5 text-purple-400" />, title: 'User Management', desc: 'Create, suspend, and manage all platform users and roles.' },
    { id: 'subscription-billing', icon: <CreditCard className="h-5 w-5 text-purple-400" />, title: 'Subscription Billing', desc: 'View invoices, plans, and billing cycles per client.' },
    { id: 'ai-config', icon: <Brain className="h-5 w-5 text-purple-400" />, title: 'AI Model Configuration', desc: 'Select OpenAI model, temperature, and system prompt templates.' },
    { id: 'twilio-config', icon: <Phone className="h-5 w-5 text-purple-400" />, title: 'Twilio & ElevenLabs', desc: 'Configure API keys, phone numbers, and voice profiles.' },
    { id: 'audit-logs', icon: <FileText className="h-5 w-5 text-purple-400" />, title: 'Audit Logs', desc: 'Complete platform event logs with actor credentials.' },
    { id: 'system-health', icon: <Activity className="h-5 w-5 text-purple-400" />, title: 'System Health', desc: 'Monitor uptime, queue status, and database latency.' },
    { id: 'crm-integration', icon: <Database className="h-5 w-5 text-purple-400" />, title: 'CRM Integration', desc: 'Connect GoHighLevel, HubSpot, or Salesforce pipelines.' },
    { id: 'conversation-logs', icon: <MessageSquare className="h-5 w-5 text-purple-400" />, title: 'Conversation Logs', desc: 'Full transcripts from all web chat and voice sessions.' },
    { id: 'server-status', icon: <Server className="h-5 w-5 text-purple-400" />, title: 'Server Status', desc: 'Node infrastructure metrics and deployment ports.' },
  ];

  return (
    <main className="mx-auto mt-28 max-w-7xl px-6 pb-24 md:px-12 font-sans text-white">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className={`h-[350px] w-[600px] rounded-full blur-[140px] opacity-15 transition-colors duration-500 ${
          userRole === 'SUPERADMIN' ? 'bg-purple-600' : userRole === 'ADMIN' ? 'bg-gold' : 'bg-blue-600'
        }`} />
      </div>

      <div className="rounded-[32px] border border-white/10 bg-glass p-6 md:p-10 shadow-glow space-y-8">
        
        {/* Dynamic Context Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-white/10 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full animate-ping ${
                userRole === 'SUPERADMIN' ? 'bg-purple-500' : userRole === 'ADMIN' ? 'bg-gold' : 'bg-emerald-500'
              }`} />
              <p className="text-xs uppercase tracking-[0.25em] font-bold text-white/70">
                {userRole === 'SUPERADMIN' ? 'Enterprise System Cockpit' : userRole === 'ADMIN' ? 'Administrative Portal' : 'Workspace Command Center'}
              </p>
            </div>
            
            <h1 className="text-2xl font-extrabold md:text-3xl bg-gradient-to-r from-white via-white to-gold bg-clip-text text-transparent">
              Welcome Back, {user?.name || 'Systems Specialist'}
            </h1>

            {/* Badges bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-2xs text-white/60 font-mono">
                {user?.email}
              </span>
              <span className={`rounded-full border px-3 py-1 text-2xs font-bold ${
                userRole === 'SUPERADMIN' ? 'bg-purple-950/40 border-purple-500/35 text-purple-300' :
                userRole === 'ADMIN' ? 'bg-gold/10 border-gold/30 text-gold' :
                'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              }`}>
                ROLE: {userRole}
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-2xs text-emerald-400 font-semibold">
                SYSTEMS LIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 sm:self-start lg:self-center">
            <button
               onClick={fetchDashboardData}
               className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4.5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 hover:text-gold"
            >
               <RefreshCw size={12} />
               <span>Sync Console</span>
            </button>
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-red-950/20 border border-red-500/20 px-4.5 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-900/30 transition"
            >
               <LogOut size={12} /> 
               <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tabs Navigation Bar */}
        <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
          {allowedTabs.map(tabId => {
            const tabDef = tabDefinitions[tabId];
            if (!tabDef) return null;
            const isSelected = activeTab === tabId;

            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-gold border-gold text-background shadow-glow-sm scale-[1.01]'
                    : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tabDef.icon}
                <span>{tabDef.label}</span>
              </button>
            );
          })}
        </div>

        {/* --- TAB VIEWPORTS --- */}

        {/* 1. COCKPIT TAB (SUPERADMIN ONLY) */}
        {activeTab === 'cockpit' && userRole === 'SUPERADMIN' && (
          <div className="space-y-8">
            {/* SA Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Platform Users', value: saMetrics?.totalUsers ?? '...' },
                { label: 'Active Business Clients', value: saMetrics?.activeClients ?? '...' },
                { label: 'Total Inbound Leads', value: saMetrics?.totalLeads ?? '...' },
                { label: 'API Calls Processed', value: saMetrics?.apiCallsToday ?? '...' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-purple-500/10 bg-[#08122e] p-5 flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-white/50">{stat.label}</span>
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Quick Portals banner */}
            <div className="rounded-2xl border border-purple-500/25 bg-purple-950/10 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-purple-400" />
                  <span>Platform Command Views</span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">Quickly access client and system panels directly from this superadmin session.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <button onClick={() => setActiveTab('clients')} className="rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-purple-500/40 hover:bg-[#071333] transition flex flex-col justify-between h-24">
                  <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">Client Setup</span>
                  <span className="text-xs font-bold text-white">Client Tone & Voice Manager</span>
                </button>
                <button onClick={() => setActiveTab('leads')} className="rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-purple-500/40 hover:bg-[#071333] transition flex flex-col justify-between h-24">
                  <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">Client Center</span>
                  <span className="text-xs font-bold text-white">Simulated Metrics Cockpit</span>
                </button>
                <button onClick={() => setActiveTab('coach')} className="rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-purple-500/40 hover:bg-[#071333] transition flex flex-col justify-between h-24">
                  <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">Scoring Portal</span>
                  <span className="text-xs font-bold text-white">AI Coach compliance logs</span>
                </button>
              </div>
            </div>

            {/* SA Module Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {superAdminModules.map((mod) => (
                <div
                  key={mod.id}
                  onClick={() => openModule(mod.id)}
                  className="group rounded-2xl border border-white/10 bg-[#08122e] p-5 transition hover:border-purple-500/35 hover:bg-[#0a1535] cursor-pointer flex gap-4"
                >
                  <div className="rounded-xl bg-purple-500/10 p-2.5 h-fit text-purple-400 group-hover:bg-purple-500/20 transition">
                    {mod.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{mod.title}</h4>
                    <p className="mt-1 text-xs text-white/50 leading-relaxed">{mod.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Status Infobar */}
            <div className="rounded-2xl border border-white/10 bg-[#08122e] p-5 flex flex-col gap-4">
              <p className="text-xs font-bold text-white">Database Engine & Integration Diagnostics</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs flex justify-between items-center">
                  <span className="text-white/50">Database type</span>
                  <span className="font-mono text-white font-semibold">SQLite (local)</span>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs flex justify-between items-center">
                  <span className="text-white/50">OpenAI API Connection</span>
                  <span className={`font-semibold ${healthData?.integrations?.openai === 'LIVE' ? 'text-green-400' : 'text-amber-400'}`}>
                    {healthData?.integrations?.openai || 'SIMULATED'}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs flex justify-between items-center">
                  <span className="text-white/50">Twilio Webhook Channel</span>
                  <span className={`font-semibold ${healthData?.integrations?.twilio === 'LIVE' ? 'text-green-400' : 'text-amber-400'}`}>
                    {healthData?.integrations?.twilio || 'SIMULATED'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CLIENT MANAGER TAB */}
        {activeTab === 'clients' && (userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2 pb-2">
              <div>
                <h2 className="text-lg font-bold text-white">Registered Client Accounts</h2>
                <p className="text-xs text-white/50">Manage subscription levels, niche configuration portals, and active status.</p>
              </div>
              <button
                onClick={() => setShowAddClient(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-background hover:brightness-105 transition"
              >
                <Plus size={14} /> Onboard Client
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#060e26]/50">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-white/40 font-semibold uppercase tracking-wider">
                    <th className="p-4">Company</th>
                    <th className="p-4">Contact Person</th>
                    <th className="p-4">Niche Door</th>
                    <th className="p-4">Revenue Bracket</th>
                    <th className="p-4 text-center">Plan</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-4 font-semibold text-white">{c.companyName}</td>
                      <td className="p-4 text-white/70">{c.contactName} ({c.contactEmail}) • {c.contactPhone}</td>
                      <td className="p-4 font-medium text-gold">{c.industry}</td>
                      <td className="p-4 text-white/60">{c.revenueBracket}</td>
                      <td className="p-4 text-center font-mono font-bold text-white/95">{c.plan}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-2xs font-bold border ${
                          c.status === 'ACTIVE' 
                            ? 'bg-green-950 text-green-400 border-green-500/20' 
                            : 'bg-red-950 text-red-400 border-red-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleSuspend(c.id)}
                          className={`rounded px-2.5 py-1 text-[10px] font-bold border transition ${
                            c.status === 'ACTIVE'
                              ? 'bg-red-950/20 text-red-400 border-red-500/20 hover:bg-red-950/40'
                              : 'bg-green-950/20 text-green-400 border-green-500/20 hover:bg-green-950/40'
                          }`}
                        >
                          {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note publisher */}
            <div className="rounded-2xl border border-white/10 bg-[#060e26]/40 p-5 space-y-4 max-w-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold">Progress Publisher Console</h3>
              <p className="text-2xs text-white/50">Write progress updates that display immediately on client command centers.</p>
              <form onSubmit={handlePublishNote} className="space-y-3">
                <textarea
                  required
                  value={publisherNote}
                  onChange={(e) => setPublisherNote(e.target.value)}
                  placeholder="Enter update details..."
                  className="w-full bg-[#050b1d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold h-20 resize-none"
                />
                <button type="submit" className="rounded-lg bg-gold text-background px-4 py-2 text-xs font-bold hover:brightness-105">
                  Publish Update
                </button>
              </form>
              {publisherStatus && <p className="text-xs text-gold animate-pulse">{publisherStatus}</p>}
            </div>
          </div>
        )}

        {/* 3. AI VOICE BUILDER */}
        {activeTab === 'voice' && (userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">AI Voice Builder & Scripts</h2>
              <p className="text-xs text-white/50">Modify prompts, trigger logic blocks, and adjust phone routing variables.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-[250px_1fr]">
              <div className="space-y-2">
                {[
                  { id: 'septic', label: 'Septic & Drain Tone' },
                  { id: 'industrial', label: 'Industrial Cleaning' },
                  { id: 'laundry', label: 'Commercial Laundry' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedVoiceIndustry(s.id);
                      if (s.id === 'septic') {
                        setCallScript(`[Niche: Septic & Drain Callback Script]
- Trigger: Outbound dial within 10 seconds of a missed call.
- Introduction: "Hey there! This is the callback assistant for Septic Specialists. We saw we just missed a call from this number a few seconds ago and wanted to get right back to you. Did we catch you at a good time?"`);
                      } else if (s.id === 'industrial') {
                        setCallScript(`[Niche: Industrial Cleaning Reactivation Script]
- Trigger: Outbound re-engagement list dial.
- Introduction: "Hello, this is Industrial Jetting Corp. We are following up on our tank maintenance cleanout contract options from last fall. Are you the lead dispatcher?"`);
                      } else {
                        setCallScript(`[Niche: Commercial Laundry Script]
- Trigger: Inbound route answering service.
- Introduction: "Hello and thank you for calling Laundry Route Solutions. Let's look up your commercial account ID. Are you calling regarding hospitality pick-up logistics?"`);
                      }
                    }}
                    className={`w-full rounded-xl px-4 py-3.5 text-left text-xs font-semibold border transition ${
                      selectedVoiceIndustry === s.id
                        ? 'bg-gold/15 border-gold text-gold'
                        : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 space-y-4">
                <label className="block text-xs uppercase tracking-wider text-white/50 font-bold">System Prompt script prompt</label>
                <textarea
                  value={callScript}
                  onChange={(e) => setCallScript(e.target.value)}
                  className="w-full bg-[#050b1d] border border-white/10 rounded-xl p-4 font-mono text-xs text-white outline-none focus:border-gold h-60"
                />
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/40">Routing Destination:</span>
                    <input type="text" defaultValue="+1 (555) 0188" className="bg-[#050b1d] border border-white/10 rounded px-2.5 py-1 text-xs text-white outline-none w-32" />
                  </div>
                  <button onClick={handleSaveScript} className="rounded-xl bg-gold text-background px-5 py-2.5 text-xs font-bold hover:brightness-105">
                    Save Voice Configuration
                  </button>
                </div>
                {scriptSaved && <p className="text-xs text-green-400 font-semibold text-center animate-pulse mt-2">✅ Voice script parameters successfully saved.</p>}
              </div>
            </div>
          </div>
        )}

        {/* 4. MISSED CALL FEED ENGINE */}
        {activeTab === 'engine' && (userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Missed Call Feed Engine</h2>
              <p className="text-xs text-white/50">Listen to live calls or manual takeover on inbound caller pipelines.</p>
            </div>
            <div className="space-y-3">
              {[
                { id: 'm1', name: 'Linda Harris', phone: '+1 (555) 0134', status: 'AI Callback Initiating...', active: true },
                { id: 'm2', name: 'Robert Chen', phone: '+1 (555) 0187', status: 'Booked in CRM', active: false },
                { id: 'm3', name: 'James Evans', phone: '+1 (555) 0104', status: 'Answered (Take Over Available)', active: true }
              ].map((c) => (
                <div key={c.id} className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                      <PhoneCall size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{c.name} ({c.phone})</p>
                      <p className="text-2xs text-white/40 mt-0.5">Status: <span className="text-gold font-medium">{c.status}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {c.active ? (
                      <>
                        <button
                          onClick={() => setAgentListeningId(agentListeningId === c.id ? null : c.id)}
                          className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                            agentListeningId === c.id ? 'bg-emerald-950 text-emerald-300 border-emerald-500/25' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                          }`}
                        >
                          {agentListeningId === c.id ? '🔇 Mute Feed' : '🎧 Listen In'}
                        </button>
                        <button
                          onClick={() => setTakeOverActiveId(takeOverActiveId === c.id ? null : c.id)}
                          className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                            takeOverActiveId === c.id ? 'bg-red-950 text-red-300 border-red-500/25' : 'bg-gold text-background border-gold hover:brightness-105'
                          }`}
                        >
                          {takeOverActiveId === c.id ? '🤝 Re-enable AI' : '🎙️ Take Over Call'}
                        </button>
                      </>
                    ) : (
                      <span className="text-2xs text-white/30 self-center">Session Ended</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {agentListeningId && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
                <PlayCircle className="animate-pulse" size={14} />
                <span>Streaming live call audio channel outcome...</span>
              </div>
            )}
            {takeOverActiveId && (
              <div className="rounded-xl border border-red-500/25 bg-red-950/20 p-3.5 text-xs text-red-400 flex items-center gap-2 animate-pulse">
                <AlertTriangle size={14} />
                <span>Microphone feed routed. AI agent paused.</span>
              </div>
            )}
          </div>
        )}

        {/* 5. REACTIVATION */}
        {activeTab === 'reactivation' && (userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Lead Reactivation Launcher</h2>
              <p className="text-xs text-white/50">Upload dead lead sheets to schedule reactivation drip templates.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-gold font-bold">New Outreach Campaign</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-3xs text-white/40 uppercase mb-1">Outreach template</label>
                    <select
                      value={selectedCampaignTemplate}
                      onChange={(e) => setSelectedCampaignTemplate(e.target.value)}
                      className="w-full bg-[#050b1d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="septic-stale">Stale Contract Renewal (Tone: Helpful)</option>
                      <option value="cleaning-cold">Cold Outbound Jetting Outreach (Tone: Professional)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-3xs text-white/40 uppercase mb-1">Upload Lead Database (.csv)</label>
                    <div className="relative border border-dashed border-white/15 rounded-xl bg-white/5 p-6 text-center cursor-pointer hover:bg-white/10 transition">
                      <input type="file" accept=".csv" onChange={handleCsvUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Upload className="mx-auto text-white/30 mb-2" size={20} />
                      <span className="text-xs text-white/80 block font-semibold">Click to select CSV file</span>
                      <span className="text-3xs text-white/40 block mt-1">Fields: Name, Phone, Email, Company</span>
                    </div>
                  </div>
                  {csvUploadStatus && <div className="rounded-lg bg-gold/10 p-2.5 text-2xs text-gold text-center font-semibold">{csvUploadStatus}</div>}
                  <button onClick={handleLaunchCampaign} className="w-full py-3 bg-gold text-background rounded-xl text-xs font-bold transition hover:brightness-105">
                    Launch Outreach Campaign
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-white/50 font-bold">Campaign Launch Logs</h3>
                <div className="space-y-2.5">
                  {reactivationLogs.map((log) => (
                    <div key={log.id} className="rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{log.campaign}</span>
                        <span className="text-white/40">{log.date}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-2xs text-white/70 bg-[#04081c] p-2 rounded-lg">
                        <div>
                          <span>Leads</span>
                          <strong className="block text-white mt-0.5">{log.contacted}</strong>
                        </div>
                        <div>
                          <span>Replies</span>
                          <strong className="block text-white mt-0.5">{log.replies}</strong>
                        </div>
                        <div>
                          <span>Booked</span>
                          <strong className="block text-gold mt-0.5">{log.bookings}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. AI COACH & SCORING */}
        {activeTab === 'coach' && (userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="text-gold h-5 w-5 animate-pulse" />
                <span>Call Compliance & Analytics Coach</span>
              </h2>
              <p className="text-xs text-white/50">Analyze script validation, speaker sentiment, and booking conversion logs.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
              <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-4 flex flex-col gap-3 max-h-[500px] overflow-y-auto">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-3xs uppercase font-bold text-white/40">Roster Logs</span>
                  <span className="text-3xs font-bold text-gold">{callsList.length} Sessions</span>
                </div>
                {callsList.map((call) => {
                  const avgScore = call.coaching ? Math.round((call.coaching.greeting + call.coaching.compliance) / 2) : 0;
                  const isSelected = selectedCallId === call.id;

                  return (
                    <button
                      key={call.id}
                      onClick={() => setSelectedCallId(call.id)}
                      className={`w-full rounded-xl p-3 text-left border transition ${
                        isSelected ? 'bg-gold/10 border-gold text-white' : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="truncate">
                          <p className="text-xs font-bold truncate">{call.leadName}</p>
                          <p className="text-[10px] text-white/40 truncate">{call.phone}</p>
                        </div>
                        <span className="rounded bg-blue-950 text-blue-300 text-[9px] px-1.5 py-0.5 border border-blue-500/20">{call.outcome}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-white/40 mt-1.5 border-t border-white/5 pt-1.5">
                        <span>Score: <strong className="text-gold">{avgScore}%</strong></span>
                        <span>{new Date(call.createdAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedCallId && callsList.find(c => c.id === selectedCallId) ? (
                (() => {
                  const call = callsList.find(c => c.id === selectedCallId);
                  const avgScore = call.coaching ? Math.round((call.coaching.greeting + call.coaching.compliance) / 2) : 0;

                  return (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                          <div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Call coaching profile: {call.leadName}</h3>
                            <p className="text-3xs text-white/45 mt-0.5">{call.phone} • Initiator: {call.initiatedBy}</p>
                          </div>
                          <span className="text-xs font-bold text-gold">{avgScore}% Quality score</span>
                        </div>

                        {/* Player simulator */}
                        <div className="bg-[#04081c]/80 border border-white/5 rounded-xl p-3.5 flex items-center gap-3">
                          <button className="h-8 w-8 rounded-full bg-gold text-background flex items-center justify-center hover:scale-105 transition">
                            <Play size={12} className="ml-0.5 fill-current" />
                          </button>
                          <div className="flex-1">
                            <div className="h-1 bg-white/10 rounded-full w-full overflow-hidden">
                              <div className="h-full bg-gold w-1/3" />
                            </div>
                            <span className="text-[9px] text-white/30 mt-1 block">0:14 / {call.durationSec}s</span>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 text-center">
                          <div className="bg-white/5 rounded-xl p-2.5">
                            <span className="text-[10px] text-white/45 block">Script Compliance</span>
                            <span className="text-md font-bold text-white block mt-0.5">{call.coaching?.compliance}%</span>
                          </div>
                          <div className="bg-white/5 rounded-xl p-2.5">
                            <span className="text-[10px] text-white/45 block">Sentiment Tone</span>
                            <span className="text-md font-bold text-emerald-400 block mt-0.5">{call.coaching?.sentiment}</span>
                          </div>
                          <div className="bg-white/5 rounded-xl p-2.5">
                            <span className="text-[10px] text-white/45 block">Greeting Greeting</span>
                            <span className="text-md font-bold text-white block mt-0.5">{call.coaching?.greeting}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 space-y-2">
                        <span className="text-3xs uppercase tracking-wider text-white/45 font-bold">Speech Transcription</span>
                        <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                          {call.coaching?.transcript?.split('\n').map((line: string, i: number) => (
                            <p key={i} className="text-xs text-white/80 leading-normal border-b border-white/5 pb-1">{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-10 text-center text-white/40 flex flex-col items-center justify-center">
                  <Sparkles size={24} className="mb-2 text-white/30" />
                  <p className="text-xs">Select a call session trace to inspect speech analytics.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. CRM SYNC TAB */}
        {activeTab === 'crm' && (userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">CRM Integrations & Sync</h2>
              <p className="text-xs text-white/50">Connect clients tools to automate scheduling, dispatch dispatching, and logs directly.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { name: 'ServiceTitan Link', key: 'servicetitan', desc: 'Sync septic bookings, tech dispatching status, and customer notes directly.' },
                { name: 'HubSpot CRM', key: 'hubspot', desc: 'Sync inbound leads pipeline and lead reactivation stages automatically.' },
                { name: 'Salesforce Enterprise', key: 'salesforce', desc: 'Sync custom fields, revenue outcomes, and call library logs.' }
              ].map(crm => (
                <div key={crm.key} className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-center pb-2">
                      <span className="font-bold text-xs text-white">{crm.name}</span>
                      <span className="rounded bg-emerald-950 text-emerald-400 text-3xs border border-emerald-500/20 px-2 py-0.5 font-bold">CONNECTED</span>
                    </div>
                    <p className="text-xs text-white/50 mt-1 leading-normal">{crm.desc}</p>
                  </div>
                  <button onClick={() => alert(`${crm.name} configuration details verified.`)} className="w-full py-2 border border-white/10 bg-white/5 rounded-xl text-2xs font-bold transition hover:bg-white/10">
                    Configure Sync Fields
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. INTERNAL INBOX */}
        {activeTab === 'inbox' && (userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Internal Inbox</h2>
              <p className="text-xs text-white/50">Lead replies route here. Read messages and schedule manually if necessary.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-[250px_1fr]">
              <div className="space-y-2">
                {inboxMessages.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedInboxId(msg.id)}
                    className={`w-full rounded-xl p-3 text-left border transition flex flex-col gap-1 ${
                      selectedInboxId === msg.id ? 'bg-gold/10 border-gold text-white' : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-xs truncate">{msg.clientName}</span>
                      <span className="text-white/40 text-[9px]">{msg.date}</span>
                    </div>
                    <p className="text-2xs text-white/50 truncate">{msg.message}</p>
                  </button>
                ))}
              </div>

              {selectedInboxId ? (
                <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-5 flex flex-col justify-between min-h-[300px]">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold border-b border-white/5 pb-2">
                      Conversation thread: {inboxMessages.find(m => m.id === selectedInboxId)?.clientName}
                    </h3>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 mt-3 max-w-[80%] text-xs">
                      <span className="text-[9px] text-gold uppercase font-bold block mb-1">INCOMING SMS</span>
                      <p>{inboxMessages.find(m => m.id === selectedInboxId)?.message}</p>
                    </div>
                  </div>
                  <form onSubmit={handleInboxReply} className="flex gap-2 pt-3 border-t border-white/5 mt-4">
                    <input
                      required
                      type="text"
                      value={inboxReplyText}
                      onChange={(e) => setInboxReplyText(e.target.value)}
                      placeholder="Type a manual routing message..."
                      className="flex-1 bg-[#050b1d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-gold outline-none"
                    />
                    <button type="submit" className="rounded-xl bg-gold text-background px-4 py-2.5 text-xs font-bold hover:brightness-105">
                      Send Reply
                    </button>
                  </form>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#060e26]/50 p-10 text-center text-white/40">Select thread to read.</div>
              )}
            </div>
          </div>
        )}

        {/* 9. LEADS & ANALYTICS TAB (ALL ROLES) */}
        {activeTab === 'leads' && (
          <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Leads Generated', value: totalLeadsGenerated, icon: <Users size={18} /> },
                { label: 'Calls Answered', value: totalCallsAnswered, icon: <PhoneCall size={18} /> },
                { label: 'Appointments Booked', value: totalBooked, icon: <CalendarDays size={18} /> },
                { label: 'Recovered Leads', value: totalRecovered, icon: <RefreshCw size={18} /> }
              ].map((m) => (
                <div key={m.label} className="rounded-2xl border border-white/10 bg-[#08122e] p-5 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-3xs uppercase tracking-wider text-white/50 font-bold block">{m.label}</span>
                    <strong className="text-2xl text-white block mt-2">{m.value}</strong>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2.5 text-gold border border-white/5">
                    {m.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Inbound Leads list table */}
            <div className="rounded-[24px] border border-white/10 bg-[#08122e]/80 p-5 md:p-6">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/5">
                <div>
                  <h3 className="text-md font-bold text-white">Recent Inbound Leads</h3>
                  <p className="text-2xs text-white/45 mt-0.5">Real-time sync of customer forms and AI voice callbacks.</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-3xs font-semibold text-emerald-400 tracking-wide uppercase">
                  Live DB Sync
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-white/80">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 font-semibold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Lead Name</th>
                      <th className="pb-3 px-4">Contact credentials</th>
                      <th className="pb-3 px-4">Business</th>
                      <th className="pb-3 px-4">Niche Door</th>
                      <th className="pb-3 px-4 text-center">Status</th>
                      <th className="pb-3 pl-4 text-right">Inbound Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-white/50">
                          No inbound leads found in database.
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead) => (
                        <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-3.5 pr-4 font-semibold text-white">{lead.name}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span>{lead.email}</span>
                              <span className="text-[10px] text-white/40 mt-0.5 font-mono">{lead.phone}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-white/70">{lead.business}</td>
                          <td className="py-3.5 px-4 text-white/70">
                            <span className="rounded bg-white/5 border border-white/5 px-2 py-0.5 text-2xs">{lead.source}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-2xs font-bold border ${
                              lead.status === 'BOOKED' || lead.status === 'NEW'
                                ? 'bg-green-950 text-green-400 border-green-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3.5 pl-4 text-right text-white/40 font-mono text-[10px]">
                            {new Date(lead.createdAt).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Campaign metrics overview */}
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-[24px] border border-white/10 bg-[#08122e]/60 p-5 space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-gold font-bold">Campaign performance diagnostics</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  Engagement rate on Missed Call Recovery campaigns is currently holding at <strong className="text-white">87.2%</strong>. Average time-to-first-response for inbound web forms is <strong className="text-white">14 seconds</strong>.
                </p>
              </section>
              <section className="rounded-[24px] border border-white/10 bg-[#08122e]/60 p-5 space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-gold font-bold">Voice AI compliance metrics</h4>
                <div className="grid gap-2 text-center text-xs">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-white/50">Average call duration</span>
                    <strong className="text-white">6m 42s</strong>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-white/50">Qualified conversion rate</span>
                    <strong className="text-white">18.7%</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50">ServiceTitan synchronization rate</span>
                    <strong className="text-emerald-400">100% SUCCESS</strong>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* 10. VOICE AI TEST TAB (USER/CLIENT ONLY) */}
        {activeTab === 'voice-test' && (
          <div className="max-w-xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <Volume2 className="h-4.5 w-4.5 text-gold" /> Outbound Test Module
              </h2>
              <p className="text-xs text-white/50 leading-relaxed">
                Test how the AI callbacks dial customer numbers. Select the script tone and launch a simulated call.
              </p>
            </div>

            <form onSubmit={handleLaunchTrial} className="space-y-4 rounded-2xl border border-white/10 bg-[#060e26]/50 p-5">
              <div className="space-y-3">
                <div>
                  <label className="block text-3xs text-white/40 uppercase mb-1.5">Industry Niche</label>
                  <select
                    value={trialIndustry}
                    onChange={(e) => setTrialIndustry(e.target.value)}
                    className="w-full bg-[#050b1d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="septic">Septic & Drain Callback Tone</option>
                    <option value="industrial">Industrial Cleanout Tone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-3xs text-white/40 uppercase mb-1.5">Your phone number</label>
                  <input
                    required
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Enter phone with +1 prefix"
                    className="w-full bg-[#050b1d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-gold outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={trialLoading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gold py-3 text-xs font-bold text-background transition hover:brightness-105 disabled:opacity-50"
              >
                {trialLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
                {trialLoading ? 'Queueing Call...' : 'Launch Test Call'}
              </button>

              {trialMsg && (
                <div className="rounded-lg bg-gold/10 p-2.5 text-2xs text-gold font-semibold text-center mt-3">
                  {trialMsg}
                </div>
              )}
            </form>
          </div>
        )}

        {/* 11. SMS CHAT LOGS (USER/CLIENT ONLY) */}
        {activeTab === 'sms-chat' && (
          <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#060e26]/60 p-5 md:p-6 flex flex-col h-[450px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 flex-shrink-0">
              <h3 className="text-sm font-bold text-gold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> SMS Sandbox Logs
              </h3>
              <span className="rounded bg-gold/10 text-gold text-3xs px-2 py-0.5 border border-gold/20 font-bold">
                Lead: John Connor (Septic)
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col justify-end">
              <div className="space-y-3">
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

            <form onSubmit={handleSendSMS} className="mt-4 flex gap-2 pt-3 border-t border-white/5 flex-shrink-0">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a response to simulate lead reply..."
                className="flex-1 bg-[#050b1d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-gold outline-none"
              />
              <button
                type="submit"
                className="h-10 w-10 rounded-xl bg-gold text-background hover:brightness-105 transition flex items-center justify-center flex-shrink-0 shadow-sm"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

      </div>

      {/* --- ADD CLIENT MODAL DIALOG --- */}
      {showAddClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#050b1d] p-6 shadow-2xl text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <h3 className="font-bold text-sm">Onboard Client Account</h3>
              <button onClick={() => setShowAddClient(false)} className="text-white/60 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block text-[10px] text-white/50 uppercase mb-1">Company Name</label>
                <input
                  required
                  type="text"
                  value={newClient.companyName}
                  onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                  className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/50 uppercase mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={newClient.contactName}
                    onChange={(e) => setNewClient({ ...newClient, contactName: e.target.value })}
                    className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={newClient.contactPhone}
                    onChange={(e) => setNewClient({ ...newClient, contactPhone: e.target.value })}
                    className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-white/50 uppercase mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={newClient.contactEmail}
                  onChange={(e) => setNewClient({ ...newClient, contactEmail: e.target.value })}
                  className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/50 uppercase mb-1">Industry</label>
                  <select
                    value={newClient.industry}
                    onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                    className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Septic & Drain">Septic & Drain</option>
                    <option value="Industrial Cleaning">Industrial Cleaning</option>
                    <option value="Commercial Laundry">Commercial Laundry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase mb-1">Revenue Bracket</label>
                  <select
                    value={newClient.revenueBracket}
                    onChange={(e) => setNewClient({ ...newClient, revenueBracket: e.target.value })}
                    className="w-full bg-[#060e26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="$5M–$15M">$5M–$15M</option>
                    <option value="$8M–$40M">$8M–$40M</option>
                    <option value="$5M–$25M">$5M–$25M</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowAddClient(false)} className="rounded-xl border border-white/10 px-4 py-2 text-xs hover:bg-white/5">Cancel</button>
                <button type="submit" className="rounded-xl bg-gold text-background px-5 py-2 text-xs font-bold hover:brightness-105">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SUPERADMIN DETAIL MODAL OVERLAYS --- */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[32px] border border-white/15 bg-[#050b1d] p-6 md:p-8 shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
                  {superAdminModules.find(m => m.id === activeModal)?.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{superAdminModules.find(m => m.id === activeModal)?.title}</h2>
                  <p className="text-xs text-white/50">{superAdminModules.find(m => m.id === activeModal)?.desc}</p>
                </div>
              </div>
              <button 
                onClick={closeModule}
                className="rounded-full border border-white/10 p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1">

              {/* 1. USER MANAGEMENT */}
              {activeModal === 'user-management' && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-white text-md">Platform Users</h3>
                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-500 hover:bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition"
                    >
                      <Plus size={14} /> Add User
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-white/60 font-medium">
                          <th className="p-3">Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Role</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-white/50">No users found.</td>
                          </tr>
                        ) : (
                          usersList.map((usr) => (
                            <tr key={usr.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="p-3 font-semibold text-white">{usr.name}</td>
                              <td className="p-3 text-white/70">{usr.email}</td>
                              <td className="p-3">
                                <select
                                  value={usr.role?.name || 'USER'}
                                  onChange={(e) => handleUpdateRole(usr.id, e.target.value)}
                                  className="bg-[#050b1d] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                                  disabled={usr.email === 'superadmin@gmail.com'}
                                >
                                  <option value="USER">USER</option>
                                  <option value="CLIENT">CLIENT</option>
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="SUPERADMIN">SUPERADMIN</option>
                                </select>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-2xs font-semibold border ${
                                  usr.suspended ? 'bg-red-950/20 text-red-400 border-red-500/20' : 'bg-green-950/20 text-green-400 border-green-500/20'
                                }`}>
                                  {usr.suspended ? 'SUSPENDED' : 'ACTIVE'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleToggleSuspendUser(usr)}
                                    className={`rounded px-2 py-1 text-xs border ${
                                      usr.suspended ? 'bg-green-900/10 text-green-400 border-green-500/20' : 'bg-amber-900/10 text-amber-400 border-amber-500/20'
                                    }`}
                                    disabled={usr.email === 'superadmin@gmail.com'}
                                  >
                                    {usr.suspended ? 'Activate' : 'Suspend'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(usr.id)}
                                    className="rounded p-1.5 bg-red-900/10 text-red-400 border border-red-500/20"
                                    disabled={usr.email === 'superadmin@gmail.com'}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {showAddUserModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
                      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#070e24] p-6 shadow-xl text-white">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                          <h4 className="font-semibold text-sm">Add Platform User</h4>
                          <button onClick={() => setShowAddUserModal(false)} className="text-white/60 hover:text-white"><X size={15} /></button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-4">
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Email</label>
                            <input type="email" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Password</label>
                            <input type="password" required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Name</label>
                            <input type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Role</label>
                            <select value={newUser.roleName} onChange={(e) => setNewUser({...newUser, roleName: e.target.value})} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none">
                              <option value="USER">USER</option>
                              <option value="CLIENT">CLIENT</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="SUPERADMIN">SUPERADMIN</option>
                            </select>
                          </div>
                          <div className="pt-2 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowAddUserModal(false)} className="rounded-full border border-white/10 px-4 py-2 text-xs hover:bg-white/5">Cancel</button>
                            <button type="submit" className="rounded-full bg-purple-500 px-5 py-2 text-xs font-semibold text-white hover:bg-purple-600">Save User</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. SUBSCRIPTION BILLING */}
              {activeModal === 'subscription-billing' && (
                <div>
                  <h3 className="font-semibold text-white text-md mb-4">Client Subscriptions</h3>
                  <div className="grid gap-4">
                    {clientsList.map(c => (
                      <div key={c.id} className="rounded-2xl border border-white/15 bg-white/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white text-sm">{c.companyName}</p>
                          <p className="text-xs text-white/60 mt-0.5">Contact: {c.contactName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-2xs text-white/40 block">PLAN LEVEL</span>
                            <select
                              value={c.plan}
                              onChange={(e) => handleUpdateClientPlan(c.id, e.target.value)}
                              className="bg-[#050b1d] border border-white/15 rounded px-2.5 py-1 text-xs text-white font-semibold mt-1 outline-none"
                            >
                              <option value="STARTER">STARTER ($1,497/mo)</option>
                              <option value="GROWTH">GROWTH ($2,997/mo)</option>
                              <option value="DOMINANCE">DOMINANCE ($5,997/mo)</option>
                            </select>
                          </div>
                          <div className="text-right">
                            <span className="text-2xs text-white/40 block">STATUS</span>
                            <span className="text-xs text-green-400 font-semibold block mt-1">Monthly Active</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. AI CONFIGURATION */}
              {activeModal === 'ai-config' && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">OpenAI API Key</label>
                      <input type="password" value={configs.openaiApiKey} onChange={(e) => handleSaveConfigs({ openaiApiKey: e.target.value })} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" placeholder="sk-..." />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Model Select</label>
                      <select value={configs.openaiModel} onChange={(e) => handleSaveConfigs({ openaiModel: e.target.value })} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none">
                        <option value="gpt-4o-mini">gpt-4o-mini (Faster, cheaper)</option>
                        <option value="gpt-4o">gpt-4o (Smartest model)</option>
                        <option value="o1-mini">o1-mini (Complex reasoning)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Temperature ({configs.openaiTemperature})</label>
                    <input type="range" min="0" max="1" step="0.1" value={configs.openaiTemperature} onChange={(e) => handleSaveConfigs({ openaiTemperature: parseFloat(e.target.value) })} className="w-full accent-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">System Sales Specialist Prompt Template</label>
                    <textarea rows={8} value={configs.systemPrompt} onChange={(e) => handleSaveConfigs({ systemPrompt: e.target.value })} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 focus:border-purple-500 outline-none font-mono" />
                  </div>
                </div>
              )}

              {/* 4. TWILIO & ELEVENLABS */}
              {activeModal === 'twilio-config' && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Twilio Account SID</label>
                      <input type="text" value={configs.twilioAccountSid} onChange={(e) => handleSaveConfigs({ twilioAccountSid: e.target.value })} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" placeholder="AC..." />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Twilio Auth Token</label>
                      <input type="password" value={configs.twilioAuthToken} onChange={(e) => handleSaveConfigs({ twilioAuthToken: e.target.value })} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" placeholder="••••••••••••" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Twilio Phone Number</label>
                      <input type="text" value={configs.twilioPhoneNumber} onChange={(e) => handleSaveConfigs({ twilioPhoneNumber: e.target.value })} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" placeholder="+1..." />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">ElevenLabs API Key</label>
                      <input type="password" value={configs.elevenLabsApiKey} onChange={(e) => handleSaveConfigs({ elevenLabsApiKey: e.target.value })} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" placeholder="key..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Active ElevenLabs Voice Profile</label>
                    <select value={configs.voiceProfile} onChange={(e) => handleSaveConfigs({ voiceProfile: e.target.value })} className="w-full bg-[#050b1d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none">
                      <option value="Rachel">Rachel (Conversational, warm)</option>
                      <option value="Adam">Adam (Professional, authoritative)</option>
                      <option value="Bella">Bella (Friendly, customer-oriented)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 5. AUDIT LOGS */}
              {activeModal === 'audit-logs' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-white/60 font-medium">
                          <th className="p-3">Time</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Actor</th>
                          <th className="p-3">Details</th>
                          <th className="p-3">IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-white/50">No logs found.</td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="p-3 text-white/50">{new Date(log.createdAt).toLocaleTimeString()}</td>
                              <td className="p-3"><span className="inline-block rounded-full bg-blue-955 text-blue-400 px-2 py-0.5 font-bold border border-blue-500/10">{log.action}</span></td>
                              <td className="p-3 text-white/80">{log.actor}</td>
                              <td className="p-3 text-white/70 max-w-xs truncate" title={log.details}>{log.details}</td>
                              <td className="p-3 text-white/40">{log.ipAddress}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 6. SYSTEM HEALTH */}
              {activeModal === 'system-health' && (
                <div className="space-y-6">
                  {healthData ? (
                    <div>
                      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <span className="text-2xs text-white/40 block">UPTIME</span>
                          <span className="text-xl font-bold text-white mt-1 block">{Math.floor(healthData.uptime / 60)}m {healthData.uptime % 60}s</span>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <span className="text-2xs text-white/40 block">MEMORY RSS</span>
                          <span className="text-xl font-bold text-white mt-1 block">{healthData.memory.rss} MB</span>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <span className="text-2xs text-white/40 block">API LATENCY</span>
                          <span className="text-xl font-bold text-green-400 mt-1 block">{healthData.metrics.apiLatencyMs} ms</span>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <span className="text-2xs text-white/40 block">ACTIVE CONNS</span>
                          <span className="text-xl font-bold text-purple-400 mt-1 block">{healthData.metrics.activeConnections}</span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-[#050b1d] p-4 font-mono text-xs space-y-1.5">
                        <p className="text-green-400">[info] Express server healthy at port 4000</p>
                        <p className="text-blue-400">[query] DB ping latency: {healthData.metrics.dbLatencyMs}ms</p>
                        <p className="text-white/60">[queue] Job queue scheduler size: {healthData.metrics.queueSize}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-white/50 py-10 animate-pulse">Loading system statistics...</p>
                  )}
                </div>
              )}

              {/* 7. CRM INTEGRATION */}
              {activeModal === 'crm-integration' && (
                <div className="space-y-4">
                  {[
                    { key: 'gohighlevel', name: 'GoHighLevel', desc: 'Directly sync inbound qualified leads, calendars, and missed call SMS records.' },
                    { key: 'hubspot', name: 'HubSpot CRM', desc: 'Auto-create contact cards and assign pipeline deal structures.' },
                    { key: 'salesforce', name: 'Salesforce API', desc: 'Sync enterprise contact object fields and voice transcript notes.' }
                  ].map(crm => (
                    <div key={crm.key} className="rounded-2xl border border-white/15 bg-white/5 p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white text-sm">{crm.name}</p>
                        <p className="text-xs text-white/60 mt-1">{crm.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = { ...configs.crmConnected, [crm.key]: !configs.crmConnected[crm.key] };
                          handleSaveConfigs({ crmConnected: updated });
                        }}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
                          configs.crmConnected?.[crm.key]
                            ? 'bg-green-950 text-green-400 border-green-500/20 hover:bg-green-900/30'
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {configs.crmConnected?.[crm.key] ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 8. CONVERSATION LOGS */}
              {activeModal === 'conversation-logs' && (
                <div className="space-y-4">
                  {selectedSession ? (
                    <div>
                      <button onClick={() => setSelectedSession(null)} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:underline">
                        <ArrowLeft size={12} /> Back to Session List
                      </button>
                      <div className="rounded-2xl border border-white/15 bg-[#030612] p-4 max-h-[50vh] overflow-y-auto space-y-3">
                        {chatLogs
                          .filter(log => log.sessionId === selectedSession)
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((log, idx) => (
                            <div key={idx} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`rounded-2xl px-4 py-2.5 max-w-md text-xs ${
                                log.role === 'user' ? 'bg-purple-500 text-white rounded-br-none' : 'bg-white/10 text-white/90 rounded-bl-none'
                              }`}>
                                <p>{log.message}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-white/60 font-medium">
                            <th className="p-3">Session ID</th>
                            <th className="p-3">Source</th>
                            <th className="p-3">Message</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chatLogs.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-white/50">No chat sessions found.</td>
                            </tr>
                          ) : (
                            Array.from(new Set(chatLogs.map(l => l.sessionId))).map((sessId) => {
                              const sessLogs = chatLogs.filter(l => l.sessionId === sessId);
                              const lastLog = sessLogs[0];
                              return (
                                <tr key={sessId} className="border-b border-white/5 hover:bg-white/5 transition">
                                  <td className="p-3 font-semibold text-white font-mono">{sessId}</td>
                                  <td className="p-3 text-white/50">{lastLog.metadata?.source || 'web'}</td>
                                  <td className="p-3 text-white/70 max-w-xs truncate">{lastLog.message}</td>
                                  <td className="p-3 text-right">
                                    <button onClick={() => setSelectedSession(sessId)} className="rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 text-xs hover:bg-purple-500/25 transition">
                                      View
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 9. SERVER INFRASTRUCTURE */}
              {activeModal === 'server-status' && (
                <div className="space-y-4">
                  {healthData ? (
                    <div>
                      <h3 className="font-semibold text-white text-md mb-2">Live Node Ports Status</h3>
                      <div className="grid gap-4 grid-cols-3 mb-4">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                          <span className="text-3xs text-white/40 block">CPU LOAD</span>
                          <span className="text-md font-bold text-white mt-1 block">1.8%</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                          <span className="text-3xs text-white/40 block">DISK STORAGE</span>
                          <span className="text-md font-bold text-white mt-1 block">42% Used</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                          <span className="text-3xs text-white/40 block">PORT BINDINGS</span>
                          <span className="text-md font-bold text-green-400 mt-1 block">3001, 4000</span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/15 bg-black p-4 font-mono text-3xs text-purple-300 h-40 overflow-y-auto leading-relaxed shadow-inner">
                        <p className="text-white/40">[2026-06-05 18:22] API server listening on http://127.0.0.1:4000</p>
                        <p className="text-white/40">[2026-06-05 18:22] Vite frontend server listening on http://127.0.0.1:3001</p>
                        <p className="text-green-400">[info] Port health diagnostics passed.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-white/50 py-10 animate-pulse">Loading node status metrics...</p>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-white/10 pt-4 mt-6">
              <button 
                onClick={closeModule}
                className="rounded-full bg-white/5 border border-white/10 px-6 py-2.5 text-xs text-white/80 hover:bg-white/10 transition"
              >
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}


