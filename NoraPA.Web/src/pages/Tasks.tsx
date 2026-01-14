import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Search,
  Clock,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  Circle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiClient.getTasks(),
  });

  const filteredTasks = tasks?.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'completed' && task.status === 'completed') ||
      (filter === 'pending' && task.status !== 'completed');
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: tasks?.length || 0,
    completed: tasks?.filter(t => t.status === 'completed').length || 0,
    pending: tasks?.filter(t => t.status !== 'completed').length || 0,
    highPriority: tasks?.filter(t => t.priority !== undefined && t.priority >= 3 && t.status !== 'completed').length || 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Task Registry</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter leading-none">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Objectives</span>
          </h1>
          <p className="text-sm font-medium text-white/30 max-w-md">
            Streamlining {stats.pending} active items through neural organization.
          </p>
        </div>

        <Button className="h-14 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-[0.2em] px-8 rounded-2xl shadow-xl shadow-emerald-500/10 gap-3 group">
          <div className="h-6 w-6 rounded-lg bg-black text-white flex items-center justify-center group-hover:rotate-90 transition-transform">
            <Plus className="h-4 w-4" />
          </div>
          New Objective
        </Button>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { title: 'Total Flux', count: stats.total, icon: CheckSquare, color: 'indigo' },
          { title: 'Finalized', count: stats.completed, icon: CheckCircle2, color: 'emerald' },
          { title: 'Active', count: stats.pending, icon: Clock, color: 'amber' },
          { title: 'Critical', count: stats.highPriority, icon: AlertCircle, color: 'rose' },
        ].map((stat) => (
          <div key={stat.title} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden group text-card-foreground">
            <div className={cn("absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-full", stat.color === 'indigo' ? 'bg-indigo-500' : stat.color === 'emerald' ? 'bg-emerald-500' : stat.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500')} />
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-xl bg-white/5", stat.color === 'indigo' ? 'text-indigo-400' : stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'amber' ? 'text-amber-400' : 'text-rose-400')}>
                <stat.icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">{stat.title}</span>
            </div>
            <div className="text-3xl font-black tracking-tighter text-white">{stat.count.toString().padStart(2, '0')}</div>
          </div>
        ))}
      </div>

      {/* Workflow Controls */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-[400px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
            <Input
              placeholder="Search objectives..."
              className="h-14 pl-12 bg-white/5 border-white/5 rounded-2xl focus:ring-emerald-500/30 transition-all placeholder:text-white/20 font-medium shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            {(['all', 'pending', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all",
                  filter === f
                    ? "bg-white text-black shadow-lg"
                    : "text-white/30 hover:text-white hover:bg-white/5"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-24 w-full bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse" />
              ))
            ) : filteredTasks && filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="group relative flex items-center justify-between p-6 rounded-[24px] border border-white/5 bg-[#0a0a0a] hover:bg-white/[0.03] hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <button className="relative group/cb">
                      {task.status === 'completed' ? (
                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="h-5 w-5 fill-current" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 group-hover/cb:border-indigo-500/50 transition-colors flex items-center justify-center group/check">
                          <Circle className="h-5 w-5 text-white/5 group-hover/check:text-indigo-400 group-hover/check:scale-110 transition-all" />
                        </div>
                      )}
                    </button>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-[15px] font-black tracking-tight transition-all truncate",
                          task.status === 'completed' ? "text-white/20 line-through" : "text-white/90"
                        )}>
                          {task.title}
                        </p>
                        {task.obligationId && (
                          <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                            <Sparkles className="h-2.5 w-2.5" />
                            Auto
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        {task.dueDate && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                            <Clock className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                        {task.priority !== undefined && (
                          <div className={cn(
                            "text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border",
                            task.priority === 1 ? "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]" :
                              task.priority === 2 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          )}>
                            {task.priority === 1 ? 'Critical' : task.priority === 2 ? 'High' : task.priority === 3 ? 'Medium' : 'Low'}
                          </div>
                        )}
                        {task.contextLink && (
                          <Link
                            to={task.contextLink}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400/60 hover:text-indigo-400 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Source
                          </Link>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-white/30 line-clamp-1 mt-1">
                          {task.description.replace(/\*\*/g, '').replace(/[📧👤⚠️📅]/g, '').split('\n')[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-[40px] border border-dashed border-white/5 py-24 flex flex-col items-center justify-center space-y-4"
              >
                <div className="h-20 w-20 rounded-full bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center">
                  <CheckSquare className="h-8 w-8 text-white/5" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Quiescent Registry</h3>
                  <p className="text-[11px] text-white/20">No active objectives found within current neural filters.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
