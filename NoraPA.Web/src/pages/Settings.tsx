import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiAnalyticsDashboard } from '@/components/AiAnalyticsDashboard';
import {
  Scale,
  Coins,
  Zap,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import {
  User,
  Plus,
  Cpu,
  CheckCircle2,
  Sparkles,
  Database,
  Globe,
  Mail,
  FileText,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Check,
  RefreshCw,
  LayoutGrid,
  Server,
  Activity,
  Home,
  Upload,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge as UiBadge } from '@/components/ui/badge';
import { LogViewer } from '@/components/LogViewer'; // Added LogViewer import

interface AiModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  isRecommended: boolean;
}

interface AiProviderConfig {
  id: string;
  name: string;
  description: string;
  recommendation: string;
  models: AiModelInfo[];
  requiresApiKey: boolean;
  supportsCustomEndpoint: boolean;
  defaultEndpoint: string;
}

interface AiSettingsData {
  id: number;
  provider: string;
  model: string;
  hasApiKey: boolean;
  apiKeyPreview?: string;
  apiEndpoint?: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  crossProviderEnabled: boolean;
}

interface AiProviderConfig {
  id: string;
  name: string;
  description: string;
  recommendation: string;
  models: AiModelInfo[];
  requiresApiKey: boolean;
  supportsCustomEndpoint: boolean;
  defaultEndpoint: string;
  signUpUrl?: string;
}

interface LocationSettings {
  city: string;
  country: string;
}

interface UserProfile {
  id?: number;
  fullName: string;
  bio: string;
  careerContext: string;
  householdContext: string;
  exclusionInstructions: string;
  aiDirectives: string;
}

export type BudgetMode = 'Premium' | 'Balanced' | 'Economy';

interface UsageStats {
  totalCost: number;
  baselineCost: number;
  totalSavings: number;
  totalRequests: number;
  avgResponseTimeMs: number;
  modelBreakdown: Record<string, number>;
  taskTypeBreakdown: Record<string, number>;
  period: string;
}


const API_BASE = '/api';

function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
  colorClass = "text-indigo-400"
}: {
  icon: any,
  label: string,
  active: boolean,
  onClick: () => void,
  colorClass?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group",
        active
          ? "bg-white/10 shadow-lg shadow-black/20"
          : "hover:bg-white/5"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg transition-colors",
        active ? "bg-black/20" : "bg-white/5 group-hover:bg-white/10"
      )}>
        <Icon className={cn("h-4 w-4", active ? colorClass : "text-white/40 group-hover:text-white/60")} />
      </div>
      <span className={cn(
        "text-sm font-medium transition-colors",
        active ? "text-white" : "text-white/40 group-hover:text-white/70"
      )}>
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="activeTab"
          className={cn("ml-auto w-1.5 h-1.5 rounded-full", colorClass.replace('text-', 'bg-'))}
        />
      )}
    </button>
  );
}

function SectionHeader({ title, description }: { title: string, description: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-black tracking-tight text-white/90">{title}</h2>
      <p className="text-sm font-medium text-white/30 mt-1">{description}</p>
    </div>
  );
}

interface CalendarItem {
  id: string;
  name: string;
  description?: string;
  backgroundColor?: string;
  isPrimary: boolean;
}

function CalendarSelector() {
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [calsRes, selectedRes] = await Promise.all([
        fetch('/api/integrations/google/calendar/list').then(r => r.json()),
        fetch('/api/integrations/google/calendar/selected').then(r => r.json())
      ]);
      setCalendars(calsRes || []);
      setSelected(selectedRes || ['primary']);
    } catch (e) {
      console.error('Failed to load calendars', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCalendar = async (calId: string) => {
    setToggling(calId);
    try {
      const newSelected = selected.includes(calId)
        ? selected.filter(id => id !== calId)
        : [...selected, calId];

      if (newSelected.length === 0) {
        toast.error('At least one calendar must be active');
        return;
      }

      setSelected(newSelected);
      const res = await fetch('/api/integrations/google/calendar/selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarIds: newSelected })
      });

      if (res.ok) {
        toast.success('Sync policy updated');
      }
    } catch (e) {
      toast.error('Failed to update selection');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 w-full bg-white/[0.02] animate-pulse rounded-2xl border border-white/5" />
        ))}
      </div>
    );
  }

  if (calendars.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-white/5 border border-dashed border-white/10 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No calendars detectable</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <AnimatePresence mode="popLayout">
        {calendars.map((cal, index) => {
          const isActive = selected.includes(cal.id);
          const isSyncing = toggling === cal.id;

          return (
            <motion.div
              key={cal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !isSyncing && toggleCalendar(cal.id)}
              className={cn(
                "group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                isActive
                  ? "bg-white/[0.02] border-cyan-500/20 hover:border-cyan-500/40"
                  : "bg-transparent border-white/5 hover:bg-white/[0.04] opacity-60"
              )}
            >
              {isActive && (
                <div
                  className="absolute inset-y-0 left-0 w-1 rounded-full"
                  style={{ backgroundColor: cal.backgroundColor || '#06b6d4' }}
                />
              )}

              <div className="flex items-center gap-4 relative z-10">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center shadow-inner border border-white/5"
                  style={{ backgroundColor: cal.backgroundColor ? `${cal.backgroundColor}20` : '#ffffff05' }}
                >
                  <Calendar className="h-4 w-4" style={{ color: cal.backgroundColor || '#fff' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/90 truncate max-w-[180px]">{cal.name}</span>
                    {cal.isPrimary && (
                      <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest">Master</span>
                    )}
                  </div>
                  <p className="text-[9px] text-white/20 font-medium truncate max-w-[200px]">{cal.description || 'Google Calendar Direct Resource'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <div className={cn(
                  "h-5 w-9 rounded-full relative transition-colors border",
                  isActive ? "bg-cyan-500 border-cyan-400" : "bg-white/5 border-white/10"
                )}>
                  <motion.div
                    animate={{ x: isActive ? 16 : 2 }}
                    className="absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm"
                  />
                </div>
                {isSyncing && <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('intelligence');
  const [providers, setProviders] = useState<AiProviderConfig[]>([]);
  const [settings, setSettings] = useState<AiSettingsData[]>([]);
  const [wizardMode, setWizardMode] = useState(false);
  const [location, setLocation] = useState<LocationSettings>({ city: 'London', country: 'UK' });
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>('openai');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string } | null>>({});
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});
  const [crossProviderEnabled, setCrossProviderEnabled] = useState(false);
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('Balanced');
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(15);
  const [chatProvider, setChatProvider] = useState<string>('');
  const [analysisProvider, setAnalysisProvider] = useState<string>('');
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    bio: '',
    careerContext: '',
    householdContext: '',
    exclusionInstructions: '',
    aiDirectives: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [providersRes, settingsRes, usageRes, budgetRes, googleRes, profileRes] = await Promise.all([
        fetch(`${API_BASE}/settings/providers`),
        fetch(`${API_BASE}/settings/ai`),
        fetch(`${API_BASE}/ai/usage/stats`),
        fetch(`${API_BASE}/settings/ai/budget-mode`),
        fetch(`${API_BASE}/integrations/google/status`),
        fetch(`${API_BASE}/profile`)
      ]);

      const providersData = await providersRes.json();
      const settingsData = await settingsRes.json();
      const usageData = await usageRes.json();
      const budgetData = await budgetRes.json();

      setProviders(providersData);
      setSettings(settingsData);
      setUsage(usageData);
      if (budgetData?.mode) setBudgetMode(budgetData.mode as BudgetMode);

      const profileData = await profileRes.json();
      if (profileData && !profileRes.status.toString().startsWith('4')) {
        setProfile(profileData);
      }

      const googleData = await googleRes.json();
      setGoogleConnected(googleData.connected);
      setAutoSyncEnabled(googleData.autoSyncEnabled);
      setSyncInterval(googleData.syncInterval);

      const active = settingsData.find((s: AiSettingsData) => s.isActive);
      if (active) {
        setActiveProvider(active.provider);
        setCrossProviderEnabled(active.crossProviderEnabled);
      }

      const models: Record<string, string> = {};
      settingsData.forEach((s: AiSettingsData) => {
        if (s.model) models[s.provider] = s.model;
      });
      setSelectedModels(models);

      // Load Task Routing settings
      try {
        const appSettingsRes = await fetch(`${API_BASE}/settings/app`);
        const appSettings = await appSettingsRes.json();
        if (appSettings.ChatProvider) setChatProvider(appSettings.ChatProvider);
        if (appSettings.AnalysisProvider) setAnalysisProvider(appSettings.AnalysisProvider);
      } catch { }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError('Could not connect to Nora Backend. Please ensure the server is running on port 7001.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProvider = async (providerId: string) => {
    setSaving(providerId);
    setTestResult(prev => ({ ...prev, [providerId]: null }));

    try {
      const provider = providers.find(p => p.id === providerId);
      const response = await fetch(`${API_BASE}/settings/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          model: selectedModels[providerId] || provider?.models[0]?.id,
          apiKey: apiKeys[providerId] || undefined,
          apiEndpoint: provider?.supportsCustomEndpoint ? provider.defaultEndpoint : undefined,
          temperature: 0.7,
          maxTokens: 4096,
          isActive: providerId === activeProvider,
          crossProviderEnabled
        })
      });

      if (response.ok) {
        setTestResult(prev => ({ ...prev, [providerId]: { success: true, message: 'Settings saved successfully!' } }));
        fetchData();
      } else {
        const error = await response.json();
        setTestResult(prev => ({ ...prev, [providerId]: { success: false, message: error.error || 'Failed to save' } }));
      }
    } catch (error) {
      setTestResult(prev => ({ ...prev, [providerId]: { success: false, message: 'Network error' } }));
    } finally {
      setSaving(null);
    }
  };

  const handleTestConnection = async (providerId: string) => {
    setTesting(providerId);
    setTestResult(prev => ({ ...prev, [providerId]: null }));

    try {
      const provider = providers.find(p => p.id === providerId);
      const response = await fetch(`${API_BASE}/settings/ai/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          apiKey: apiKeys[providerId],
          apiEndpoint: provider?.defaultEndpoint
        })
      });

      const result = await response.json();
      setTestResult(prev => ({ ...prev, [providerId]: result }));
    } catch (error) {
      setTestResult(prev => ({ ...prev, [providerId]: { success: false, message: 'Connection test failed' } }));
    } finally {
      setTesting(null);
    }
  };

  const handleActivateProvider = async (providerId: string) => {
    try {
      const response = await fetch(`${API_BASE}/settings/ai/activate/${providerId}`, {
        method: 'POST'
      });

      if (response.ok) {
        setActiveProvider(providerId);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to activate provider:', error);
    }
  };

  const handleSaveBudgetMode = async (mode: BudgetMode) => {
    setBudgetMode(mode);
    try {
      await fetch(`${API_BASE}/settings/ai/budget-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
    } catch (error) {
      console.error('Failed to save budget mode:', error);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch(`${API_BASE}/integrations/google/auth`);
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('Failed to get Google Auth URL', err);
    }
  };

  const handleSyncGmail = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/integrations/google/sync`, { method: 'POST' });
      const data = await res.json();
      alert(`Synced ${data.syncedCount} new messages!`);
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleAutoSync = async (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    try {
      await fetch(`${API_BASE}/settings/app`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'GoogleAutoSyncEnabled', value: enabled.toString() })
      });
    } catch (err) {
      console.error('Failed to save auto-sync setting', err);
    }
  };

  const handleIntervalChange = async (minutes: number) => {
    setSyncInterval(minutes);
    try {
      await fetch(`${API_BASE}/settings/app`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'GoogleSyncInterval', value: minutes.toString() })
      });
    } catch (err) {
      console.error('Failed to save sync interval', err);
    }
  };

  const handleSaveProfile = async () => {
    setSaving('profile');
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (response.ok) {
        alert('Profile context updated successfully!');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(null);
    }
  };

  const getSettingsForProvider = (providerId: string): AiSettingsData | undefined => {
    return settings.find(s => s.provider === providerId);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-white/40 text-sm font-medium">Connecting to Neural Core...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-8">
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 max-w-md text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6 text-rose-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Connection Failed</h3>
          <p className="text-sm text-white/50">{error}</p>
          <Button onClick={() => { setError(null); fetchData(); }} variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  // --- Render Functions for Tabs ---

  const renderIntelligenceTab = () => {
    if (wizardMode) {
      return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
          <SectionHeader title="AI Setup Wizard" description="Select the experience that best fits your needs." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wizard Cards */}
            <div onClick={() => { setActiveProvider('anthropic'); handleActivateProvider('anthropic'); }} className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer transition-all">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center mb-4 text-white shadow-lg shadow-indigo-500/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Maximum Intelligence</h3>
              <p className="text-xs text-white/60 leading-relaxed mb-4">I want the smartest AI available for complex coding and reasoning.</p>
              <p className="text-[10px] uppercase font-bold text-indigo-300">Activates: Claude 3.5 Sonnet</p>
            </div>

            <div onClick={() => { setActiveProvider('openai'); handleActivateProvider('openai'); }} className="p-6 rounded-3xl bg-fuchsia-500/10 border border-fuchsia-500/30 hover:bg-fuchsia-500/20 cursor-pointer transition-all">
              <div className="h-12 w-12 rounded-2xl bg-fuchsia-500 flex items-center justify-center mb-4 text-white shadow-lg shadow-fuchsia-500/30">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Balanced (Standard)</h3>
              <p className="text-xs text-white/60 leading-relaxed mb-4">I want a good balance of speed and capability for everyday tasks.</p>
              <p className="text-[10px] uppercase font-bold text-fuchsia-300">Activates: GPT-4o</p>
            </div>

            <div onClick={() => { setActiveProvider('deepseek'); handleActivateProvider('deepseek'); }} className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer transition-all">
              <div className="h-12 w-12 rounded-2xl bg-rose-500 flex items-center justify-center mb-4 text-white shadow-lg shadow-rose-500/30">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Best Value / Coding</h3>
              <p className="text-xs text-white/60 leading-relaxed mb-4">High performance coding at a very low cost.</p>
              <p className="text-[10px] uppercase font-bold text-rose-300">Activates: DeepSeek V3</p>
            </div>

            <div onClick={() => { setActiveProvider('ollama'); handleActivateProvider('ollama'); }} className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer transition-all">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 text-white shadow-lg shadow-emerald-500/30">
                <Server className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Free & Local</h3>
              <p className="text-xs text-white/60 leading-relaxed mb-4">Run entirely on my device. Privacy focused, no API costs.</p>
              <p className="text-[10px] uppercase font-bold text-emerald-300">Activates: Ollama</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
        <SectionHeader title="Artificial Intelligence" description="Manage your AI providers, models, and API keys." />

        <div className="grid gap-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">
            Select & Configure Providers
          </label>

          {providers.map((provider) => {
            const providerSettings = getSettingsForProvider(provider.id);
            const isActive = activeProvider === provider.id;
            const isExpanded = expandedProvider === provider.id;
            const result = testResult[provider.id];

            return (
              <div key={provider.id} className="space-y-0">
                {/* Provider Card (Same as before) */}
                <div
                  className={cn(
                    "relative p-5 rounded-3xl border transition-all cursor-pointer group",
                    isActive
                      ? "bg-indigo-500/5 border-indigo-500/30"
                      : providerSettings?.hasApiKey
                        ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30"
                        : "bg-white/5 border-white/5 hover:border-white/10",
                    isExpanded && "rounded-b-none"
                  )}
                  onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-black text-white">{provider.name}</p>
                        {isActive && (
                          <UiBadge className="bg-indigo-500/20 text-indigo-400 border-none text-[8px] h-4">Active</UiBadge>
                        )}
                        {providerSettings?.hasApiKey && (
                          <UiBadge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] h-4">Configured</UiBadge>
                        )}
                        {provider.models.some(m => m.isRecommended) && (
                          <UiBadge className="bg-amber-500/10 text-amber-400 border-none text-[8px] h-4">Recommended</UiBadge>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-indigo-400 italic">{provider.recommendation}</p>
                      <p className="text-[10px] text-white/30 max-w-[80%] leading-relaxed mt-1">{provider.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && <CheckCircle2 className="h-4 w-4 text-indigo-500" />}
                      <ChevronRight className={cn("h-4 w-4 text-white/20 transition-transform", isExpanded && "rotate-90")} />
                    </div>
                  </div>
                </div>

                {/* Expanded Config (Identical to previous logic) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 bg-white/[0.02] border border-t-0 border-white/5 rounded-b-3xl space-y-5">
                        {/* Model Selection */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Select Model</label>
                          <div className="grid grid-cols-2 gap-2">
                            {provider.models.map((model) => (
                              <button
                                key={model.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedModels(prev => ({ ...prev, [provider.id]: model.id }));
                                }}
                                className={cn(
                                  "p-3 rounded-xl border text-left transition-all",
                                  selectedModels[provider.id] === model.id || (!selectedModels[provider.id] && model.isRecommended)
                                    ? "bg-indigo-500/10 border-indigo-500/30"
                                    : "bg-white/5 border-white/5 hover:border-white/10"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] font-bold text-white">{model.name}</p>
                                  {model.isRecommended && <Zap className="h-3 w-3 text-amber-400" />}
                                </div>
                                <p className="text-[9px] text-white/30 mt-0.5">{model.description}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* API Key */}
                        {provider.requiresApiKey && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">API Key</label>
                              {provider.signUpUrl && (
                                <a href={provider.signUpUrl} target="_blank" rel="noreferrer" className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium select-none" onClick={(e) => e.stopPropagation()}>
                                  Get Key <ArrowRight className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type={showApiKey[provider.id] ? 'text' : 'password'}
                                placeholder={providerSettings?.hasApiKey ? providerSettings.apiKeyPreview : `Enter ${provider.name} API key...`}
                                value={apiKeys[provider.id] || ''}
                                onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 pr-20"
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setShowApiKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] })); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                  {showApiKey[provider.id] ? <EyeOff className="h-3.5 w-3.5 text-white/30" /> : <Eye className="h-3.5 w-3.5 text-white/30" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Custom Endpoint for Ollama */}
                        {provider.supportsCustomEndpoint && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Endpoint URL</label>
                            <input
                              type="text"
                              placeholder={provider.defaultEndpoint}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>
                        )}

                        {/* Connect/Test Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleTestConnection(provider.id); }}
                            disabled={testing === provider.id}
                            className="flex-1 rounded-xl bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 h-10 text-[10px] font-bold uppercase tracking-wider"
                          >
                            {testing === provider.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
                            Test Connection
                          </Button>
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleSaveProvider(provider.id); }}
                            disabled={saving === provider.id}
                            className="flex-1 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 h-10 text-[10px] font-bold uppercase tracking-wider"
                          >
                            {saving === provider.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Check className="h-3.5 w-3.5 mr-2" />}
                            Save Settings
                          </Button>
                          {!isActive && (providerSettings?.hasApiKey || (providerSettings && !provider.requiresApiKey)) && (
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleActivateProvider(provider.id); }}
                              className="rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 h-10 text-[10px] font-bold uppercase tracking-wider px-6"
                            >
                              <Zap className="h-3.5 w-3.5 mr-2" />
                              Activate
                            </Button>
                          )}
                        </div>

                        {result && result.message && (
                          <div className={cn("p-2 rounded-lg text-[10px]", result.success ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10")}>{result.message}</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Smart AI Routing */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <SectionHeader title="Smart AI Routing" description="Optimize cost and performance by automatically selecting the best model for each task." />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Premium Mode */}
            <div
              onClick={() => handleSaveBudgetMode('Premium')}
              className={cn(
                "p-5 rounded-3xl border cursor-pointer transition-all group",
                budgetMode === 'Premium'
                  ? "bg-indigo-500/10 border-indigo-500/50"
                  : "bg-white/5 border-white/5 hover:border-white/10"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={cn("p-2 rounded-xl", budgetMode === 'Premium' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-white/10 text-white/40")}>
                  <Zap className="h-5 w-5" />
                </div>
                {budgetMode === 'Premium' && <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
              </div>
              <h3 className="text-sm font-black text-white mb-1">Premium</h3>
              <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                Prioritizes quality above all. Uses best models (GPT-4o, Claude 3.5 Sonnet) for all tasks.
              </p>
            </div>

            {/* Balanced Mode */}
            <div
              onClick={() => handleSaveBudgetMode('Balanced')}
              className={cn(
                "p-5 rounded-3xl border cursor-pointer transition-all group",
                budgetMode === 'Balanced'
                  ? "bg-fuchsia-500/10 border-fuchsia-500/50"
                  : "bg-white/5 border-white/5 hover:border-white/10"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={cn("p-2 rounded-xl", budgetMode === 'Balanced' ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30" : "bg-white/10 text-white/40")}>
                  <Scale className="h-5 w-5" />
                </div>
                {budgetMode === 'Balanced' && <div className="h-3 w-3 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]" />}
              </div>
              <h3 className="text-sm font-black text-white mb-1">Balanced</h3>
              <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                Smart routing. Uses premium models for complex tasks and faster models for simple ones.
              </p>
            </div>

            {/* Economy Mode */}
            <div
              onClick={() => handleSaveBudgetMode('Economy')}
              className={cn(
                "p-5 rounded-3xl border cursor-pointer transition-all group",
                budgetMode === 'Economy'
                  ? "bg-emerald-500/10 border-emerald-500/50"
                  : "bg-white/5 border-white/5 hover:border-white/10"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={cn("p-2 rounded-xl", budgetMode === 'Economy' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-white/10 text-white/40")}>
                  <Coins className="h-5 w-5" />
                </div>
                {budgetMode === 'Economy' && <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
              </div>
              <h3 className="text-sm font-black text-white mb-1">Economy</h3>
              <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                Cost-conscious. Maximizes use of efficient models (Haiku, Flash) unless absolutely necessary.
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-3xl bg-white/5 border border-dashed border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Cross-Provider Comparison</p>
            </div>
            <button
              onClick={() => setCrossProviderEnabled(!crossProviderEnabled)}
              className={cn("h-6 w-11 rounded-full relative p-1 transition-colors", crossProviderEnabled ? "bg-indigo-500" : "bg-white/10")}
            >
              <div className={cn("h-4 w-4 rounded-full bg-white shadow-lg transition-transform", crossProviderEnabled && "translate-x-5")} />
            </button>
          </div>
          <p className="text-[10px] text-white/30 leading-relaxed">Advanced: Run queries against all configured providers and auto-select the best result based on confidence scores.</p>
        </div>

        {/* Task-Specific Routing */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <SectionHeader title="Task Router" description="Assign different providers for different tasks." />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chat Provider */}
            <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Ask Nora (Chat)</label>
              </div>
              <select
                value={chatProvider || ''}
                onChange={async (e) => {
                  const val = e.target.value;
                  setChatProvider(val);
                  await fetch('/api/settings/app', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'ChatProvider', value: val || '' }) });
                  alert(`Chat Provider set to: ${val || 'Default (Active)'}`);
                }}
                className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">Use Active Provider ({activeProvider})</option>
                {providers.filter(p => getSettingsForProvider(p.id)?.hasApiKey || p.id === 'ollama').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="text-[9px] text-white/30">Which provider should handle conversational AI?</p>
            </div>

            {/* Analysis Provider */}
            <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Email Analysis</label>
              </div>
              <select
                value={analysisProvider || ''}
                onChange={async (e) => {
                  const val = e.target.value;
                  setAnalysisProvider(val);
                  await fetch('/api/settings/app', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'AnalysisProvider', value: val || '' }) });
                  alert(`Analysis Provider set to: ${val || 'Default (Active)'}`);
                }}
                className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Use Active Provider ({activeProvider})</option>
                {providers.filter(p => getSettingsForProvider(p.id)?.hasApiKey || p.id === 'ollama').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="text-[9px] text-white/30">Which provider should process your emails?</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIdentityTab = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
      <SectionHeader title="Identity & Profiling" description="Build your personal AI context for tailored assistance." />

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Full Legal Name</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50"
              placeholder="e.g. Konrad Walsh"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Personal Biography</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 min-h-[100px]"
              placeholder="Who are you? Interests, general background..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Career Context</label>
              <textarea
                value={profile.careerContext}
                onChange={(e) => setProfile({ ...profile, careerContext: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 min-h-[120px]"
                placeholder="Work details, company projects, professional goals..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Household & Family</label>
              <textarea
                value={profile.householdContext}
                onChange={(e) => setProfile({ ...profile, householdContext: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 min-h-[120px]"
                placeholder="Family members, address details, household roles..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 flex items-center justify-between">
              Exclusion Rules
              <span className="text-[8px] text-white/20">Help Nora avoid noise</span>
            </label>
            <input
              type="text"
              value={profile.exclusionInstructions}
              onChange={(e) => setProfile({ ...profile, exclusionInstructions: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50"
              placeholder="e.g. Always ignore myself in contact extraction, skip marketing emails..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">AI Behavior Directives</label>
            <input
              type="text"
              value={profile.aiDirectives}
              onChange={(e) => setProfile({ ...profile, aiDirectives: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50"
              placeholder="e.g. Be very concise, highlight all financial consequences, mark insurance as high priority..."
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSaveProfile}
        disabled={saving === 'profile'}
        className="w-full rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
      >
        {saving === 'profile' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Identity Context'}
      </Button>
    </div>
  );

  const renderIntegrationsTab = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
      <SectionHeader title="Integrations" description="Connect external services and extend functionality." />

      {/* Cloud Integration */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Cloud Storage</label>
        <div className="grid gap-3">
          {/* Google Workspace */}
          <div className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/[0.07] transition-all">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white/5 shadow-inner">
                <Mail className="h-4 w-4 text-rose-500" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white/80">Google Workspace</p>
                <p className="text-[9px] text-white/30 truncate max-w-[180px]">Sync Gmail inbox for AI analysis.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {googleConnected ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1.5 pr-4 border-r border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Auto-Sync</span>
                      <button
                        onClick={() => handleToggleAutoSync(!autoSyncEnabled)}
                        className={cn(
                          "w-8 h-4 rounded-full transition-all relative border border-white/10",
                          autoSyncEnabled ? "bg-emerald-500/20" : "bg-white/5"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all shadow-sm",
                          autoSyncEnabled ? "right-0.5 bg-emerald-400" : "left-0.5 bg-white/20"
                        )} />
                      </button>
                    </div>
                    {autoSyncEnabled && (
                      <select
                        value={syncInterval}
                        onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                        className="bg-transparent text-[9px] font-bold text-indigo-400 outline-none border-none cursor-pointer"
                      >
                        <option value="5">Every 5m</option>
                        <option value="15">Every 15m</option>
                        <option value="30">Every 30m</option>
                        <option value="60">Every 1h</option>
                      </select>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSyncGmail}
                      disabled={syncing}
                      className="h-8 px-4 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 text-[9px] font-bold uppercase tracking-wider"
                    >
                      {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                      Sync Now
                    </Button>
                    <Button
                      onClick={async () => {
                        if (confirm('Disconnect Google? You will need to reconnect to sync again.')) {
                          await fetch('/api/integrations/google/disconnect', { method: 'POST' });
                          setGoogleConnected(false);
                          alert('Google disconnected. Click "Connect" to re-authenticate with new permissions (including Calendar).');
                        }
                      }}
                      className="h-8 px-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-[9px] font-bold uppercase tracking-wider"
                    >
                      Disconnect
                    </Button>
                    <UiBadge className="bg-emerald-500/10 text-emerald-400 border-none text-[9px] h-6 px-3">Active</UiBadge>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleConnectGoogle}
                  className="h-8 px-4 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 text-[9px] font-bold uppercase tracking-wider"
                >
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* Google Calendar Selection - Only show when connected */}
          {googleConnected && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  <div>
                    <p className="text-xs font-bold text-white/80">Calendar Sync</p>
                    <p className="text-[9px] text-white/30">Select which calendars to sync</p>
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      await fetch('/api/integrations/google/calendar/sync', { method: 'POST' });
                      alert('Calendar synced!');
                    } catch { alert('Sync failed'); }
                  }}
                  className="h-7 px-3 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-[8px] font-bold uppercase"
                >
                  Sync Now
                </Button>
              </div>
              <CalendarSelector />
            </div>
          )}

          {/* Microsoft OneDrive (Static for now) */}
          <div className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 group opacity-50 filter grayscale transition-all">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white/5 shadow-inner">
                <Database className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-xs font-bold text-white/80">Microsoft OneDrive</p>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Coming Soon</p>
          </div>
        </div>
      </div>

      {/* Plugin System Placeholder */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <LayoutGrid className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-black text-white">Plugin Architecture</h3>
          </div>
          <p className="text-xs text-white/50 leading-relaxed mb-4">
            Future-proof your assistant with modular plugins.
            Nextcloud, Notion, and Slack integrations coming soon.
          </p>
          <Button disabled className="h-8 text-[10px] bg-white/5 text-white/30 border border-white/10 rounded-lg uppercase font-bold tracking-wider">
            Coming in v2.0
          </Button>
        </div>
        <div className="absolute right-0 top-0 opacity-10">
          <LayoutGrid className="h-32 w-32 -mr-8 -mt-8 rotate-12" />
        </div>
      </div>

      {/* Home Assistant Integration Placeholder */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 relative overflow-hidden group cursor-pointer hover:border-cyan-500/40 transition-all">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-black text-white">Home Assistant</h3>
            </div>
            <UiBadge className="bg-cyan-500/20 text-cyan-400 border-none">Planned</UiBadge>
          </div>
          <p className="text-xs text-white/50 leading-relaxed mb-4">
            Bi-directional control for your smart home. Surface entities in Nora and trigger automations from context.
          </p>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[9px] font-mono text-cyan-200/60">
              addon: core_nora_bridge
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[9px] font-mono text-cyan-200/60">
              entity: sensor.nora_status
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
      <SectionHeader title="System & Logs" description="Monitor performance and debug issues." />

      <AiAnalyticsDashboard stats={usage} isLoading={loading} />

      <div className="pt-6 border-t border-white/5">
        <SectionHeader title="System Logs" description="Real-time application activity." />
        <LogViewer />
      </div>

      {/* Auto-Task Creation Toggle */}
      <div className="pt-6 border-t border-white/5 space-y-4">
        <SectionHeader title="Automation Pipeline" description="Control automatic task creation from AI analysis." />

        <div className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Auto-Task Creation</h4>
              <p className="text-xs text-white/40 max-w-[300px]">
                Automatically create tasks from obligations detected during AI email analysis.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const currentValue = await fetch(`${API_BASE}/settings/AutoTaskCreation`).then(r => r.json()).catch(() => ({ value: 'true' }));
                const newValue = currentValue.value === 'true' ? 'false' : 'true';
                await fetch(`${API_BASE}/settings/AutoTaskCreation`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ value: newValue })
                });
                // Visual feedback - could add state here
                alert(`Auto-Task Creation ${newValue === 'true' ? 'enabled' : 'disabled'}`);
              } catch (err) {
                console.error('Failed to toggle auto-task creation:', err);
              }
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-bold"
          >
            Toggle
          </button>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-white/5">
        <SectionHeader title="Data Management" description="Protect your intelligence data." />

        <div className="p-5 rounded-3xl bg-white/5 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">System Backup</h4>
              <p className="text-xs text-white/40 max-w-[300px]">Download a full snapshot of your local database, including trained context and history.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              id="db-upload"
              className="hidden"
              accept=".db"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (!confirm("This will OVERWRITE your current database with the selected backup. All current data will be lost. Continue?")) return;

                const formData = new FormData();
                formData.append("file", file);

                try {
                  const res = await fetch(`${API_BASE}/system/restore`, {
                    method: 'POST',
                    body: formData
                  });
                  if (res.ok) {
                    alert("Database restored! The application will now reload.");
                    window.location.reload();
                  } else {
                    const err = await res.json();
                    alert("Restore failed: " + (err.detail || err.title || "Unknown error"));
                  }
                } catch (err) {
                  console.error(err);
                  alert("Restore failed. Check console.");
                }
              }}
            />
            <Button
              onClick={() => document.getElementById('db-upload')?.click()}
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold px-6 border border-white/5"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              onClick={() => window.open(`${API_BASE}/system/backup`, '_blank')}
              className="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 shadow-lg shadow-indigo-500/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Database
            </Button>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-rose-500/5 border border-rose-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-rose-500/10 transition-colors">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Reset Demo Data</h4>
              <p className="text-xs text-white/40 max-w-[300px]">Clear all extracted messages, contacts, and events to start fresh. Keeps your settings.</p>
            </div>
          </div>
          <Button
            onClick={async () => {
              if (window.confirm("Are you sure? This will DELETE ALL messages, contacts, events, and analysis history. This action cannot be undone.")) {
                try {
                  await fetch(`${API_BASE}/system/reset-demo-data`, { method: 'DELETE' });
                  alert("System reset successfully.");
                  window.location.reload();
                } catch (e) {
                  alert("Failed to reset system.");
                }
              }
            }}
            variant="destructive"
            className="rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold px-6 border border-rose-500/30"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Data
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-10 overflow-hidden">
      {/* Settings Navigation */}
      <aside className="w-72 flex-shrink-0 flex flex-col gap-6 py-2">
        <div className="px-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Control Center</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">System <span className="text-white/20">Config</span></h1>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-1.5 flex gap-1">
          <button
            onClick={() => setWizardMode(true)}
            className={cn(
              "flex-1 py-2 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all",
              wizardMode ? "bg-white text-black shadow-xl" : "text-white/30 hover:text-white hover:bg-white/5"
            )}
          >
            Wizard
          </button>
          <button
            onClick={() => setWizardMode(false)}
            className={cn(
              "flex-1 py-2 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all",
              !wizardMode ? "bg-white text-black shadow-xl" : "text-white/30 hover:text-white hover:bg-white/5"
            )}
          >
            Advanced
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem
            icon={Cpu}
            label="Intelligence"
            active={activeTab === 'intelligence'}
            onClick={() => setActiveTab('intelligence')}
            colorClass="text-indigo-400"
          />
          <SidebarItem
            icon={User}
            label="Neural Identity"
            active={activeTab === 'identity'}
            onClick={() => setActiveTab('identity')}
            colorClass="text-rose-400"
          />
          <SidebarItem
            icon={LayoutGrid}
            label="Integrations"
            active={activeTab === 'integrations'}
            onClick={() => setActiveTab('integrations')}
            colorClass="text-cyan-400"
          />
          <SidebarItem
            icon={Activity}
            label="Pulse & Logs"
            active={activeTab === 'system'}
            onClick={() => setActiveTab('system')}
            colorClass="text-emerald-400"
          />
        </nav>

        <div className="p-6 rounded-[32px] bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Nora Pro</p>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Active License</p>
            </div>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed font-medium">
            System is running at peak neural performance.
          </p>
        </div>
      </aside>

      {/* Settings Content Area */}
      <section className="flex-1 overflow-y-auto pr-6 no-scrollbar pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + wizardMode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activeTab === 'intelligence' && renderIntelligenceTab()}
            {activeTab === 'identity' && renderIdentityTab()}
            {activeTab === 'integrations' && renderIntegrationsTab()}
            {activeTab === 'system' && renderSystemTab()}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}
