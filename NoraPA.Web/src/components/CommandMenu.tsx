import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    FileText,
    Search,
    Command,
    Inbox,
    CheckSquare,
    Settings,
    Home,
    User,
    MessageSquare,
    Sparkles,
    Zap,
    LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CommandItem {
    id: string;
    label: string;
    icon: any;
    shortcut?: string;
    action: () => void;
    category: string;
}

export function CommandMenu({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onClose(); // Toggle if already open, but here it's handled by parent
            }
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const commands: CommandItem[] = [
        { id: 'home', label: 'Go to Home', icon: Home, shortcut: 'G H', category: 'Navigation', action: () => navigate('/') },
        { id: 'inbox', label: 'Go to Inbox', icon: Inbox, shortcut: 'G I', category: 'Navigation', action: () => navigate('/inbox') },
        { id: 'tasks', label: 'Go to Tasks', icon: CheckSquare, shortcut: 'G T', category: 'Navigation', action: () => navigate('/tasks') },
        { id: 'chat', label: 'Ask Nora AI', icon: Sparkles, shortcut: 'G A', category: 'Intelligence', action: () => navigate('/chat') },
        { id: 'analytics', label: 'View Analytics', icon: LayoutGrid, shortcut: 'G L', category: 'Intelligence', action: () => navigate('/analytics') },
        { id: 'people', label: 'People & Identity', icon: User, shortcut: 'G P', category: 'Navigation', action: () => navigate('/people') },
        { id: 'documents', label: 'Access Vault', icon: FileText, shortcut: 'G V', category: 'Navigation', action: () => navigate('/documents') },
        { id: 'events', label: 'Temporal Schedule', icon: Calendar, shortcut: 'G E', category: 'Navigation', action: () => navigate('/events') },
        { id: 'settings', label: 'Open Settings', icon: Settings, shortcut: 'G S', category: 'System', action: () => navigate('/settings') },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        cmd.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                            <Search className="h-5 w-5 text-indigo-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search commands, pages, or Nora Intelligence..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-white/20 font-mono">
                                ESC
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
                            {filteredCommands.length > 0 ? (
                                <div className="space-y-4 p-2">
                                    {['Navigation', 'Intelligence', 'System'].map(category => {
                                        const catCmds = filteredCommands.filter(c => c.category === category);
                                        if (catCmds.length === 0) return null;
                                        return (
                                            <div key={category} className="space-y-1">
                                                <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">
                                                    {category}
                                                </h3>
                                                {catCmds.map(cmd => (
                                                    <button
                                                        key={cmd.id}
                                                        onClick={() => {
                                                            cmd.action();
                                                            onClose();
                                                        }}
                                                        className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-white/5 group transition-all text-left"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all border border-white/5 group-hover:border-indigo-500/20">
                                                                <cmd.icon className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">
                                                                    {cmd.label}
                                                                </div>
                                                                <div className="text-[10px] text-white/20 font-medium">
                                                                    Quick access to core functions
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {cmd.shortcut && (
                                                            <div className="flex gap-1">
                                                                {cmd.shortcut.split(' ').map((key, i) => (
                                                                    <kbd key={i} className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-white/30">
                                                                        {key}
                                                                    </kbd>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-12 text-center space-y-4">
                                    <div className="h-16 w-16 rounded-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center mx-auto">
                                        <Command className="h-8 w-8 text-white/10" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-white/40">No matching directives</p>
                                        <p className="text-[11px] text-white/20 italic">"Try searching for 'In' for Inbox or 'Set' for Settings"</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-white/20 uppercase tracking-widest">
                                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">↵</kbd>
                                    Execute
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-white/20 uppercase tracking-widest">
                                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">↑↓</kbd>
                                    Browse
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-3 w-3 text-indigo-400 animate-pulse" />
                                <span className="text-[9px] font-black text-indigo-400/50 uppercase tracking-widest">Neural Index Active</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
