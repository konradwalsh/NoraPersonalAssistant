import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isError?: boolean;
}

export default function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Greetings Konrad. My neural pathways are synchronizing. I have access to your Inbox, Tasks, and Vault. How shall we proceed today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (text?: string) => {
        const messageText = (text || input).trim();
        if (!messageText || isTyping) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!text) setInput('');
        setIsTyping(true);

        try {
            const response = await apiClient.sendChat(messageText);

            const assistantMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMsg]);

        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "I'm experiencing a neural disconnect. Please verify my core connection and attempt to resend.",
                timestamp: new Date(),
                isError: true
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const suggestions = [
        "Analyze recent emails",
        "Summary of my tasks",
        "Check my schedule for tomorrow",
        "Draft a follow-up email"
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto w-full relative"
        >
            {/* Chat Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Neural Core Active</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter leading-none">
                        Ask <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Nora</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-4 rounded-3xl backdrop-blur-md">
                    <div className="flex flex-col items-end pr-4 border-r border-white/5">
                        <div className="text-xl font-black tracking-tighter tabular-nums leading-none">99.8%</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-white/20 mt-1">Accuracy</div>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Sparkles className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 min-h-0 bg-white/[0.02] border border-white/5 rounded-[40px] flex flex-col overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                {/* Scrollable Messages */}
                <div
                    className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative z-10"
                    ref={scrollRef}
                >
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex gap-6 max-w-4xl",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-2xl relative group transition-transform hover:scale-110",
                                msg.role === 'user'
                                    ? "bg-white/[0.05] text-white border border-white/10"
                                    : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20"
                            )}>
                                {msg.role === 'user' ? <User className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
                                {msg.role === 'assistant' && (
                                    <div className="absolute -inset-1 bg-indigo-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </div>

                            <div className={cn(
                                "flex flex-col gap-2",
                                msg.role === 'user' ? "items-end text-right" : "items-start text-left"
                            )}>
                                <div className={cn(
                                    "p-6 rounded-[32px] text-[15px] leading-relaxed relative overflow-hidden",
                                    msg.role === 'user'
                                        ? "bg-white/[0.05] text-white border border-white/10 rounded-tr-none marker:bg-indigo-500"
                                        : msg.isError
                                            ? "bg-red-500/10 text-red-100 border border-red-500/20 rounded-tl-none font-medium"
                                            : "bg-[#0a0a0a] text-white/90 border border-white/5 rounded-tl-none shadow-xl"
                                )}>
                                    {msg.content.split('\n').map((line, i) => (
                                        <p key={i} className={cn(i > 0 && "mt-3")}>{line}</p>
                                    ))}

                                    <div className={cn(
                                        "mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/10",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}>
                                        <Calendar className="h-3 w-3" />
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6 max-w-4xl mr-auto">
                            <div className="h-12 w-12 rounded-2xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20">
                                <Bot className="h-6 w-6" />
                            </div>
                            <div className="bg-black/60 p-6 rounded-[32px] rounded-tl-none border border-white/5 flex items-center gap-3">
                                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="h-2 w-2 bg-indigo-400 rounded-full" />
                                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-2 w-2 bg-indigo-400 rounded-full" />
                                <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-2 w-2 bg-indigo-400 rounded-full" />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Quick Actions Suggestions */}
                <div className="px-8 pb-4 flex flex-wrap gap-2 relative z-10">
                    {suggestions.map((text, i) => (
                        <motion.button
                            key={text}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            onClick={() => handleSend(text)}
                            className="px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                            {text}
                        </motion.button>
                    ))}
                </div>

                {/* Premium Input Area */}
                <div className="p-8 bg-black/40 border-t border-white/5 relative z-10 backdrop-blur-xl">
                    <div className="relative flex items-center max-w-4xl mx-auto group">
                        <div className="absolute inset-0 bg-indigo-500/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Input
                            placeholder="Direct Nora to analyze, reason, or act..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            disabled={isTyping}
                            className="h-20 bg-white/[0.02] border-white/10 rounded-3xl pl-8 pr-20 py-6 text-[15px] font-medium focus:ring-indigo-500/30 transition-all placeholder:text-white/10 shadow-inner"
                        />
                        <div className="absolute right-4 flex items-center gap-3">
                            <Button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isTyping}
                                className="h-12 w-12 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-400 shadow-xl shadow-indigo-500/20 p-0 flex items-center justify-center transition-transform hover:scale-105"
                            >
                                {isTyping ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-center text-[9px] text-white/10 mt-6 font-black uppercase tracking-[0.3em]">
                Neural Reasoning Engine v2.0 • Konrad-01 Authorization Verified
            </p>
        </motion.div>
    );
}
