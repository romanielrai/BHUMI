'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Users, Phone, CheckCircle2, Clock, Target, Calendar, ClipboardList, Send, CheckSquare, Square, Trash2, ListTodo, RefreshCw, Play, Pause, Check, Flame, PhoneCall, ShieldAlert } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  clientId: string;
  status: string;
  progress: number;
  startDate?: string;
  estCompletion?: string;
  client?: { companyName: string };
  leads?: Lead[];
}

interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  notes: string;
  status: string;
}

interface Meeting {
  id: string;
  time: string;
  prospectName: string;
  purpose: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface DailyUpdate {
  id: string;
  date: string;
  summary: string;
  createdAt: string;
}

export default function AgentDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState('');

  // Sub-tab Navigation
  const [activeSubTab, setActiveSubTab] = useState<'dialer' | 'planner'>('dialer');

  // Lead feedback update states
  const [editStatus, setEditStatus] = useState('NEW');
  const [editNotes, setEditNotes] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Planner & Target States
  const [callTarget, setCallTarget] = useState(20);
  const [callsMade, setCallsMade] = useState(0);
  const [targetInput, setTargetInput] = useState('20');

  // Meetings
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingForm, setMeetingForm] = useState({
    time: '',
    prospectName: '',
    purpose: ''
  });

  // Checklist Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState('');

  // Daily Updates
  const [dailyUpdateInput, setDailyUpdateInput] = useState('');
  const [recentUpdates, setRecentUpdates] = useState<DailyUpdate[]>([]);
  
  const sseRef = useRef<EventSource | null>(null);

  // Fetch agent's projects
  const fetchProjects = async (autoSelect = false) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) return;

    try {
      const user = JSON.parse(userStr);
      const adminId = user.adminId;

      const res = await fetch('/api/crm/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter projects assigned to this admin (by adminId or admin email)
        const adminProjects = (data.projects || []).filter((p: any) => 
          p.adminId === adminId || p.admin?.email === user.email
        );
        setProjects(adminProjects);

        if (adminProjects.length > 0 && (autoSelect || !selectedProjectId)) {
          const firstProj = adminProjects[0];
          setSelectedProjectId(firstProj.id);
          fetchLeads(firstProj.id);
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads for selected project
  const fetchLeads = async (projectId: string) => {
    const token = localStorage.getItem('token');
    if (!token || !projectId) return;

    try {
      const res = await fetch(`/api/crm/admin-leads/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        
        if (data.leads?.length > 0) {
          // Select first lead by default
          const firstLead = data.leads[0];
          setSelectedLeadId(firstLead.id);
          setEditStatus(firstLead.status);
          setEditNotes(firstLead.notes || '');
          setEditPhone(firstLead.phone || '');
          setEditEmail(firstLead.email || '');
        } else {
          setSelectedLeadId('');
          setEditNotes('');
          setEditPhone('');
          setEditEmail('');
        }
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  // Fetch planner data (target, meetings, tasks)
  const fetchPlannerData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/crm/admin/daily-planner', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.planner) {
          setCallTarget(data.planner.callTarget || 20);
          setCallsMade(data.planner.callsMade || 0);
          setTargetInput(String(data.planner.callTarget || 20));
        }
        setMeetings(data.meetings || []);
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching planner data:', err);
    }
  };

  // Fetch agent's recent daily updates
  const fetchRecentUpdates = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/crm/admin/daily-updates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentUpdates(data.updates || []);
      }
    } catch (err) {
      console.error('Error fetching daily updates:', err);
    }
  };

  const selectedProjectIdRef = useRef(selectedProjectId);

  useEffect(() => {
    selectedProjectIdRef.current = selectedProjectId;
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProjects(true);
    fetchPlannerData();
    fetchRecentUpdates();

    // Subscribe to SSE updates
    sseRef.current = new EventSource('/api/crm/stream');
    sseRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'LEAD_STATUS_UPDATE' || data.type === 'CONNECTED') {
          // Hot reload
          fetchProjects(false);
          const currentProjectId = selectedProjectIdRef.current;
          if (currentProjectId) {
            fetchLeads(currentProjectId);
          }
          fetchPlannerData();
        }
      } catch (e) {
        // ignore
      }
    };

    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, [fetchProjects]);

  // Handle project select change
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    fetchLeads(projectId);
  };

  // Handle lead select
  const handleLeadSelect = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setEditStatus(lead.status);
    setEditNotes(lead.notes || '');
    setEditPhone(lead.phone || '');
    setEditEmail(lead.email || '');
  };

  // Trigger project admin-work action (START, PAUSE, COMPLETE)
  const handleAgentWorkAction = async (projectId: string, action: 'START' | 'PAUSE' | 'COMPLETE') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionStatus(`Sending ${action.toLowerCase()} trigger...`);
    try {
      const res = await fetch(`/api/crm/projects/${projectId}/admin-work`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        setActionStatus(`Project successfully marked as ${action.toLowerCase()}ed.`);
        fetchProjects(false);
        setTimeout(() => setActionStatus(''), 3000);
      } else {
        const err = await res.json();
        setActionStatus(err.error || 'Action failed.');
      }
    } catch {
      setActionStatus('Connection error.');
    }
  };

  // Update Lead Outbound Status & Notes & Contact Information
  const handleUpdateLeadStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setActionStatus('Saving lead feedback...');
    try {
      const res = await fetch(`/api/crm/leads/${selectedLeadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
          phone: editPhone,
          email: editEmail
        })
      });

      if (res.ok) {
        setActionStatus('Lead updated successfully!');
        if (selectedProjectId) {
          fetchLeads(selectedProjectId);
        }
        fetchPlannerData();
        setTimeout(() => setActionStatus(''), 3000);
      } else {
        const err = await res.json();
        setActionStatus(err.error || 'Failed to update lead.');
      }
    } catch {
      setActionStatus('Connection error.');
    }
  };

  // Daily Planner Handlers
  const handleSetTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    const val = parseInt(targetInput, 10);
    if (isNaN(val) || val <= 0) return;

    try {
      const res = await fetch('/api/crm/admin/daily-planner/target', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ target: val })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.planner) {
          setCallTarget(data.planner.callTarget);
        }
        setActionStatus('Daily call target updated.');
        setTimeout(() => setActionStatus(''), 3000);
      }
    } catch (err) {
      console.error('Error setting target:', err);
    }
  };

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!meetingForm.time || !meetingForm.prospectName) {
      alert('Time and prospect name are required.');
      return;
    }

    try {
      const res = await fetch('/api/crm/admin/daily-planner/meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(meetingForm)
      });
      if (res.ok) {
        setMeetingForm({ time: '', prospectName: '', purpose: '' });
        fetchPlannerData();
        setActionStatus('Meeting scheduled successfully.');
        setTimeout(() => setActionStatus(''), 3000);
      }
    } catch (err) {
      console.error('Error adding meeting:', err);
    }
  };

  const handleToggleMeeting = async (meetingId: string, completed: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/crm/admin/daily-planner/meeting/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ completed })
      });
      if (res.ok) {
        fetchPlannerData();
      }
    } catch (err) {
      console.error('Error toggling meeting:', err);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/crm/admin/daily-planner/meeting/${meetingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPlannerData();
        setActionStatus('Meeting removed.');
        setTimeout(() => setActionStatus(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting meeting:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!taskInput.trim()) return;

    try {
      const res = await fetch('/api/crm/admin/daily-planner/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: taskInput.trim() })
      });
      if (res.ok) {
        setTaskInput('');
        fetchPlannerData();
      }
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/crm/admin/daily-planner/task/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ completed })
      });
      if (res.ok) {
        fetchPlannerData();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/crm/admin/daily-planner/task/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPlannerData();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleSubmitDailyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!dailyUpdateInput.trim()) return;

    try {
      const res = await fetch('/api/crm/admin/daily-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ summary: dailyUpdateInput.trim() })
      });
      if (res.ok) {
        setDailyUpdateInput('');
        fetchRecentUpdates();
        setActionStatus('Daily updates report submitted.');
        setTimeout(() => setActionStatus(''), 3000);
      }
    } catch (err) {
      console.error('Error submitting daily update:', err);
    }
  };

  // Get active project details
  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Performance calculations
  const totalLeads = leads.length;
  const contactedLeads = leads.filter(l => l.status !== 'NEW').length;
  const closedLeads = leads.filter(l => ['CLOSED', 'DEAL_CLOSED', 'Deal Closed', 'Deal Closed ✅', 'Call Went Well', 'Follow-up Meeting Scheduled'].includes(l.status)).length;
  const closedPercentage = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  // Wave Bar Component for audio wave representation
  const WaveBar = ({ delay }: { delay: number }) => (
    <motion.div
      className="w-1 rounded-full bg-purple-500/80"
      animate={{ height: ['4px', '22px', '8px', '16px', '4px'] }}
      transition={{ duration: 1.2, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );

  return (
    <div className="space-y-8 font-sans antialiased text-white/95">
      
      {/* ── AGENT BANNER & STATS TICKERS ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
        {/* Total Assigned Campaigns */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-glow backdrop-blur-xl">
          <div className="flex items-center justify-between text-white/40 text-[9px] tracking-[0.2em] uppercase font-bold">
            <span>Allocated Projects</span>
            <Briefcase size={14} className="text-purple-400" />
          </div>
          <p className="mt-3 text-3xl font-black font-mono tracking-tight text-white">{projects.length}</p>
        </div>

        {/* Total Leads to Call */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-glow backdrop-blur-xl">
          <div className="flex items-center justify-between text-white/40 text-[9px] tracking-[0.2em] uppercase font-bold">
            <span>Total Leads</span>
            <Users size={14} className="text-blue-400" />
          </div>
          <p className="mt-3 text-3xl font-black font-mono tracking-tight text-white">{totalLeads}</p>
        </div>

        {/* Contacted Leads */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-glow backdrop-blur-xl">
          <div className="flex items-center justify-between text-white/40 text-[9px] tracking-[0.2em] uppercase font-bold">
            <span>Leads Contacted</span>
            <Phone size={14} className="text-gold" />
          </div>
          <p className="mt-3 text-3xl font-black font-mono tracking-tight text-white">{contactedLeads}</p>
        </div>

        {/* Campaign Conversion Recovery Rate */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-glow backdrop-blur-xl">
          <div className="flex items-center justify-between text-white/40 text-[9px] tracking-[0.2em] uppercase font-bold">
            <span>Outcomes Rate</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-black font-mono tracking-tight text-emerald-400">{closedPercentage}%</p>
        </div>
      </div>

      {/* Tab sub-navigation */}
      <div className="flex border-b border-white/10 pb-px mb-6">
        <button
          onClick={() => setActiveSubTab('dialer')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all duration-300 ${
            activeSubTab === 'dialer'
              ? 'border-purple-500 text-white bg-purple-500/10'
              : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
          } rounded-t-xl`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>My Prospects</span>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('planner')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all duration-300 ${
            activeSubTab === 'planner'
              ? 'border-purple-500 text-white bg-purple-500/10'
              : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
          } rounded-t-xl`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Daily Planner & Log</span>
          </div>
        </button>
      </div>

      {activeSubTab === 'planner' ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-fadeIn">
          {/* Left Column: Target Ring & Log Update */}
          <div className="space-y-8 lg:col-span-5">
            {/* Call Targets Progress Ring */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-6 shadow-glow backdrop-blur-md space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Target size={16} className="text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Daily Calling Targets</h3>
              </div>
              
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                {/* SVG Circular Progress Ring */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background Ring */}
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      className="text-white/5"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {/* Progress Ring */}
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      className="text-purple-500 transition-all duration-500 ease-out"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 60}
                      strokeDashoffset={
                        2 * Math.PI * 60 * (1 - Math.min(callsMade / Math.max(callTarget, 1), 1))
                      }
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  
                  {/* Inside Text */}
                  <div className="absolute text-center">
                    <span className="text-3xl font-black text-white">{callsMade}</span>
                    <span className="text-white/40 text-[10px] block">/ {callTarget} calls</span>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-white/80">
                    {callsMade >= callTarget ? '🎉 Target Achieved!' : `${callTarget - callsMade} more dials to reach today's target.`}
                  </p>
                  <p className="text-[10px] text-white/40">Calls auto-increment on each outbound outcome save.</p>
                </div>
              </div>

              {/* Set Call Target Form */}
              <form onSubmit={handleSetTarget} className="flex gap-2 items-end border-t border-white/5 pt-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block">Adjust Today's Target</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-955 border border-white/10 px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-purple-400 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white transition active:scale-95 shrink-0"
                >
                  Set
                </button>
              </form>
            </div>

            {/* Daily Update Form */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-6 shadow-glow backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <ClipboardList size={16} className="text-gold" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">30-Sec Daily Update</h3>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Quickly submit your daily end-of-day summary. This updates the management activity feed.
              </p>

              <form onSubmit={handleSubmitDailyUpdate} className="space-y-4">
                <textarea
                  rows={3}
                  value={dailyUpdateInput}
                  onChange={(e) => setDailyUpdateInput(e.target.value)}
                  placeholder="Summarize your progress today (e.g. Completed 25 outreach calls, set up 2 meetings, closed Sarah Connor)..."
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-3 text-xs text-white placeholder-white/30 outline-hidden focus:border-purple-400 transition resize-none h-24"
                  required
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-3 text-xs font-bold text-white transition"
                >
                  <Send size={13} />
                  <span>Submit Work Log</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Meetings, Tasks checklist, and recent update feed */}
          <div className="space-y-8 lg:col-span-7">
            {/* Meetings Tracker */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-6 shadow-glow backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Calendar size={16} className="text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Scheduled Meetings</h3>
              </div>

              {/* Add Meeting Form */}
              <form onSubmit={handleAddMeeting} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-955/40 p-4 rounded-xl border border-white/5">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block">Time</label>
                  <input
                    type="time"
                    value={meetingForm.time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-white/10 p-2 text-xs text-white outline-hidden focus:border-purple-400 transition"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block">Prospect</label>
                  <input
                    type="text"
                    placeholder="Prospect Name"
                    value={meetingForm.prospectName}
                    onChange={(e) => setMeetingForm({ ...meetingForm, prospectName: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-white/10 p-2 text-xs text-white outline-hidden focus:border-purple-400 transition"
                    required
                  />
                </div>
                <div className="space-y-1 flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block">Purpose</label>
                    <input
                      type="text"
                      placeholder="e.g. Sales Demo"
                      value={meetingForm.purpose}
                      onChange={(e) => setMeetingForm({ ...meetingForm, purpose: e.target.value })}
                      className="w-full rounded-lg bg-slate-950 border border-white/10 p-2 text-xs text-white outline-hidden focus:border-purple-400 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-purple-600 hover:bg-purple-500 p-2 text-xs font-bold text-white transition mt-4 shrink-0"
                  >
                    Add
                  </button>
                </div>
              </form>

              {/* Meetings List */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {meetings.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-6">No meetings scheduled for today.</p>
                ) : (
                  meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                        meeting.completed 
                          ? 'border-emerald-500/10 bg-emerald-500/[0.02] text-white/55' 
                          : 'border-white/5 bg-slate-955/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleMeeting(meeting.id, !meeting.completed)}
                          className="text-white/60 hover:text-white transition"
                        >
                          {meeting.completed ? (
                            <CheckSquare size={16} className="text-emerald-400" />
                          ) : (
                            <Square size={16} className="text-white/30" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-gold">{meeting.time}</span>
                            <span className={`text-xs font-bold ${meeting.completed ? 'line-through text-white/40' : 'text-white'}`}>
                              {meeting.prospectName}
                            </span>
                          </div>
                          {meeting.purpose && (
                            <p className="text-[10px] text-white/40 mt-0.5">{meeting.purpose}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="text-white/30 hover:text-rose-400 p-1.5 hover:bg-white/5 rounded-lg transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Daily Tasks Checklist */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-6 shadow-glow backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <ListTodo size={16} className="text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Personal Task Checklist</h3>
              </div>

              {/* Add Task Form */}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new quick task..."
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-955 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-hidden focus:border-purple-400 transition"
                  required
                />
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white transition active:scale-95"
                >
                  Add Task
                </button>
              </form>

              {/* Tasks List */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {tasks.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-6">No tasks added for today.</p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition ${
                        task.completed 
                          ? 'border-emerald-500/10 bg-emerald-500/[0.02] text-white/55' 
                          : 'border-white/5 bg-slate-955/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleTask(task.id, !task.completed)}
                          className="text-white/60 hover:text-white transition"
                        >
                          {task.completed ? (
                            <CheckSquare size={16} className="text-emerald-400" />
                          ) : (
                            <Square size={16} className="text-white/30" />
                          )}
                        </button>
                        <span className={`text-xs font-medium ${task.completed ? 'line-through text-white/40' : 'text-white'}`}>
                          {task.title}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-white/30 hover:text-rose-400 p-1.5 hover:bg-white/5 rounded-lg transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Daily updates logged */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-6 shadow-glow backdrop-blur-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/5 pb-3">Recent Daily Log History</h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {recentUpdates.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-4">No daily logs submitted yet.</p>
                ) : (
                  recentUpdates.map((update) => (
                    <div key={update.id} className="p-3.5 rounded-xl border border-white/5 bg-slate-955/40 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-[9px] font-bold text-white/45">
                        <span className="font-mono">{new Date(update.createdAt).toLocaleDateString()}</span>
                        <span>{new Date(update.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-white/80 whitespace-pre-wrap">{update.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-fadeIn">
          {/* Left Column: Campaigns & Dial triggers */}
          <div className="space-y-8 lg:col-span-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-6 shadow-glow backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-purple-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Campaign Nodes</h2>
                </div>
                <button 
                  onClick={() => fetchProjects(false)} 
                  className="p-1 rounded-lg border border-white/5 bg-white/5 text-white/40 hover:text-white transition"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              {loading ? (
                <p className="text-xs text-white/40 text-center py-6">Loading campaigns...</p>
              ) : projects.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-6">No campaigns allocated by administrator.</p>
              ) : (
                <div className="space-y-3">
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => handleProjectSelect(proj.id)}
                      className={`w-full text-left rounded-xl p-4 border transition-all duration-300 block space-y-3.5 ${
                        selectedProjectId === proj.id 
                          ? 'border-purple-500 bg-purple-500/[0.04] shadow-glow-sm scale-[1.01]' 
                          : 'border-white/5 bg-slate-950/20 hover:bg-slate-950/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white block truncate max-w-[150px]">{proj.name}</span>
                        <span className={`text-[8px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          proj.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' :
                          proj.status === 'WORK_STARTED' ? 'bg-purple-500/10 border-purple-500/15 text-purple-400' :
                          proj.status === 'IN_PROGRESS' ? 'bg-blue-500/10 border-blue-500/15 text-blue-400' : 'bg-amber-500/10 border-amber-500/15 text-gold'
                        }`}>
                          {proj.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[9px] text-white/40 uppercase font-bold tracking-wider">
                          <span>Fulfillment</span>
                          <span>{proj.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-purple-500 rounded-full" 
                            style={{ width: `${proj.progress}%` }} 
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* WORK TRIGGERS CONSOLE */}
            {activeProject && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-6 shadow-glow backdrop-blur-md space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dialer State Controller</h3>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Control the calling progress of the current campaign. Updating state updates the client dashboard in real-time.
                </p>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAgentWorkAction(activeProject.id, 'START')}
                    disabled={activeProject.status === 'WORK_STARTED' || activeProject.status === 'COMPLETED'}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 hover:bg-emerald-500/10 py-3 text-emerald-400 font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                    title="Start Calling Outbounds"
                  >
                    <Play size={14} />
                    <span className="text-[9px] uppercase tracking-wider">Start</span>
                  </button>

                  <button
                    onClick={() => handleAgentWorkAction(activeProject.id, 'PAUSE')}
                    disabled={activeProject.status === 'IN_PROGRESS' || activeProject.status === 'COMPLETED' || activeProject.status === 'PENDING_APPROVAL'}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-500/15 bg-blue-500/5 hover:bg-blue-500/10 py-3 text-blue-400 font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                    title="Pause Outbounds"
                  >
                    <Pause size={14} />
                    <span className="text-[9px] uppercase tracking-wider">Pause</span>
                  </button>

                  <button
                    onClick={() => handleAgentWorkAction(activeProject.id, 'COMPLETE')}
                    disabled={activeProject.status === 'COMPLETED'}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gold/15 bg-gold/5 hover:bg-gold/10 py-3 text-gold font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                    title="Archive / Complete Campaign"
                  >
                    <Check size={14} />
                    <span className="text-[9px] uppercase tracking-wider">Done</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Prospect list & feedback form */}
          <div className="space-y-6 lg:col-span-8">

            {/* ── QUICK DAILY LOG BAR ── */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-4 backdrop-blur-md">
              <form onSubmit={handleSubmitDailyUpdate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <Send size={13} className="text-gold" />
                  <span className="text-xs font-bold text-white/80 whitespace-nowrap">Quick Daily Log:</span>
                </div>
                <input
                  type="text"
                  value={dailyUpdateInput}
                  onChange={(e) => setDailyUpdateInput(e.target.value)}
                  placeholder="Submit your daily summary fast... (e.g. Made 20 calls, closed 1 deal)"
                  className="flex-1 rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-purple-400 transition"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2.5 text-xs font-bold text-white transition active:scale-95"
                >
                  Submit
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* My Prospects Table */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/35 overflow-hidden shadow-glow backdrop-blur-md md:col-span-7">
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-blue-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">My Assigned Prospects</h3>
                  </div>
                  <span className="text-[10px] font-bold text-white/30 font-mono">{leads.length} total</span>
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
                  {leads.length === 0 ? (
                    <p className="text-xs text-white/40 text-center py-10 px-4">Select a campaign node to load your prospects.</p>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-950 text-white/40 text-[9.5px] font-bold uppercase tracking-wider border-b border-white/5">
                          <th className="px-4 py-3 w-8">#</th>
                          <th className="px-4 py-3">Prospect</th>
                          <th className="px-4 py-3 hidden sm:table-cell">Company</th>
                          <th className="px-4 py-3 hidden md:table-cell">Phone</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Edit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {leads.map((lead, idx) => (
                          <tr
                            key={lead.id}
                            onClick={() => handleLeadSelect(lead)}
                            className={`cursor-pointer transition-colors ${
                              selectedLeadId === lead.id
                                ? 'bg-blue-500/[0.06] border-l-2 border-l-blue-500'
                                : 'hover:bg-white/[0.015]'
                            }`}
                          >
                            <td className="px-4 py-3.5 font-mono text-white/25 text-[10px]">{idx + 1}</td>
                            <td className="px-4 py-3.5">
                              <span className="font-bold text-white block text-xs">{lead.name}</span>
                              <span className="text-[10px] text-white/40 sm:hidden block">{lead.company}</span>
                            </td>
                            <td className="px-4 py-3.5 text-white/55 hidden sm:table-cell text-[11px]">{lead.company}</td>
                            <td className="px-4 py-3.5 font-mono text-white/55 hidden md:table-cell text-[11px]">{lead.phone || '—'}</td>
                            <td className="px-4 py-3.5">
                              <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                ['CLOSED', 'DEAL_CLOSED', 'Deal Closed', 'Deal Closed ✅'].includes(lead.status) ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' :
                                lead.status === 'Call Went Well' ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-300' :
                                lead.status === 'Call Went Poorly' ? 'bg-rose-500/10 border-rose-500/15 text-rose-400' :
                                lead.status === 'Follow-up Meeting Scheduled' ? 'bg-blue-500/10 border-blue-500/15 text-blue-300' :
                                ['Lost/Failed', 'Lost / Failed ❌'].includes(lead.status) ? 'bg-red-500/10 border-red-500/15 text-red-400' :
                                lead.status === 'INTERESTED' ? 'bg-purple-500/10 border-purple-500/15 text-purple-400' :
                                lead.status === 'FOLLOW_UP' ? 'bg-blue-500/10 border-blue-500/15 text-blue-400' :
                                lead.status === 'NO_ANSWER' ? 'bg-yellow-500/10 border-yellow-500/15 text-yellow-400' :
                                lead.status === 'CONTACTED' ? 'bg-amber-500/10 border-amber-500/15 text-amber-400' : 'bg-white/5 border-white/5 text-white/60'
                              }`}>
                                {lead.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleLeadSelect(lead); }}
                                className={`rounded-lg px-3 py-1.5 text-[9.5px] font-bold transition ${
                                  selectedLeadId === lead.id
                                    ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                                    : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                {selectedLeadId === lead.id ? 'Editing' : 'Select'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Lead Feedback Panel */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-6 shadow-glow backdrop-blur-md md:col-span-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Flame size={16} className="text-gold" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Dialer Control Console</h3>
                </div>

                {selectedLeadId ? (
                  (() => {
                    const lead = leads.find(l => l.id === selectedLeadId);
                    if (!lead) return null;
                    return (
                      <form onSubmit={handleUpdateLeadStatus} className="space-y-4">
                        <div className="rounded-xl border border-white/5 bg-slate-950/70 p-4 space-y-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-white">{lead.name}</span>
                            <a 
                              href={`tel:${editPhone || lead.phone}`} 
                              className="inline-flex items-center gap-1.5 text-gold hover:underline font-mono text-[10px]"
                              onClick={(e) => {
                                e.preventDefault();
                                alert(`Simulating outbound VoIP bridge to ${editPhone || lead.phone}`);
                              }}
                            >
                              <PhoneCall size={10} />
                              <span>Bridge Call</span>
                            </a>
                          </div>
                          <p className="text-[10px] text-white/50">{lead.company}</p>
                          
                          {/* Interactive Voice Waveform when a lead is active */}
                          <div className="border-t border-white/5 pt-3 space-y-1.5">
                            <p className="text-[8px] font-bold text-purple-400 uppercase tracking-widest">Active Audio Channel</p>
                            <div className="flex items-end justify-center gap-1 h-6 bg-slate-900/60 rounded-lg py-1">
                              {Array.from({ length: 14 }).map((_, i) => (
                                <WaveBar key={i} delay={i * 0.08} />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Contact details editable */}
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block">
                              Decision Maker Phone
                            </label>
                            <input
                              type="tel"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              placeholder="Phone number"
                              className="w-full rounded-xl bg-slate-955 border border-white/10 px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-purple-400 transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block">
                              Decision Maker Email
                            </label>
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              placeholder="Email address"
                              className="w-full rounded-xl bg-slate-955 border border-white/10 px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-purple-400 transition"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block">Outbound Dial outcome</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-3 text-xs text-white outline-hidden focus:border-purple-400 focus:shadow-[0_0_12px_rgba(168,85,247,0.1)] transition-all duration-300"
                          >
                            <option value="NEW">New / Not Called</option>
                            <option value="Call Went Well">Call Went Well 👍</option>
                            <option value="Call Went Poorly">Call Went Poorly 👎</option>
                            <option value="Follow-up Meeting Scheduled">Follow-up Meeting Scheduled 📅</option>
                            <option value="Deal Closed ✅">Deal Closed ✅</option>
                            <option value="Lost / Failed ❌">Lost / Failed ❌</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="NO_ANSWER">No Answer</option>
                            <option value="INTERESTED">Interested</option>
                            <option value="FOLLOW_UP">Follow Up</option>
                            <option value="CLOSED">Closed (Success)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block">Call Feed Logs</label>
                          <textarea
                            rows={3}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Enter dial notes and next steps..."
                            className="w-full rounded-xl bg-slate-950/80 border border-white/10 px-4 py-3 text-xs text-white placeholder-white/30 outline-hidden focus:border-purple-400 focus:shadow-[0_0_12px_rgba(168,85,247,0.1)] transition-all duration-300 resize-none h-24"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-3 text-xs font-bold text-white transition-all duration-300 shadow-md shadow-purple-500/10 active:scale-[0.98]"
                        >
                          <CheckCircle2 size={13} />
                          <span>Save Dial Outcome</span>
                        </button>
                      </form>
                    );
                  })()
                ) : (
                  <p className="text-xs text-white/40 text-center py-12">Select a lead from the queue list to update progress.</p>
                )}
              </div>
            </div>

            {/* STATUS ALERTS BAR */}
            {actionStatus && (
              <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-950/20 px-4 py-3.5 text-xs text-purple-300 shadow-md mt-4">
                <ShieldAlert size={14} className="text-purple-400 animate-pulse" />
                <span className="font-semibold">{actionStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
