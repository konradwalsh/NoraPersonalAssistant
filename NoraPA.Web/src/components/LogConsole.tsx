import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal,
    X,
    Trash2,
    Download,
    Filter,
    Minimize2,
    Maximize2,
    ChevronDown,
    AlertCircle,
    AlertTriangle,
    Info,
    Bug,
    Zap,
    Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logger, { type LogEntry, LogLevel, LogLevelNames, LogLevelClasses } from '@/lib/logger';

interface LogConsoleProps {
    isOpen: boolean;
    onClose: () => void;
}

const LogLevelIcons: Record<LogLevel, React.ElementType> = {
    [LogLevel.Trace]: Activity,
    [LogLevel.Debug]: Bug,
    [LogLevel.Info]: Info,
    [LogLevel.Warn]: AlertTriangle,
    [LogLevel.Error]: AlertCircle,
    [LogLevel.Critical]: Zap,
};

export default function LogConsole({ isOpen, onClose }: LogConsoleProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filterLevel, setFilterLevel] = useState<LogLevel>(LogLevel.Trace);
    const [filterSource, setFilterSource] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load initial logs and subscribe to updates
    useEffect(() => {
        setLogs(logger.getLogs({ limit: 200 }));

        const unsubscribe = logger.subscribe((entry) => {
            if (entry.id === -1) {
                // Clear signal
                setLogs([]);
            } else {
                setLogs(prev => [entry, ...prev].slice(0, 200));
            }
        });

        return unsubscribe;
    }, []);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll]);

    const filteredLogs = logs.filter(log => {
        if (log.level < filterLevel) return false;
        if (filterSource && !log.source.toLowerCase().includes(filterSource.toLowerCase())) return false;
        return true;
    });

    const handleClear = useCallback(() => {
        logger.clear();
    }, []);

    const handleExport = useCallback(() => {
        const data = JSON.stringify(logs, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nora-logs-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [logs]);

    const formatTimestamp = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={cn(
                    "fixed z-50 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50",
                    "flex flex-col backdrop-blur-xl",
                    isMinimized
                        ? "bottom-4 right-4 w-72 h-12"
                        : "bottom-4 right-4 w-[600px] h-[450px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)]"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10">
                            <Terminal className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white/80">Log Console</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[9px] font-bold text-white/40">
                                {filteredLogs.length} entries
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {!isMinimized && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-white/40 hover:text-white/80 hover:bg-white/5"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-white/40 hover:text-white/80 hover:bg-white/5"
                                    onClick={handleExport}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                                    onClick={handleClear}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/40 hover:text-white/80 hover:bg-white/5"
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/40 hover:text-white/80 hover:bg-white/5"
                            onClick={onClose}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Filters */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-b border-white/5 overflow-hidden"
                                >
                                    <div className="p-3 flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-white/30 uppercase">Level</span>
                                            <div className="relative">
                                                <select
                                                    value={filterLevel}
                                                    onChange={(e) => setFilterLevel(Number(e.target.value) as LogLevel)}
                                                    aria-label="Filter log level"
                                                    className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 pr-8 text-xs text-white/80 focus:outline-none focus:border-indigo-500/50"
                                                >
                                                    {Object.entries(LogLevelNames).map(([level, name]) => (
                                                        <option key={level} value={level} className="bg-[#1a1a1a]">
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-[10px] font-bold text-white/30 uppercase">Source</span>
                                            <input
                                                type="text"
                                                value={filterSource}
                                                onChange={(e) => setFilterSource(e.target.value)}
                                                placeholder="Filter by source..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={autoScroll}
                                                onChange={(e) => setAutoScroll(e.target.checked)}
                                                className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/50"
                                            />
                                            <span className="text-[10px] font-bold text-white/40">Auto-scroll</span>
                                        </label>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Log entries */}
                        <div
                            ref={containerRef}
                            className="flex-1 overflow-y-auto font-mono text-[11px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                        >
                            {filteredLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-white/20">
                                    <Terminal className="h-8 w-8 mb-2" />
                                    <p className="text-xs">No logs to display</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-0.5">
                                    {filteredLogs.map((log) => {
                                        const Icon = LogLevelIcons[log.level];
                                        const levelClass = LogLevelClasses[log.level];

                                        return (
                                            <div
                                                key={log.id}
                                                className={cn(
                                                    "flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors group",
                                                    log.level >= LogLevel.Error && "bg-red-500/5"
                                                )}
                                            >
                                                <Icon
                                                    className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", levelClass)}
                                                />
                                                <span className="text-white/30 shrink-0 w-20">
                                                    {formatTimestamp(log.timestamp)}
                                                </span>
                                                <span
                                                    className={cn("shrink-0 w-16 font-bold", levelClass)}
                                                >
                                                    {LogLevelNames[log.level]}
                                                </span>
                                                <span className="text-indigo-400/70 shrink-0 w-28 truncate">
                                                    [{log.source}]
                                                </span>
                                                <span className="text-white/70 flex-1 break-all">
                                                    {log.message}
                                                </span>
                                                {log.data !== undefined && (
                                                    <span className="text-white/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        +data
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Status bar */}
                        <div className="px-4 py-2 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] text-white/30">Live</span>
                                </div>
                                <span className="text-[10px] text-white/20">
                                    Min Level: {LogLevelNames[logger.getSettings().minLevel]}
                                </span>
                            </div>
                            <span className="text-[10px] text-white/20">
                                Buffer: {logger.count}/{logger.getSettings().maxEntries}
                            </span>
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
