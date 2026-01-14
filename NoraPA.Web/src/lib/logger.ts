/**
 * Nora Logging System
 * A comprehensive frontend logging service with configurable levels,
 * circular buffer storage, and integration with the backend log API.
 */

export const LogLevel = {
    Trace: 0,
    Debug: 1,
    Info: 2,
    Warn: 3,
    Error: 4,
    Critical: 5,
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export const LogLevelNames: Record<LogLevel, string> = {
    [LogLevel.Trace]: 'TRACE',
    [LogLevel.Debug]: 'DEBUG',
    [LogLevel.Info]: 'INFO',
    [LogLevel.Warn]: 'WARN',
    [LogLevel.Error]: 'ERROR',
    [LogLevel.Critical]: 'CRITICAL',
};

export const LogLevelColors: Record<LogLevel, string> = {
    [LogLevel.Trace]: '#6B7280', // gray
    [LogLevel.Debug]: '#8B5CF6', // purple
    [LogLevel.Info]: '#3B82F6',  // blue
    [LogLevel.Warn]: '#F59E0B',  // amber
    [LogLevel.Error]: '#EF4444', // red
    [LogLevel.Critical]: '#DC2626', // dark red
};

export const LogLevelClasses: Record<LogLevel, string> = {
    [LogLevel.Trace]: 'log-level-trace',
    [LogLevel.Debug]: 'log-level-debug',
    [LogLevel.Info]: 'log-level-info',
    [LogLevel.Warn]: 'log-level-warn',
    [LogLevel.Error]: 'log-level-error',
    [LogLevel.Critical]: 'log-level-critical',
};

export interface LogEntry {
    id: number;
    timestamp: Date;
    level: LogLevel;
    source: string;
    message: string;
    data?: unknown;
}

export interface LoggerSettings {
    minLevel: LogLevel;
    showConsole: boolean;
    maxEntries: number;
    persistToStorage: boolean;
}

type LogSubscriber = (entry: LogEntry) => void;

const STORAGE_KEY = 'nora_logger_settings';
const LOGS_STORAGE_KEY = 'nora_logs';

class Logger {
    private logs: LogEntry[] = [];
    private subscribers: Set<LogSubscriber> = new Set();
    private idCounter = 0;
    private settings: LoggerSettings = {
        minLevel: LogLevel.Info,
        showConsole: false,
        maxEntries: 500,
        persistToStorage: false,
    };

    constructor() {
        this.loadSettings();
        this.loadPersistedLogs();
    }

    private loadSettings(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch {
            // Use defaults
        }
    }

    private loadPersistedLogs(): void {
        if (!this.settings.persistToStorage) return;
        try {
            const stored = localStorage.getItem(LOGS_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.logs = parsed.map((log: LogEntry) => ({
                    ...log,
                    timestamp: new Date(log.timestamp),
                }));
                this.idCounter = this.logs.length > 0
                    ? Math.max(...this.logs.map(l => l.id)) + 1
                    : 0;
            }
        } catch {
            // Start fresh
        }
    }

    private persistLogs(): void {
        if (!this.settings.persistToStorage) return;
        try {
            // Only persist last 100 to avoid storage bloat
            const toStore = this.logs.slice(-100);
            localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(toStore));
        } catch {
            // Storage might be full
        }
    }

    saveSettings(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch {
            // Ignore
        }
    }

    getSettings(): LoggerSettings {
        return { ...this.settings };
    }

    updateSettings(updates: Partial<LoggerSettings>): void {
        this.settings = { ...this.settings, ...updates };
        this.saveSettings();
    }

    private log(level: LogLevel, source: string, message: string, data?: unknown): LogEntry | null {
        if (level < this.settings.minLevel) return null;

        const entry: LogEntry = {
            id: this.idCounter++,
            timestamp: new Date(),
            level,
            source,
            message,
            data,
        };

        this.logs.push(entry);

        // Trim if over limit
        while (this.logs.length > this.settings.maxEntries) {
            this.logs.shift();
        }

        // Notify subscribers
        this.subscribers.forEach(sub => sub(entry));

        // Persist
        this.persistLogs();

        // Also log to browser console in development
        this.logToConsole(entry);

        return entry;
    }

    private logToConsole(entry: LogEntry): void {
        const prefix = `[${LogLevelNames[entry.level]}] [${entry.source}]`;
        const args = entry.data ? [prefix, entry.message, entry.data] : [prefix, entry.message];

        switch (entry.level) {
            case LogLevel.Trace:
            case LogLevel.Debug:
                console.debug(...args);
                break;
            case LogLevel.Info:
                console.info(...args);
                break;
            case LogLevel.Warn:
                console.warn(...args);
                break;
            case LogLevel.Error:
            case LogLevel.Critical:
                console.error(...args);
                break;
        }
    }

    // Public logging methods
    trace(source: string, message: string, data?: unknown): void {
        this.log(LogLevel.Trace, source, message, data);
    }

    debug(source: string, message: string, data?: unknown): void {
        this.log(LogLevel.Debug, source, message, data);
    }

    info(source: string, message: string, data?: unknown): void {
        this.log(LogLevel.Info, source, message, data);
    }

    warn(source: string, message: string, data?: unknown): void {
        this.log(LogLevel.Warn, source, message, data);
    }

    error(source: string, message: string, data?: unknown): void {
        this.log(LogLevel.Error, source, message, data);
    }

    critical(source: string, message: string, data?: unknown): void {
        this.log(LogLevel.Critical, source, message, data);
    }

    // Query methods
    getLogs(options?: {
        minLevel?: LogLevel;
        source?: string;
        limit?: number;
        since?: Date;
    }): LogEntry[] {
        let result = [...this.logs];

        if (options?.minLevel !== undefined) {
            result = result.filter(l => l.level >= options.minLevel!);
        }

        if (options?.source) {
            result = result.filter(l =>
                l.source.toLowerCase().includes(options.source!.toLowerCase())
            );
        }

        if (options?.since) {
            result = result.filter(l => l.timestamp >= options.since!);
        }

        result = result.reverse(); // Newest first

        if (options?.limit) {
            result = result.slice(0, options.limit);
        }

        return result;
    }

    clear(): void {
        this.logs = [];
        this.persistLogs();
        this.subscribers.forEach(sub => sub({
            id: -1,
            timestamp: new Date(),
            level: LogLevel.Info,
            source: 'Logger',
            message: 'Logs cleared',
        }));
    }

    // Subscription for real-time updates
    subscribe(callback: LogSubscriber): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    // Get count
    get count(): number {
        return this.logs.length;
    }
}

// Singleton instance
export const logger = new Logger();

// Convenience function to create a scoped logger
export function createLogger(source: string) {
    return {
        trace: (message: string, data?: unknown) => logger.trace(source, message, data),
        debug: (message: string, data?: unknown) => logger.debug(source, message, data),
        info: (message: string, data?: unknown) => logger.info(source, message, data),
        warn: (message: string, data?: unknown) => logger.warn(source, message, data),
        error: (message: string, data?: unknown) => logger.error(source, message, data),
        critical: (message: string, data?: unknown) => logger.critical(source, message, data),
    };
}

export default logger;
