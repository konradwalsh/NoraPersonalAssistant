import { Button } from '@/components/ui/button';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Flag, Zap, Clock, User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageCardProps {
  message: Message;
  onClick: () => void;
  onMarkProcessed: () => void;
  onFlagFollowUp: () => void;
  active?: boolean;
}

export function MessageCard({ message, onClick, onMarkProcessed, onFlagFollowUp, active }: MessageCardProps) {
  const sender = message.fromName || message.fromAddress || 'Unknown Sender';
  const date = new Date(message.receivedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const isProcessed = !!message.processedAt;
  const hasAnalysis = message.aiAnalyses && message.aiAnalyses.length > 0;
  const analysisStatus = hasAnalysis ? message.aiAnalyses![0].status : 'none';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group relative p-6 rounded-[2.5rem] transition-all duration-500 cursor-pointer overflow-hidden",
        "border border-white/5 bg-[#0d0d0d] hover:bg-[#121212]",
        active ? "border-indigo-500/50 bg-[#121212] shadow-2xl shadow-indigo-500/10" : "hover:border-white/10"
      )}
    >
      {/* Active Indicator Gradient */}
      {active && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
      )}

      <div className="flex flex-col gap-4">
        {/* Header: Sender & Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-inner",
              active ? "bg-indigo-500 text-white" : "bg-white/5 text-white/40 group-hover:bg-white/10"
            )}>
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className={cn(
                "text-xs font-black uppercase tracking-widest transition-colors",
                active ? "text-indigo-400" : "text-white/40 group-hover:text-white/60"
              )}>
                {sender.split(' ')[0]}
              </p>
              <h3 className="text-sm font-black text-white leading-none mt-1 truncate max-w-[160px]">
                {sender}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {analysisStatus === 'completed' && (
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Zap className="h-3 w-3 text-indigo-400" />
              </div>
            )}
            {isProcessed && (
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              </div>
            )}
          </div>
        </div>

        {/* Content: Subject & Snippet */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-white leading-tight line-clamp-1 italic tracking-tight uppercase">
            {message.subject || '(No Subject)'}
          </h4>
          <p className="text-xs text-white/30 leading-relaxed line-clamp-2 font-medium">
            {message.bodyPlain || 'No preview available...'}
          </p>
        </div>

        {/* Footer: Date & Actions */}
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-white/40">
            <Clock className="h-3 w-3 opacity-50" />
            {date}
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isProcessed && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/5"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkProcessed();
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full hover:bg-amber-500/10 hover:text-amber-400 border border-white/5"
              onClick={(e) => {
                e.stopPropagation();
                onFlagFollowUp();
              }}
            >
              <Flag className="h-4 w-4" />
            </Button>
            <div className="h-8 w-8 rounded-full flex items-center justify-center border border-white/5 bg-white/5">
              <ChevronRight className="h-4 w-4 text-white/20" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}