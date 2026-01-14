using NoraPA.API.Services;
using NoraPA.Core;
using Microsoft.EntityFrameworkCore;

namespace NoraPA.API.Services;

public class GmailBackgroundWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<GmailBackgroundWorker> _logger;

    public GmailBackgroundWorker(IServiceScopeFactory scopeFactory, ILogger<GmailBackgroundWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Gmail Background Worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<NoraDbContext>();
                    var syncService = scope.ServiceProvider.GetRequiredService<GmailSyncService>();

                    // Check if enabled
                    var enabledSetting = await db.AppSettings.FindAsync("GoogleAutoSyncEnabled");
                    var isEnabled = enabledSetting?.Value?.ToLower() == "true";

                    if (isEnabled)
                    {
                        // Get interval
                        var intervalSetting = await db.AppSettings.FindAsync("GoogleSyncInterval");
                        if (!int.TryParse(intervalSetting?.Value, out int minutes))
                        {
                            minutes = 15; // default
                        }

                        // Gmail Sync
                        _logger.LogInformation("Automatic Gmail sync starting...");
                        var emailCount = await syncService.SyncInboxAsync(triggerAnalysis: true);
                        _logger.LogInformation($"Gmail sync completed. {emailCount} new messages found.");

                        // Calendar Sync
                        var calendarSyncService = scope.ServiceProvider.GetRequiredService<GoogleCalendarSyncService>();
                        _logger.LogInformation("Automatic Calendar sync starting...");
                        var eventCount = await calendarSyncService.SyncEventsAsync();
                        _logger.LogInformation($"Calendar sync completed. {eventCount} new events synced.");

                        // Store last sync time
                        var lastSyncSetting = await db.AppSettings.FindAsync("GoogleLastSync");
                        if (lastSyncSetting == null)
                        {
                            lastSyncSetting = new AppSettings { Key = "GoogleLastSync", UpdatedAt = DateTime.UtcNow };
                            db.AppSettings.Add(lastSyncSetting);
                        }
                        lastSyncSetting.Value = DateTime.UtcNow.ToString("O");
                        lastSyncSetting.UpdatedAt = DateTime.UtcNow;
                        await db.SaveChangesAsync();

                        // Sleep for the interval
                        await System.Threading.Tasks.Task.Delay(TimeSpan.FromMinutes(minutes), stoppingToken);
                    }
                    else
                    {
                        // Check again in 1 minute if it was disabled
                        await System.Threading.Tasks.Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in Gmail Background Worker.");
                // Wait 5 minutes on error before retry
                await System.Threading.Tasks.Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }
}
