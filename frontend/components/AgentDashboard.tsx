'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Users, Phone, CheckCircle2, Clock, 
  Play, Pause, Check, X, RefreshCw, AlertCircle, 
  ChevronRight, PhoneCall, Edit3, MessageSquare, ShieldAlert,
  ArrowUpRight, Target, Flame
} from 'lucide-react';

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

export default function AgentDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState('');

  // Lead feedback update states
  const [editStatus, setEditStatus] = useState('NEW');
  const [editNotes, setEditNotes] = useState('');
  
  const sseRef = useRef<EventSource | null>(null);

  // Fetch agent's projects
  const fetchProjects = async (autoSelect = false) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) return;

    try {
      const user = JSON.parse(userStr);
      const agentId = user.agentId;

      const res = await fetch('/api/crm/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter projects assigned to this agent (by agentId or agent email)
        const agentProjects = (data.projects || []).filter((p: any) => 
          p.agentId === agentId || p.agent?.email === user.email
        );
        setProjects(agentProjects);

        if (agentProjects.length > 0 && (autoSelect || !selectedProjectId)) {
          const firstProj = agentProjects[0];
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
      const res = await fetch(`/api/crm/agent-leads/${projectId}`, {
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
        } else {
          setSelectedLeadId('');
          setEditNotes('');
        }
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  const selectedProjectIdRef = useRef(selectedProjectId);

  useEffect(() => {
    selectedProjectIdRef.current = selectedProjectId;
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProjects(true);

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
        }
      } catch (e) {
        // ignore
      }
    };

    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

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
  };

  // Trigger project agent-work action (START, PAUSE, COMPLETE)
  const handleAgentWorkAction = async (projectId: string, action: 'START' | 'PAUSE' | 'COMPLETE') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionStatus(`Sending ${action.toLowerCase()} trigger...`);
    try {
      const res = await fetch(`/api/crm/projects/${projectId}/agent-work`, {
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

  // Update Lead Outbound Status & Notes
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
          notes: editNotes
        })
      });

      if (res.ok) {
        setActionStatus('Lead updated successfully!');
        if (selectedProjectId) {
          fetchLeads(selectedProjectId);
        }
        setTimeout(() => setActionStatus(''), 3000);
      } else {
        const err = await res.json();
        setActionStatus(err.error || 'Failed to update lead.');
      }
    } catch {
      setActionStatus('Connection error.');
    }
  };

  // Get active project details
  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Performance calculations
  const totalLeads = leads.length;
  const contactedLeads = leads.filter(l => l.status !== 'NEW').length;
  const closedLeads = leads.filter(l => l.status === 'CLOSED').length;
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
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

        {/* Right Column: Lead queue list & feedback form */}
        <div className="space-y-8 lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Leads Queue List */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-6 shadow-glow backdrop-blur-md md:col-span-7 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Users size={16} className="text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Outbound Dialing Queue</h3>
              </div>

              <div className="overflow-y-auto max-h-[380px] space-y-2.5 pr-1">
                {leads.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-8">Select a campaign node to load leads.</p>
                ) : (
                  leads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => handleLeadSelect(lead)}
                      className={`w-full text-left rounded-xl p-3.5 border transition-all duration-300 text-xs flex items-center justify-between ${
                        selectedLeadId === lead.id
                          ? 'border-blue-500 bg-blue-500/[0.04] scale-[1.01]'
                          : 'border-white/5 bg-slate-950/20 hover:bg-slate-950/40'
                      }`}
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <span className="font-bold text-white block truncate">{lead.name}</span>
                        <span className="text-[10px] text-white/40 block truncate">{lead.company}</span>
                        <span className="text-[10px] text-white/55 block font-mono font-semibold">{lead.phone}</span>
                      </div>
                      
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          lead.status === 'CLOSED' ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' :
                          lead.status === 'INTERESTED' ? 'bg-purple-500/10 border-purple-500/15 text-purple-400' :
                          lead.status === 'FOLLOW_UP' ? 'bg-blue-500/10 border-blue-500/15 text-blue-400' :
                          lead.status === 'NO_ANSWER' ? 'bg-yellow-500/10 border-yellow-500/15 text-yellow-400' :
                          lead.status === 'CONTACTED' ? 'bg-gold/10 border-gold/15 text-gold' : 'bg-white/5 border-white/5 text-white/60'
                        }`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </div>
                    </button>
                  ))
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
                            href={`tel:${lead.phone}`} 
                            className="inline-flex items-center gap-1.5 text-gold hover:underline font-mono text-[10px]"
                            onClick={() => alert(`Simulating outbound VoIP bridge to ${lead.phone}`)}
                          >
                            <PhoneCall size={10} />
                            <span>Bridge Call</span>
                          </a>
                        </div>
                        <p className="text-[10px] text-white/50">{lead.company}</p>
                        <p className="text-[10px] text-white/40 font-mono">{lead.email}</p>
                        
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

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase block">Outbound Dial outcome</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-3 text-xs text-white outline-hidden focus:border-purple-400 focus:shadow-[0_0_12px_rgba(168,85,247,0.1)] transition-all duration-300"
                        >
                          <option value="NEW">New</option>
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
            <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-950/20 px-4 py-3.5 text-xs text-purple-300 shadow-md">
              <ShieldAlert size={14} className="text-purple-400 animate-pulse" />
              <span className="font-semibold">{actionStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
