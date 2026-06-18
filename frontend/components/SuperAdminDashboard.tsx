'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, Users, ListCollapse, Activity, Settings, RefreshCw, 
  Plus, Edit2, Trash2, Check, X, Save, AlertCircle, Cpu, HardDrive, 
  Link, Clock, UserCheck, ShieldCheck, Mail, Lock, Upload, FileSpreadsheet,
  UserPlus, FolderOpen, Shield, CheckCircle2, ChevronRight, Search, SlidersHorizontal
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  suspended: boolean;
  roleId: string;
  role?: { name: string };
}

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

interface ChatbotLog {
  id: string;
  leadId?: string;
  userMessage: string;
  botResponse: string;
  createdAt: string;
}

interface Health {
  uptime: number;
  memory: { rss: number; heapTotal: number; heapUsed: number };
  metrics: { apiLatencyMs: number; dbLatencyMs: number; activeConnections: number };
  integrations: { databaseType: string; databaseConnection: string; openai: string; twilio: string };
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'health' | 'users' | 'audit' | 'chatlogs' | 'configs' | 'prospects' | 'employees'>('health');
  const [loading, setLoading] = useState(true);

  // --- State Variables ---
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [chatbotLogs, setChatbotLogs] = useState<ChatbotLog[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [globalConfigs, setGlobalConfigs] = useState<any>({});
  const [configStatus, setConfigStatus] = useState('');

  // User Form Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userFormStatus, setUserFormStatus] = useState('');
  const [userForm, setUserForm] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    roleName: 'CLIENT',
    suspended: false
  });

  // --- Prospect Management States ---
  const [prospectSummary, setProspectSummary] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectLeads, setProjectLeads] = useState<any[]>([]);
  const [listName, setListName] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [prospectSearch, setProspectSearch] = useState<string>('');
  const [prospectFilter, setProspectFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [leadSearch, setLeadSearch] = useState<string>('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [assignTargetType, setAssignTargetType] = useState<'list' | 'leads'>('list');
  const [selectedEmployeeForAssign, setSelectedEmployeeForAssign] = useState<string>('');
  const [prospectStatusMsg, setProspectStatusMsg] = useState<string>('');
  // Tracks the current assignment info shown in the assign modal
  const [currentAssignmentInfo, setCurrentAssignmentInfo] = useState<{ name: string; id: string } | null>(null);

  // --- Employee Management States ---
  const [employees, setEmployees] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [employeeModalOpen, setEmployeeModalOpen] = useState<boolean>(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState<boolean>(false);
  const [employeeForm, setEmployeeForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    roleName: 'AGENT',
    designationId: '',
    password: ''
  });
  const [employeeFormStatus, setEmployeeFormStatus] = useState<string>('');

  // Designation States
  const [designationModalOpen, setDesignationModalOpen] = useState<boolean>(false);
  const [isEditingDesignation, setIsEditingDesignation] = useState<boolean>(false);
  const [designationForm, setDesignationForm] = useState({
    id: '',
    name: '',
    description: '',
    permissions: 'VIEW_OWN,CALL_LEADS'
  });
  const [designationFormStatus, setDesignationFormStatus] = useState<string>('');

  // --- Fetch API Data ---
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);

      // 1. Fetch System Health
      const healthRes = await fetch('/api/superadmin/system-health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealth(data);
      }

      // 2. Fetch Platform Users
      const usersRes = await fetch('/api/superadmin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      // 3. Fetch Audit Logs
      const auditRes = await fetch('/api/superadmin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || []);
      }

      // 4. Fetch Conversation Logs
      const chatLogsRes = await fetch('/api/superadmin/conversation-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (chatLogsRes.ok) {
        const data = await chatLogsRes.json();
        setChatbotLogs(data.logs || []);
      }

      // 5. Fetch Global Configs
      const configsRes = await fetch('/api/superadmin/configs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (configsRes.ok) {
        const data = await configsRes.json();
        setGlobalConfigs(data.configs || {});
      }

      // 6. Fetch Employees
      const empRes = await fetch('/api/superadmin/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data.employees || []);
      }

      // 7. Fetch Designations
      const desRes = await fetch('/api/superadmin/designations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (desRes.ok) {
        const data = await desRes.json();
        setDesignations(data.designations || []);
      }

      // 8. Fetch Prospect Summary
      const summaryRes = await fetch('/api/superadmin/prospects/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setProspectSummary(data.summary || []);
      }

    } catch (err) {
      console.error('Fetch superadmin details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // SSE Stream Integration
    const sse = new EventSource('/api/crm/stream');
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ACTIVITY_LOG' || data.type === 'NOTIFICATION') {
          fetchData();
        }
      } catch (err) {
        // ignore
      }
    };

    return () => {
      sse.close();
    };
  }, []);

  // --- User Directory Actions ---
  const openAddUserModal = () => {
    setUserForm({
      id: '',
      name: '',
      email: '',
      password: '',
      roleName: 'CLIENT',
      suspended: false
    });
    setIsEditingUser(false);
    setUserFormStatus('');
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (u: User) => {
    setUserForm({
      id: u.id,
      name: u.name || '',
      email: u.email,
      password: '', // Leave blank to avoid changing password
      roleName: u.role?.name || 'CLIENT',
      suspended: u.suspended
    });
    setIsEditingUser(true);
    setUserFormStatus('');
    setIsUserModalOpen(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setUserFormStatus('Saving account details...');

    try {
      const url = isEditingUser 
        ? `/api/superadmin/users/${userForm.id}` 
        : '/api/superadmin/users';
      const method = isEditingUser ? 'PATCH' : 'POST';

      // Discard blank password on edit
      const payload: any = { ...userForm };
      if (isEditingUser && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setUserFormStatus('Saved successfully!');
        fetchData();
        setTimeout(() => setIsUserModalOpen(false), 800);
      } else {
        const data = await res.json();
        setUserFormStatus(data.error || 'Failed to save user account.');
      }
    } catch {
      setUserFormStatus('Network error.');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/superadmin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete user.');
      }
    } catch {
      alert('Network error.');
    }
  };

  const toggleSuspension = async (u: User) => {
    const token = localStorage.getItem('token');
    if (!token) return;

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
        fetchData();
      }
    } catch {
      alert('Error updating user.');
    }
  };

  // --- EMPLOYEE MANAGEMENT HANDLERS ---
  const openAddEmployeeModal = () => {
    setEmployeeForm({
      id: '',
      name: '',
      email: '',
      phone: '',
      roleName: 'AGENT',
      designationId: designations[0]?.id || '',
      password: ''
    });
    setIsEditingEmployee(false);
    setEmployeeFormStatus('');
    setEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = (emp: any) => {
    setEmployeeForm({
      id: emp.id,
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      roleName: emp.role?.name || 'AGENT',
      designationId: emp.designation?.id || '',
      password: '' // leave blank
    });
    setIsEditingEmployee(true);
    setEmployeeFormStatus('');
    setEmployeeModalOpen(true);
  };

  const saveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setEmployeeFormStatus('Saving employee account...');
    try {
      const url = isEditingEmployee 
        ? `/api/superadmin/employees/${employeeForm.id}` 
        : '/api/superadmin/employees';
      const method = isEditingEmployee ? 'PATCH' : 'POST';

      const payload: any = { ...employeeForm };
      if (isEditingEmployee && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEmployeeFormStatus('Employee details saved successfully!');
        fetchData();
        setTimeout(() => setEmployeeModalOpen(false), 800);
      } else {
        const data = await res.json();
        setEmployeeFormStatus(data.error || 'Failed to save employee.');
      }
    } catch (err) {
      setEmployeeFormStatus('Network connection error.');
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this employee?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/superadmin/employees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete employee.');
      }
    } catch {
      alert('Network error.');
    }
  };

  const toggleEmployeeSuspension = async (emp: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/superadmin/employees/${emp.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ suspended: !emp.suspended })
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      alert('Error updating employee suspension.');
    }
  };

  // --- DESIGNATION CRUD HANDLERS ---
  const openAddDesignationModal = () => {
    setDesignationForm({
      id: '',
      name: '',
      description: '',
      permissions: 'VIEW_OWN,CALL_LEADS'
    });
    setIsEditingDesignation(false);
    setDesignationFormStatus('');
    setDesignationModalOpen(true);
  };

  const openEditDesignationModal = (des: any) => {
    setDesignationForm({
      id: des.id,
      name: des.name,
      description: des.description || '',
      permissions: des.permissions || 'VIEW_OWN,CALL_LEADS'
    });
    setIsEditingDesignation(true);
    setDesignationFormStatus('');
    setDesignationModalOpen(true);
  };

  const saveDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setDesignationFormStatus('Saving designation details...');
    try {
      const url = isEditingDesignation 
        ? `/api/superadmin/designations/${designationForm.id}` 
        : '/api/superadmin/designations';
      const method = isEditingDesignation ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(designationForm)
      });

      if (res.ok) {
        setDesignationFormStatus('Designation saved successfully!');
        fetchData();
        setTimeout(() => setDesignationModalOpen(false), 800);
      } else {
        const data = await res.json();
        setDesignationFormStatus(data.error || 'Failed to save designation.');
      }
    } catch {
      setDesignationFormStatus('Network error.');
    }
  };

  const deleteDesignation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this designation?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/superadmin/designations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete designation.');
      }
    } catch {
      alert('Network error.');
    }
  };

  // --- PROSPECT MANAGEMENT HANDLERS ---
  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setListName(file.name.replace(/\.[^/.]+$/, ""));
    setProspectStatusMsg('');
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        setProspectStatusMsg('Analyzing CSV data...');
        const res = await fetch('/api/superadmin/prospects/upload-preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ csvContent: text })
        });
        if (res.ok) {
          const data = await res.json();
          setCsvPreview(data.preview || []);
          setProspectStatusMsg(`Preview ready: ${data.preview?.length || 0} rows found.`);
        } else {
          const data = await res.json();
          setProspectStatusMsg(data.error || 'Failed to parse CSV preview.');
        }
      } catch (err) {
        setProspectStatusMsg('Error parsing CSV preview.');
      }
    };
    reader.readAsText(file);
  };

  const confirmProspectsUpload = async () => {
    if (!listName) {
      alert('Please enter a name for this prospect list.');
      return;
    }
    if (csvPreview.length === 0) {
      alert('No prospects found to upload.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setProspectStatusMsg('Saving prospects list to system...');
    try {
      const res = await fetch('/api/superadmin/prospects/upload-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ listName, prospects: csvPreview })
      });
      if (res.ok) {
        setProspectStatusMsg('List uploaded successfully!');
        setCsvPreview([]);
        setListName('');
        fetchData();
      } else {
        const data = await res.json();
        setProspectStatusMsg(data.error || 'Failed to confirm upload.');
      }
    } catch (e) {
      setProspectStatusMsg('Error confirming upload.');
    }
  };

  const fetchProjectLeads = async (projId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/crm/agent-leads/${projId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjectLeads(data.leads || []);
        setSelectedLeadIds([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectProjectForLeads = (projId: string) => {
    setSelectedProjectId(projId);
    if (projId) {
      fetchProjectLeads(projId);
    } else {
      setProjectLeads([]);
      setSelectedLeadIds([]);
    }
  };

  const triggerAssign = (targetType: 'list' | 'leads', targetIdOrIds: any) => {
    setAssignTargetType(targetType);
    setSelectedEmployeeForAssign('');

    // Determine current assignment to show in modal
    if (targetType === 'list') {
      const proj = prospectSummary.find(p => p.id === selectedProjectId);
      if (proj?.assignedTo) {
        setCurrentAssignmentInfo({ name: proj.assignedTo.name, id: proj.assignedTo.id || '' });
      } else {
        setCurrentAssignmentInfo(null);
      }
    } else {
      // For individual leads: show assignment if exactly one lead selected
      const ids = Array.isArray(targetIdOrIds) ? targetIdOrIds : [targetIdOrIds];
      if (ids.length === 1) {
        const lead = projectLeads.find(l => l.id === ids[0]);
        const emp = lead ? employees.find(e => e.id === lead.userId || e.agentId === lead.userId) : null;
        setCurrentAssignmentInfo(emp ? { name: emp.name, id: emp.id } : null);
      } else {
        setCurrentAssignmentInfo(null);
      }
    }

    setAssignModalOpen(true);
  };

  const confirmAssignment = async () => {
    const token = localStorage.getItem('token');
    if (!token || !selectedEmployeeForAssign) return;

    try {
      const payload: any = { employeeId: selectedEmployeeForAssign };
      if (assignTargetType === 'list') {
        payload.projectId = selectedProjectId;
      } else {
        payload.leadIds = selectedLeadIds;
      }

      const res = await fetch('/api/superadmin/prospects/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setAssignModalOpen(false);
        setSelectedLeadIds([]);
        fetchData();
        if (selectedProjectId) {
          fetchProjectLeads(selectedProjectId);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Assignment failed.');
      }
    } catch (e) {
      alert('Error assigning prospects.');
    }
  };

  const confirmUnassign = async () => {
    if (!confirm('Remove current assignment? Prospects will become unassigned.')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload: any = { employeeId: null };
      if (assignTargetType === 'list') {
        payload.projectId = selectedProjectId;
      } else {
        payload.leadIds = selectedLeadIds;
      }

      const res = await fetch('/api/superadmin/prospects/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setAssignModalOpen(false);
        setSelectedLeadIds([]);
        fetchData();
        if (selectedProjectId) fetchProjectLeads(selectedProjectId);
      } else {
        const data = await res.json();
        alert(data.error || 'Unassign failed.');
      }
    } catch {
      alert('Error removing assignment.');
    }
  };

  // --- Config Editor Action ---
  const saveGlobalConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setConfigStatus('Updating system settings...');

    try {
      const res = await fetch('/api/superadmin/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(globalConfigs)
      });

      if (res.ok) {
        setConfigStatus('Global configs updated successfully!');
        setTimeout(() => setConfigStatus(''), 4000);
        fetchData();
      } else {
        setConfigStatus('Failed to update configs.');
      }
    } catch {
      setConfigStatus('Network error.');
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (loading && !health) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/50">
        <p className="animate-pulse text-xs uppercase tracking-widest font-bold text-purple-400">Syncing SuperAdmin Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* ── TABS SELECTOR ── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 pb-5">
        {[
          { id: 'health', label: 'System Health', icon: Cpu },
          { id: 'prospects', label: 'Prospects Control', icon: FolderOpen },
          { id: 'employees', label: 'Employee Directory', icon: Users },
          { id: 'users', label: 'User Directory', icon: UserCheck },
          { id: 'audit', label: 'Audit Trails', icon: ListCollapse },
          { id: 'chatlogs', label: 'AI Chatbot Logs', icon: Clock },
          { id: 'configs', label: 'Global Parameters', icon: Settings }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === t.id 
                  ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-glow-sm' 
                  : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={13} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── SYSTEM HEALTH TAB ── */}
      {activeTab === 'health' && health && (
        <div className="space-y-8 text-left">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {/* Uptime */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between text-white/50 text-[10px] tracking-widest uppercase font-bold">
                <span>System Uptime</span>
                <Clock size={14} className="text-purple-400" />
              </div>
              <p className="mt-3 text-2xl font-bold font-mono text-white">{formatUptime(health.uptime)}</p>
            </div>
            {/* Active Connections */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between text-white/50 text-[10px] tracking-widest uppercase font-bold">
                <span>API Connections</span>
                <Activity size={14} className="text-purple-400" />
              </div>
              <p className="mt-3 text-2xl font-bold font-mono text-purple-300">{health.metrics?.activeConnections || 0} active</p>
            </div>
            {/* API Latency */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between text-white/50 text-[10px] tracking-widest uppercase font-bold">
                <span>API Latency</span>
                <Activity size={14} className="text-purple-400" />
              </div>
              <p className="mt-3 text-2xl font-bold font-mono text-purple-300">{health.metrics?.apiLatencyMs || 0} ms</p>
            </div>
            {/* RAM heap Used */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between text-white/50 text-[10px] tracking-widest uppercase font-bold">
                <span>RAM usage</span>
                <HardDrive size={14} className="text-purple-400" />
              </div>
              <p className="mt-3 text-2xl font-bold font-mono text-white">{health.memory?.heapUsed || 0} MB / {health.memory?.heapTotal} MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Integrations checklist */}
            <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2">
                <Link size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white font-sans">Active Integrations Check</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Database Adapter', type: health.integrations?.databaseType || 'Local Emulator', status: health.integrations?.databaseConnection || 'CONNECTED' },
                  { name: 'OpenAI (GPT Specialized Sockets)', type: 'Lead Chatbot & AI Voice Analysis', status: health.integrations?.openai || 'LIVE' },
                  { name: 'Twilio Dialer API Link', type: 'Live Outbound dialers and calls routing', status: health.integrations?.twilio || 'SIMULATED' }
                ].map((i, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-white/80">{i.name}</span>
                      <span className="block text-[10px] text-white/40">{i.type}</span>
                    </div>
                    <span className={`text-[8.5px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                      i.status === 'CONNECTED' || i.status === 'LIVE' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                      {i.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance status details */}
            <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white font-sans">Diagnostics Summary</h3>
              </div>
              <div className="space-y-3.5 text-xs text-white/70 leading-relaxed font-sans">
                <p>All core sub-processes are operating correctly. Sockets connection is healthy and streaming lead updates instantly to visual panels.</p>
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 space-y-2 font-mono text-2xs">
                  <div className="flex justify-between">
                    <span>Process RSS:</span>
                    <span>{health.memory?.rss} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database Latency:</span>
                    <span>{health.metrics?.dbLatencyMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Queue Status:</span>
                    <span className="text-emerald-400">Idle / Healthy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USER DIRECTORY TAB ── */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-purple-400" />
              <h2 className="text-lg font-bold text-white">System User Directory</h2>
            </div>
            <button
              onClick={openAddUserModal}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 text-xs font-bold transition"
            >
              <Plus size={14} />
              <span>Add System User</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">User Details</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Account Security</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-white/30">No platform users registered.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white">{u.name || 'Specialist'}</p>
                          <p className="text-2xs text-white/40">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded bg-white/5 border border-white/10 px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-purple-300">
                          {u.role?.name || 'CLIENT'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleSuspension(u)}
                          className={`rounded px-2.5 py-0.5 text-2xs font-extrabold transition ${
                            u.suspended 
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/35' 
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/35'
                          }`}
                        >
                          {u.suspended ? 'SUSPENDED' : 'ACTIVE'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => openEditUserModal(u)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                          title="Edit"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-950/20 border border-red-500/20 text-red-300 hover:bg-red-900/30 transition"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── USER MODAL ── */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#060b1b] p-6 space-y-5 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck size={16} className="text-purple-400" />
                <span>{isEditingUser ? 'Edit User Profile' : 'Add New System User'}</span>
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveUser} className="space-y-4">
              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">User Full Name</label>
                <input
                  required
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. John Connor"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1 flex items-center gap-1">
                  <Mail size={10} />
                  <span>User Email</span>
                </label>
                <input
                  required
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="e.g. email@domain.com"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1 flex items-center gap-1">
                  <Lock size={10} />
                  <span>Password {isEditingUser && '(leave blank to keep unchanged)'}</span>
                </label>
                <input
                  type="password"
                  required={!isEditingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Set login password..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">System Role</label>
                  <select
                    value={userForm.roleName}
                    onChange={(e) => setUserForm({ ...userForm, roleName: e.target.value })}
                    className="w-full rounded-xl bg-background border border-white/10 px-2 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                  >
                    <option value="SUPERADMIN">Super Admin</option>
                    <option value="ADMIN">Company Admin</option>
                    <option value="AGENT">Outbound Agent</option>
                    <option value="CLIENT">Client Portal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Account Suspension</label>
                  <select
                    value={userForm.suspended ? 'true' : 'false'}
                    onChange={(e) => setUserForm({ ...userForm, suspended: e.target.value === 'true' })}
                    className="w-full rounded-xl bg-background border border-white/10 px-2 py-2 text-xs text-white outline-none focus:border-purple-400 transition"
                  >
                    <option value="false">Active / Unrestricted</option>
                    <option value="true">Suspended / Locked</option>
                  </select>
                </div>
              </div>

              {userFormStatus && (
                <p className="text-xs text-gold animate-pulse text-center">{userFormStatus}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="w-1/2 rounded-xl bg-white/5 hover:bg-white/10 py-2.5 text-xs font-bold text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white py-2.5 text-xs font-bold transition"
                >
                  Save Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── AUDIT TRAILS TAB ── */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-purple-400" />
              <h2 className="text-lg font-bold text-white">Security & Audit Log Trails</h2>
            </div>
            <button onClick={fetchData} className="text-white/40 hover:text-white transition">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor Email</th>
                  <th className="px-4 py-3">Details / Target</th>
                  <th className="px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px] text-white/70">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-white/30 font-sans">No audit events logged.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-purple-300">{log.action}</td>
                      <td className="px-4 py-3">{log.actor}</td>
                      <td className="px-4 py-3 font-sans text-white/80">{log.details}</td>
                      <td className="px-4 py-3 text-white/40">{log.ipAddress}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CHATBOT LOGS TAB ── */}
      {activeTab === 'chatlogs' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-purple-400" />
              <h2 className="text-lg font-bold text-white font-sans">Live Chatbot Conversation Feeds</h2>
            </div>
            <button onClick={fetchData} className="text-white/40 hover:text-white transition">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {chatbotLogs.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-8">No chatbot message exchanges found.</p>
            ) : (
              chatbotLogs.map((chat) => (
                <div key={chat.id} className="rounded-xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
                  <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                    <span>Lead Interaction ID: {chat.leadId || 'ANONYMOUS'}</span>
                    <span>{new Date(chat.createdAt).toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="rounded-lg bg-white/5 p-3.5 border border-white/5 text-gold font-sans leading-relaxed">
                      <span className="block text-2xs uppercase tracking-wider font-bold text-white/40 mb-1">User Input:</span>
                      <p>{chat.userMessage}</p>
                    </div>
                    <div className="rounded-lg bg-purple-950/20 p-3.5 border border-purple-500/15 text-purple-200 font-sans leading-relaxed">
                      <span className="block text-2xs uppercase tracking-wider font-bold text-white/40 mb-1">AI Agent Response:</span>
                      <p>{chat.botResponse}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── GLOBAL CONFIGS TAB ── */}
      {activeTab === 'configs' && (
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-purple-400" />
            <h2 className="text-lg font-bold text-white">System Global Configuration Key-Value Editor</h2>
          </div>

          <form onSubmit={saveGlobalConfigs} className="space-y-6 text-left">
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
              <p className="text-xs text-white/40 leading-relaxed font-sans mb-2">
                Below are the active system configurations. Modify these keys to update default behaviors, limits, or configurations across all instances.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Dynamically render text inputs for configs */}
                {Object.keys(globalConfigs).length === 0 ? (
                  <p className="text-xs text-white/30">No active key-value properties found in system.</p>
                ) : (
                  Object.keys(globalConfigs).map((key) => {
                    // Check if value is object or array; skip if complex or stringify
                    const val = typeof globalConfigs[key] === 'object' 
                      ? JSON.stringify(globalConfigs[key]) 
                      : globalConfigs[key];
                    
                    return (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-purple-300 tracking-wider uppercase font-mono">{key}</label>
                        <input
                          type="text"
                          value={val || ''}
                          onChange={(e) => {
                            let parsedVal: any = e.target.value;
                            if (typeof globalConfigs[key] === 'number') {
                              parsedVal = Number(e.target.value);
                            }
                            setGlobalConfigs({ ...globalConfigs, [key]: parsedVal });
                          }}
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition font-mono"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {configStatus && (
              <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-950/20 px-4 py-3 text-xs text-purple-300 animate-pulse">
                <AlertCircle size={14} className="text-purple-400" />
                <span>{configStatus}</span>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-6 py-3.5 text-xs font-bold transition"
            >
              <Save size={14} />
              <span>Update Global Configuration Parameters</span>
            </button>
          </form>
        </div>
      )}

      {/* ── PROSPECTS CONTROL TAB ── */}
      {activeTab === 'prospects' && (
        <div className="space-y-8 text-left">

          {/* ── PROSPECT OVERVIEW STATS ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const totalLists = prospectSummary.length;
              const totalProspects = prospectSummary.reduce((s, p) => s + (p.totalLeads || 0), 0);
              const assignedProspects = prospectSummary.reduce((s, p) => s + (p.assignedLeads || 0), 0);
              const unassigned = totalProspects - assignedProspects;
              return [
                { label: 'Total Lists', value: totalLists, color: 'text-purple-300', accent: 'border-purple-500/20 bg-purple-500/[0.05]' },
                { label: 'Total Prospects', value: totalProspects, color: 'text-white', accent: 'border-white/10 bg-white/[0.02]' },
                { label: 'Assigned', value: assignedProspects, color: 'text-emerald-300', accent: 'border-emerald-500/20 bg-emerald-500/[0.05]' },
                { label: 'Unassigned', value: unassigned, color: 'text-amber-300', accent: 'border-amber-500/20 bg-amber-500/[0.05]' }
              ].map(stat => (
                <div key={stat.label} className={`rounded-2xl border ${stat.accent} p-4 space-y-1.5`}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">{stat.label}</p>
                  <p className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</p>
                </div>
              ));
            })()}
          </div>

          {/* CSV File Bulk Uploader */}
          <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Upload size={18} className="text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Bulk Import Prospects</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Uploader Form */}
              <div className="md:col-span-5 space-y-4">
                <p className="text-xs text-white/50 leading-relaxed">
                  Upload a standard `.csv` or `.xlsx` prospect contact sheet. The system validates decision maker name, email, phone, company, and remarks before importing.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[9.5px] font-extrabold text-white/40 tracking-wider uppercase block mb-1">List Identifier Name</label>
                    <input
                      type="text"
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="e.g. Q2 Outreach Campaign"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition"
                    />
                  </div>

                  <div className="relative border border-dashed border-white/10 hover:border-purple-500/50 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition p-6 text-center cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileSpreadsheet size={28} className="mx-auto text-white/30 mb-2.5" />
                    <span className="block text-xs font-bold text-white/80 mb-0.5">Choose CSV Spreadsheet</span>
                    <span className="block text-[10px] text-white/40">Drag & drop or select files (max 20MB)</span>
                  </div>
                </div>

                {prospectStatusMsg && (
                  <p className="text-xs text-gold font-mono animate-pulse">{prospectStatusMsg}</p>
                )}

                {csvPreview.length > 0 && (
                  <button
                    onClick={confirmProspectsUpload}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white py-3 text-xs font-bold transition shadow-md shadow-purple-500/10 active:scale-[0.98]"
                  >
                    <CheckCircle2 size={14} />
                    <span>Confirm and Save {csvPreview.length} Prospects</span>
                  </button>
                )}
              </div>

              {/* Preview Box */}
              <div className="md:col-span-7 rounded-xl border border-white/5 bg-slate-950/20 p-4 space-y-3">
                <span className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest block">CSV Parsing Preview (Top 5 rows)</span>
                {csvPreview.length === 0 ? (
                  <div className="border border-white/5 rounded-xl bg-white/[0.01] p-10 text-center text-xs text-white/30">
                    No files loaded. Select a CSV file to view parsing.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-white/5 rounded-xl">
                    <table className="w-full border-collapse text-left text-[11px] text-white/70">
                      <thead>
                        <tr className="bg-white/5 text-[9px] uppercase font-bold text-white/40 tracking-wider border-b border-white/10">
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Company</th>
                          <th className="px-3 py-2">Phone</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {csvPreview.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.01]">
                            <td className="px-3 py-2 font-bold text-white font-sans">{row.name}</td>
                            <td className="px-3 py-2">{row.company}</td>
                            <td className="px-3 py-2">{row.phone}</td>
                            <td className="px-3 py-2">{row.email}</td>
                            <td className="px-3 py-2 font-sans truncate max-w-[150px]">{row.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Structured Prospect Lists Dashboard */}
          <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-purple-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Prospect Campaign Lists</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Assignment filter */}
                <select
                  value={prospectFilter}
                  onChange={(e) => setProspectFilter(e.target.value as any)}
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition cursor-pointer"
                >
                  <option value="all">All Lists</option>
                  <option value="assigned">Assigned Only</option>
                  <option value="unassigned">Unassigned Only</option>
                </select>

                {/* Search filter */}
                <div className="relative rounded-xl bg-white/5 border border-white/10 flex items-center px-3.5">
                  <Search size={13} className="text-white/40 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search lists..."
                    value={prospectSearch}
                    onChange={(e) => setProspectSearch(e.target.value)}
                    className="bg-transparent py-2.5 text-xs text-white outline-none w-36 placeholder-white/30"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
              <table className="w-full text-left border-collapse text-xs text-white/80">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Campaign Name</th>
                    <th className="px-4 py-3">Upload Date</th>
                    <th className="px-4 py-3 text-center">Prospect Count</th>
                    <th className="px-4 py-3 text-center">Fulfillment Progress</th>
                    <th className="px-4 py-3">Assigned Agent</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {prospectSummary.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-white/30">No prospect lists registered on platform.</td>
                    </tr>
                  ) : (
                    prospectSummary
                      .filter(p => {
                        const matchesSearch = p.name.toLowerCase().includes(prospectSearch.toLowerCase());
                        const matchesFilter = prospectFilter === 'all'
                          ? true
                          : prospectFilter === 'assigned' ? !!p.assignedTo : !p.assignedTo;
                        return matchesSearch && matchesFilter;
                      })
                      .map((p) => (
                        <tr key={p.id} className={`hover:bg-white/[0.01] transition-colors ${selectedProjectId === p.id ? 'bg-purple-950/10 border-l-2 border-purple-500' : ''}`}>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-white block">{p.name}</span>
                          </td>
                          <td className="px-4 py-3.5 text-white/40">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-bold text-purple-300">
                            {p.totalLeads}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-2 max-w-[120px] mx-auto">
                              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.progress}%` }} />
                              </div>
                              <span className="font-mono text-[10px] text-emerald-400 font-bold">{p.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {p.assignedTo ? (
                              <span className="rounded bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-emerald-400 font-semibold text-[10px]">
                                {p.assignedTo.name}
                              </span>
                            ) : (
                              <span className="text-white/30 text-[10px] uppercase font-bold italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                selectProjectForLeads(p.id);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white px-2.5 py-1.5 text-[10.5px] font-bold transition"
                            >
                              <span>Manage leads</span>
                              <ChevronRight size={11} />
                            </button>
                            <button
                              onClick={() => {
                                selectProjectForLeads(p.id);
                                triggerAssign('list', p.id);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1.5 text-[10.5px] font-bold transition shadow-sm"
                            >
                              <span>Assign List</span>
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Prospects / Leads table */}
          {selectedProjectId && (() => {
            const filteredLeads = projectLeads.filter(
              l => l.name.toLowerCase().includes(leadSearch.toLowerCase()) || l.company.toLowerCase().includes(leadSearch.toLowerCase())
            );
            const allFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id));
            const someFilteredSelected = filteredLeads.some(l => selectedLeadIds.includes(l.id)) && !allFilteredSelected;

            return (
              <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Prospects inside list</h3>
                    <p className="text-[10px] text-white/40">
                      {selectedLeadIds.length > 0
                        ? <span className="text-purple-300 font-bold">{selectedLeadIds.length} selected</span>
                        : 'Select individual prospects to manually allocate them to staff.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative rounded-xl bg-white/5 border border-white/10 flex items-center px-3.5">
                      <Search size={13} className="text-white/40 mr-2" />
                      <input
                        type="text"
                        placeholder="Search prospects..."
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        className="bg-transparent py-2 text-xs text-white outline-none w-36 placeholder-white/30"
                      />
                    </div>

                    {selectedLeadIds.length > 0 && (
                      <button
                        onClick={() => triggerAssign('leads', selectedLeadIds)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 text-xs font-bold transition shadow-md shadow-purple-500/15"
                      >
                        <UserPlus size={12} />
                        <span>Assign Selected ({selectedLeadIds.length})</span>
                      </button>
                    )}

                    {selectedLeadIds.length > 0 && (
                      <button
                        onClick={() => setSelectedLeadIds([])}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white px-3 py-2 text-xs font-bold transition"
                      >
                        <X size={12} />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
                  <table className="w-full text-left border-collapse text-xs text-white/80">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-4 py-3 text-center w-10">
                          <input
                            type="checkbox"
                            ref={el => {
                              if (el) el.indeterminate = someFilteredSelected;
                            }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Select all filtered leads
                                const filteredIds = filteredLeads.map(l => l.id);
                                setSelectedLeadIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                              } else {
                                // Deselect all filtered leads
                                const filteredIds = new Set(filteredLeads.map(l => l.id));
                                setSelectedLeadIds(prev => prev.filter(id => !filteredIds.has(id)));
                              }
                            }}
                            checked={allFilteredSelected}
                            className="rounded border-white/10 bg-transparent text-purple-600 focus:ring-0 outline-none cursor-pointer"
                            title={allFilteredSelected ? 'Deselect all visible' : 'Select all visible'}
                          />
                        </th>
                        <th className="px-4 py-3">Prospect Details</th>
                        <th className="px-4 py-3">Decision Maker Contact</th>
                        <th className="px-4 py-3">Call status</th>
                        <th className="px-4 py-3">Assigned To</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {projectLeads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-white/30">No prospects available.</td>
                        </tr>
                      ) : filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-white/30">No prospects match your search.</td>
                        </tr>
                      ) : (
                        filteredLeads.map((l) => {
                          const assignedEmp = employees.find(e => e.id === l.userId || e.agentId === l.userId);
                          return (
                            <tr
                              key={l.id}
                              className={`hover:bg-white/[0.01] transition-colors ${
                                selectedLeadIds.includes(l.id) ? 'bg-purple-950/10 border-l-2 border-purple-500/40' : ''
                              }`}
                            >
                              <td className="px-4 py-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedLeadIds.includes(l.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedLeadIds(prev => [...prev, l.id]);
                                    } else {
                                      setSelectedLeadIds(prev => prev.filter(id => id !== l.id));
                                    }
                                  }}
                                  className="rounded border-white/10 bg-transparent text-purple-600 focus:ring-0 outline-none cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-white block">{l.name}</span>
                                  <span className="text-2xs text-white/40 block">{l.company}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 font-mono">
                                <div className="space-y-0.5">
                                  <span className="block text-white/70 font-semibold">{l.phone || 'No Phone'}</span>
                                  <span className="block text-[10px] text-white/40">{l.email || 'No Email'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                  l.status === 'CLOSED' || l.status.includes('Closed') ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' :
                                  l.status.includes('Well') ? 'bg-purple-500/10 border-purple-500/15 text-purple-400' :
                                  l.status.includes('Scheduled') || l.status === 'FOLLOW_UP' ? 'bg-blue-500/10 border-blue-500/15 text-blue-400' :
                                  l.status.includes('Poorly') ? 'bg-yellow-500/10 border-yellow-500/15 text-yellow-400' :
                                  l.status.includes('Failed') || l.status === 'LOST' ? 'bg-red-500/10 border-red-500/15 text-red-400' :
                                  'bg-white/5 border-white/5 text-white/60'
                                }`}>
                                  {l.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                {assignedEmp ? (
                                  <span className="text-emerald-400 font-bold text-[10.5px]">{assignedEmp.name}</span>
                                ) : (
                                  <span className="text-white/30 text-[10px] italic">Unassigned</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedLeadIds([l.id]);
                                    triggerAssign('leads', [l.id]);
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                                  title="Assign Lead"
                                >
                                  <UserPlus size={11} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── EMPLOYEE DIRECTORY TAB ── */}
      {activeTab === 'employees' && (
        <div className="space-y-10 text-left">
          {/* Employee Directory */}
          <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-400" />
                <h2 className="text-lg font-bold text-white">System Employee Directory</h2>
              </div>
              <button
                onClick={openAddEmployeeModal}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 text-xs font-bold transition shadow-md shadow-purple-500/10"
              >
                <Plus size={14} />
                <span>Add Employee Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {employees.length === 0 ? (
                <div className="col-span-full border border-white/5 rounded-2xl bg-white/[0.01] p-12 text-center text-xs text-white/30">
                  No employee profiles registered on platform.
                </div>
              ) : (
                employees.map((emp) => (
                  <div key={emp.id} className="rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 p-5 space-y-4 relative overflow-hidden transition duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-300 font-extrabold text-sm uppercase">
                          {emp.name ? emp.name.charAt(0) : 'E'}
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-white leading-tight">{emp.name}</h3>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded bg-purple-950/40 border border-purple-500/30 px-2 py-0.5 font-mono text-[9px] font-bold text-purple-300">
                              {emp.role?.name || 'AGENT'}
                            </span>
                            {emp.designation && (
                              <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/70">
                                {emp.designation.name}
                              </span>
                            )}
                            {/* Activity badge */}
                            {(() => {
                              const isActiveToday = emp.recentUpdates?.some((u: any) => {
                                const d = new Date(u.createdAt);
                                return d.toDateString() === new Date().toDateString();
                              });
                              return isActiveToday ? (
                                <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                                  ● Active Today
                                </span>
                              ) : (
                                <span className="rounded bg-white/5 border border-white/5 px-2 py-0.5 text-[9px] font-bold text-white/25">
                                  Inactive
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleEmployeeSuspension(emp)}
                          className={`rounded-lg px-2.5 py-1 text-[9.5px] font-extrabold tracking-wider transition ${
                            emp.suspended 
                              ? 'bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/30' 
                              : 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/30'
                          }`}
                        >
                          {emp.suspended ? 'DEACTIVATED' : 'ACTIVE'}
                        </button>

                        <button
                          onClick={() => openEditEmployeeModal(emp)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                          title="Edit Profile"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => deleteEmployee(emp.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-950/20 border border-red-500/20 text-red-300 hover:bg-red-900/30 transition"
                          title="Delete Employee"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Employee stats block */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-white/50 bg-slate-950/40 rounded-xl p-3 border border-white/5 font-sans">
                      <div className="space-y-0.5">
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-white/30">Assigned Prospects</span>
                        <span className="block font-bold text-white font-mono text-xs">{emp.prospectCount || 0} prospects</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-white/30">Dialer Call Target</span>
                        <span className="block font-bold text-white font-mono text-xs">{emp.dailyPlanner?.callsMade || 0} / {emp.dailyPlanner?.callTarget || 0} calls</span>
                      </div>
                      <div className="space-y-0.5 col-span-2 border-t border-white/5 pt-2 mt-1.5">
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-white/30">Latest Daily Update Log</span>
                        <span className="block text-white/70 italic line-clamp-1">
                          {emp.recentUpdates && emp.recentUpdates.length > 0 
                            ? `"${emp.recentUpdates[0].summary}"` 
                            : 'No updates logged today.'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Custom Designation / Role manager */}
          <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-md space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Manage Roles & Designations</h2>
                <p className="text-[10.5px] text-white/40">Create Custom organizational designations (e.g. Sales Agent, Team Lead, Senior Agent) and assign dial permissions.</p>
              </div>

              <button
                onClick={openAddDesignationModal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 py-2.5 px-4 text-xs font-bold transition"
              >
                <Plus size={13} />
                <span>Create Designation</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {designations.length === 0 ? (
                <p className="text-xs text-white/30 italic text-center py-4">No designations configured.</p>
              ) : (
                designations.map((des) => (
                  <div key={des.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/5 bg-white/[0.01] rounded-xl p-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{des.name}</span>
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[8.5px] font-mono text-purple-300 font-bold border border-white/10">
                          Permissions: {des.permissions}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 leading-relaxed font-sans">{des.description || 'No description provided.'}</p>
                    </div>

                    <div className="flex items-center gap-1.5 sm:self-start lg:self-center">
                      <button
                        onClick={() => openEditDesignationModal(des)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                        title="Edit Designation"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => deleteDesignation(des.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-950/20 border border-red-500/20 text-red-300 hover:bg-red-900/30 transition"
                        title="Delete Designation"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PROSPECT ASSIGN MODAL ── */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#060b1b] p-6 space-y-5 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck size={16} className="text-purple-400" />
                <span>Allocate Prospects</span>
              </h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">

              {/* What's being assigned */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1">Assigning</span>
                {assignTargetType === 'list' ? (
                  <span className="text-white font-semibold">
                    Entire list: <span className="text-purple-300">{prospectSummary.find(p => p.id === selectedProjectId)?.name || 'Selected list'}</span>
                  </span>
                ) : (
                  <span className="text-white font-semibold">
                    <span className="text-purple-300">{selectedLeadIds.length}</span> selected prospect{selectedLeadIds.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Current assignment indicator */}
              {currentAssignmentInfo ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3 space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400/70 block">Currently assigned to</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-extrabold text-[9px] uppercase">
                        {currentAssignmentInfo.name.charAt(0)}
                      </div>
                      <span className="text-amber-300 font-bold text-xs">{currentAssignmentInfo.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={confirmUnassign}
                      className="text-[9px] font-bold text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-400/40 bg-red-950/20 hover:bg-red-950/40 rounded-lg px-2 py-1 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/5 bg-white/[0.01] px-4 py-2.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 block">Currently assigned to</span>
                  <span className="text-white/30 text-[10.5px] italic">Unassigned</span>
                </div>
              )}

              {/* Employee selector */}
              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">
                  {currentAssignmentInfo ? 'Reassign to' : 'Assign to'}
                </label>
                <select
                  value={selectedEmployeeForAssign}
                  onChange={(e) => setSelectedEmployeeForAssign(e.target.value)}
                  className="w-full rounded-xl bg-background border border-white/10 px-3.5 py-3 text-xs text-white outline-none focus:border-purple-400 transition"
                >
                  <option value="">Choose an employee...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}
                      style={currentAssignmentInfo?.id === e.id ? { fontWeight: 'bold' } : {}}
                    >
                      {e.name} ({e.designation?.name || 'Agent'}){currentAssignmentInfo?.id === e.id ? ' — current' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="w-1/2 rounded-xl bg-white/5 hover:bg-white/10 py-2.5 text-xs font-bold text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAssignment}
                  disabled={!selectedEmployeeForAssign}
                  className="w-1/2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 text-xs font-bold transition shadow-md shadow-purple-500/10"
                >
                  {currentAssignmentInfo ? 'Reassign' : 'Confirm Assign'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── EMPLOYEE FORM MODAL ── */}
      {employeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#060b1b] p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck size={16} className="text-purple-400" />
                <span>{isEditingEmployee ? 'Modify Employee Profile' : 'Add Employee Profile'}</span>
              </h3>
              <button onClick={() => setEmployeeModalOpen(false)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveEmployee} className="space-y-4">
              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  placeholder="e.g. Jane Agent"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1 flex items-center gap-1">
                  <Mail size={10} />
                  <span>Email Address</span>
                </label>
                <input
                  required
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  placeholder="e.g. email@domain.com"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  placeholder="e.g. 555-0199"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1 flex items-center gap-1">
                  <Lock size={10} />
                  <span>Password {isEditingEmployee && '(leave blank to keep unchanged)'}</span>
                </label>
                <input
                  type="password"
                  required={!isEditingEmployee}
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                  placeholder="Set login password..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Company Role</label>
                  <select
                    value={employeeForm.roleName}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, roleName: e.target.value })}
                    className="w-full rounded-xl bg-background border border-white/10 px-2 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition"
                  >
                    <option value="AGENT">Outbound Agent</option>
                    <option value="TEAMLEADER">Team Leader</option>
                    <option value="EMPLOYEE">Regular Employee</option>
                    <option value="ADMIN">Company Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Designation</label>
                  <select
                    value={employeeForm.designationId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, designationId: e.target.value })}
                    className="w-full rounded-xl bg-background border border-white/10 px-2 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition"
                  >
                    <option value="" disabled>Select Designation...</option>
                    {designations.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {employeeFormStatus && (
                <p className="text-xs text-gold animate-pulse text-center font-semibold">{employeeFormStatus}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmployeeModalOpen(false)}
                  className="w-1/2 rounded-xl bg-white/5 hover:bg-white/10 py-2.5 text-xs font-bold text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white py-2.5 text-xs font-bold transition shadow-md shadow-purple-500/10"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DESIGNATION FORM MODAL ── */}
      {designationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#060b1b] p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-purple-400" />
                <span>{isEditingDesignation ? 'Modify Designation' : 'Create Custom Designation'}</span>
              </h3>
              <button onClick={() => setDesignationModalOpen(false)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveDesignation} className="space-y-4">
              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Designation Name</label>
                <input
                  required
                  type="text"
                  value={designationForm.name}
                  onChange={(e) => setDesignationForm({ ...designationForm, name: e.target.value })}
                  placeholder="e.g. Sales Agent"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={designationForm.description}
                  onChange={(e) => setDesignationForm({ ...designationForm, description: e.target.value })}
                  placeholder="Brief description of responsibilities..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition resize-none"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-white/40 tracking-wider uppercase block mb-1">Permissions Scope</label>
                <input
                  required
                  type="text"
                  value={designationForm.permissions}
                  onChange={(e) => setDesignationForm({ ...designationForm, permissions: e.target.value })}
                  placeholder="e.g. VIEW_OWN,CALL_LEADS"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-400 transition font-mono"
                />
              </div>

              {designationFormStatus && (
                <p className="text-xs text-gold animate-pulse text-center font-semibold">{designationFormStatus}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDesignationModalOpen(false)}
                  className="w-1/2 rounded-xl bg-white/5 hover:bg-white/10 py-2.5 text-xs font-bold text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white py-2.5 text-xs font-bold transition shadow-md shadow-purple-500/10"
                >
                  Save Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
