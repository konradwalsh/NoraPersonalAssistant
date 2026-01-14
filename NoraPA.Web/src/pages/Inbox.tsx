import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  CheckCircle2,
  Flag,
  Zap,
  Clock,
  User,
  Mail,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  Inbox as InboxIcon,
  FileText,
  Code,
  Paperclip,
  Download,
  AlertTriangle,
  MoreVertical,
  Trash2,
  ArrowRight,
  RefreshCw,
  PenTool
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AiAnalysisDisplay } from '@/components/AiAnalysisDisplay';


type FilterType = 'all' | 'unprocessed' | 'processed' | 'follow-up';
type SortType = 'newest' | 'oldest' | 'sender';

/**
 * Main Inbox component responsible for displaying, filtering, sorting, and processing messages.
 * Handles the communication lifecycle: List -> Detail -> AI Analysis -> Action.
 */
export default function Inbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [viewMode, setViewMode] = useState<'plain' | 'html'>('plain');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [search, setSearch] = useState('');

  // New State
  const [isDrafting, setIsDrafting] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [messages, filter, sort, search]);

  // Clear draft when message changes
  useEffect(() => {
    setDraft(null);
    setIsDrafting(false);
  }, [selectedMessage?.id]);

  // Polling for AI Analysis status
  useEffect(() => {
    let pollInterval: any;

    const isProcessing = selectedMessage?.aiAnalyses?.some(a => a.status === 'processing');

    if (isProcessing && selectedMessage) {
      pollInterval = setInterval(async () => {
        try {
          const freshMessage = await apiClient.getMessage(selectedMessage.id);
          const stillProcessing = freshMessage.aiAnalyses?.some(a => a.status === 'processing');

          if (!stillProcessing) {
            // Update messages list
            setMessages(prev => prev.map(m => m.id === freshMessage.id ? freshMessage : m));
            // Update selected message
            setSelectedMessage(freshMessage);
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Polling failed', error);
        }
      }, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [selectedMessage?.id, selectedMessage?.aiAnalyses?.[0]?.status]);

  /**
   * Fetches messages from the backend API.
   * Updates loading state and handles errors.
   */
  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMessages();
      setMessages(data);
      return data;
    } catch (error) {
      toast.error('Failed to sync messages');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const cycleSort = () => {
    const sorts: SortType[] = ['newest', 'oldest', 'sender'];
    const nextIndex = (sorts.indexOf(sort) + 1) % sorts.length;
    setSort(sorts[nextIndex]);
    toast.success(`Sorting by ${sorts[nextIndex]}`, { duration: 1000 });
  };

  const applyFiltersAndSort = () => {
    let filtered = messages.filter(message => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          (message.subject?.toLowerCase().includes(searchLower)) ||
          (message.fromName?.toLowerCase().includes(searchLower)) ||
          (message.fromAddress?.toLowerCase().includes(searchLower)) ||
          (message.bodyPlain?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Status filter
      switch (filter) {
        case 'unprocessed':
          return !message.processedAt;
        case 'processed':
          return !!message.processedAt;
        case 'follow-up':
          return message.importance === 'follow-up';
        default:
          return true;
      }
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
        case 'sender':
          const aSender = a.fromName || a.fromAddress || '';
          const bSender = b.fromName || b.fromAddress || '';
          return aSender.localeCompare(bSender);
        default: // newest
          return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
      }
    });

    setFilteredMessages(filtered);
  };

  const handleMarkProcessed = async (messageId: number) => {
    try {
      await apiClient.updateMessage(messageId, {
        processedAt: new Date().toISOString()
      });
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, processedAt: new Date().toISOString() }
          : msg
      ));
      toast.success('Archived to processed');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleFlagFollowUp = async (messageId: number) => {
    try {
      await apiClient.updateMessage(messageId, {
        importance: 'follow-up'
      });
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, importance: 'follow-up' }
          : msg
      ));
      toast.success('Pinned for follow-up');
    } catch (error) {
      toast.error('Failed to set priority');
    }
  };

  /**
   * Triggers or retries AI analysis for a specific message.
   * If analysis is already processing, it should ideally prevent re-submission (handled by UI state).
   * @param messageId - The ID of the message to analyze
   * @param instructions - Optional user feedback/instructions to refine the analysis
   */
  const handleAnalyzeMessage = async (messageId: number, instructions?: string) => {
    const toastId = toast.loading('Initializing Intelligence...');
    try {
      const pendingAnalysis = await apiClient.analyzeMessage(messageId, { instructions });
      toast.success('Intelligence analysis queued', { id: toastId });

      // Build updated message with the new "processing" record at the top
      if (selectedMessage && selectedMessage.id === messageId) {
        const updatedMsg = {
          ...selectedMessage,
          aiAnalyses: [pendingAnalysis, ...(selectedMessage.aiAnalyses || [])]
        };
        setSelectedMessage(updatedMsg);
        setMessages(prev => prev.map(m => m.id === messageId ? updatedMsg : m));
      } else {
        await loadMessages();
      }
    } catch (error) {
      toast.error('AI Processing failed', { id: toastId });
    }
  };

  const handleDraftReply = async () => {
    if (!selectedMessage) return;
    setIsDrafting(true);
    setDraft(null);
    const toastId = toast.loading('Drafting response...');
    try {
      const res = await apiClient.draftReply(selectedMessage.id);
      setDraft(res.draft);
      toast.success('Reply drafted', { id: toastId });
    } catch (err) {
      setDraft(null);
      toast.error('Failed to draft reply', { id: toastId });
    } finally {
      setIsDrafting(false);
    }
  };

  const handleAddContact = async (contactData: any) => {
    try {
      await apiClient.createContact({
        ...contactData,
        sourceMessageId: selectedMessage?.id
      });
      toast.success(`Contact '${contactData.name}' saved to Nora's memory.`);
    } catch (error) {
      toast.error('Failed to save contact');
    }
  };

  const handleAddEvent = async (eventData: any) => {
    try {
      await apiClient.createCalendarEvent({
        ...eventData,
        sourceMessageId: selectedMessage?.id
      });
      toast.success(`Event '${eventData.title}' scheduled in Nora.`);
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Inbox Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-black tracking-tighter">Inbox</h1>
            <div className="h-6 px-2 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black flex items-center justify-center uppercase tracking-widest border border-indigo-500/20">
              {filteredMessages.length} Messages
            </div>
          </div>
          <p className="text-sm font-medium text-white/30">Process your digital footprint with AI precision.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMessages}
            className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white/70"
          >
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="rounded-xl bg-white text-black hover:bg-white/90 font-bold px-6 shadow-xl shadow-indigo-500/20">
            Sync Accounts
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
          <Input
            placeholder="Search Intelligence Feed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 bg-white/5 border-white/5 rounded-2xl pl-12 pr-4 focus:ring-indigo-500/50 transition-all placeholder:text-white/20 text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          <div className="flex bg-white/5 border border-white/5 p-1 rounded-2xl h-12">
            {(['all', 'unprocessed', 'processed', 'follow-up'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                  filter === f ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-white/5 mx-2 hidden lg:block" />

          <Button
            variant="outline"
            size="icon"
            onClick={cycleSort}
            className={cn(
              "h-12 w-12 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all",
              sort !== 'newest' ? "text-indigo-400 border-indigo-500/20 bg-indigo-500/5" : "text-white/40"
            )}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-white/40">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Message List */}
      <div className="space-y-3 relative min-h-[400px]">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-28 w-full rounded-2xl bg-white/5 border border-white/5 animate-pulse"
              />
            ))
          ) : filteredMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-dashed border-white/5 rounded-3xl"
            >
              <InboxIcon className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-sm font-medium text-white/30">Your inbox is pristine.</p>
            </motion.div>
          ) : (
            filteredMessages.map((message, idx) => {
              const date = new Date(message.receivedAt);
              const hasAnalysis = message.aiAnalyses && message.aiAnalyses.length > 0;
              const isProcessing = message.aiAnalyses?.some(a => a.status === 'processing');

              return (
                <motion.div
                  layout
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedMessage(message)}
                  className={cn(
                    "group relative overflow-hidden flex items-center gap-6 p-5 rounded-2xl border transition-all cursor-pointer",
                    "bg-[#121212] border-white/5 hover:border-white/10 hover:bg-white/[0.03]",
                    selectedMessage?.id === message.id && "border-indigo-500/40 bg-indigo-500/[0.02]"
                  )}
                >
                  <div className="flex-shrink-0 relative">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                      <User className="h-5 w-5" />
                    </div>
                    {message.importance === 'follow-up' && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 border-2 border-[#121212] shadow-lg flex items-center justify-center">
                        <Flag className="h-2 w-2 text-white fill-current" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 group-hover:text-indigo-300 transition-colors">
                        {message.fromName || message.fromAddress?.split('@')[0] || 'Unknown Origin'}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-white/10" />
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-black text-white/30 ml-auto">
                          <Paperclip className="h-2.5 w-2.5" />
                          {message.attachments.length}
                        </div>
                      )}
                    </div>
                    <h3 className="text-[15px] font-black text-white/90 truncate pr-8 tracking-tight group-hover:translate-x-1 transition-transform">
                      {message.subject || '(No Subject Provided)'}
                    </h3>
                    <p className="text-xs text-white/30 truncate pr-12 font-medium">
                      {message.bodyPlain || 'No readable preview available for this communication.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pr-2">
                    {hasAnalysis && (
                      <div className={cn(
                        "flex items-center gap-2 h-7 px-3 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                        isProcessing
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                          : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                      )}>
                        {isProcessing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Zap className="h-3 w-3 fill-current" />
                        )}
                        <span>{isProcessing ? 'Thinking' : 'Analyzed'}</span>
                      </div>
                    )}

                    <div className="flex gap-1.5 items-center opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFlagFollowUp(message.id);
                        }}
                        className="h-10 w-10 rounded-2xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-500 text-white/20 border border-white/5"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkProcessed(message.id);
                        }}
                        className="h-10 w-10 rounded-2xl bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 text-white/20 border border-white/5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden bg-[#0f0f0f] border-white/5 flex flex-col md:flex-row gap-0">
          <div className="flex h-full w-full overflow-hidden">
            {/* Context Sidebar (Left) */}
            <div className="w-80 border-r border-white/5 bg-black/40 flex flex-col hidden lg:flex">
              <div className="p-6 border-b border-white/5">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20">Message Identity</span>
                <div className="mt-4 flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5">
                    <div className="h-full w-full rounded-[9px] bg-black flex items-center justify-center font-black text-xs">
                      {selectedMessage?.fromName?.[0] || 'U'}
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate">{selectedMessage?.fromName || 'Unknown'}</span>
                    <span className="text-[10px] text-white/30 truncate">{selectedMessage?.fromAddress}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-8 overflow-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.1em] font-black text-white/20">Metadata</span>
                    <Clock className="h-3 w-3 text-white/20" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40">Received</span>
                      <span className="text-[10px] font-bold text-white/70">{selectedMessage ? new Date(selectedMessage.receivedAt).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40">Source</span>
                      <span className="text-[10px] font-bold text-indigo-400">Gmail API</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40">Priority</span>
                      <span className="text-[10px] font-bold text-amber-500">{selectedMessage?.importance || 'Normal'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] uppercase tracking-[0.1em] font-black text-white/20">AI Actions</span>
                  <div className="grid gap-2">
                    <Button
                      onClick={() => selectedMessage && handleAnalyzeMessage(selectedMessage.id)}
                      disabled={selectedMessage?.aiAnalyses?.some(a => a.status === 'processing')}
                      className="w-full justify-start gap-3 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-400 text-xs font-bold py-5 h-auto group"
                    >
                      <Zap className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      {selectedMessage?.aiAnalyses?.some(a => a.status === 'processing') ? 'Analyzing...' : 'Generate Intelligence'}
                    </Button>
                    <Button
                      onClick={() => selectedMessage && handleAnalyzeMessage(selectedMessage.id)}
                      disabled={selectedMessage?.aiAnalyses?.some(a => a.status === 'processing')}
                      variant="outline"
                      className="w-full justify-start gap-3 border-white/5 bg-white/5 hover:bg-white/10 text-white/70 rounded-2xl text-xs font-bold py-5 h-auto group"
                    >
                      <ArrowUpDown className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                      {selectedMessage?.aiAnalyses?.some(a => a.status === 'processing') ? 'Extracting...' : 'Extract Entities'}
                    </Button>
                    <Button
                      onClick={handleDraftReply}
                      disabled={isDrafting}
                      className="w-full justify-start gap-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-400 text-xs font-bold py-5 h-auto group shadow-lg"
                    >
                      <PenTool className="h-4 w-4 group-hover:-translate-y-1 transition-transform" />
                      {isDrafting ? 'Writing...' : 'Draft Reply'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content (Middle/Right) */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
              <DialogHeader className="p-8 pb-4 border-b border-white/5 space-y-4">
                <div className="flex items-start justify-between">
                  <DialogTitle className="text-2xl font-black tracking-tighter leading-tight max-w-[80%] uppercase italic">
                    {selectedMessage?.subject || '(No Subject)'}
                  </DialogTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(null)} className="rounded-full hover:bg-white/10 text-white/30">
                    <ChevronRight className="h-5 w-5 rotate-90" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-black uppercase text-white/40 tracking-widest leading-none">
                    Reference ID: {selectedMessage?.id}
                  </div>
                  {selectedMessage?.lifeDomain && (
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-white/40 uppercase tracking-wider">{selectedMessage.lifeDomain}</span>
                  )}
                  {selectedMessage?.attachments && selectedMessage.attachments.length > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                      <Paperclip className="h-2.5 w-2.5" />
                      {selectedMessage.attachments.length} {selectedMessage.attachments.length === 1 ? 'File' : 'Files'}
                    </span>
                  )}
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-auto p-8 space-y-12">

                {draft && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-400 flex items-center gap-2">
                        <PenTool className="h-3 w-3" />
                        Generated Draft
                      </h4>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] hover:bg-emerald-500/20 text-emerald-400" onClick={() => navigator.clipboard.writeText(draft).then(() => toast.success('Copied'))}>Copy to Clipboard</Button>
                    </div>
                    <div className="text-sm font-medium text-white/80 whitespace-pre-wrap font-mono leading-relaxed selection:bg-emerald-500/30">
                      {draft}
                    </div>
                  </motion.div>
                )}

                {/* Message Body */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-400 flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Original Communication
                    </h4>
                    <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl">
                      <button
                        onClick={() => setViewMode('plain')}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
                          viewMode === 'plain' ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"
                        )}
                      >
                        <FileText className="h-3 w-3" /> Plain
                      </button>
                      <button
                        onClick={() => setViewMode('html')}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
                          viewMode === 'html' ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"
                        )}
                      >
                        <Code className="h-3 w-3" /> Visual
                      </button>
                    </div>
                  </div>
                  <div className={cn(
                    "border border-white/5 rounded-3xl overflow-hidden shadow-inner shadow-black/50",
                    viewMode === 'html' ? "bg-white text-black" : "bg-[#121212] p-8 text-white/70"
                  )}>
                    {viewMode === 'html' && selectedMessage?.bodyHtml ? (
                      <div className="html-wrapper w-full bg-white rounded-3xl overflow-hidden min-h-[400px]">
                        <iframe
                          title="email-content"
                          srcDoc={selectedMessage.bodyHtml}
                          className="w-full min-h-[500px] border-none"
                          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                          onLoad={(e) => {
                            const iframe = e.currentTarget;
                            // Resize height to fit content if possible
                            if (iframe.contentWindow) {
                              // Inject base styles for readability
                              const doc = iframe.contentWindow.document;
                              doc.body.style.fontFamily = 'Inter, system-ui, sans-serif';
                              doc.body.style.margin = '20px';
                              // Attempt resize (cross-origin might block this if not same-origin srcDoc)
                              iframe.style.height = (doc.body.scrollHeight + 50) + 'px';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {selectedMessage?.bodyPlain || selectedMessage?.bodyHtml || 'No content provided in this message block.'}
                      </div>
                    )}
                  </div>
                </section>

                {/* Real Attachments */}
                {selectedMessage?.attachments && selectedMessage.attachments.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-amber-400 flex items-center gap-2">
                        <Paperclip className="h-3 w-3" />
                        Secure Attachments & Assets
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold text-[9px]">
                        {selectedMessage.attachments.length} LOCAL FILES
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedMessage.attachments.map(att => (
                        <div key={att.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all cursor-default">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2.5 bg-black/40 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                              <FileText className="h-4 w-4 text-white/40 group-hover:text-indigo-400" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-white/90 truncate max-w-[150px]">{att.filename}</p>
                              <p className="text-[10px] text-white/30 font-medium">{(att.sizeBytes / 1024).toFixed(1)} KB • {att.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-xl bg-white/5 text-white/40 hover:bg-indigo-500 hover:text-white border border-white/5 transition-all"
                            onClick={() => window.open(`${API_BASE}/attachments/${att.id}/download`, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Intelligence Sections */}
                {selectedMessage?.aiAnalyses && selectedMessage.aiAnalyses.length > 0 && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-400 flex items-center gap-2">
                        <Zap className="h-3 w-3 fill-current" />
                        Extracted Action Intelligence
                      </h4>
                      <span className="text-[10px] text-white/20">
                        {selectedMessage.aiAnalyses[0].modelUsed ? `Neural Core: ${selectedMessage.aiAnalyses[0].modelUsed.toUpperCase()}` : 'Neural Analysis Engine'}
                      </span>
                    </div>
                    <AiAnalysisDisplay
                      analysis={selectedMessage.aiAnalyses[0]}
                      onAddContact={handleAddContact}
                      onAddEvent={handleAddEvent}
                      onRetry={(instructions) => handleAnalyzeMessage(selectedMessage!.id, instructions)}
                      onConfirm={() => handleMarkProcessed(selectedMessage!.id)}
                    />
                  </section>
                )}

                {/* (Duplicate Attachments Section Removed) */}

                {(!selectedMessage?.aiAnalyses || selectedMessage.aiAnalyses.length === 0) && (
                  <div className="py-12 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center space-y-4 text-center">
                    <Zap className="h-8 w-8 text-white/5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest">No Intelligence Found</p>
                      <p className="text-[11px] text-white/20 max-w-[200px]">Click 'Generate Intelligence' to analyze this communication.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
