import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Upload, Link as LinkIcon, Download, ExternalLink, Calendar, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import type { Attachment } from '@/lib/types';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function Documents() {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'files' | 'links'>('all');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getAttachments();
            setAttachments(data);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
            toast.error('Could not load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (id: number, filename: string) => {
        window.open(`/api/attachments/${id}/download`, '_blank');
    };

    const filteredAttachments = attachments.filter(doc => {
        const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.message?.subject?.toLowerCase().includes(searchTerm.toLowerCase());

        const isLink = doc.mimeType === 'text/uri-list';

        if (activeFilter === 'files') return matchesSearch && !isLink;
        if (activeFilter === 'links') return matchesSearch && isLink;
        return matchesSearch;
    });

    const categories = [
        { id: 'all', label: 'Registry' },
        { id: 'files', label: 'Archives' },
        { id: 'links', label: 'Directives' }
    ];

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-white/20">
                <div className="relative">
                    <FileText className="h-12 w-12 animate-pulse" />
                    <div className="absolute inset-0 blur-2xl bg-cyan-500/20 animate-pulse" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Decrypting Vault</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Premium Bento Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 p-8 rounded-[2.5rem] bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText className="h-24 w-24 text-cyan-500 rotate-6" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Secure Repository</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter text-white leading-none">
                                Virtual <span className="text-white/20">Archives</span>
                            </h1>
                            <p className="text-sm font-medium text-white/40 mt-4 max-w-lg leading-relaxed">
                                "Ideas and assets are the currency of the information age. Secure your wealth."
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    </div>
                    <div>
                        <div className="text-4xl font-black tracking-tighter tabular-nums text-white group-hover:scale-105 transition-transform origin-left">{attachments.length}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60 mt-1">Total Assets</div>
                    </div>
                </div>
            </div>

            {/* Neural Controls */}
            <div className="flex flex-col lg:flex-row gap-6 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                    <Input
                        placeholder="Search encrypted records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-16 bg-white/[0.02] border-white/5 rounded-2xl pl-14 pr-4 focus:ring-cyan-500/30 transition-all placeholder:text-white/10 text-[15px] font-medium"
                    />
                </div>

                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveFilter(cat.id as any)}
                            className={cn(
                                "px-6 py-2.5 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all",
                                activeFilter === cat.id
                                    ? 'bg-white text-black shadow-lg shadow-white/5'
                                    : 'text-white/30 hover:text-white hover:bg-white/5'
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Registry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredAttachments.map((doc, index) => {
                        const isLink = doc.mimeType === 'text/uri-list';
                        return (
                            <motion.div
                                key={doc.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: index * 0.03 }}
                                className="group relative p-6 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all flex flex-col gap-6 overflow-hidden"
                            >
                                <div className={cn(
                                    "absolute -top-12 -right-12 w-32 h-32 blur-[40px] opacity-[0.03] group-hover:opacity-[0.1] transition-opacity rounded-full",
                                    isLink ? "bg-cyan-500" : "bg-indigo-500"
                                )} />

                                <div className="flex items-start justify-between relative z-10">
                                    <div className={cn(
                                        "p-4 rounded-2xl shadow-inner border transition-all group-hover:scale-110 duration-500",
                                        isLink
                                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                    )}>
                                        {isLink ? <LinkIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-white/20 bg-white/5 px-2.5 py-1 rounded-lg uppercase tracking-[0.2em] border border-white/5">
                                            {isLink ? 'Redirect' : 'Archive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 flex-1 relative z-10">
                                    <h3 className="text-lg font-black text-white leading-tight tracking-tight line-clamp-2" title={doc.filename}>
                                        {doc.filename}
                                    </h3>
                                    {doc.message && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest line-clamp-1">
                                                Origin: {doc.message.subject}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                        {isLink ? (
                                            <a
                                                href={doc.localPath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-10 px-5 flex items-center gap-2 rounded-2xl bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                                            >
                                                Access <ExternalLink className="h-3 w-3" />
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => handleDownload(doc.id, doc.filename)}
                                                className="h-10 px-5 flex items-center gap-2 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
                                            >
                                                Retrieve <Download className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {filteredAttachments.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-32 space-y-6"
                >
                    <div className="h-24 w-24 rounded-full bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center">
                        <File className="h-10 w-10 text-white/5" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Vault Query Negative</p>
                        <p className="text-[11px] text-white/20 italic italic leading-relaxed">No matching encrypted records found in neural indexing.</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
