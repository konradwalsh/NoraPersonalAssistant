import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
    title: string;
    value: string | number;
    label: string;
    icon: React.ElementType;
    color: string;
    trend?: string;
    delay?: number;
}

export function StatCard({ title, value, label, icon: Icon, color, trend = "+12%", delay = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay }}
            className="group relative rounded-2xl border border-white/5 bg-[#121212] p-6 hover:bg-white/[0.02] transition-colors"
        >
            <div className="flex items-start justify-between">
                <div className={cn("p-2 rounded-xl bg-opacity-10", color)}>
                    <Icon className={cn("h-6 w-6", color.replace('bg-', 'text-'))} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    <span>{trend}</span>
                </div>
            </div>

            <div className="mt-4 space-y-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tighter">{value}</span>
                    <span className="text-xs font-medium text-white/30">{label}</span>
                </div>
                <p className="text-xs font-semibold text-white/50 tracking-wide uppercase">{title}</p>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-4 w-4 text-white/20" />
            </div>

            {/* Subtle bottom gradient */}
            <div className={cn("absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-20", color.replace('bg-', 'text-'))} />
        </motion.div>
    );
}
