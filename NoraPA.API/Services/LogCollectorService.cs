using System.Collections.Concurrent;

namespace NoraPA.API.Services;

/// <summary>
/// A centralized log collector that stores recent logs in a circular buffer
/// and exposes them via an API endpoint for frontend consumption.
/// </summary>
public class LogCollectorService
{
    private readonly ConcurrentQueue<LogEntry> _logs = new();
    private readonly int _maxLogs;
    private readonly object _lock = new();

    public LogCollectorService(int maxLogs = 500)
    {
        _maxLogs = maxLogs;
    }

    public void AddLog(LogEntry entry)
    {
        _logs.Enqueue(entry);

        // Trim if over limit
        while (_logs.Count > _maxLogs && _logs.TryDequeue(out _)) { }
    }

    public IEnumerable<LogEntry> GetLogs(LogLevel? minLevel = null, string? source = null, int? limit = null)
    {
        var query = _logs.AsEnumerable();

        if (minLevel.HasValue)
        {
            query = query.Where(l => l.Level >= minLevel.Value);
        }

        if (!string.IsNullOrEmpty(source))
        {
            query = query.Where(l => l.Source.Contains(source, StringComparison.OrdinalIgnoreCase));
        }

        query = query.OrderByDescending(l => l.Timestamp);

        if (limit.HasValue)
        {
            query = query.Take(limit.Value);
        }

        return query.ToList();
    }

    public void Clear()
    {
        while (_logs.TryDequeue(out _)) { }
    }

    public int Count => _logs.Count;
}

public class LogEntry
{
    public long Id { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public LogLevel Level { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Exception { get; set; }
    public Dictionary<string, object>? Properties { get; set; }
}

public enum LogLevel
{
    Trace = 0,
    Debug = 1,
    Information = 2,
    Warning = 3,
    Error = 4,
    Critical = 5
}
