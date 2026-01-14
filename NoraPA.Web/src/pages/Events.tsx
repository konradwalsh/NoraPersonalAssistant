import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import type { CalendarEvent } from '@/lib/types';
import { toast } from 'react-hot-toast';

export default function Events() {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getCalendarEvents();
            setEvents(data);
        } catch (error) {
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const sortedEvents = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Premium Bento Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CalendarIcon className="h-24 w-24 text-indigo-500 rotate-6" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Temporal Intelligence</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter text-white leading-none">
                                User <span className="text-white/20">Schedule</span>
                            </h1>
                            <p className="text-sm font-medium text-white/40 mt-4 max-w-lg leading-relaxed">
                                "The key is not to prioritize what's on your schedule, but to schedule your priorities."
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    </div>
                    <div>
                        <div className="text-4xl font-black tracking-tighter tabular-nums text-white group-hover:scale-105 transition-transform origin-left">{sortedEvents.length}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60 mt-1">Pending Events</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Month View Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                <div className="flex items-center p-1 bg-black/20 rounded-[1.5rem] gap-1 ml-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/20 hover:text-white rounded-xl">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] w-40 text-center text-white/80">{currentMonth}</span>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/20 hover:text-white rounded-xl">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex items-center gap-2 pr-2">
                    <Button className="rounded-2xl bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest px-8 h-12 shadow-2xl shadow-indigo-500/10">
                        <Plus className="h-4 w-4 mr-2" /> New Directive
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Visual Calendar Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-3 grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="bg-[#0a0a0a] py-6 text-center border-b border-white/5">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{day}</span>
                        </div>
                    ))}
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="bg-[#0a0a0a] min-h-[140px] p-4 hover:bg-white/[0.02] transition-colors relative group border-t border-white/[0.02]">
                            <span className="text-xs font-black text-white/10 group-hover:text-white/30 transition-colors">
                                {i + 1 <= 30 ? (i + 1).toString().padStart(2, '0') : ''}
                            </span>
                            {/* Potential Mini Event Dots could go here */}
                        </div>
                    ))}
                </motion.div>

                {/* Upcoming Events Agenda */}
                <div className="space-y-4">
                    <div className="px-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-1 w-1 rounded-full bg-indigo-500" />
                            <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Agenda</h3>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-24 w-full bg-white/[0.02] animate-pulse rounded-[1.5rem] border border-white/5" />
                            ))
                        ) : sortedEvents.length === 0 ? (
                            <div className="p-12 rounded-[2rem] bg-white/[0.01] border border-dashed border-white/5 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/10">Zero Directives Found</p>
                            </div>
                        ) : (
                            sortedEvents.map((event, i) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-5 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] rounded-[2rem] transition-all group cursor-pointer"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                            <span className="text-[9px] font-black uppercase tracking-tighter">
                                                {new Date(event.startTime).toLocaleString('default', { month: 'short' })}
                                            </span>
                                            <span className="text-lg font-black leading-none">{new Date(event.startTime).getDate()}</span>
                                        </div>
                                        <div className="flex-1 space-y-1 mt-1">
                                            <h4 className="text-[13px] font-black text-white/80 leading-tight group-hover:text-white transition-colors">{event.title}</h4>
                                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/20">
                                                <span className="flex items-center gap-1 group-hover:text-indigo-400/60 transition-colors">
                                                    <Clock className="h-3 w-3" />
                                                    {event.isAllDay ? 'All Day' : new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-white/10 mt-1">
                                                    <MapPin className="h-2.5 w-2.5" />
                                                    {event.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
