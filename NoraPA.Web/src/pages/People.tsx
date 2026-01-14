import { useState, useEffect } from 'react';
import { User, Search, Plus, Mail, Phone, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import type { Contact } from '@/lib/types';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function People() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getContacts();
            setContacts(data);
        } catch (error) {
            toast.error('Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.organization?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Premium Bento Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <User className="h-24 w-24 text-emerald-500 -rotate-12" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Neural Network</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter text-white leading-none">
                                Identity <span className="text-white/20">Directory</span>
                            </h1>
                            <p className="text-sm font-medium text-white/40 mt-4 max-w-md leading-relaxed">
                                Curating and managing the cognitive map of your most relevant human connections and collaborators.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                            <Building className="h-6 w-6" />
                        </div>
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div>
                        <div className="text-4xl font-black tracking-tighter tabular-nums text-white group-hover:scale-105 transition-transform origin-left">{contacts.length}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mt-1">Identified Entities</div>
                    </div>
                </div>
            </div>

            {/* Modern Search & Action Bar */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-2 flex flex-col md:flex-row gap-2">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Query Identity Index..."
                        className="bg-transparent border-none h-14 pl-14 text-[13px] font-medium placeholder:text-white/10 focus-visible:ring-0"
                    />
                </div>
                <div className="flex items-center gap-2 pr-2">
                    <Button className="rounded-2xl bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest px-8 h-12 shadow-2xl shadow-emerald-500/10">
                        <Plus className="h-4 w-4 mr-2" /> Add Entity
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-48 w-full bg-white/[0.02] animate-pulse rounded-[2.5rem] border border-white/5" />
                    ))}
                </div>
            ) : filteredContacts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-24 flex flex-col items-center justify-center space-y-4"
                >
                    <div className="h-20 w-20 rounded-[2rem] bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center">
                        <User className="h-8 w-8 text-white/10" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-black text-white/40 uppercase tracking-widest">Zero Entities Resolved</p>
                        <p className="text-[11px] font-bold text-white/10 uppercase tracking-widest mt-1 italic">"The directory is silent"</p>
                    </div>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContacts.map((contact, i) => (
                        <motion.div
                            key={contact.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group relative p-8 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] rounded-[2.5rem] transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-5 mb-6">
                                <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 p-px group-hover:scale-110 transition-transform">
                                    <div className="h-full w-full rounded-[1.4rem] bg-black flex items-center justify-center font-black text-white/90 text-2xl tracking-tighter">
                                        {contact.name.charAt(0)}
                                    </div>
                                </div>
                                <div className="space-y-1 overflow-hidden">
                                    <h3 className="text-lg font-black tracking-tighter text-white/80 group-hover:text-white transition-colors truncate">{contact.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-emerald-500/40" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 truncate">
                                            {contact.organization || contact.title || 'Freelance / Unaffiliated'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-white/5">
                                {contact.email && (
                                    <div className="flex items-center gap-3 text-[11px] font-bold text-white/30 group-hover:text-white/60 transition-colors">
                                        <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all">
                                            <Mail className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="truncate">{contact.email}</span>
                                    </div>
                                )}
                                {contact.phone && (
                                    <div className="flex items-center gap-3 text-[11px] font-bold text-white/30 group-hover:text-white/60 transition-colors">
                                        <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all">
                                            <Phone className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="truncate">{contact.phone}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
