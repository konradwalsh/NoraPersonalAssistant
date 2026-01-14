import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Search,
  Clock,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Timer
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function Deadlines() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'missed' | 'met'>('all');

  const { data: deadlines, isLoading } = useQuery({
    queryKey: ['deadlines'],
    queryFn: () => apiClient.getDeadlines(),
  });

  const filteredDeadlines = deadlines?.filter(d => {
    const matchesSearch = (d.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || d.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: deadlines?.length || 0,
    upcoming: deadlines?.filter(d => d.status === 'active').length || 0,
    met: deadlines?.filter(d => d.status === 'met').length || 0,
    missed: deadlines?.filter(d => d.status === 'missed').length || 0,
  };

  const getTimeRemaining = (dateStr?: string) => {
    if (!dateStr) return 'No date';
    const now = new Date();
    const deadline = new Date(dateStr);
    const diff = deadline.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days left`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Bento Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-8 rounded-[2.5rem] bg-gradient-to-br from-rose-500/10 via-transparent to-transparent border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="h-24 w-24 text-rose-500 -rotate-12" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Temporal Enforcer</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white leading-none">
                System <span className="text-white/20">Deadlines</span>
              </h1>
              <p className="text-sm font-medium text-white/40 mt-4 max-w-md leading-relaxed">
                "Time is the most valuable thing a man can spend. Ensure your expenditures are deliberate."
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:bg-white/[0.04] transition-all">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
              <Timer className="h-6 w-6" />
            </div>
            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div>
            <div className="text-4xl font-black tracking-tighter tabular-nums text-white group-hover:scale-105 transition-transform origin-left">{stats.upcoming}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 mt-1">Pending Deadlines</div>
          </div>
        </div>
      </div>

      {/* Modern Search & Filter */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-2 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-rose-500 transition-colors" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search temporal directives..."
            className="bg-transparent border-none h-14 pl-14 text-[13px] font-medium placeholder:text-white/10 focus-visible:ring-0"
          />
        </div>
        <div className="flex p-1 bg-black/20 rounded-[1.5rem] gap-1 overflow-x-auto no-scrollbar">
          {(['all', 'active', 'missed', 'met'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filter === f
                  ? "bg-white text-black shadow-xl"
                  : "text-white/20 hover:text-white/40"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Premium List View */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-28 w-full bg-white/[0.02] animate-pulse rounded-[2rem] border border-white/5" />
            ))
          ) : filteredDeadlines && filteredDeadlines.length > 0 ? (
            filteredDeadlines.map((deadline, index) => (
              <motion.div
                key={deadline.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex items-center justify-between p-6 pl-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all"
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={cn(
                    "w-full h-full",
                    deadline.status === 'missed' ? "bg-rose-500" : "bg-indigo-500"
                  )} />
                </div>

                <div className="flex items-center gap-6 flex-1">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all shadow-lg",
                    deadline.status === 'missed' ? "bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-rose-500/10" :
                      deadline.status === 'met' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        "bg-white/5 border-white/10 text-indigo-400 group-hover:border-indigo-500/30"
                  )}>
                    <Timer className="h-6 w-6" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-[15px] font-black tracking-tight text-white/80 group-hover:text-white transition-colors capitalize">
                      {deadline.description || deadline.deadlineType}
                    </h3>
                    <div className="flex items-center gap-4">
                      {deadline.deadlineDate && (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-white/20 uppercase tracking-widest">
                          <Calendar className="h-3 w-3" />
                          <span className="text-white/40">{new Date(deadline.deadlineDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className={cn(
                        "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest",
                        deadline.status === 'missed' ? "text-rose-500" : "text-white/20"
                      )}>
                        <Clock className="h-3 w-3 opacity-50" />
                        {getTimeRemaining(deadline.deadlineDate)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Link to={`/inbox?messageId=${deadline.messageId}`}>
                    <Button variant="ghost" className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest px-4">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Details
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/20 hover:text-white">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 flex flex-col items-center justify-center space-y-4"
            >
              <div className="h-20 w-20 rounded-[2rem] bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-white/10" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-white/40 uppercase tracking-widest">No Active Deadlines</p>
                <p className="text-[11px] font-bold text-white/10 uppercase tracking-widest mt-1 italic">"The timeline is clear"</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}