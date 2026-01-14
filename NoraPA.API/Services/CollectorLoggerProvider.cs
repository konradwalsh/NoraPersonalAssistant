using Microsoft.Extensions.Logging;
using MsLogLevel = Microsoft.Extensions.Logging.LogLevel;

namespace NoraPA.API.Services;

/// <summary>
/// A custom logger provider that pipes all logs to the LogCollectorService
/// while also passing through to the default console logger.
/// </summary>
public class CollectorLoggerProvider : ILoggerProvider
{
    private readonly LogCollectorService _collector;
    private readonly Func<string, MsLogLevel, bool> _filter;
    private long _logId = 0;

    public CollectorLoggerProvider(LogCollectorService collector, Func<string, MsLogLevel, bool>? filter = null)
    {
        _collector = collector;
        _filter = filter ?? ((_, _) => true);
    }

    public ILogger CreateLogger(string categoryName)
    {
        return new CollectorLogger(categoryName, _collector, _filter, () => Interlocked.Increment(ref _logId));
    }

    public void Dispose() { }
}

public class CollectorLogger : ILogger
{
    private readonly string _categoryName;
    private readonly LogCollectorService _collector;
    private readonly Func<string, MsLogLevel, bool> _filter;
    private readonly Func<long> _idGenerator;

    public CollectorLogger(
        string categoryName, 
        LogCollectorService collector, 
        Func<string, MsLogLevel, bool> filter,
        Func<long> idGenerator)
    {
        _categoryName = categoryName;
        _collector = collector;
        _filter = filter;
        _idGenerator = idGenerator;
    }

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(MsLogLevel logLevel) => _filter(_categoryName, logLevel);

    public void Log<TState>(
        MsLogLevel logLevel, 
        EventId eventId, 
        TState state, 
        Exception? exception, 
        Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel)) return;

        var entry = new LogEntry
        {
            Id = _idGenerator(),
            Timestamp = DateTime.UtcNow,
            Level = ConvertLogLevel(logLevel),
            Source = SimplifyCategory(_categoryName),
            Message = formatter(state, exception),
            Exception = exception?.ToString(),
            Properties = ExtractProperties(state)
        };

        _collector.AddLog(entry);
    }

    private static LogLevel ConvertLogLevel(MsLogLevel msLevel) => msLevel switch
    {
        MsLogLevel.Trace => LogLevel.Trace,
        MsLogLevel.Debug => LogLevel.Debug,
        MsLogLevel.Information => LogLevel.Information,
        MsLogLevel.Warning => LogLevel.Warning,
        MsLogLevel.Error => LogLevel.Error,
        MsLogLevel.Critical => LogLevel.Critical,
        _ => LogLevel.Information
    };

    private static string SimplifyCategory(string category)
    {
        // Simplify long category names like "NoraPA.API.AiAnalysisService" -> "AiAnalysisService"
        var lastDot = category.LastIndexOf('.');
        return lastDot >= 0 ? category[(lastDot + 1)..] : category;
    }

    private static Dictionary<string, object>? ExtractProperties<TState>(TState state)
    {
        if (state is IEnumerable<KeyValuePair<string, object>> props)
        {
            var dict = new Dictionary<string, object>();
            foreach (var prop in props)
            {
                if (prop.Key != "{OriginalFormat}")
                {
                    dict[prop.Key] = prop.Value;
                }
            }
            return dict.Count > 0 ? dict : null;
        }
        return null;
    }
}
