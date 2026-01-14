import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Inbox,
  CheckSquare,
  AlertTriangle,
  Calendar,
  Clock,
  Zap,
  Loader2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Mail,
  ListTodo,
  CalendarDays,
  Activity,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { apiClient } from '@/lib/api';

const containers = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages'],
    queryFn: () => apiClient.getMessages()
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiClient.getTasks()
  });

  const { data: obligations, isLoading: isLoadingObligations } = useQuery({
    queryKey: ['obligations'],
    queryFn: () => apiClient.getObligations()
  });

  const { data: deadlines, isLoading: isLoadingDeadlines } = useQuery({
    queryKey: ['deadlines'],
    queryFn: () => apiClient.getDeadlines()
  });

  const isLoading = isLoadingMessages || isLoadingTasks || isLoadingObligations || isLoadingDeadlines;

  // Derive counts
  const inboxCount = messages?.filter(m => !m.processedAt).length ?? 0;
  const taskCount = tasks?.length ?? 0;
  const obligationCount = obligations?.length ?? 0;
  const deadlineCount = deadlines?.length ?? 0;

  const { data: upcomingEvents } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => apiClient.getCalendarEvents().then(events =>
      events.filter(e => new Date(e.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5)
    ),
    refetchInterval: 60000
  });

  const [globalSyncing, setGlobalSyncing] = useState(false);

  const handleGlobalSync = async () => {
    setGlobalSyncing(true);
    try {
      await Promise.all([
        fetch('/api/integrations/google/sync', { method: 'POST' }),
        fetch('/api/integrations/google/calendar/sync', { method: 'POST' })
      ]);
      toast.success('Neural cores synchronized');
    } catch (e) {
      toast.error('Sync failure detected');
    } finally {
      setGlobalSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
          <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/20">Syncing Intelligence</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containers}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">System Active</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter leading-none">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Konrad</span>
          </h1>
          <p className="text-sm font-medium text-white/30 max-w-md">
            {inboxCount > 0
              ? `Nora has identified ${inboxCount} new actionable items since your last session.`
              : "Everything is synced and optimized. No immediate actions required."}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleGlobalSync}
            disabled={globalSyncing}
            className="rounded-2xl bg-white/[0.05] border border-white/5 text-white/80 hover:bg-white hover:text-black font-black text-[10px] uppercase tracking-widest px-6 h-12 shadow-2xl transition-all"
          >
            {globalSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {globalSyncing ? 'Syncing...' : 'Neural Sync'}
          </Button>
          <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-4 rounded-3xl backdrop-blur-md">
            <div className="flex flex-col items-end pr-4 border-r border-white/5">
              <div className="text-xl font-black tracking-tighter tabular-nums leading-none">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/20 mt-1">
                {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="flex items-center gap-3 pl-2">
              <div className="h-10 w-10 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <div>
                <div className="text-sm font-bold leading-none">AI Active</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/20 mt-1">Optimized Core</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Action Center - Bento Grid Style */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { title: 'Inbox', count: inboxCount, icon: Inbox, color: 'indigo', label: 'to process' },
          { title: 'Tasks', count: taskCount, icon: CheckSquare, color: 'emerald', label: 'active now' },
          { title: 'Deadlines', count: deadlineCount, icon: Calendar, color: 'rose', label: 'upcoming' },
          { title: 'Obligations', count: obligationCount, icon: AlertTriangle, color: 'amber', label: 'tracked' },
        ].map((card, idx) => (
          <motion.div
            key={card.title}
            variants={item}
            className="group relative h-40 rounded-3xl border border-white/5 bg-[#0a0a0a] overflow-hidden hover:border-white/10 transition-all cursor-pointer"
          >
            <div className={cn(
              "absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity translate-x-10 -translate-y-10 rounded-full",
              `bg-${card.color}-500`
            )} />
            <div className="p-6 h-full flex flex-col justify-between relative z-10">
              <div className="flex items-center justify-between">
                <div className={cn("p-2.5 rounded-xl border border-white/5 bg-white/5", `text-${card.color}-400`)}>
                  <card.icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <div className="text-3xl font-black tracking-tighter mb-0.5">{card.count.toString().padStart(2, '0')}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">{card.title}</span>
                  <span className="h-1 w-1 rounded-full bg-white/10" />
                  <span className="text-[9px] font-medium text-white/10 lowercase">{card.label}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Intelligence Feed */}
        <motion.div
          variants={item}
          className="lg:col-span-2 rounded-[32px] border border-white/5 bg-white/[0.01] backdrop-blur-sm overflow-hidden flex flex-col min-h-[500px]"
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Intelligence Feed
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest h-8 px-4 rounded-full border border-white/5 hover:bg-white/5 transition-all">Latest</Button>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest h-8 px-4 rounded-full text-white/20 hover:text-white transition-all">Archived</Button>
            </div>
          </div>

          <div className="p-2 flex-1 overflow-auto no-scrollbar">
            {messages?.filter(m => m.aiAnalyses && m.aiAnalyses.some(a => a.status === 'completed')).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="h-20 w-20 rounded-full bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-white/5" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-white/60">Quiescent State Detected</p>
                  <p className="text-xs text-white/20 max-w-[280px] leading-relaxed italic">Intelligence engine is waiting for new input. Actionable insights will materialize here automatically.</p>
                </div>
              </div>
            ) : (
              <div className="grid p-4 gap-3">
                {messages
                  ?.filter(m => m.aiAnalyses && m.aiAnalyses.some(a => a.status === 'completed'))
                  .slice(0, 5)
                  .map((msg, idx) => {
                    const analysis = msg.aiAnalyses!.find(a => a.status === 'completed')!;
                    let summaryText = '';
                    try {
                      const summaryJson = JSON.parse(analysis.summary || '{}');
                      summaryText = summaryJson.text || 'Analysis complete. Ready for review.';
                    } catch (e) {
                      summaryText = analysis.summary || 'Data processing finalized.';
                    }

                    return (
                      <motion.div
                        key={msg.id}
                        whileHover={{ scale: 1.01, x: 4 }}
                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-5">
                          <div className="mt-1 h-10 w-10 rounded-2xl bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center justify-center text-white p-0.5">
                            <div className="h-full w-full rounded-[14px] bg-black flex items-center justify-center">
                              <Zap className="h-4 w-4 fill-indigo-500 text-indigo-500" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-400">
                                {msg.fromName || msg.fromAddress?.split('@')[0]}
                              </span>
                              <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">{new Date(msg.receivedAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-sm font-black text-white/90 truncate tracking-tight">{msg.subject}</h4>
                            <p className="text-xs text-white/30 leading-relaxed line-clamp-2">
                              {summaryText}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                <Button variant="ghost" className="w-full h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all text-white/10 hover:text-white/40 border border-dashed border-white/5 mt-2">
                  Open Intelligent Feed
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Sidebar */}
        <div className="space-y-8">
          <motion.div
            variants={item}
            className="rounded-[32px] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-8 space-y-6 relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[50px] rounded-full group-hover:scale-125 transition-transform duration-1000" />

            <div className="space-y-2 relative z-10">
              <h3 className="text-xl font-black tracking-tighter italic">Nora Assistant Pro</h3>
              <p className="text-xs text-white/40 leading-relaxed">
                Unlock multi-tenant workspace management, advanced Gmail automation, and custom model routing.
              </p>
            </div>
            <Button className="w-full bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest py-6 rounded-2xl shadow-xl relative z-10">
              Enhance Experience
            </Button>
          </motion.div>

          <motion.div
            variants={item}
            className="rounded-[32px] border border-white/5 bg-[#0a0a0a] overflow-hidden shadow-xl flex flex-col"
          >
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-cyan-400" />
                Temporal Intelligence
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-white/5 hover:bg-white/5">
                <ChevronRight className="h-4 w-4 text-white/20" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {!upcomingEvents || upcomingEvents.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center mx-auto">
                    <CalendarDays className="h-5 w-5 text-white/10" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/10 italic">No upcoming directives</p>
                </div>
              ) : (
                upcomingEvents.map((event, i) => (
                  <div key={event.id} className="flex items-start gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-white/[0.02] transition-all">
                    <div className="h-12 w-12 rounded-2xl bg-cyan-500/5 flex flex-col items-center justify-center border border-cyan-500/10 group-hover:bg-cyan-500 group-hover:text-white transition-all text-cyan-400">
                      <span className="text-[8px] font-black uppercase leading-none">{new Date(event.startTime).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg font-black leading-none">{new Date(event.startTime).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="text-[13px] font-black text-white/80 truncate group-hover:text-white transition-colors">{event.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-white/20" />
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                          {event.isAllDay ? 'All Day' : new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-auto p-6 border-t border-white/5 bg-cyan-500/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Neural Capacity</span>
                <span className="text-[10px] font-black text-cyan-400">92% Optimized</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '92%' }}
                  className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
