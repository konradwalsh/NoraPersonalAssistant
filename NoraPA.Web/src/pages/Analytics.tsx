import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    Zap,
    Clock,
    Brain,
    Coins,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export default function Analytics() {
    const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');

    const { data: statsData, isLoading: isLoadingStats } = useQuery({
        queryKey: ['analytics', 'stats'],
        queryFn: () => apiClient.getAnalyticsStats()
    });

    const { data: throughputData, isLoading: isLoadingThroughput } = useQuery({
        queryKey: ['analytics', 'throughput', timeframe],
        queryFn: () => apiClient.getAnalyticsThroughput(timeframe)
    });

    const stats = [
        {
            label: 'Neural Inferences',
            value: statsData?.totalRequests?.toLocaleString() || '0',
            change: '+12%',
            icon: Brain,
            color: 'text-cyan-400',
            trend: 'up'
        },
        {
            label: 'Intelligence Saved',
            value: `${((statsData?.totalRequests || 0) * 0.05).toFixed(1)}h`,
            change: '+5.2h',
            icon: Clock,
            color: 'text-indigo-400',
            trend: 'up'
        },
        {
            label: 'Compute Cost',
            value: `$${(statsData?.totalCost || 0).toFixed(2)}`,
            change: '-18%',
            icon: Coins,
            color: 'text-emerald-400',
            trend: 'down'
        },
        {
            label: 'System Latency',
            value: `${Math.round(statsData?.avgLatency || 0)}ms`,
            change: '-12ms',
            icon: Zap,
            color: 'text-amber-400',
            trend: 'down'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Premium Bento Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 p-8 rounded-[2.5rem] bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BarChart3 className="h-24 w-24 text-cyan-500 rotate-12" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Neural Performance</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter text-white leading-none">
                                System <span className="text-white/20">Analytics</span>
                            </h1>
                            <p className="text-sm font-medium text-white/40 mt-4 max-w-lg leading-relaxed">
                                Visualizing the neural efficiency and intelligence throughput of your personal assistant core.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    </div>
                    <div>
                        <div className="text-4xl font-black tracking-tighter tabular-nums text-white group-hover:scale-105 transition-transform origin-left">99.8%</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60 mt-1">Core Accuracy</div>
                    </div>
                </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform", stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg",
                                stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            )}>
                                {stat.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {stat.change}
                            </div>
                        </div>
                        <div className="text-2xl font-black tracking-tight text-white/90">{stat.value}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mt-1">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area: Charts Placeholders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black tracking-tight text-white/80">Intelligence Throughput</h3>
                            <p className="text-xs font-medium text-white/20 uppercase tracking-widest">Inferences vs Knowledge Synthesis</p>
                        </div>
                        <div className="flex p-1 bg-black/20 rounded-xl gap-1">
                            {['24h', '7d', '30d'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t as any)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                        timeframe === t ? "bg-white text-black" : "text-white/20 hover:text-white/40"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-64 w-full bg-gradient-to-t from-white/[0.02] to-transparent rounded-3xl border border-dashed border-white/5 flex items-end p-8 gap-4">
                        {(throughputData || []).length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-white/10 italic">
                                Insufficient data for neural mapping
                            </div>
                        ) : (
                            throughputData?.map((d: any, i: number) => {
                                const maxCount = Math.max(...throughputData.map((x: any) => x.count), 1);
                                const h = (d.count / maxCount) * 100;
                                return (
                                    <motion.div
                                        key={d.date}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: i * 0.05, duration: 1 }}
                                        className="flex-1 bg-gradient-to-t from-cyan-500/20 to-cyan-500/40 rounded-t-lg relative group/bar min-w-[20px]"
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20">
                                            {d.count} reqs
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6 flex flex-col justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-black tracking-tight text-white/80">Model Distribution</h3>
                        <p className="text-xs font-medium text-white/20 uppercase tracking-widest">Neural usage by provider</p>
                    </div>

                    <div className="relative flex items-center justify-center py-12">
                        <div className="h-48 w-48 rounded-full border-[12px] border-white/5 relative">
                            <div className="absolute inset-0 rounded-full border-[12px] border-cyan-500 border-r-transparent border-b-transparent -rotate-45" />
                            <div className="absolute inset-0 rounded-full border-[12px] border-indigo-500 border-l-transparent border-t-transparent border-b-transparent rotate-12" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <PieChart className="h-6 w-6 text-white/20 mb-2" />
                                <span className="text-xl font-black tracking-tighter">GPT-4o</span>
                                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Primary Core</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {statsData?.modelBreakdown && Object.entries(statsData.modelBreakdown).length > 0 ? (
                            Object.entries(statsData.modelBreakdown).map(([name, count]: [string, any]) => (
                                <div key={name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest truncate">{name || 'Default Core'}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-white/60">{count}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-[9px] font-bold text-white/10 uppercase tracking-widest text-center py-4">No model activity mapped</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
