import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
    id: number;
    timestamp: string;
    level: number;
    source: string;
    message: string;
    exception?: string;
}

const LogLevelNames = ["Trace", "Debug", "Info", "Warn", "Error", "Critical"];
const LogLevelColors = [
    "text-gray-400", "text-blue-400", "text-green-400", "text-yellow-400", "text-red-400", "text-red-600 font-bold"
];

export function LogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/logs?limit=100');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        try {
            await fetch('/api/logs', { method: 'DELETE' });
            setLogs([]);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(() => {
            if (autoRefresh) fetchLogs();
        }, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Live Logs</h3>
                    <Badge variant="outline" className="text-[10px] text-white/40 border-white/10">{logs.length} entries</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className={cn("h-7 text-[10px] uppercase font-bold tracking-wider", autoRefresh ? "text-emerald-400 bg-emerald-500/10" : "text-white/40")}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        {autoRefresh ? "Live" : "Paused"}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white/40 hover:text-white" onClick={fetchLogs}>
                        <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white/40 hover:text-red-400" onClick={clearLogs}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            <ScrollArea className="h-[300px] w-full p-4 font-mono text-[10px]">
                {logs.length === 0 ? (
                    <div className="text-center text-white/20 py-10 italic">No logs captured yet.</div>
                ) : (
                    <div className="space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors group">
                                <span className="text-white/20 flex-shrink-0 w-16">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <span className={cn("font-bold w-12 flex-shrink-0", LogLevelColors[log.level] || "text-gray-400")}>
                                    {LogLevelNames[log.level] || "UNK"}
                                </span>
                                <span className="text-indigo-400/60 w-24 flex-shrink-0 truncate" title={log.source}>
                                    [{log.source.split('.').pop()}]
                                </span>
                                <span className="text-white/70 break-all">
                                    {log.message}
                                    {log.exception && (
                                        <div className="mt-1 p-2 bg-red-900/20 text-red-300 rounded overflow-x-auto whitespace-pre">
                                            {log.exception}
                                        </div>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
