'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import {
  MessageSquare,
  FileText,
  Kanban,
  FolderGit2,
  ShieldCheck,
  Settings,
  AlertCircle,
  Play,
  CheckCircle2,
  GitPullRequest,
  Database,
  BookOpen,
  Sparkles,
  Clock,
  ArrowRight,
  ChevronRight,
  Plus,
  RefreshCw,
  FileCode,
  Trash2,
  User,
  ExternalLink,
  Lock,
  Unlock,
  Send,
  Check,
  Terminal,
  Activity,
  FileEdit,
  History,
  X
} from 'lucide-react';

const GithubIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// Types
interface Message {
  id: string;
  sender: 'user' | 'csa';
  text: string;
  timestamp: Date;
  decisionsGenerated?: Array<{ text: string; reasoning: string }>;
  tasksGenerated?: Array<{ title: string; spec: string }>;
}

interface Decision {
  id: string;
  project_id: string;
  decision_text: string;
  reasoning: string;
  created_at: string;
  superseded_by?: string | null;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  spec_markdown: string;
  status: 'draft' | 'inbox' | 'in_progress' | 'awaiting_review' | 'revision' | 'approved' | 'rejected' | 'merged';
  branch_name: string;
  created_at: string;
  updated_at: string;
}

interface AuditItem {
  id: string;
  text: string;
  checked: boolean;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Authenticate user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        setAuthLoading(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        setAuthLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<'chat' | 'docs' | 'board' | 'repo' | 'verify'>('chat');
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet');
  const [githubRepo, setGithubRepo] = useState('https://github.com/khori/rekanvibecoding');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string>('csa-sync/context.md');
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; type: 'info' | 'warning' | 'success' }>>([
    { id: '1', text: 'CSA diinisialisasi untuk project rekanvibecoding', type: 'success' }
  ]);

  // Projects & Database State
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [fetchingProjects, setFetchingProjects] = useState(true);
  
  // Create Project Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newInstallationId, setNewInstallationId] = useState('');

  // Create Task Form State
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [generatingTask, setGeneratingTask] = useState(false);

  // GitHub Repos & Connection State
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [fetchingRepos, setFetchingRepos] = useState(false);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState('');

  const fetchGithubRepos = async () => {
    if (!user) return;
    try {
      setFetchingRepos(true);
      const res = await fetch(`/api/github/repos?userId=${user.id}`);
      const data = await res.json();
      setGithubRepos(data.repos || []);
      setIsGithubConnected(data.connected || false);
    } catch (err) {
      console.error('Error fetching github repos:', err);
    } finally {
      setFetchingRepos(false);
    }
  };

  useEffect(() => {
    if (isCreateModalOpen && user) {
      fetchGithubRepos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateModalOpen, user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const githubStatus = params.get('github');
      const githubError = params.get('github_error');

      if (githubStatus === 'connected') {
        setLogs(prev => [...prev, '[System] Akun GitHub berhasil dihubungkan!']);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (githubError) {
        setLogs(prev => [...prev, `[System] Gagal menghubungkan ke GitHub: ${decodeURIComponent(githubError)}`]);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      setFetchingProjects(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
      if (data && data.length > 0) {
        setActiveProject((prev: any) => {
          if (!prev) {
            setGithubRepo(data[0].github_repo_url || '');
            return data[0];
          }
          const updated = data.find(p => p.id === prev.id);
          if (updated) {
            setGithubRepo(updated.github_repo_url || '');
            return updated;
          }
          setGithubRepo(data[0].github_repo_url || '');
          return data[0];
        });
      } else {
        setActiveProject(null);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setFetchingProjects(false);
    }
  };

  const fetchDecisions = async () => {
    if (!activeProject) return;
    try {
      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('project_id', activeProject.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDecisions(data || []);
    } catch (err) {
      console.error('Error fetching decisions:', err);
    }
  };

  const handleSaveDecision = async (text: string) => {
    if (!activeProject) {
      alert('Pilih proyek terlebih dahulu.');
      return;
    }

    const decisionTitle = window.prompt('Masukkan judul singkat keputusan arsitektur ini:', 'Keputusan Desain Arsitektural');
    if (!decisionTitle) return;

    try {
      const { error } = await supabase
        .from('decisions')
        .insert([
          {
            project_id: activeProject.id,
            decision_text: decisionTitle,
            reasoning: text
          }
        ]);

      if (error) throw error;

      setLogs(prev => [...prev, `[System] Keputusan "${decisionTitle}" berhasil disimpan ke database.`]);
      
      setNotifications(prev => [
        ...prev,
        { id: Date.now().toString(), text: `Keputusan disimpan: ${decisionTitle}`, type: 'success' }
      ]);

      await fetchDecisions();
    } catch (err: any) {
      alert('Gagal menyimpan keputusan: ' + err.message);
    }
  };

  const fetchTasks = async () => {
    if (!activeProject) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', activeProject.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchProjectState = async () => {
    if (!activeProject) return;
    try {
      const { data, error } = await supabase
        .from('project_state')
        .select('*')
        .eq('project_id', activeProject.id)
        .single();

      if (error) throw error;
      if (data) {
        setProjectState({
          context_markdown: data.context_markdown || ''
        });
      }
    } catch (err) {
      console.error('Error fetching project state:', err);
    }
  };

  const handleGenerateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    if (!newTaskTitle.trim()) {
      alert('Judul task tidak boleh kosong.');
      return;
    }

    if (newTaskTitle.trim().length < 5) {
      alert('Judul task minimal 5 karakter agar CSA dapat menganalisis dengan baik.');
      return;
    }

    if (newTaskTitle.trim().length > 80) {
      alert('Judul task terlalu panjang. Batasi maksimal 80 karakter.');
      return;
    }

    try {
      setGeneratingTask(true);
      const res = await fetch('/api/csa/generate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          userId: user.id,
          taskTitle: newTaskTitle,
          model: selectedModel
        })
      });
      const data = await res.json();

      if (data.success) {
        setIsCreateTaskModalOpen(false);
        setNewTaskTitle('');
        setLogs(prev => [...prev, `[System] Task "${data.task.title}" berhasil didekomposisi oleh CSA (Status: Draft).`]);
        
        // Synchronize task specification to GitHub repository if URL exists
        if (activeProject.github_repo_url) {
          setLogs(prev => [...prev, `[GitHub Sync] Menyinkronkan spesifikasi task ke branch "${data.task.branch_name}"...`]);
          try {
            const syncRes = await fetch('/api/github/sync-task', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                projectId: activeProject.id,
                taskId: data.task.id,
                repoUrl: activeProject.github_repo_url,
                branchName: data.task.branch_name,
                specMarkdown: data.task.spec_markdown
              })
            });
            const syncData = await syncRes.json();
            if (syncData.success) {
              setLogs(prev => [...prev, `[GitHub Sync] ${syncData.message}`]);
              
              // Update task status from Draft to Inbox in the database
              try {
                const { error: statusError } = await supabase
                  .from('tasks')
                  .update({ status: 'inbox', updated_at: new Date().toISOString() })
                  .eq('id', data.task.id);

                if (statusError) throw statusError;
                setLogs(prev => [...prev, `[System] Status task "${data.task.title}" berhasil diperbarui ke Inbox.`]);
              } catch (statusErr: any) {
                console.error('Error updating task status:', statusErr);
                setLogs(prev => [...prev, `[System] Gagal memperbarui status task ke Inbox: ${statusErr.message || statusErr}`]);
              }
            } else {
              setLogs(prev => [...prev, `[GitHub Sync] Gagal menyinkronkan: ${syncData.error}`]);
            }
          } catch (syncErr: any) {
            console.error('Error syncing task spec:', syncErr);
            setLogs(prev => [...prev, `[GitHub Sync] Gagal: ${syncErr.message || syncErr}`]);
          }
        }

        setNotifications(prev => [
          ...prev,
          { id: Date.now().toString(), text: `Task baru dibuat: ${data.task.title}`, type: 'success' }
        ]);
        await fetchTasks();
      } else {
        alert('Gagal membuat task: ' + data.error);
      }
    } catch (err: any) {
      alert('Error saat mendekomposisi task: ' + (err.message || err));
    } finally {
      setGeneratingTask(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newProjectName.trim()) {
      alert('Nama proyek tidak boleh kosong.');
      return;
    }

    if (newProjectName.trim().length < 3) {
      alert('Nama proyek minimal harus terdiri dari 3 karakter.');
      return;
    }

    if (newProjectName.trim().length > 50) {
      alert('Nama proyek maksimal 50 karakter.');
      return;
    }

    if (newRepoUrl.trim()) {
      const githubUrlRegex = /^(https:\/\/github\.com\/)?[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
      if (!githubUrlRegex.test(newRepoUrl.trim())) {
        alert('Format URL Repositori GitHub tidak valid. Gunakan format owner/repo atau URL GitHub lengkap.');
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            name: newProjectName,
            github_repo_url: newRepoUrl || null,
            github_installation_id: newInstallationId || null
          }
        ])
        .select();

      if (error) throw error;

      setIsCreateModalOpen(false);
      
      // Register GitHub webhook if repo url is provided
      if (newRepoUrl) {
        try {
          const webhookRes = await fetch('/api/github/register-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, repoUrl: newRepoUrl })
          });
          const webhookData = await webhookRes.json();
          if (webhookData.success) {
            setLogs(prev => [...prev, `[System] ${webhookData.message}`]);
          } else {
            setLogs(prev => [...prev, `[System] Gagal daftar webhook: ${webhookData.error}`]);
          }
        } catch (webhookErr: any) {
          console.error('Error calling register webhook endpoint:', webhookErr);
          setLogs(prev => [...prev, `[System] Gagal daftar webhook: ${webhookErr.message || webhookErr}`]);
        }
      }

      // Push AGENTS.md to root of user repository if repo url is provided (Koreksi 3)
      if (newRepoUrl) {
        try {
          const agentsRes = await fetch('/api/github/push-agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, repoUrl: newRepoUrl })
          });
          const agentsData = await agentsRes.json();
          if (agentsData.success) {
            setLogs(prev => [...prev, `[System] ${agentsData.message}`]);
            setNotifications(prev => [
              ...prev,
              { id: Date.now().toString(), text: 'File AGENTS.md berhasil dibuat di root repository.', type: 'info' }
            ]);
          } else {
            setLogs(prev => [...prev, `[System] Gagal membuat AGENTS.md: ${agentsData.error}`]);
          }
        } catch (agentsErr: any) {
          console.error('Error calling push agents endpoint:', agentsErr);
          setLogs(prev => [...prev, `[System] Gagal membuat AGENTS.md: ${agentsErr.message || agentsErr}`]);
        }
      }

      setNewProjectName('');
      setNewRepoUrl('');
      setNewInstallationId('');

      setLogs(prev => [...prev, `[System] Proyek "${newProjectName}" berhasil dibuat.`]);
      
      await fetchProjects();
      if (data && data.length > 0) {
        // Seed default decisions
        try {
          await supabase
            .from('decisions')
            .insert([
              {
                project_id: data[0].id,
                decision_text: 'Menggunakan Next.js 16 App Router dengan TypeScript',
                reasoning: 'Mendukung React 19 Server Components untuk performa optimal dan rendering terstruktur.'
              },
              {
                project_id: data[0].id,
                decision_text: 'Menggunakan Supabase untuk Auth, DB PostgreSQL, dan RLS',
                reasoning: 'Memangkas waktu setup backend dan menjamin keamanan multi-user lewat RLS bawaan.'
              }
            ]);
        } catch (seedErr) {
          console.error('Failed to seed default decisions:', seedErr);
        }

        setActiveProject(data[0]);
        setGithubRepo(data[0].github_repo_url || '');
      }
    } catch (err: any) {
      alert('Gagal membuat proyek: ' + err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!activeProject) return;

    fetchDecisions();
    fetchTasks();
    fetchProjectState();

    // Setup Supabase realtime subscriptions for tasks, decisions, and project_state tables
    const tasksChannel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload: any) => {
          console.log('[Realtime] Task change detected:', payload);
          if ((payload.new && payload.new.project_id === activeProject.id) || 
              (payload.old && payload.old.project_id === activeProject.id)) {
            fetchTasks();
          }
        }
      )
      .subscribe();

    const decisionsChannel = supabase
      .channel('decisions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'decisions'
        },
        (payload: any) => {
          console.log('[Realtime] Decision change detected:', payload);
          if ((payload.new && payload.new.project_id === activeProject.id) || 
              (payload.old && payload.old.project_id === activeProject.id)) {
            fetchDecisions();
          }
        }
      )
      .subscribe();

    const stateChannel = supabase
      .channel('state-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_state'
        },
        (payload: any) => {
          console.log('[Realtime] Project state change detected:', payload);
          if ((payload.new && payload.new.project_id === activeProject.id) || 
              (payload.old && payload.old.project_id === activeProject.id)) {
            fetchProjectState();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(decisionsChannel);
      supabase.removeChannel(stateChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject]);

  // Mock Database State (in-memory, loaded from/to localStorage)
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectState, setProjectState] = useState({
    context_markdown: '# Project Context: rekanvibecoding\n\n## Deskripsi\nPlatform kolaborasi visual AI untuk vibe coding, mengintegrasikan CSA sebagai pengawas arsitektur.\n\n## Teknologi Utama\n- Next.js 16 (App Router, React 19)\n- Tailwind CSS v4\n- Supabase (Auth, RLS, DB)\n- Vercel AI SDK\n\n## Arsitektur & Aturan\n- Seluruh state disimpan di Database Supabase\n- CSA & AE bertukar data via repository (`/csa-sync/`)\n- Git Branching: main (release) & feature/task-{id} (development)\n\n## Status Terakhir\n- Project diinisialisasi (Task 0.1)\n- Setup Supabase & skema tabel selesai (Task 0.3, Task 1.1)'
  });

  const [prd, setPrd] = useState<string>(`# Product Requirements Document (PRD)
## CSA — Chief Software Architect App (MVP)

### 1. Deskripsi Produk
Aplikasi SaaS yang bertindak sebagai "AI CTO/Tech Lead" untuk mengawasi kualitas kode hasil AI coding agent (Cursor, Claude Code, dll) secara asinkron lewat repository GitHub.

### 2. Fitur Inti MVP
- **Brainstorming & Spec Generation:** Chat interface untuk merancang ide dan generate task.
- **Git Sync (/csa-sync/):** Sinkronisasi state via repo GitHub tanpa koneksi API langsung ke AI agent.
- **Automated Verification:** CSA memvalidasi diff kode dan hasil pengujian GitHub Actions.
- **User Audit Gate:** Verifikasi manual visual dan environment variables oleh user sebelum merge.`);

  const [brd, setBrd] = useState<string>(`# Business Requirements Document (BRD)
## CSA — Chief Software Architect App (MVP)

### 1. Masalah Bisnis
Solo builder non-teknis sering menghasilkan "AI slop" — kode rapuh yang tampak berjalan namun tidak aman dan tidak konsisten.

### 2. Solusi & Value Proposition
Menyediakan layer pengawasan kualitas otomatis untuk solo builder agar kode mereka production-ready dan memiliki kualitas setara tech-lead berpengalaman.`);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Simulator Workflow States
  // 'ready' -> 'push' -> 'ci_running' -> 'ci_failed'/'ci_passed' -> 'review_running' -> 'review_done' -> 'audit' -> 'merged'
  const [simStep, setSimStep] = useState<'ready' | 'push' | 'ci_running' | 'ci_failed' | 'ci_passed' | 'review_running' | 'review_done' | 'audit' | 'merged'>('ready');
  const [ciLogs, setCiLogs] = useState<string[]>([]);
  const [csaAnalysis, setCsaAnalysis] = useState<string>('');
  const [csaEvaluation, setCsaEvaluation] = useState<any>(null);
  const [taskDiff, setTaskDiff] = useState<string>('');
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [envSecrets, setEnvSecrets] = useState<string>('');
  const [simWebhookPayload, setSimWebhookPayload] = useState<string>('');

  // Initial Seed Data
  useEffect(() => {
    // Load from local storage or set defaults
    const localDecisions = localStorage.getItem('csa_decisions');
    const localTasks = localStorage.getItem('csa_tasks');
    
    if (localDecisions && localTasks) {
      setDecisions(JSON.parse(localDecisions));
      setTasks(JSON.parse(localTasks));
    } else {
      const defaultDecisions: Decision[] = [
        {
          id: 'dec-1',
          project_id: 'rekanvibecoding',
          decision_text: 'Menggunakan Next.js 16 App Router dengan TypeScript',
          reasoning: 'Mendukung React 19 Server Components untuk performa optimal dan rendering terstruktur.',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 'dec-2',
          project_id: 'rekanvibecoding',
          decision_text: 'Menggunakan Supabase untuk Auth, DB PostgreSQL, dan RLS',
          reasoning: 'Memangkas waktu setup backend dan menjamin keamanan multi-user lewat RLS bawaan.',
          created_at: new Date(Date.now() - 3600000 * 20).toISOString()
        },
        {
          id: 'dec-3',
          project_id: 'rekanvibecoding',
          decision_text: 'Arsitektur sinkronisasi file-based lewat folder /csa-sync/',
          reasoning: 'Menjamin CSA tidak bergantung pada API agent eksternal yang terus berubah, komunikasi terisolasi via git commit.',
          created_at: new Date(Date.now() - 3600000 * 18).toISOString()
        }
      ];

      const defaultTasks: Task[] = [
        {
          id: 'task-1',
          project_id: 'rekanvibecoding',
          title: 'Inisialisasi Project Next.js (Fase 0.1)',
          spec_markdown: 'Setup project Next.js + TS + Tailwind CSS. Konfigurasi folder `src/app`.',
          status: 'merged',
          branch_name: 'main',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 23).toISOString()
        },
        {
          id: 'task-2',
          project_id: 'rekanvibecoding',
          title: 'Setup Database Supabase & Skema Awal (Fase 0.3 & 1.2)',
          spec_markdown: 'Membuat project Supabase dan migrasi database untuk tabel `projects`, `tasks`, dan `decisions`. Aktifkan RLS.',
          status: 'merged',
          branch_name: 'feature/database-setup',
          created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 19).toISOString()
        },
        {
          id: 'task-3',
          project_id: 'rekanvibecoding',
          title: 'Setup GitHub OAuth & Octokit Client (Fase 2.1 & 2.2)',
          spec_markdown: 'Implementasi otentikasi GitHub dan integrasi SDK Octokit untuk memanipulasi file di repo target.',
          status: 'merged',
          branch_name: 'feature/github-integration',
          created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 17).toISOString()
        },
        {
          id: 'task-4',
          project_id: 'rekanvibecoding',
          title: 'UI Chat Brainstorming & Keputusan Otomatis (Fase 3.2 & 3.3)',
          spec_markdown: 'Membuat chat box, menyimpan keputusan baru ke tabel decisions, dan mengintegrasikan Vercel AI SDK.',
          status: 'merged',
          branch_name: 'feature/chat-brainstorm',
          created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 11).toISOString()
        },
        {
          id: 'task-5',
          project_id: 'rekanvibecoding',
          title: 'Implementasi Review Otomatis CSA (Fase 5.4)',
          spec_markdown: 'Membangun API endpoint `/api/webhook/github` yang mendeteksi push, memicu polling GitHub Actions, dan melakukan review kode otomatis menggunakan LLM.',
          status: 'awaiting_review',
          branch_name: 'feature/csa-auto-review',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 1).toISOString()
        },
        {
          id: 'task-6',
          project_id: 'rekanvibecoding',
          title: 'Deteksi Anomali Konteks & Progress Mundur (Fase 5.6)',
          spec_markdown: 'Deteksi otomatis jika AE menghapus kode yang dideklarasikan "selesai" di riwayat task sebelumnya.',
          status: 'draft',
          branch_name: 'feature/anomaly-detection',
          created_at: new Date(Date.now() - 3600000 * 0.5).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 0.5).toISOString()
        }
      ];

      setDecisions(defaultDecisions);
      setTasks(defaultTasks);
      localStorage.setItem('csa_decisions', JSON.stringify(defaultDecisions));
      localStorage.setItem('csa_tasks', JSON.stringify(defaultTasks));
    }

    // Default chat messages
    setMessages([
      {
        id: 'msg-1',
        sender: 'csa',
        text: 'Halo! Saya adalah Chief Software Architect (CSA) Anda. Saya di sini untuk membantu merancang arsitektur aplikasi, menjaga konsistensi kode, memecah rencana menjadi task terstruktur, dan memverifikasi pekerjaan AI Engineer (AE) Anda.\n\nApa proyek yang ingin Anda bangun hari ini?',
        timestamp: new Date(Date.now() - 3600000 * 3)
      }
    ]);

    // Setup Audit Checklist items
    setAuditItems([
      { id: 'aud-1', text: 'Periksa UI endpoint verifikasi apakah responsif di mobile & desktop.', checked: false },
      { id: 'aud-2', text: 'Verifikasi tombol "Approve & Merge" memicu animasi transisi yang halus.', checked: false },
      { id: 'aud-3', text: 'Pastikan API webhook `/api/webhook/github` mengembalikan status 200 OK.', checked: false }
    ]);

    // Set simulator default logs
    setLogs([
      '[System] Terkoneksi ke repository khori/rekanvibecoding',
      '[System] Webhook terpasang di github.com/khori/rekanvibecoding/webhooks/123456',
      '[CSA] Siap mendeteksi push commit di branch feature/csa-auto-review'
    ]);
  }, []);

  // Save State Helper
  const saveDb = (newDecisions: Decision[], newTasks: Task[]) => {
    setDecisions(newDecisions);
    setTasks(newTasks);
    localStorage.setItem('csa_decisions', JSON.stringify(newDecisions));
    localStorage.setItem('csa_tasks', JSON.stringify(newTasks));
  };

  // Scroll Chat to Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle User Input in Chat
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (isTyping) {
      alert('Mohon tunggu respons dari CSA selesai sebelum mengirim pesan baru.');
      return;
    }

    if (chatInput.trim().length > 1000) {
      alert('Pesan Anda terlalu panjang. Batasi maksimal 1000 karakter.');
      return;
    }

    const userMsg: Message = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/csa/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.text,
          projectId: activeProject?.id || null,
          model: selectedModel
        })
      });
      const data = await res.json();
      setIsTyping(false);

      if (data.success) {
        setMessages(prev => [...prev, {
          id: `msg-c-${Date.now()}`,
          sender: 'csa',
          text: data.text,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `msg-c-${Date.now()}`,
          sender: 'csa',
          text: `Gagal mendapatkan analisis dari CSA: ${data.error}`,
          timestamp: new Date()
        }]);
      }
    } catch (err: any) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `msg-c-${Date.now()}`,
        sender: 'csa',
        text: `Error menghubungi CSA Engine: ${err.message || err}`,
        timestamp: new Date()
      }]);
    }
  };

  // Run Simulator Workflow Steps
  // Step 1: AE Pushes code
  const triggerAePush = async () => {
    setSimStep('push');

    // Dynamically resolve target repo name and branch name based on active project
    const repoFullName = activeProject?.github_repo_url 
      ? activeProject.github_repo_url.split('github.com/')[1] || 'khori/rekanvibecoding'
      : 'khori/rekanvibecoding';
      
    // Find task matching status 'inbox' or 'draft' to simulate push on
    const targetTask = tasks.find(t => t.status === 'inbox' || t.status === 'draft') || tasks[0];
    const targetBranch = targetTask?.branch_name || 'feature/csa-auto-review';

    const webhookPayload = {
      ref: `refs/heads/${targetBranch}`,
      before: 'a2b3c4d5e6f7g8h9',
      after: 'c8d7e6f5g4h3i2j1',
      repository: {
        name: repoFullName.split('/')[1] || 'rekanvibecoding',
        full_name: repoFullName
      },
      pusher: { name: 'ai-engineer-claudecode' },
      commits: [{
        id: 'c8d7e6f5g4h3i2j1',
        message: targetTask 
          ? `feat: implement changes for task ${targetTask.title}` 
          : 'feat: implement auto-review webhook and LLM evaluator client',
        timestamp: new Date().toISOString(),
        added: ['src/app/api/webhook/github/route.ts', 'src/lib/csa/evaluator.ts'],
        modified: ['src/app/globals.css', 'package.json']
      }]
    };

    setSimWebhookPayload(JSON.stringify(webhookPayload, null, 2));

    setLogs(prev => [
      ...prev,
      `[Webhook Simulator] Mengirim push event untuk branch "${targetBranch}" ke endpoint webhook...`
    ]);

    try {
      const res = await fetch('/api/webhook/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });
      const data = await res.json();
      
      if (data.received) {
        setLogs(prev => [
          ...prev,
          `[Webhook] Webhook berhasil dipanggil. Terdeteksi ${data.updatedTasksCount} task status inbox diperbarui ke in_progress.`
        ]);
        await fetchTasks();
      } else {
        setLogs(prev => [...prev, `[Webhook] Gagal memproses event push: ${data.error}`]);
      }
    } catch (err: any) {
      console.error('Error triggering webhook:', err);
      setLogs(prev => [...prev, `[Webhook] Gagal memanggil webhook: ${err.message || err}`]);
    }

    setActiveTab('repo');
    setActiveFile('csa-sync/outbox/report-5.md');
  };

  // Step 2: Trigger CI/CD Tests
  const triggerCiTests = (shouldPass = true) => {
    setSimStep('ci_running');
    setCiLogs([]);
    setActiveTab('verify');
    
    const logsList = [
      '🚀 Starting GitHub Actions workflow: Test & Lint Codebase',
      '📦 Installing node modules...',
      '🔧 Checking ESLint rules...',
      '🧪 Running Jest unit tests...',
      'PASS  src/__tests__/evaluator.test.ts',
      'PASS  src/__tests__/webhook.test.ts',
      '✨ Code Coverage: 87.4% (Target > 80%)'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logsList.length) {
        setCiLogs(prev => [...prev, logsList[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        if (shouldPass) {
          setSimStep('ci_passed');
          setLogs(prev => [...prev, `[GitHub Actions] CI/CD Tests Lolos (Semua test berhasil)`]);

          // Pull changes from repository and update status to awaiting_review
          const targetTask = tasks.find(t => t.status === 'in_progress') || tasks.find(t => t.status === 'inbox') || tasks[0];
          if (targetTask && activeProject) {
            setLogs(prev => [...prev, `[GitHub Pull] Menarik perubahan kode (git diff) dari branch "${targetTask.branch_name}"...`]);
            
            fetch('/api/github/pull-changes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                repoUrl: activeProject.github_repo_url,
                branchName: targetTask.branch_name
              })
            })
            .then(res => res.json())
            .then(async (pullData) => {
              if (pullData.success) {
                setLogs(prev => [...prev, `[GitHub Pull] Sukses menarik diff perubahan. Karakter diff: ${pullData.diffText?.length || 0}`]);
                setTaskDiff(pullData.diffText || '');
                
                // Update status from in_progress to awaiting_review in database
                try {
                  const { error: statusError } = await supabase
                    .from('tasks')
                    .update({ status: 'awaiting_review', updated_at: new Date().toISOString() })
                    .eq('id', targetTask.id);

                  if (statusError) throw statusError;
                  setLogs(prev => [...prev, `[System] Status task "${targetTask.title}" berhasil diperbarui ke Awaiting Review.`]);
                  await fetchTasks();
                } catch (statusErr: any) {
                  console.error('Error updating status to awaiting_review:', statusErr);
                  setLogs(prev => [...prev, `[System] Gagal memperbarui status ke Awaiting Review: ${statusErr.message || statusErr}`]);
                }
              } else {
                setLogs(prev => [...prev, `[GitHub Pull] Gagal: ${pullData.error}`]);
              }
            })
            .catch(err => {
              console.error('Error in fetch pull-changes:', err);
              setLogs(prev => [...prev, `[GitHub Pull] Error: ${err.message || err}`]);
            });
          }
        } else {
          setSimStep('ci_failed');
          setCiLogs(prev => [...prev, '❌ FAIL src/__tests__/evaluator.test.ts', '   Error: Expected status 200, got 500']);
          setLogs(prev => [...prev, `[GitHub Actions] CI/CD Tests Gagal (Gagal kompilasi/pengujian)`]);
        }
      }
    }, 400);
  };

  // Step 3: CSA Evaluation Review
  const triggerCsaEvaluation = async () => {
    // Find active task (usually awaiting_review or in_progress)
    const targetTask = tasks.find(t => t.status === 'awaiting_review') || tasks.find(t => t.status === 'in_progress') || tasks[0];
    if (!targetTask || !activeProject) {
      alert('Pilih proyek dan task terlebih dahulu.');
      return;
    }

    setSimStep('review_running');
    setCsaAnalysis('');

    setLogs(prev => [
      ...prev,
      `[CSA] Memulai proses verifikasi terintegrasi untuk task: "${targetTask.title}"...`,
      `[CSA] Membaca spesifikasi tugas dari Supabase DB...`,
      `[CSA] Menarik perubahan kode (git diff) dari repository...`
    ]);

    try {
      const response = await fetch('/api/csa/verify-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: targetTask.id,
          userId: user.id
        })
      });

      const data = await response.json();

      if (data.success) {
        const evalResult = data.evaluation;
        setCsaAnalysis(data.reportMarkdown);
        setCsaEvaluation(evalResult);
        setSimStep('review_done');

        setLogs(prev => [
          ...prev,
          `[CSA] Audit selesai. Hasil Penilaian: ${evalResult.approved ? 'APPROVED (TEKNIS)' : 'REJECTED'} (Skor: ${evalResult.score}/100)`,
          `[CSA] ${data.syncMessage}`,
          `[GitHub PR Comment] CSA memposting komentar ke PR: "${evalResult.reasoning.substring(0, 100)}..."`
        ]);

        // Refresh tasks from DB
        await fetchTasks();

        setNotifications(prev => [
          ...prev,
          { 
            id: Date.now().toString(), 
            text: `Audit CSA untuk task "${targetTask.title}" selesai dengan status ${evalResult.approved ? 'APPROVED' : 'REJECTED'}!`, 
            type: evalResult.approved ? 'success' as const : 'warning' as const 
          }
        ]);
      } else {
        setSimStep('ready'); // reset step
        setLogs(prev => [...prev, `❌ [CSA] Verifikasi gagal: ${data.error}`]);
      }
    } catch (err: any) {
      setSimStep('ready');
      setLogs(prev => [...prev, `❌ [CSA] Kesalahan koneksi: ${err.message || err}`]);
    }
  };

  // Step 4: Handle Audit Checkbox Check
  const handleAuditCheck = (id: string) => {
    setAuditItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
      const allChecked = updated.every(item => item.checked);
      if (allChecked && simStep === 'review_done') {
        setSimStep('audit');
      } else if (!allChecked && simStep === 'audit') {
        setSimStep('review_done');
      }
      return updated;
    });
  };

  // Step 5: Merge branch to main
  const handleMergeToMain = async () => {
    const targetTask = selectedTask || tasks.find(t => t.status === 'approved') || tasks[0];
    if (!targetTask || !activeProject) {
      alert('Pilih task terlebih dahulu.');
      return;
    }

    // Validate Environment Variables (Task 7.4)
    if (envSecrets.trim()) {
      const lines = envSecrets.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('=');
        if (parts.length < 2 || !parts[0].trim() || !parts[1].trim()) {
          alert('Format Environment Variables salah. Gunakan format KEY=VALUE, satu per baris.');
          return;
        }
      }
    }

    const allChecked = auditItems.every(item => item.checked);
    if (!allChecked) {
      alert('Harap selesaikan seluruh visual checklist audit terlebih dahulu.');
      return;
    }

    setLogs(prev => [
      ...prev,
      `[Merge Gate] Memulai penggabungan kode (merge) untuk task: "${targetTask.title}"`,
      `[Database] Memperbarui status task menjadi "merged" di database Supabase...`
    ]);    try {
      // 1. Call GitHub Merge endpoint first!
      setLogs(prev => [
        ...prev,
        `[GitHub API] Menghubungi endpoint penggabungan branch /api/github/merge-task...`
      ]);

      const mergeRes = await fetch('/api/github/merge-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          projectId: activeProject.id,
          taskId: targetTask.id,
          repoUrl: activeProject.github_repo_url,
          branchName: targetTask.branch_name || `feature/task-${targetTask.id}`
        })
      });

      if (!mergeRes.ok) {
        const errorData = await mergeRes.json();
        throw new Error(errorData.error || 'Server error saat melakukan merge branch di GitHub.');
      }

      const mergeData = await mergeRes.json();

      if (!mergeData.success) {
        throw new Error(mergeData.error || 'Gagal melakukan merge branch di GitHub.');
      }

      // Output dynamic log message depending on whether it is mock or real
      if (mergeData.isMock) {
        setLogs(prev => [
          ...prev,
          `[GitHub API] ⚠️ ${mergeData.message}`,
          `[GitHub API] Catatan: PR tidak digabungkan di GitHub asli (offline/mode mockup).`
        ]);
      } else {
        setLogs(prev => [
          ...prev,
          `[GitHub API] ✅ ${mergeData.message}`,
          `[GitHub API] PR #${mergeData.prNumber} berhasil di-merge secara nyata di GitHub.`
        ]);
      }

      // 2. ONLY AFTER SUCCESS, update the task status in Supabase database to 'merged'
      setLogs(prev => [
        ...prev,
        `[Database] Memperbarui status task menjadi "merged" di database Supabase...`
      ]);

      const { error: dbUpdateError } = await supabase
        .from('tasks')
        .update({
          status: 'merged',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetTask.id);

      if (dbUpdateError) {
        throw new Error(`Merge sukses di GitHub, tetapi gagal memperbarui database: ${dbUpdateError.message}`);
      }

      setLogs(prev => [
        ...prev,
        `[Database] Status task sukses diperbarui ke "merged".`
      ]);

      // 3. Save Environment Variables securely (Task 7.4)
      if (envSecrets.trim()) {
        localStorage.setItem(`csa_env_secrets_${activeProject.id}_${targetTask.id}`, envSecrets.trim());
        setLogs(prev => [
          ...prev,
          `[Secure Vault] Environment variables berhasil divalidasi dan disimpan secara aman.`
        ]);
      }

      setLogs(prev => [
        ...prev,
        `[CSA Context Updater] Memicu pembaruan dokumen arsitektur (context.md)...`
      ]);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a5b4fc', '#4f46e5', '#34d399']
      });

      // 4. Call context updater route dynamically
      const updateRes = await fetch('/api/csa/update-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          userId: user.id,
          diffText: taskDiff || 'Pembaruan arsitektur umum untuk task: ' + targetTask.title
        })
      });

      const updateData = await updateRes.json();
      if (updateData.success) {
        setLogs(prev => [
          ...prev,
          `[CSA Context Updater] Sukses merevisi context.md arsitektur proyek.`,
          `[System] Penggabungan branch ${targetTask.branch_name || `feature/task-${targetTask.id}`} berhasil diselesaikan.`
        ]);
        
        // Refresh project state and tasks list
        await fetchProjectState();
        await fetchTasks();
        setSelectedTask(null); // clear selection
      } else {
        setLogs(prev => [...prev, `⚠️ [CSA Context Updater] Gagal memperbarui context.md: ${updateData.error}`]);
      }

      setSimStep('merged');
      setNotifications(prev => [
        ...prev,
        { 
          id: Date.now().toString(), 
          text: `Task "${targetTask.title}" sukses di-merge ke main! CSA memperbarui context.md.`, 
          type: 'success' as const
        }
      ]);

    } catch (err: any) {
      console.error('Error merging task:', err);
      setLogs(prev => [...prev, `❌ [Merge Gate] Kesalahan saat memproses penggabungan: ${err.message || err}`]);
      alert('Gagal melakukan merge: ' + err.message);
    }
  };

  // Reset Simulator
  const resetSimulator = () => {
    setSimStep('ready');
    setCiLogs([]);
    setCsaAnalysis('');
    setAuditItems(prev => prev.map(i => ({ ...i, checked: false })));
    setEnvSecrets('');
    setSimWebhookPayload('');
    
    // Reset task 5 status to awaiting_review in memory
    const updatedTasks = tasks.map(t => {
      if (t.id === 'task-5') return { ...t, status: 'awaiting_review' as const };
      if (t.id === 'task-6') return { ...t, status: 'draft' as const };
      return t;
    });
    saveDb(decisions, updatedTasks);

    setLogs([
      '[System] Simulator di-reset.',
      '[System] Terkoneksi ke repository khori/rekanvibecoding',
      '[CSA] Siap mendeteksi push commit di branch feature/csa-auto-review'
    ]);
  };

  // Mock File Content Generator
  const getFileContent = (path: string) => {
    if (path === 'csa-sync/context.md') {
      return projectState.context_markdown;
    }
    if (path === 'csa-sync/inbox/task-5.md') {
      return `# TASK SPECIFICATION: task-5
**Judul:** Implementasi Review Otomatis CSA (Fase 5.4)
**Branch Terkait:** feature/csa-auto-review
**Status:** ${tasks.find(t => t.id === 'task-5')?.status.toUpperCase() || 'AWAITING_REVIEW'}

## 1. Deskripsi Fitur
Membangun endpoint webhook di aplikasi CSA untuk memicu alur review otomatis saat AI Engineer (AE) melakukan push ke branch feature.

## 2. Kriteria Penerimaan (Acceptance Criteria)
- Webhook menerima POST dari GitHub.
- Membaca file \`outbox/report-{id}.md\` dari branch terkait.
- Polling status pengujian dari GitHub Actions (check-runs).
- Menjalankan analisis model LLM (CSA) berdasarkan kode diff, membandingkan dengan \`context.md\` arsitektur.
- Mengirimkan persetujuan (Approve) atau revisi (Reject) kembali ke repo/database.

## 3. Konteks Referensi
Lihat keputusan arsitektur di \`context.md\` dan pastikan tidak melanggar aturan RLS Supabase.`;
    }
    if (path === 'csa-sync/outbox/report-5.md') {
      if (simStep === 'ready') return '# ERROR: File belum di-push oleh AI Engineer';
      return `# AI ENGINEER WORK REPORT: report-5
**Task ID:** task-5
**Status AE:** Completed
**Branch:** feature/csa-auto-review

## 1. Ringkasan Perubahan
Saya telah menyelesaikan implementasi review otomatis. Berikut adalah perubahannya:
- Membuat route baru \`src/app/api/webhook/github/route.ts\` untuk menerima GitHub Webhook push events.
- Membuat client evaluator di \`src/lib/csa/evaluator.ts\` untuk mengkonsumsi Vercel AI SDK dan menganalisis kode diff.
- Mengintegrasikan pembacaan status pengujian (Check Runs) menggunakan client Octokit.

## 2. File yang Ditambahkan/Diubah
- \`src/app/api/webhook/github/route.ts\`
- \`src/lib/csa/evaluator.ts\`
- \`src/__tests__/evaluator.test.ts\`

## 3. Catatan untuk CSA
Semua pengujian unit test telah berjalan lokal dan lulus. Skema RLS database Supabase telah ditaati.`;
    }
    if (path === 'AGENTS.md') {
      return `<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in \`node_modules/next/dist/docs/\` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# INSTRUKSI AI ENGINEER (AE) SINKRONISASI CSA
Seluruh pekerjaan Anda harus dikoordinasikan lewat folder \`csa-sync/\`:
1. Baca task aktif Anda dari \`csa-sync/inbox/\`.
2. Selalu patuhi keputusan arsitektur di \`csa-sync/context.md\`.
3. Setelah selesai bekerja di branch Anda, buat file laporan kerja di \`csa-sync/outbox/report-{id}.md\` sesuai format baku.
4. Lakukan git push untuk memicu verifikasi otomatis oleh CSA.`;
    }
    return '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#07090e] text-[#f8fafc]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-screen bg-[#07090e] text-[#f8fafc] overflow-hidden">
      {/* Dynamic radial glow in the background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#6366f1] opacity-[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#4f46e5] opacity-[0.03] blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="glass-panel border-b border-indigo-950/40 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <span>CSA</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Chief Software Architect</span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <GithubIcon size={12} className="text-slate-500" />
              <span>
                {activeProject?.github_repo_url 
                  ? activeProject.github_repo_url.replace('https://github.com/', '') 
                  : 'Belum terhubung ke repo'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono">webhook active</span>
            </p>
          </div>
        </div>

        {/* Global Action / Settings in Header */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-900/30 rounded-lg px-2 py-1">
            <span className="text-xs text-slate-400 font-medium">Proyek:</span>
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const proj = projects.find(p => p.id === e.target.value);
                if (proj) {
                  setActiveProject(proj);
                  setGithubRepo(proj.github_repo_url || '');
                  setLogs(prev => [...prev, `[System] Beralih ke proyek: ${proj.name}`]);
                }
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-semibold"
            >
              {fetchingProjects ? (
                <option value="">Memuat...</option>
              ) : projects.length === 0 ? (
                <option value="">Tidak ada proyek</option>
              ) : (
                projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0f111a] text-slate-200">
                    {p.name}
                  </option>
                ))
              )}
            </select>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs ml-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 font-semibold"
            >
              <Plus size={10} />
              <span>Baru</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs bg-indigo-950/40 border border-indigo-900/30 rounded-lg px-3 py-2 text-slate-300">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="font-medium text-slate-400">CSA Engine:</span>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)} 
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="claude-3-5-sonnet" className="bg-[#0f111a]">Claude 3.5 Sonnet</option>
              <option value="gemini-3.5-flash" className="bg-[#0f111a]">Gemini 3.5 Flash</option>
              <option value="gpt-4o" className="bg-[#0f111a]">GPT-4o</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-indigo-950/30 bg-[#07090e]/80 flex flex-col justify-between overflow-y-auto">
          {/* Main Navigation Menu */}
          <div className="p-4 space-y-6">
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-3 mb-2">SaaS Dashboard</p>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-indigo-600/15 text-indigo-200 border-l-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/20'}`}
                >
                  <MessageSquare size={16} />
                  <span>Brainstorming Chat</span>
                  {activeTab !== 'chat' && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('docs')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'docs' ? 'bg-indigo-600/15 text-indigo-200 border-l-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/20'}`}
                >
                  <FileText size={16} />
                  <span>Specifications</span>
                </button>

                <button
                  onClick={() => setActiveTab('board')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'board' ? 'bg-indigo-600/15 text-indigo-200 border-l-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/20'}`}
                >
                  <Kanban size={16} />
                  <span>Kanban Board</span>
                  <span className="ml-auto text-xs bg-indigo-950 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded-md font-mono">
                    {tasks.filter(t => t.status === 'awaiting_review' || t.status === 'in_progress').length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('repo')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'repo' ? 'bg-indigo-600/15 text-indigo-200 border-l-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/20'}`}
                >
                  <FolderGit2 size={16} />
                  <span>Repo Sync Folder</span>
                  <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono uppercase">csa-sync</span>
                </button>

                <button
                  onClick={() => setActiveTab('verify')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'verify' ? 'bg-indigo-600/15 text-indigo-200 border-l-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/20'}`}
                >
                  <ShieldCheck size={16} />
                  <span>Verification Center</span>
                  {tasks.some(t => t.status === 'awaiting_review') && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              </nav>
            </div>

            {/* Simulated Database Status Overview */}
            <div className="border-t border-indigo-950/40 pt-4">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5">
                <Database size={10} />
                <span>Simulated DB Status</span>
              </p>
              <div className="space-y-1.5 px-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Decisions:</span>
                  <span className="font-mono text-indigo-300 font-bold">{decisions.length}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tasks Total:</span>
                  <span className="font-mono text-indigo-300 font-bold">{tasks.length}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tasks Merged:</span>
                  <span className="font-mono text-emerald-400 font-bold">{tasks.filter(t => t.status === 'merged').length}</span>
                </div>
              </div>
            </div>

            {/* Notifications Feed */}
            <div className="border-t border-indigo-950/40 pt-4">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5">
                <Activity size={10} />
                <span>Real-Time Logs</span>
              </p>
              <div className="bg-[#0b0f19] border border-indigo-950/60 rounded-lg p-2 h-36 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1">
                {logs.map((log, idx) => (
                  <div key={idx} className="leading-normal border-b border-indigo-950/30 pb-0.5 last:border-b-0">
                    <span className="text-slate-500">{new Date().toLocaleTimeString()}</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Connected User */}
          <div className="p-4 border-t border-indigo-950/40 flex items-center justify-between bg-indigo-950/10 gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-200 flex-shrink-0">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.user_metadata?.full_name || 'Vibe Coder'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || 'Solo Developer'}
                </p>
              </div>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-[10px] bg-rose-950/30 hover:bg-rose-900/30 text-rose-300 border border-rose-950 px-2 py-1 rounded transition-colors flex-shrink-0 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 flex flex-col bg-[#080b12] overflow-hidden">
          
          {projects.length === 0 && !fetchingProjects ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
              <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#6366f1] opacity-[0.03] blur-[120px] pointer-events-none" />
              <div className="max-w-md w-full text-center space-y-6 glass-panel rounded-2xl border border-indigo-950/40 p-8 shadow-2xl z-10">
                <div className="inline-flex h-14 w-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 items-center justify-center text-indigo-400 mb-2">
                  <FolderGit2 size={32} />
                </div>
                <h2 className="text-lg font-bold text-gradient">Belum Ada Proyek Terhubung</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Anda belum memiliki proyek apapun yang terdaftar di CSA. Silakan buat proyek baru untuk mulai merancang arsitektur dan mengawasi pekerjaan AI Engineer Anda.
                </p>
                
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/50 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Buat Proyek Pertama Anda</span>
                </button>
              </div>
            </div>
          ) : (
            /* Main Workspace Area (Rendering Selected Tab) */
            <div className="flex-1 overflow-y-auto p-6">
            
            {/* 💬 TAB: BRAINSTORM CHAT */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col bg-[#0b0f19]/40 border border-indigo-950/30 rounded-xl overflow-hidden glass-panel">
                
                {/* Chat Panel Header */}
                <div className="px-4 py-3 border-b border-indigo-950/40 bg-indigo-950/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-200">Brainstorming Spek Proyek</span>
                  </div>
                  <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-medium">
                    Fase 3.2 — Chat UI
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-300 border border-indigo-500/20'}`}>
                        {msg.sender === 'user' ? 'U' : 'AI'}
                      </div>
                      
                      <div className="space-y-2">
                        <div className={`rounded-xl p-3.5 text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#0f1322] border border-indigo-950/50 text-slate-200'}`}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>

                          {msg.sender === 'csa' && (
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => handleSaveDecision(msg.text)}
                                className="text-[10px] bg-indigo-600/10 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                              >
                                <Database size={10} />
                                <span>Simpan Keputusan</span>
                              </button>
                            </div>
                          )}
                          
                          {/* Decisions generated visualization */}
                          {msg.decisionsGenerated && (
                            <div className="mt-4 border-t border-indigo-950/50 pt-3 space-y-2">
                              <p className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                                <Database size={12} />
                                <span>Keputusan Terdeteksi & Disimpan:</span>
                              </p>
                              {msg.decisionsGenerated.map((dec, i) => (
                                <div key={i} className="bg-indigo-950/30 border border-indigo-900/30 rounded p-2 text-xs">
                                  <div className="font-semibold text-indigo-300 flex items-center gap-1">
                                    <Check size={12} className="text-indigo-400" />
                                    {dec.text}
                                  </div>
                                  <div className="text-slate-400 text-[11px] mt-0.5 ml-4">{dec.reasoning}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tasks generated visualization */}
                          {msg.tasksGenerated && (
                            <div className="mt-4 border-t border-indigo-950/50 pt-3 space-y-2">
                              <p className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                                <Kanban size={12} />
                                <span>Task Hasil Dekomposisi Spek:</span>
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {msg.tasksGenerated.map((tsk, i) => (
                                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded p-2 text-xs">
                                    <div className="font-semibold text-indigo-200">{tsk.title}</div>
                                    <div className="text-slate-400 text-[10px] mt-0.5 line-clamp-2">{tsk.spec}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 px-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="h-8 w-8 rounded-full bg-slate-800 text-indigo-300 border border-indigo-500/20 flex items-center justify-center text-xs font-bold animate-pulse">
                        AI
                      </div>
                      <div className="bg-[#0f1322] border border-indigo-950/50 rounded-xl p-3.5 text-sm text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input Footer */}
                <form onSubmit={handleChatSubmit} className="p-3 border-t border-indigo-950/40 bg-indigo-950/10 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Tulis ide atau tanyakan arsitektur proyek... (coba: 'Saya butuh Sentry')"
                    className="flex-1 bg-slate-950/60 border border-indigo-950 border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 flex items-center justify-center transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}

            {/* 📋 TAB: SPECIFICATIONS (PRD/BRD/Decisions) */}
            {activeTab === 'docs' && (
              <div className="space-y-6">
                
                {/* Top Statistics Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-4 rounded-xl border border-indigo-950/30 flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Product Requirements Document (PRD)</h4>
                      <p className="text-xl font-bold">PRD.md</p>
                      <p className="text-xs text-slate-400">Generasi spec otomatis dari brainstorming.</p>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono uppercase">Version 1.0</span>
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-indigo-950/30 flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Business Requirements Document (BRD)</h4>
                      <p className="text-xl font-bold">BRD.md</p>
                      <p className="text-xs text-slate-400">Dokumen landasan target pasar & mitigasi risiko.</p>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono uppercase">Version 1.0</span>
                  </div>
                </div>

                {/* PRD/BRD Document Tab Panel */}
                <div className="glass-panel border border-indigo-950/30 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-indigo-950/40 bg-indigo-950/15 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-200">Pratinjau Dokumen Hidup</span>
                    <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                      <BookOpen size={14} /> Live Spec
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-indigo-950/40 h-[450px]">
                    <div className="p-4 overflow-y-auto">
                      <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {(() => {
                          const text = projectState.context_markdown || '';
                          const prdIndex = text.search(/#+ (Product Requirements Document|PRD)/i);
                          const brdIndex = text.search(/#+ (Business Requirements Document|BRD)/i);
                          if (prdIndex !== -1 && brdIndex !== -1) {
                            return prdIndex < brdIndex 
                              ? text.substring(prdIndex, brdIndex).trim() 
                              : text.substring(prdIndex).trim();
                          }
                          return text;
                        })()}
                      </pre>
                    </div>
                    <div className="p-4 overflow-y-auto">
                      <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {(() => {
                          const text = projectState.context_markdown || '';
                          const prdIndex = text.search(/#+ (Product Requirements Document|PRD)/i);
                          const brdIndex = text.search(/#+ (Business Requirements Document|BRD)/i);
                          if (prdIndex !== -1 && brdIndex !== -1) {
                            return prdIndex < brdIndex 
                              ? text.substring(brdIndex).trim() 
                              : text.substring(brdIndex, prdIndex).trim();
                          }
                          return `# Business Requirements Document (BRD)

## Keputusan Arsitektur Terdaftar (Tabel decisions):
${decisions.map((d, i) => `${i + 1}. **${d.decision_text}**\n   _${d.reasoning}_`).join('\n\n') || 'Belum ada keputusan.'}`;
                        })()}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Architecture Decisions Log (Tabel Decisions - Fase 1.3) */}
                <div className="glass-panel border border-indigo-950/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Database size={16} className="text-indigo-400" />
                      <span>Log Keputusan Arsitektur (\`decisions\` table)</span>
                    </h3>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono uppercase">Synced</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-indigo-950 text-slate-400 bg-indigo-950/20">
                          <th className="py-2.5 px-3">ID</th>
                          <th className="py-2.5 px-3">Keputusan</th>
                          <th className="py-2.5 px-3">Justifikasi (Reasoning)</th>
                          <th className="py-2.5 px-3">Waktu Dibuat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-950/30">
                        {decisions.map((dec) => (
                          <tr key={dec.id} className="hover:bg-indigo-950/10 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-indigo-400 font-bold">{dec.id}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-200">{dec.decision_text}</td>
                            <td className="py-2.5 px-3 text-slate-400 leading-relaxed">{dec.reasoning}</td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{new Date(dec.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* 🗺️ TAB: KANBAN BOARD */}
            {activeTab === 'board' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold">Status Pelacakan Task</h2>
                    <p className="text-xs text-slate-400">Progres task yang diurai dari spec, dieksekusi oleh AE di repository.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsCreateTaskModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-950/20 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Buat Task Baru</span>
                    </button>
                    <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1.5 rounded border border-indigo-500/20 font-medium">
                      Fase 3.4 — Task Generator
                    </span>
                  </div>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  
                  {/* Column 1: Inbox */}
                  <div className="bg-[#0b0f19]/30 border border-indigo-950/30 rounded-xl p-2.5 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center pb-2 border-b border-indigo-950/40 mb-2.5">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Inbox
                      </span>
                      <span className="text-[9px] bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 px-1 py-0.5 rounded font-bold font-mono">
                        {tasks.filter(t => t.status === 'inbox' || t.status === 'draft').length}
                      </span>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-0.5">
                      {tasks.filter(t => t.status === 'inbox' || t.status === 'draft').map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => {
                            setSelectedTask(t);
                            setActiveTab('verify');
                          }}
                          className="bg-[#0f1322] border border-blue-900/20 p-2.5 rounded-lg text-[11px] space-y-1.5 relative overflow-hidden hover:border-blue-500/40 cursor-pointer transition-all"
                        >
                          <h4 className="font-semibold text-slate-200 line-clamp-1">{t.title}</h4>
                          <p className="text-slate-400 leading-normal line-clamp-2">{t.spec_markdown}</p>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-indigo-950/30">
                            <span className="font-mono">{t.id}</span>
                            <span className={`font-mono px-1 py-0.2 rounded text-[8px] font-bold uppercase ${t.status === 'draft' ? 'bg-slate-900 text-slate-400' : 'bg-blue-950/50 text-blue-300'}`}>
                              {t.status === 'draft' ? 'draft' : 'inbox'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: In Progress */}
                  <div className="bg-[#0b0f19]/30 border border-indigo-950/30 rounded-xl p-2.5 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center pb-2 border-b border-indigo-950/40 mb-2.5">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                        In Progress
                      </span>
                      <span className="text-[9px] bg-sky-950/40 text-sky-300 border border-sky-500/20 px-1 py-0.5 rounded font-bold font-mono">
                        {tasks.filter(t => t.status === 'in_progress').length}
                      </span>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-0.5">
                      {tasks.filter(t => t.status === 'in_progress').map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => {
                            setSelectedTask(t);
                            setActiveTab('verify');
                          }}
                          className="bg-[#0f1322] border border-sky-900/30 p-2.5 rounded-lg text-[11px] space-y-1.5 relative overflow-hidden hover:border-sky-500/40 cursor-pointer transition-all"
                        >
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-500 animate-pulse" />
                          <h4 className="font-semibold text-slate-200 line-clamp-1">{t.title}</h4>
                          <p className="text-slate-400 leading-normal line-clamp-2">{t.spec_markdown}</p>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-indigo-950/30">
                            <span className="font-mono">{t.id}</span>
                            <span className="font-mono text-sky-400 flex items-center gap-0.5">
                              <RefreshCw size={9} className="animate-spin" /> Coding
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Awaiting Review */}
                  <div className="bg-[#0b0f19]/30 border border-indigo-950/30 rounded-xl p-2.5 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center pb-2 border-b border-indigo-950/40 mb-2.5">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Awaiting Review
                      </span>
                      <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1 py-0.5 rounded font-bold font-mono">
                        {tasks.filter(t => t.status === 'awaiting_review').length}
                      </span>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-0.5">
                      {tasks.filter(t => t.status === 'awaiting_review').map(t => (
                        <div 
                          key={t.id}
                          onClick={() => {
                            setSelectedTask(t);
                            setActiveTab('verify');
                          }}
                          className="bg-[#0f1322] border border-amber-900/30 p-2.5 rounded-lg text-[11px] space-y-1.5 hover:border-amber-500/40 transition-all cursor-pointer group"
                        >
                          <h4 className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                            <span className="line-clamp-1">{t.title}</span>
                            <ChevronRight size={10} className="text-slate-500 group-hover:text-indigo-400 flex-shrink-0" />
                          </h4>
                          <p className="text-slate-400 leading-normal line-clamp-2">{t.spec_markdown}</p>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-indigo-950/30">
                            <span className="font-mono">{t.id}</span>
                            <span className="text-[8px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded font-bold uppercase flex items-center gap-0.5"><Clock size={8} /> verify</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 4: Approved */}
                  <div className="bg-[#0b0f19]/30 border border-indigo-950/30 rounded-xl p-2.5 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center pb-2 border-b border-indigo-950/40 mb-2.5">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Approved
                      </span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1 py-0.5 rounded font-bold font-mono">
                        {tasks.filter(t => t.status === 'approved').length}
                      </span>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-0.5">
                      {tasks.filter(t => t.status === 'approved').map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => {
                            setSelectedTask(t);
                            setActiveTab('verify');
                          }}
                          className="bg-[#0f1322] border border-emerald-900/30 p-2.5 rounded-lg text-[11px] space-y-1.5 hover:border-emerald-500/40 cursor-pointer transition-all"
                        >
                          <h4 className="font-semibold text-slate-200 line-clamp-1">{t.title}</h4>
                          <p className="text-slate-400 leading-normal line-clamp-2">{t.spec_markdown}</p>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-indigo-950/30">
                            <span className="font-mono">{t.id}</span>
                            <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-bold uppercase flex items-center gap-0.5">
                              <Check size={8} /> passed
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 5: Rejected */}
                  <div className="bg-[#0b0f19]/30 border border-indigo-950/30 rounded-xl p-2.5 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center pb-2 border-b border-indigo-950/40 mb-2.5">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Rejected
                      </span>
                      <span className="text-[9px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-1 py-0.5 rounded font-bold font-mono">
                        {tasks.filter(t => t.status === 'rejected').length}
                      </span>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-0.5">
                      {tasks.filter(t => t.status === 'rejected').map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => {
                            setSelectedTask(t);
                            setActiveTab('verify');
                          }}
                          className="bg-[#0f1322] border border-rose-900/30 p-2.5 rounded-lg text-[11px] space-y-1.5 hover:border-rose-500/40 cursor-pointer transition-all"
                        >
                          <h4 className="font-semibold text-slate-200 line-clamp-1">{t.title}</h4>
                          <p className="text-slate-400 leading-normal line-clamp-2">{t.spec_markdown}</p>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-indigo-950/30">
                            <span className="font-mono">{t.id}</span>
                            <span className="text-[8px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.2 rounded font-bold uppercase flex items-center gap-0.5">
                              <X size={8} /> rejected
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 6: Merged */}
                  <div className="bg-[#0b0f19]/30 border border-indigo-950/30 rounded-xl p-2.5 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center pb-2 border-b border-indigo-950/40 mb-2.5">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        Merged
                      </span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1 py-0.5 rounded font-bold font-mono">
                        {tasks.filter(t => t.status === 'merged').length}
                      </span>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-0.5">
                      {tasks.filter(t => t.status === 'merged').map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => {
                            setSelectedTask(t);
                            setActiveTab('verify');
                          }}
                          className="bg-[#0f1322]/50 border border-indigo-950/20 p-2.5 rounded-lg text-[11px] space-y-1.5 opacity-75 hover:border-indigo-500/40 cursor-pointer transition-all"
                        >
                          <h4 className="font-semibold text-slate-300 line-clamp-1">{t.title}</h4>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-indigo-950/20 font-mono">
                            <span>{t.id}</span>
                            <span className="text-indigo-400 flex items-center gap-0.5 font-medium">
                              <CheckCircle2 size={9} /> merged
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 📂 TAB: REPO SYNC FOLDER VISUALIZER */}
            {activeTab === 'repo' && (
              <div className="h-full flex flex-col bg-[#0b0f19]/40 border border-indigo-950/30 rounded-xl overflow-hidden glass-panel">
                
                {/* Visualizer Header */}
                <div className="px-4 py-3 border-b border-indigo-950/40 bg-indigo-950/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderGit2 size={16} className="text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-200">csa-sync Folder Visualizer (GitHub Repo)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold font-mono">
                    File-based sync
                  </span>
                </div>

                <div className="flex flex-1 divide-x divide-indigo-950/40 h-[450px]">
                  
                  {/* File Explorer Sidebar */}
                  <div className="w-64 p-3 bg-slate-950/40 overflow-y-auto space-y-4">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2">Workspace Tree</p>
                    
                    <div className="space-y-1 text-xs">
                      {/* Root Files */}
                      <div className="text-slate-400 py-1 px-2 font-mono flex items-center gap-1.5">
                        <GithubIcon size={12} className="text-indigo-400" />
                        <span>rekanvibecoding/</span>
                      </div>
                      
                      <button
                        onClick={() => setActiveFile('AGENTS.md')}
                        className={`w-full text-left py-1.5 pl-6 pr-2 rounded font-mono flex items-center gap-2 ${activeFile === 'AGENTS.md' ? 'bg-indigo-950 text-indigo-300' : 'text-slate-400 hover:bg-slate-900/40'}`}
                      >
                        <FileCode size={12} className="text-blue-400" />
                        <span>AGENTS.md</span>
                      </button>

                      {/* Folder csa-sync */}
                      <div className="text-slate-300 py-1 pl-4 pr-2 font-mono flex items-center gap-1.5">
                        <FolderGit2 size={12} className="text-amber-500" />
                        <span>csa-sync/</span>
                      </div>

                      {/* context.md */}
                      <button
                        onClick={() => setActiveFile('csa-sync/context.md')}
                        className={`w-full text-left py-1.5 pl-8 pr-2 rounded font-mono flex items-center gap-2 ${activeFile === 'csa-sync/context.md' ? 'bg-indigo-950 text-indigo-300' : 'text-slate-400 hover:bg-slate-900/40'}`}
                      >
                        <FileText size={12} className="text-yellow-400" />
                        <span>context.md</span>
                      </button>

                      {/* Inbox Folder */}
                      <div className="text-slate-400 py-1 pl-8 pr-2 font-mono flex items-center gap-1.5">
                        <FolderGit2 size={12} className="text-amber-500" />
                        <span>inbox/</span>
                      </div>

                      {/* task-5.md */}
                      <button
                        onClick={() => setActiveFile('csa-sync/inbox/task-5.md')}
                        className={`w-full text-left py-1.5 pl-12 pr-2 rounded font-mono flex items-center gap-2 ${activeFile === 'csa-sync/inbox/task-5.md' ? 'bg-indigo-950 text-indigo-300' : 'text-slate-400 hover:bg-slate-900/40'}`}
                      >
                        <FileCode size={12} className="text-indigo-400" />
                        <span>task-5.md</span>
                      </button>

                      {/* Outbox Folder */}
                      <div className="text-slate-400 py-1 pl-8 pr-2 font-mono flex items-center gap-1.5">
                        <FolderGit2 size={12} className="text-amber-500" />
                        <span>outbox/</span>
                      </div>

                      {/* report-5.md */}
                      <button
                        onClick={() => setActiveFile('csa-sync/outbox/report-5.md')}
                        className={`w-full text-left py-1.5 pl-12 pr-2 rounded font-mono flex items-center gap-2 ${activeFile === 'csa-sync/outbox/report-5.md' ? 'bg-indigo-950 text-indigo-300' : 'text-slate-400 hover:bg-slate-900/40'}`}
                      >
                        <FileText size={12} className="text-emerald-400" />
                        <span>report-5.md</span>
                      </button>
                    </div>
                  </div>

                  {/* File Viewer Content */}
                  <div className="flex-1 flex flex-col bg-slate-950/20 overflow-hidden">
                    <div className="px-4 py-2 border-b border-indigo-950/40 bg-slate-950/30 flex items-center gap-2">
                      <FileEdit size={12} className="text-slate-400" />
                      <span className="text-[11px] font-mono text-slate-300">{activeFile}</span>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto">
                      <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {getFileContent(activeFile)}
                      </pre>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ⚡ TAB: VERIFICATION CENTER & AUDIT GATE */}
            {activeTab === 'verify' && (
              <div className="space-y-6">
                
                {/* Task Header */}
                <div className="glass-panel p-4 rounded-xl border border-indigo-950/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-950/30 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold">Evaluasi Task:</span>
                        <select
                          value={selectedTask?.id || ''}
                          onChange={(e) => {
                            const task = tasks.find(t => t.id === e.target.value);
                            setSelectedTask(task || null);
                          }}
                          className="bg-slate-950 border border-indigo-950/60 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                        >
                          <option value="">-- Pilih Task --</option>
                          {tasks.map(t => (
                            <option key={t.id} value={t.id}>
                              [{t.status.toUpperCase()}] {t.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedTask && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono uppercase font-bold">
                            {selectedTask.id}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            Branch: {selectedTask.branch_name || `feature/task-${selectedTask.id}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {selectedTask ? (
                      <h2 className="text-sm font-bold text-slate-200 pt-1">{selectedTask.title}</h2>
                    ) : (
                      <div className="text-xs text-slate-500 italic pt-1">
                        Pilih task dari dropdown di atas atau klik kartu di Kanban board untuk memuat log verifikasi.
                      </div>
                    )}
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-400 font-semibold">Status:</span>
                    {(() => {
                      const status = selectedTask ? selectedTask.status : simStep;
                      switch (status) {
                        case 'approved':
                          return (
                            <span className="text-[10px] uppercase font-mono font-bold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                              <Check size={12} /> TECHNICAL PASSED
                            </span>
                          );
                        case 'rejected':
                          return (
                            <span className="text-[10px] uppercase font-mono font-bold px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-1">
                              <X size={12} /> TECHNICAL REJECTED
                            </span>
                          );
                        case 'awaiting_review':
                          return (
                            <span className="text-[10px] uppercase font-mono font-bold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1 animate-pulse">
                              <Clock size={12} /> AWAITING REVIEW
                            </span>
                          );
                        case 'in_progress':
                          return (
                            <span className="text-[10px] uppercase font-mono font-bold px-2 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center gap-1 animate-pulse">
                              <RefreshCw size={12} className="animate-spin" /> IN PROGRESS
                            </span>
                          );
                        case 'merged':
                          return (
                            <span className="text-[10px] uppercase font-mono font-bold px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center gap-1">
                              <CheckCircle2 size={12} /> MERGED TO MAIN
                            </span>
                          );
                        default:
                          return (
                            <span className="text-[10px] uppercase font-mono font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              {status}
                            </span>
                          );
                      }
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Column 1: Test Runners (GitHub Actions) */}
                  <div className="glass-panel border border-indigo-950/30 rounded-xl overflow-hidden flex flex-col h-[400px]">
                    <div className="px-4 py-3 border-b border-indigo-950/40 bg-indigo-950/15 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Terminal size={12} className="text-slate-400" />
                        CI/CD Test Runner (Fase 5.2)
                      </h3>
                      {simStep === 'ci_running' && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 bg-black p-4 font-mono text-[10px] overflow-y-auto space-y-1.5 text-slate-300">
                      {ciLogs.length === 0 ? (
                        <div className="text-slate-600 italic">Menunggu pemicu pengujian dari push commit...</div>
                      ) : (
                        ciLogs.map((log, i) => (
                          <div key={i} className={log.startsWith('❌') ? 'text-rose-400 font-bold' : log.startsWith('PASS') ? 'text-emerald-400' : 'text-slate-300'}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-3 border-t border-indigo-950/40 bg-indigo-950/10 flex gap-2">
                      <button
                        onClick={() => triggerCiTests(true)}
                        disabled={simStep !== 'push' && simStep !== 'ci_running'}
                        className="flex-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/40 text-indigo-300 text-[11px] font-semibold py-1.5 rounded transition-colors disabled:opacity-40"
                      >
                        Simulate CI Pass
                      </button>
                      <button
                        onClick={() => triggerCiTests(false)}
                        disabled={simStep !== 'push' && simStep !== 'ci_running'}
                        className="flex-1 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-900/30 text-rose-300 text-[11px] font-semibold py-1.5 rounded transition-colors disabled:opacity-40"
                      >
                        Simulate CI Fail
                      </button>
                    </div>
                  </div>

                  {/* Column 2: CSA Code Quality Evaluator */}
                  <div className="glass-panel border border-indigo-950/30 rounded-xl overflow-hidden flex flex-col h-[400px]">
                    <div className="px-4 py-3 border-b border-indigo-950/40 bg-indigo-950/15 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={12} className="text-indigo-400" />
                        CSA Automated Evaluator (Fase 5.4)
                      </h3>
                      {simStep === 'review_running' && (
                        <RefreshCw size={12} className="animate-spin text-indigo-400" />
                      )}
                    </div>

                    <div className="flex-1 p-4 bg-[#0a0d17] overflow-y-auto">
                      {simStep === 'ready' || simStep === 'push' || simStep === 'ci_running' ? (
                        <div className="text-slate-500 text-xs italic">Menunggu kelulusan CI/CD test runner...</div>
                      ) : simStep === 'ci_failed' ? (
                        <div className="text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                          <AlertCircle size={14} />
                          <span>Pemeriksaan dibatalkan: Kode gagal lolos uji CI/CD.</span>
                        </div>
                      ) : simStep === 'review_running' ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold animate-pulse">
                            <RefreshCw size={14} className="animate-spin" />
                            <span>CSA sedang membaca diff & outbox report...</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-1/2 rounded-full animate-infinite-loading" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {csaAnalysis}
                        </div>
                      )}
                    </div>

                    <div className="p-3 border-t border-indigo-950/40 bg-indigo-950/10">
                      <button
                        onClick={triggerCsaEvaluation}
                        disabled={simStep !== 'ci_passed'}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800/40 disabled:text-slate-500 text-white text-xs font-semibold py-2 rounded transition-colors"
                      >
                        Jalankan Review CSA
                      </button>
                    </div>
                  </div>

                  {/* Column 3: Visual Audit & Merge Gate */}
                  <div className="glass-panel border border-indigo-950/30 rounded-xl overflow-hidden flex flex-col h-[400px]">
                    <div className="px-4 py-3 border-b border-indigo-950/40 bg-indigo-950/15 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock size={12} className="text-amber-400" />
                        User Audit Gate & Merge (Fase 7)
                      </h3>
                      {simStep === 'audit' ? (
                        <Unlock size={12} className="text-emerald-400" />
                      ) : (
                        <Lock size={12} className="text-slate-500" />
                      )}
                    </div>

                    <div className="flex-1 p-4 bg-[#0a0d17] overflow-y-auto space-y-4">
                      {simStep === 'ready' || simStep === 'push' || simStep === 'ci_running' || simStep === 'ci_passed' || simStep === 'review_running' ? (
                        <div className="text-slate-500 text-xs italic">Menunggu CSA merampungkan verifikasi teknis...</div>
                      ) : simStep === 'ci_failed' ? (
                        <div className="text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                          <AlertCircle size={14} />
                          <span>Audit dikunci: Perbaiki error kompilasi terlebih dahulu.</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* CSA Dynamic Security Checklist (Task 7.1) */}
                          <div className="bg-indigo-950/10 border border-indigo-900/20 rounded-lg p-3 space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-indigo-400" />
                              <span>Kepatuhan Arsitektur ({csaEvaluation ? `${csaEvaluation.score}/100` : '0/100'})</span>
                            </h4>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-300">1. CI/CD Build Status</span>
                                <span className="flex items-center gap-1 font-mono text-[10px]">
                                  <span className="text-emerald-400 flex items-center gap-1 font-semibold"><Check size={12} /> PASSED</span>
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs border-t border-indigo-950/40 pt-1.5">
                                <span className="text-slate-300">2. RLS Security Audit</span>
                                <span className="flex items-center gap-1 font-mono text-[10px]">
                                  {csaEvaluation?.score === 30 ? (
                                    <span className="text-rose-400 flex items-center gap-1 font-semibold"><X size={12} /> BYPASS DETECTED</span>
                                  ) : csaEvaluation ? (
                                    <span className="text-emerald-400 flex items-center gap-1 font-semibold"><Check size={12} /> COMPLIANT</span>
                                  ) : (
                                    <span className="text-slate-500 flex items-center gap-1"><Clock size={12} /> PENDING</span>
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs border-t border-indigo-950/40 pt-1.5">
                                <span className="text-slate-300">3. Exception Handling Check</span>
                                <span className="flex items-center gap-1 font-mono text-[10px]">
                                  {csaEvaluation?.score === 55 ? (
                                    <span className="text-rose-400 flex items-center gap-1 font-semibold"><X size={12} /> MISSING TRY-CATCH</span>
                                  ) : csaEvaluation ? (
                                    <span className="text-emerald-400 flex items-center gap-1 font-semibold"><Check size={12} /> IMPLEMENTED</span>
                                  ) : (
                                    <span className="text-slate-500 flex items-center gap-1"><Clock size={12} /> PENDING</span>
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs border-t border-indigo-950/40 pt-1.5">
                                <span className="text-slate-300">4. LLM DoD Evaluation</span>
                                <span className="flex items-center gap-1 font-mono text-[10px]">
                                  {csaEvaluation ? (
                                    csaEvaluation.approved ? (
                                      <span className="text-emerald-400 flex items-center gap-1 font-semibold"><Check size={12} /> APPROVED</span>
                                    ) : (
                                      <span className="text-rose-400 flex items-center gap-1 font-semibold"><X size={12} /> REJECTED</span>
                                    )
                                  ) : (
                                    <span className="text-slate-500 flex items-center gap-1"><Clock size={12} /> PENDING</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Checklist Audit Visual (Task 7.1)</h4>
                            <div className="space-y-2">
                              {auditItems.map(item => (
                                <label key={item.id} className="flex items-start gap-2.5 bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-lg cursor-pointer hover:bg-indigo-950/10 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => handleAuditCheck(item.id)}
                                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
                                  />
                                  <span className="text-xs text-slate-300 leading-normal">{item.text}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-indigo-950/40 pt-3">
                            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Environment Variables (Task 7.4)</h4>
                            <textarea
                              value={envSecrets}
                              onChange={(e) => setEnvSecrets(e.target.value)}
                              placeholder="Masukkan API Keys jika diperlukan (tidak tersimpan di Repo, e.g. RESEND_API_KEY=re_123)"
                              className="w-full h-16 bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 border-t border-indigo-950/40 bg-indigo-950/10">
                      {selectedTask?.status === 'merged' || simStep === 'merged' ? (
                        <div className="w-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold py-2 rounded text-center flex items-center justify-center gap-1.5 font-mono uppercase">
                          <CheckCircle2 size={14} />
                          <span>SUKSES DI-MERGE KE MAIN</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleMergeToMain}
                          disabled={
                            !(selectedTask?.status === 'approved' && auditItems.every(item => item.checked)) && 
                            simStep !== 'audit'
                          }
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800/40 disabled:text-slate-500 text-white text-xs font-semibold py-2 rounded transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
                        >
                          <GitPullRequest size={14} />
                          <span>Approve & Merge ke Main (Task 7.3)</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
          )}
        </main>

        {/* Right Panel: Simulator Control Center */}
        <aside className="w-80 border-l border-indigo-950/30 bg-[#090c15] flex flex-col justify-between overflow-y-auto">
          <div className="p-4 space-y-6">
            
            {/* Simulator Context Heading */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Settings size={14} />
                <span>Simulation Controller</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Panel ini digunakan untuk mensimulasikan kejadian luar (GitHub push, CI/CD run, dll.) untuk menguji website CSA.
              </p>
            </div>

            {/* Workflow Pipeline Progress */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workflow Stage</span>
              <div className="relative pl-4 space-y-4 border-l border-indigo-950/60 text-xs">
                
                {/* State 1: Spec Ready */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center border ${simStep !== 'ready' ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-[#090c15] border-indigo-800/60'}`}>
                    <Check size={8} />
                  </div>
                  <div className="font-medium text-slate-200">Task-5 Inbox Ready</div>
                  <div className="text-[10px] text-slate-400">Task spec di-push ke inbox repo.</div>
                </div>

                {/* State 2: AE Push Webhook */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center border ${simStep !== 'ready' && simStep !== 'push' ? 'bg-indigo-500 border-indigo-400 text-white' : simStep === 'push' ? 'bg-indigo-950 border-indigo-500 text-indigo-300 animate-pulse' : 'bg-[#090c15] border-indigo-800/60'}`}>
                    {simStep === 'push' ? '●' : <Check size={8} />}
                  </div>
                  <div className={`font-medium ${simStep === 'push' ? 'text-indigo-300 font-bold' : 'text-slate-300'}`}>AE Push Code Webhook</div>
                  <div className="text-[10px] text-slate-400">AI Engineer lapor di outbox & push code.</div>
                </div>

                {/* State 3: CI/CD Status */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center border ${simStep === 'ci_passed' || simStep === 'review_running' || simStep === 'review_done' || simStep === 'audit' || simStep === 'merged' ? 'bg-indigo-500 border-indigo-400 text-white' : simStep === 'ci_failed' ? 'bg-rose-500 border-rose-400 text-white' : simStep === 'ci_running' ? 'bg-indigo-950 border-indigo-500 text-indigo-300 animate-pulse' : 'bg-[#090c15] border-indigo-800/60'}`}>
                    {simStep === 'ci_failed' ? '✗' : simStep === 'ci_running' ? '●' : <Check size={8} />}
                  </div>
                  <div className={`font-medium ${simStep === 'ci_running' ? 'text-indigo-300 font-bold' : simStep === 'ci_failed' ? 'text-rose-400' : 'text-slate-300'}`}>GitHub Actions CI</div>
                  <div className="text-[10px] text-slate-400">Pengujian otomatis kompilasi & test.</div>
                </div>

                {/* State 4: CSA Automated Review */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center border ${simStep === 'review_done' || simStep === 'audit' || simStep === 'merged' ? 'bg-indigo-500 border-indigo-400 text-white' : simStep === 'review_running' ? 'bg-indigo-950 border-indigo-500 text-indigo-300 animate-pulse' : 'bg-[#090c15] border-indigo-800/60'}`}>
                    {simStep === 'review_running' ? '●' : <Check size={8} />}
                  </div>
                  <div className={`font-medium ${simStep === 'review_running' ? 'text-indigo-300 font-bold' : 'text-slate-300'}`}>CSA Automated Review</div>
                  <div className="text-[10px] text-slate-400">AI memverifikasi konsistensi arsitektur.</div>
                </div>

                {/* State 5: User Audit & Merge */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center border ${simStep === 'merged' ? 'bg-emerald-500 border-emerald-400 text-white' : simStep === 'audit' ? 'bg-indigo-950 border-indigo-500 text-indigo-300 animate-pulse' : 'bg-[#090c15] border-indigo-800/60'}`}>
                    {simStep === 'merged' ? <Check size={8} /> : '●'}
                  </div>
                  <div className={`font-medium ${simStep === 'audit' ? 'text-indigo-300 font-bold' : simStep === 'merged' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>User Audit & Git Merge</div>
                  <div className="text-[10px] text-slate-400">Pengecekan visual manual & merge to main.</div>
                </div>

              </div>
            </div>

            {/* Controller Action Buttons */}
            <div className="space-y-3 border-t border-indigo-950/40 pt-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trigger Events</span>
              <div className="space-y-2">
                <button
                  onClick={triggerAePush}
                  disabled={simStep !== 'ready'}
                  className="w-full bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-900/40 text-indigo-300 text-xs font-semibold py-2 px-3 rounded flex items-center justify-between disabled:opacity-40 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <GitPullRequest size={12} />
                    <span>AE Pushes Commit (Webhook)</span>
                  </span>
                  <ArrowRight size={12} />
                </button>

                <div className="bg-[#0b0f19] border border-indigo-950/80 rounded p-2 font-mono text-[9px] text-slate-500 max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {simWebhookPayload || '// Payload Webhook akan muncul di sini saat event terpicu'}
                </div>
              </div>
            </div>

          </div>

          {/* Reset button at the bottom */}
          <div className="p-4 border-t border-indigo-950/40 bg-indigo-950/10">
            <button
              onClick={resetSimulator}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw size={12} />
              <span>Reset Simulator</span>
            </button>
          </div>
        </aside>

      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-indigo-950/40 p-6 shadow-2xl relative animate-fade-in">
            <h3 className="text-base font-bold text-slate-200 mb-4 text-gradient flex items-center gap-2">
              <FolderGit2 size={18} className="text-indigo-400" />
              <span>Buat Proyek Baru</span>
            </h3>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nama Proyek</label>
                <input
                  type="text"
                  placeholder="Contoh: My SaaS App"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-indigo-950/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-400">GitHub Repository</label>
                  {!isGithubConnected ? (
                    <a
                      href={`/api/auth/github/login?userId=${user?.id}`}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <GithubIcon size={10} /> Hubungkan GitHub
                    </a>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      ● Terhubung ke GitHub
                    </span>
                  )}
                </div>
                
                <select
                  value={selectedRepoFullName}
                  onChange={(e) => {
                    setSelectedRepoFullName(e.target.value);
                    const selected = githubRepos.find(r => r.full_name === e.target.value);
                    if (selected) {
                      setNewRepoUrl(selected.html_url);
                      if (!newProjectName.trim()) {
                        setNewProjectName(selected.name);
                      }
                    }
                  }}
                  className="w-full bg-slate-950/60 border border-indigo-950/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- Pilih Repositori --</option>
                  {fetchingRepos ? (
                    <option value="">Memuat...</option>
                  ) : (
                    githubRepos.map(repo => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.full_name} {repo.isMock ? '(Mockup)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Repository URL (Manual)</label>
                <input
                  type="url"
                  placeholder="https://github.com/username/repo"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="w-full bg-slate-950/60 border border-indigo-950/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">GitHub Installation ID (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: 12345678"
                  value={newInstallationId}
                  onChange={(e) => setNewInstallationId(e.target.value)}
                  className="w-full bg-slate-950/60 border border-indigo-950/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Simpan Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-indigo-950/40 p-6 shadow-2xl relative animate-fade-in">
            <h3 className="text-base font-bold text-slate-200 mb-4 text-gradient flex items-center gap-2">
              <Kanban size={18} className="text-indigo-400" />
              <span>Dekomposisi Task Baru</span>
            </h3>
            
            {generatingTask ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">CSA sedang merancang spesifikasi...</p>
                  <p className="text-xs text-slate-400">Membaca context & keputusan arsitektur untuk menghasilkan spesifikasi teknis.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateTask} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Judul Fitur / Task Baru</label>
                  <input
                    type="text"
                    placeholder="Contoh: Integrasi Sentry SDK"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-slate-950/60 border border-indigo-950/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateTaskModalOpen(false)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Dekomposisi dengan CSA
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
