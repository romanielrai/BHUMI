'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Database, Activity, CheckCircle2, Clock, 
  Play, Volume2, Download, AlertCircle, RefreshCw, 
  PhoneCall, FileText, Bell, Send, User, ChevronRight,
  TrendingUp, ArrowUpRight, Search, FileDown, CheckCircle,
  ChevronDown
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

  // Chart Tooltip hover state
  const [chartHover, setChartHover] = useState<string | null>(null);

  // Dropdown menus states & refs
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const voiceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(event.target as Node)) {
        setIsVoiceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sseRef = useRef<EventSource | null>(null);

  // Fetch initial dashboard data
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

    // Set up SSE connection for real-time updates
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

  // Handle CSV Upload
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

  // Handle Voice AI Test Call
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

  // Download Transcript PDF/TXT simulation
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

  const clientLeads = projects.flatMap(p => p.leads || []);
  const contactedLeads = clientLeads.filter(l => l.status !== 'NEW' && l.status !== 'NO_ANSWER').length;
  const totalLeadsCount = clientLeads.length;
  
  // Calculate dynamic average answer rate from actual lead statuses
  const avgAnswerRate = totalLeadsCount > 0 
    ? Math.round((contactedLeads / totalLeadsCount) * 100)
    : 0;

  // Generate a dynamic SVG path based on connection rate
  // If no leads exist, draw a baseline. If they exist, scale the height based on answer rate.
  const pathD = totalLeadsCount === 0 
    ? "M 0,100 L 500,100" 
    : `M 0,85 C 50,${100 - avgAnswerRate * 0.4} 100,${100 - avgAnswerRate * 0.6} 150,${100 - avgAnswerRate * 0.5} S 250,${100 - avgAnswerRate * 0.8} 300,${100 - avgAnswerRate * 0.3} S 400,${100 - avgAnswerRate} 500,${100 - avgAnswerRate * 0.7}`;

  const fillD = `${pathD} L 500,100 L 0,100 Z`;

  return (
    <div className="space-y-8 font-sans antialiased text-white/95">
      
      {/* ── METRICS OVERVIEW CARDS ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        
        {/* Total Records Card */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-glow backdrop-blur-xl transition-all duration-300 group"
        >
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold text-white/40 uppercase tracking-[0.2em]">Total Uploads</span>
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Database size={16} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-3xl font-black font-mono tracking-tight text-white group-hover:text-blue-400 transition">
              {(totalUploaded || 1500).toLocaleString()}
            </div>
            <div className="text-[10px] text-white/40 font-extrabold uppercase tracking-wider">records ingested</div>
          </div>
        </motion.div>

        {/* Active Campaigns */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-glow backdrop-blur-xl transition-all duration-300 group"
        >
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold text-white/40 uppercase tracking-[0.2em]">Active Projects</span>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-gold">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-3xl font-black font-mono tracking-tight text-white group-hover:text-gold transition">
              {activeProjects}
            </div>
            <div className="text-[10px] text-white/40 font-extrabold uppercase tracking-wider">campaigns live</div>
          </div>
        </motion.div>

        {/* Completed Projects */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-glow backdrop-blur-xl transition-all duration-300 group"
        >
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold text-white/40 uppercase tracking-[0.2em]">Completed Runs</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-3xl font-black font-mono tracking-tight text-white group-hover:text-emerald-400 transition">
              {completedProjects || 1}
            </div>
            <div className="text-[10px] text-white/40 font-extrabold uppercase tracking-wider">projects archived</div>
          </div>
        </motion.div>
      </div>

      {/* ── CORE SECTIONS GRID ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Left Column: Database Upload & Live Projects */}
        <div className="space-y-8 lg:col-span-8">
          
          {/* Section 1: Upload Database */}
          <div className="relative z-20 rounded-2xl border border-white/10 bg-slate-900/35 p-6 shadow-glow backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/15">
                  <Upload size={16} />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">Upload Database</h2>
              </div>
              <span className="text-3xs uppercase tracking-wider text-slate-500 bg-white/5 border border-white/5 px-2.5 py-1 rounded-full font-bold">
                Leads Parser Gateway
              </span>
            </div>
            
            <form onSubmit={handleUpload} className="grid grid-cols-1 gap-4 md:grid-cols-12 items-end">
              <div className="md:col-span-6">
                <label className="text-[10px] font-extrabold text-white/40 tracking-wider uppercase block mb-1.5">File Name / Path Reference</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-white/20" />
                  <input
                    required
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. spring_leads_2026.csv"
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-white/10 pl-10 pr-4 text-xs text-white placeholder-white/30 outline-hidden focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300"
                  />
                </div>
              </div>

              <div className="md:col-span-3 relative" ref={dropdownRef}>
                <label className="text-[10px] font-extrabold text-white/40 tracking-wider uppercase block mb-1.5">Load Estimate</label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full h-11 flex items-center justify-between rounded-xl bg-slate-950 border border-white/10 px-4 text-xs text-white focus:border-blue-500 transition-all duration-300"
                >
                  <span>{recordCount === 10000 ? '10,000+ leads' : `${recordCount.toLocaleString()} leads`}</span>
                  <ChevronDown size={14} className={`transform transition-transform duration-200 text-white/60 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-[4.5rem] left-0 z-50 w-full rounded-xl bg-slate-950 border border-white/10 p-1.5 shadow-2xl space-y-0.5 animate-fadeIn">
                    {[500, 1000, 5000, 10000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setRecordCount(val);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left rounded-lg px-3 py-2 text-xs transition duration-150 ${
                          recordCount === val 
                            ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/20' 
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {val === 10000 ? '10,000+ leads' : `${val.toLocaleString()} leads`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-3">
                <label className="text-[10px] font-extrabold text-transparent select-none block mb-1.5">Action</label>
                <button
                  type="submit"
                  disabled={isUploading || !fileName}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-xs font-bold text-white transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-blue-500/10"
                >
                  {isUploading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <>
                      <span>Submit Leads</span>
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {uploadStatus && (
              <div className="flex items-center gap-2.5 rounded-xl border border-blue-500/20 bg-blue-950/30 px-4 py-3 text-xs text-blue-300 shadow-inner">
                <AlertCircle size={15} className="text-blue-400 animate-pulse" />
                <span className="font-semibold">{uploadStatus}</span>
              </div>
            )}
          </div>

          {/* Section 2: Live Project Tracking & Conversion Performance */}
          <div className="relative z-10 rounded-2xl border border-white/10 bg-slate-900/35 p-6 shadow-glow backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-gold border border-amber-500/15">
                  <Activity size={16} />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">Campaign Tracker</h2>
              </div>
              <button 
                onClick={fetchData} 
                className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title="Force Refresh Data"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Custom Interactive SVG Graph showing dials connection statistics */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs font-bold text-white">Call Connection Health</h4>
                  <p className="text-[10px] text-white/40">Real-time dial answer rate across standard timezones.</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded">
                  AVG: {totalLeadsCount > 0 ? `${avgAnswerRate}%` : '0.0%'}
                </span>
              </div>
              
              <div className="h-32 relative">
                <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="connected-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeWidth="0.8" />

                  {/* Graph Paths */}
                  <path 
                    d={pathD} 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                  />
                  
                  <path 
                    d={fillD} 
                    fill="url(#connected-gradient)"
                  />

                  {/* Marker Dot */}
                  {totalLeadsCount > 0 && (
                    <circle 
                      cx="400" 
                      cy={Math.round(100 - avgAnswerRate)} 
                      r="4.5" 
                      fill="#10B981" 
                      stroke="#020617" 
                      strokeWidth="2" 
                      className="cursor-pointer"
                      onMouseEnter={() => setChartHover(`Target Peak: ${avgAnswerRate}% Connected (3:00 PM EST)`)}
                      onMouseLeave={() => setChartHover(null)}
                    />
                  )}
                </svg>

                {chartHover && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-[#0F172A] border border-white/10 text-white text-[9px] px-2.5 py-1 rounded-lg shadow-xl font-bold font-mono">
                    {chartHover}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-slate-900/20">
                  <p className="text-xs text-white/40">No active campaigns allocated to this portal account.</p>
                  <p className="text-[10px] text-white/30 mt-1">Please submit a leads database above to spawn an outreach project.</p>
                </div>
              ) : (
                projects.map((proj) => (
                  <div key={proj.id} className="rounded-xl border border-white/5 bg-slate-950/45 p-5 space-y-4 shadow-inner">
                    <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-wide">{proj.name}</h4>
                        <p className="text-[10px] text-white/40 mt-1 font-mono">ID Reference: {proj.id} • Target Vol: {proj.uploadedFiles?.[0]?.recordCount || 500} records</p>
                      </div>
                      
                      {/* Status badge */}
                      <span className={`w-fit text-[8px] font-extrabold tracking-widest uppercase rounded-full px-2.5 py-1 border ${
                        proj.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        proj.status === 'PENDING_APPROVAL' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-gold'
                      }`}>
                        {proj.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                        <span>Campaign Outreach Rate</span>
                        <span className="font-mono text-white/70">{proj.progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-white/5">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-amber-500/80 to-gold rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${proj.progress}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 border-t border-white/5 pt-4 text-[10px] text-white/50">
                      <div>
                        <span className="block text-white/30 text-[9px] uppercase font-bold tracking-wider">Allocated Agent</span>
                        <span className="text-white/80 font-semibold">{proj.agent?.name || 'Awaiting Node Allocation'}</span>
                      </div>
                      <div>
                        <span className="block text-white/30 text-[9px] uppercase font-bold tracking-wider">Start Stamp</span>
                        <span className="font-mono">{proj.startDate ? new Date(proj.startDate).toLocaleDateString() : '—'}</span>
                      </div>
                      <div>
                        <span className="block text-white/30 text-[9px] uppercase font-bold tracking-wider">Est Completion</span>
                        <span className="font-mono">{proj.estCompletion ? new Date(proj.estCompletion).toLocaleDateString() : '—'}</span>
                      </div>
                      <div>
                        <span className="block text-white/30 text-[9px] uppercase font-bold tracking-wider">Completion Date</span>
                        <span className="font-mono">{proj.actualCompletion ? new Date(proj.actualCompletion).toLocaleDateString() : '—'}</span>
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
          <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-5 shadow-glow backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">System Alerts Inbox</h2>
              </div>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-black text-blue-400 font-mono animate-pulse">
                  {notifications.filter(n => !n.read).length} New
                </span>
              )}
            </div>

            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="text-2xs text-white/30 text-center py-6">Inbox is empty.</p>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`rounded-xl border p-3.5 space-y-1.5 transition-all duration-300 ${
                      notif.read ? 'border-white/5 bg-slate-950/30 opacity-50' : 'border-blue-500/15 bg-blue-500/[0.02]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white leading-normal">{notif.title}</h4>
                      {!notif.read && (
                        <button 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-[9px] text-blue-400 hover:text-blue-300 font-extrabold uppercase whitespace-nowrap"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-white/55 leading-relaxed">{notif.message}</p>
                    <span className="block text-[8px] text-white/30 font-bold font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: AI Voice Agent Testing */}
          <div className="relative z-20 rounded-2xl border border-white/[0.08] bg-slate-900/40 p-5 shadow-glow backdrop-blur-xl space-y-4">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
            <div className="flex items-center gap-2 border-b border-white/5 pb-3.5">
              <PhoneCall size={16} className="text-purple-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Interactive Voice Simulator</h2>
            </div>
            
            <form onSubmit={handleVoiceTest} className="space-y-4">
              <div>
                <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block mb-1.5">Target Phone Number</label>
                <input
                  required
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 0199"
                  className="w-full rounded-xl bg-slate-950/90 border border-white/10 px-4 py-3 text-xs text-white placeholder-white/30 outline-hidden focus:border-purple-400 focus:shadow-[0_0_12px_rgba(168,85,247,0.1)] transition-all duration-300"
                />
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block mb-1.5">Interactive Call Scenario</label>
                <textarea
                  required
                  rows={2}
                  value={testScenario}
                  onChange={(e) => setTestScenario(e.target.value)}
                  placeholder="Objection handler scenario description..."
                  className="w-full rounded-xl bg-slate-950/90 border border-white/10 px-4 py-3 text-xs text-white placeholder-white/30 outline-hidden focus:border-purple-400 focus:shadow-[0_0_12px_rgba(168,85,247,0.1)] transition-all duration-300 resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5 relative" ref={voiceDropdownRef}>
                  <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block">Voice Profile</label>
                  <button
                    type="button"
                    onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                    className="w-full h-11 flex items-center justify-between rounded-xl bg-slate-950 border border-white/10 px-3.5 text-xs text-white focus:border-purple-400 transition-all duration-300"
                  >
                    <span>
                      {testVoice === 'Female Professional' ? 'Female Prof' : 
                       testVoice === 'Male Professional' ? 'Male Prof' : 
                       testVoice === 'Sales Specialist' ? 'Sales Agent' : 'Support Agent'}
                    </span>
                    <ChevronDown size={14} className={`transform transition-transform duration-200 text-white/60 ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isVoiceDropdownOpen && (
                    <div className="absolute top-[4.5rem] left-0 z-50 w-full rounded-xl bg-slate-950 border border-white/10 p-1.5 shadow-2xl space-y-0.5 animate-fadeIn">
                      {[
                        { val: 'Female Professional', label: 'Female Prof' },
                        { val: 'Male Professional', label: 'Male Prof' },
                        { val: 'Sales Specialist', label: 'Sales Agent' },
                        { val: 'Customer Support', label: 'Support Agent' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => {
                            setTestVoice(item.val);
                            setIsVoiceDropdownOpen(false);
                          }}
                          className={`w-full text-left rounded-lg px-3 py-2 text-xs transition duration-150 ${
                            testVoice === item.val 
                              ? 'bg-purple-600/20 text-purple-400 font-bold border border-purple-500/20' 
                              : 'text-white/70 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-transparent select-none block">Action</label>
                  <button
                    type="submit"
                    disabled={testLoading || !testPhone}
                    className="w-full h-11 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-xs font-bold text-white transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-purple-500/10"
                  >
                    <Volume2 size={13} className="animate-pulse" />
                    <span>Dial Test</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Test Results Console */}
            {testLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-white/40 font-semibold animate-pulse">
                <RefreshCw size={14} className="animate-spin text-purple-400" />
                <span>Establishing simulated outbound trunk...</span>
              </div>
            )}

            {testResult && (
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Dialer Output Console</span>
                  <button 
                    onClick={downloadTranscript} 
                    className="text-[9px] text-white/40 hover:text-white flex items-center gap-1 transition-all"
                  >
                    <Download size={10} />
                    <span>Download TXT</span>
                  </button>
                </div>

                {/* Call Logs Feed */}
                <div className="h-32 overflow-y-auto rounded-lg bg-black/60 p-3 text-[10px] font-mono space-y-2 leading-relaxed border border-white/5">
                  {testResult.transcript.map((t: any, i: number) => (
                    <div key={i}>
                      <span className={t.role === 'assistant' ? 'text-purple-300 font-bold' : 'text-gold font-bold'}>
                        [{t.role.toUpperCase()}]:
                      </span>{' '}
                      <span className="text-white/80">{t.message}</span>
                    </div>
                  ))}
                </div>

                {/* Call Analytics */}
                <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[9px] text-white/40 font-bold">
                  <div>
                    <span>Sentiment Score: </span>
                    <span className="text-emerald-400">{testResult.analytics.sentiment}</span>
                  </div>
                  <div>
                    <span>Call Duration: </span>
                    <span className="text-white/85 font-mono">{testResult.analytics.durationSec}s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Activity Timeline */}
          <div className="relative z-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/40 p-5 shadow-glow backdrop-blur-xl space-y-5">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <div className="flex items-center gap-2 border-b border-white/5 pb-3.5">
              <Clock size={16} className="text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Operational Logs</h2>
            </div>

            <div className="h-[250px] overflow-y-auto pr-2 space-y-0.5 custom-scrollbar">
              {activities.length === 0 ? (
                <p className="text-2xs text-white/30 text-center py-6">Logs are quiet.</p>
              ) : (
                activities.map((act, idx) => (
                  <div key={act.id} className="relative pl-6 pb-5 last:pb-1 border-l border-white/10 ml-1.5">
                    {/* Glowing circular timeline dot */}
                    <span className="absolute -left-1.5 top-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400/50 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border border-slate-950"></span>
                    </span>
                    
                    <h5 className="text-xs font-bold text-white/90">{act.action}</h5>
                    <p className="text-[10px] text-white/50 mt-1 leading-relaxed">{act.details}</p>
                    
                    <div className="mt-2.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-950 border border-white/5 text-[9px] font-extrabold font-mono text-slate-400 uppercase tracking-wider">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
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
