import React from 'react';
import { DollarSign, BarChart3, PieChart, TrendingUp, ArrowDownRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

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

interface AiAnalyticsDashboardProps {
    stats: UsageStats | null;
    isLoading: boolean;
}

export function AiAnalyticsDashboard({ stats, isLoading }: AiAnalyticsDashboardProps) {
    if (isLoading) {
        return <div className="p-8 text-center text-white/30 animate-pulse">Loading analytics...</div>;
    }

    if (!stats) {
        return <div className="p-8 text-center text-white/30">No usage data available yet.</div>;
    }

    const savingsPercent = stats.baselineCost > 0
        ? Math.round((stats.totalSavings / stats.baselineCost) * 100)
        : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cost vs Baseline */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Total Cost (MTD)</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-white">${stats.totalCost.toFixed(4)}</h3>
                    </div>
                    <p className="text-xs text-white/40 mt-2">
                        vs <span className="line-through decoration-white/30">${stats.baselineCost.toFixed(4)}</span> baseline
                    </p>
                </div>

                {/* Savings */}
                <div className="bg-emerald-500/10 rounded-2xl p-5 border border-emerald-500/10 relative overflow-hidden group hover:border-emerald-500/20 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-16 h-16 text-emerald-400" />
                    </div>
                    <p className="text-emerald-400/60 text-xs font-bold uppercase tracking-wider mb-1">Net Savings</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-emerald-400">${stats.totalSavings.toFixed(4)}</h3>
                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-0">
                            {savingsPercent}%
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-emerald-400/50 text-xs">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>Reduced via smart routing</span>
                    </div>
                </div>

                {/* Performance */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-16 h-16 text-amber-400" />
                    </div>
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Avg Response Time</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-white">{stats.avgResponseTimeMs}ms</h3>
                    </div>
                    <p className="text-xs text-white/40 mt-2">
                        Across {stats.totalRequests} requests
                    </p>
                </div>
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Model Breakdown */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-4 h-4 text-white/60" />
                        <h4 className="text-sm font-bold text-white/80">Model Usage Distribution</h4>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(stats.modelBreakdown || {}).map(([model, count]) => {
                            const percent = Math.round((count / stats.totalRequests) * 100);
                            return (
                                <div key={model} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-white/60">{model}</span>
                                        <span className="text-white/40">{count} ({percent}%)</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                        {Object.keys(stats.modelBreakdown || {}).length === 0 && (
                            <p className="text-xs text-white/30 italic">No data yet</p>
                        )}
                    </div>
                </div>

                {/* Task Type Breakdown */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-white/60" />
                        <h4 className="text-sm font-bold text-white/80">Task Complexity Breakdown</h4>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(stats.taskTypeBreakdown || {}).map(([type, count]) => {
                            const percent = Math.round((count / stats.totalRequests) * 100);
                            return (
                                <div key={type} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-white/60">{type}</span>
                                        <span className="text-white/40">{count} ({percent}%)</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-fuchsia-500 rounded-full" style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                        {Object.keys(stats.taskTypeBreakdown || {}).length === 0 && (
                            <p className="text-xs text-white/30 italic">No data yet</p>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
