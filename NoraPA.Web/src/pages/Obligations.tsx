import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Search,
  Clock,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function Obligations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled'>('all');

  const { data: obligations, isLoading } = useQuery({
    queryKey: ['obligations'],
    queryFn: () => apiClient.getObligations(),
  });

  const filteredObligations = obligations?.filter(obj => {
    const matchesSearch = obj.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.consequence?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'fulfilled' && obj.status === 'fulfilled') ||
      (filter === 'pending' && obj.status !== 'fulfilled');
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: obligations?.length || 0,
    urgent: obligations?.filter(o => (o.priority ?? 0) >= 3 && o.status !== 'fulfilled').length || 0,
    pending: obligations?.filter(o => o.status !== 'fulfilled').length || 0,
    fulfilled: obligations?.filter(o => o.status === 'fulfilled').length || 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Bento Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-8 rounded-[2.5rem] bg-gradient-to-br from-amber-500/10 via-transparent to-transparent border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="h-24 w-24 text-amber-500 rotate-12" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Commitment Tracker</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white leading-none">
                Active <span className="text-white/20">Obligations</span>
              </h1>
              <p className="text-sm font-medium text-white/40 mt-4 max-w-md leading-relaxed">
                "A commitment is a promise to yourself that the future won't just happen, it will be directed."
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:bg-white/[0.04] transition-all">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="text-4xl font-black tracking-tighter tabular-nums text-white group-hover:scale-105 transition-transform origin-left">{stats.urgent}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 mt-1">Urgent Commitments</div>
          </div>
        </div>
      </div>

      {/* Modern Filter & Search Area */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-2 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-amber-500 transition-colors" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Query system for specific commitments..."
            className="bg-transparent border-none h-14 pl-14 text-[13px] font-medium placeholder:text-white/10 focus-visible:ring-0"
          />
        </div>
        <div className="flex p-1 bg-black/20 rounded-[1.5rem] gap-1">
          {(['all', 'pending', 'fulfilled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
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

      {/* High-End List View */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-28 w-full bg-white/[0.02] animate-pulse rounded-[2rem] border border-white/5" />
            ))
          ) : filteredObligations && filteredObligations.length > 0 ? (
            filteredObligations.map((obligation, index) => (
              <motion.div
                key={obligation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex items-center justify-between p-6 pl-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all"
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={cn(
                    "w-full h-full",
                    (obligation.priority ?? 0) >= 3 ? "bg-rose-500" : "bg-amber-500"
                  )} />
                </div>

                <div className="flex items-center gap-6 flex-1">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all",
                    obligation.status === 'fulfilled'
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      : (obligation.priority ?? 0) >= 3
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                        : "bg-white/5 border-white/5 text-white/40 group-hover:text-amber-500"
                  )}>
                    {obligation.status === 'fulfilled' ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[15px] font-black tracking-tight text-white/80 group-hover:text-white transition-colors">
                        {obligation.action}
                      </h3>
                      {obligation.priority !== undefined && (
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                          obligation.priority >= 3 ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-white/20"
                        )}>
                          P{obligation.priority}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {obligation.triggerType && (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-white/20 uppercase tracking-widest">
                          <Clock className="h-3 w-3" />
                          {obligation.triggerType}: <span className="text-white/40">{obligation.triggerValue}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-white/10 uppercase tracking-widest">
                        ID: {obligation.id}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <Link to={`/inbox?messageId=${obligation.messageId}`}>
                    <Button variant="ghost" className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest px-4">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Trace
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
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
                <AlertTriangle className="h-8 w-8 text-white/10" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-white/40 uppercase tracking-widest">No Active Commitments</p>
                <p className="text-[11px] font-bold text-white/10 uppercase tracking-widest mt-1 italic">"The horizon is clear of obligations"</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}