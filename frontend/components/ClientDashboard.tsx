'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Database, Activity, CheckCircle2, Clock, 
  Play, Volume2, Download, AlertCircle, RefreshCw, 
  PhoneCall, FileText, Bell, Send, User, ChevronRight
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  startDate?: string;
  estCompletion?: string;
  actualCompletion?: string;
  agent?: { name: string };
  leads?: any[];
  uploadedFiles?: any[];
}

export default function ClientDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Database Upload Form
  const [fileName, setFileName] = useState('');
  const [recordCount, setRecordCount] = useState(500);
  const [fileType, setFileType] = useState('CSV');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // AI Voice Agent Test Form
  const [testPhone, setTestPhone] = useState('');
  const [testScenario, setTestScenario] = useState('');
  const [testVoice, setTestVoice] = useState('Female Professional');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const sseRef = useRef<EventSource | null>(null);

  // 1. Fetch initial dashboard data
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const projectsRes = await fetch('/api/crm/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        // Client only sees their projects dynamically based on user.clientId
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userClientId = user?.clientId || 'client-1';

        const clientProjects = (data.projects || []).filter((p: any) => p.clientId === userClientId);
        setProjects(clientProjects);
      }

      // Fetch dynamic notifications from database
      const notifRes = await fetch('/api/crm/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      } else {
        setNotifications([
          { id: 'n-1', title: 'Welcome to CRM', message: 'Welcome to your growth cockpit.', read: false, createdAt: new Date() }
        ]);
      }

      setActivities([
        { id: 'a-1', action: 'Account Activated', details: 'Client portal online.', createdAt: new Date(Date.now() - 3600000) }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  // Mark notification as read dynamically in database
  const handleMarkAsRead = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/crm/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // 2. Set up SSE connection for real-time updates
    sseRef.current = new EventSource('/api/crm/stream');
    
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const currentUserId = user?.id || 'user-client';

    sseRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ACTIVITY_LOG' && data.userId === currentUserId) {
          setActivities(prev => [data, ...prev]);
        } else if (data.type === 'NOTIFICATION' && data.userId === currentUserId) {
          setNotifications(prev => [data, ...prev]);
        } else if (data.type === 'LEAD_STATUS_UPDATE' || data.type === 'CONNECTED') {
          // Trigger hot refetch
          fetchData();
        }
      } catch (err) {
        // ignore
      }
    };

    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  // 3. Handle CSV Upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) return;

    setIsUploading(true);
    setUploadStatus('Processing and scanning database file...');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/crm/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName,
          fileType,
          recordCount
        })
      });

      if (res.ok) {
        setUploadStatus('Successfully parsed leads! Pending approval.');
        setFileName('');
        fetchData();
        setTimeout(() => setUploadStatus(''), 4000);
      } else {
        setUploadStatus('Failed to upload file.');
      }
    } catch {
      setUploadStatus('Connection error.');
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Handle Voice AI Test Call
  const handleVoiceTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testScenario) return;

    setTestLoading(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/crm/voice-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          scenario: testScenario,
          voiceType: testVoice
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      } else {
        alert('Failed to trigger test call.');
      }
    } catch {
      alert('Network error triggering test call.');
    } finally {
      setTestLoading(false);
    }
  };

  // 5. Download Transcript PDF/TXT simulation
  const downloadTranscript = () => {
    if (!testResult) return;
    const txt = testResult.transcript.map((t: any) => `[${t.role.toUpperCase()}]: ${t.message}`).join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voice-agent-transcript.txt';
    a.click();
  };

  // Tickers and Metrics calculations
  const totalUploaded = projects.reduce((sum, p) => sum + (p.uploadedFiles?.[0]?.recordCount || 0), 0);
  const activeProjects = projects.filter(p => p.status !== 'COMPLETED').length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;

  return (
    <div className="space-y-8">
      
      {/* ── METRICS OVERVIEW CARDS ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        
        {/* Total Records Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Total Uploads</span>
            <Database size={16} className="text-blue-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono">{totalUploaded || 1500}</span>
            <span className="text-xs text-white/40">records total</span>
          </div>
        </motion.div>

        {/* Active Campaigns */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Active Projects</span>
            <Activity size={16} className="text-gold" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono">{activeProjects}</span>
            <span className="text-xs text-white/40">campaigns in flight</span>
          </div>
        </motion.div>

        {/* Completed Projects */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Completed Runs</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono">{completedProjects || 1}</span>
            <span className="text-xs text-white/40">projects archived</span>
          </div>
        </motion.div>
      </div>

      {/* ── CORE SECTIONS GRID ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Left Column: Database Upload & Live Projects */}
        <div className="space-y-8 lg:col-span-8">
          
          {/* Section 1: Upload Database */}
          <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
            <div className="flex items-center gap-2">
              <Upload size={18} className="text-blue-400" />
              <h2 className="text-lg font-bold text-white">Upload Database</h2>
            </div>
            
            <form onSubmit={handleUpload} className="grid grid-cols-1 gap-4 md:grid-cols-12 items-end">
              <div className="md:col-span-6">
                <label className="text-[10px] font-bold text-white/40 tracking-wider uppercase block mb-1.5">File Name</label>
                <input
                  required
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. spring_leads_2026.csv"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-400 transition"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-[10px] font-bold text-white/40 tracking-wider uppercase block mb-1.5">Lead Count</label>
                <select
                  value={recordCount}
                  onChange={(e) => setRecordCount(Number(e.target.value))}
                  className="w-full rounded-xl bg-background border border-white/10 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-400 transition"
                >
                  <option value={500}>500 leads</option>
                  <option value={1000}>1,000 leads</option>
                  <option value={5000}>5,000 leads</option>
                  <option value={10000}>10,000+ leads</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={isUploading || !fileName}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  <span>Submit File</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </form>

            {uploadStatus && (
              <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-950/20 px-4 py-3 text-xs text-blue-300">
                <AlertCircle size={14} className="text-blue-400" />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>

          {/* Section 2: Live Project Tracking */}
          <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-gold" />
                <h2 className="text-lg font-bold text-white">Live Project Tracking</h2>
              </div>
              <button onClick={fetchData} className="text-white/40 hover:text-white transition">
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-6">No campaigns found. Upload a database above to start.</p>
              ) : (
                projects.map((proj) => (
                  <div key={proj.id} className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">{proj.name}</h4>
                        <p className="text-[10px] text-white/40 mt-0.5">ID: {proj.id} • Leads: {proj.uploadedFiles?.[0]?.recordCount || 500}</p>
                      </div>
                      
                      {/* Status badge */}
                      <span className={`w-fit text-[9px] font-bold tracking-widest uppercase rounded-full px-2.5 py-1 ${
                        proj.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                        proj.status === 'PENDING_APPROVAL' ? 'bg-blue-500/20 text-blue-400' : 'bg-gold/20 text-gold'
                      }`}>
                        {proj.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-white/40">
                        <span>Campaign Progress</span>
                        <span className="font-mono">{proj.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <motion.div 
                          className="h-full bg-gold rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${proj.progress}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 border-t border-white/5 pt-3 text-[10px] text-white/50">
                      <div>
                        <span className="block text-white/30 text-[9px] uppercase font-semibold">Assigned Agent</span>
                        <span className="text-white/80">{proj.agent?.name || 'Waiting allocation...'}</span>
                      </div>
                      <div>
                        <span className="block text-white/30 text-[9px] uppercase font-semibold">Start Date</span>
                        <span>{proj.startDate ? new Date(proj.startDate).toLocaleDateString() : '—'}</span>
                      </div>
                      <div>
                        <span className="block text-white/30 text-[9px] uppercase font-semibold">Est Completion</span>
                        <span>{proj.estCompletion ? new Date(proj.estCompletion).toLocaleDateString() : '—'}</span>
                      </div>
                      <div>
                        <span className="block text-white/30 text-[9px] uppercase font-semibold">Completed At</span>
                        <span>{proj.actualCompletion ? new Date(proj.actualCompletion).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Notifications, AI Voice Test & Activity Timeline */}
        <div className="space-y-8 lg:col-span-4">
          
          {/* Notifications Center */}
          <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-400" />
                <h2 className="text-md font-bold text-white">Inbox Notifications</h2>
              </div>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-extrabold text-blue-400 font-mono">
                  {notifications.filter(n => !n.read).length} New
                </span>
              )}
            </div>

            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-4">No recent notifications.</p>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`rounded-xl border p-3.5 space-y-1.5 transition ${
                      notif.read ? 'border-white/5 bg-white/[0.01] opacity-60' : 'border-blue-500/20 bg-blue-500/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                      {!notif.read && (
                        <button 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-[9px] text-blue-400 hover:underline font-semibold"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-white/60 leading-relaxed">{notif.message}</p>
                    <span className="block text-[8px] text-white/30 font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: AI Voice Agent Testing */}
          <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <PhoneCall size={18} className="text-purple-400" />
              <h2 className="text-md font-bold text-white">AI Voice Testing</h2>
            </div>
            
            <form onSubmit={handleVoiceTest} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-white/40 tracking-wider uppercase block mb-1">Target Phone</label>
                <input
                  required
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/40 tracking-wider uppercase block mb-1">Scenario description</label>
                <textarea
                  required
                  rows={2}
                  value={testScenario}
                  onChange={(e) => setTestScenario(e.target.value)}
                  placeholder="Objection: Customer says price is too high."
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-white/40 tracking-wider uppercase block mb-1">Voice Type</label>
                  <select
                    value={testVoice}
                    onChange={(e) => setTestVoice(e.target.value)}
                    className="w-full rounded-lg bg-background border border-white/10 px-2 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                  >
                    <option value="Female Professional">Female Prof</option>
                    <option value="Male Professional">Male Prof</option>
                    <option value="Sales Specialist">Sales Agent</option>
                    <option value="Customer Support">Support Agent</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={testLoading || !testPhone}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
                  >
                    <Volume2 size={12} className="animate-pulse" />
                    <span>Dial Test</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Test Results Console */}
            {testLoading && (
              <p className="text-[10px] text-white/40 text-center animate-pulse py-4">📞 Triggering outbound test call...</p>
            )}

            {testResult && (
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 space-y-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-purple-400 uppercase tracking-wider">Simulated Transcript</span>
                  <button onClick={downloadTranscript} className="text-white/40 hover:text-white flex items-center gap-1 transition">
                    <Download size={10} />
                    <span>Download</span>
                  </button>
                </div>

                {/* Call Logs Feed */}
                <div className="h-[140px] overflow-y-auto rounded-lg bg-black/40 p-2 text-[10px] font-mono space-y-2 leading-relaxed">
                  {testResult.transcript.map((t: any, i: number) => (
                    <div key={i}>
                      <span className={t.role === 'assistant' ? 'text-purple-300' : 'text-gold'}>
                        [{t.role.toUpperCase()}]:
                      </span>{' '}
                      <span className="text-white/80">{t.message}</span>
                    </div>
                  ))}
                </div>

                {/* Call Analytics */}
                <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[9px] text-white/40 font-semibold">
                  <div>
                    <span>Sentiment: </span>
                    <span className="text-emerald-400">{testResult.analytics.sentiment}</span>
                  </div>
                  <div>
                    <span>Duration: </span>
                    <span className="text-white/80">{testResult.analytics.durationSec}s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Activity Timeline */}
          <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Clock size={16} className="text-blue-400" />
              <h2 className="text-md font-bold text-white">Activity Timeline</h2>
            </div>

            <div className="h-[280px] overflow-y-auto pr-1 space-y-4">
              {activities.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-6">Timeline is quiet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="relative pl-6 border-l border-white/10">
                    <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
                    <h5 className="text-xs font-bold text-white/80">{act.action}</h5>
                    <p className="text-[10px] text-white/40 mt-0.5">{act.details}</p>
                    <span className="block text-[8px] text-white/30 mt-1 font-mono">
                      {new Date(act.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
