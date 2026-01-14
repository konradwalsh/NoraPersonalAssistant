using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using NoraPA.Core;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace NoraPA.API.Services;

/// <summary>
/// Service for syncing Google Calendar events to the local database.
/// </summary>
public class GoogleCalendarSyncService
{
    private readonly GoogleAuthService _authService;
    private readonly NoraDbContext _db;
    private readonly ILogger<GoogleCalendarSyncService> _logger;

    public GoogleCalendarSyncService(GoogleAuthService authService, NoraDbContext db, ILogger<GoogleCalendarSyncService> logger)
    {
        _authService = authService;
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Gets the list of calendars available in the user's Google account.
    /// </summary>
    public async Task<List<CalendarInfo>> GetCalendarListAsync()
    {
        var credential = await _authService.GetCredentialAsync();
        if (credential == null) return new List<CalendarInfo>();

        var service = new CalendarService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "Nora Assistant"
        });

        var calendars = new List<CalendarInfo>();
        
        try
        {
            var listRequest = service.CalendarList.List();
            var response = await listRequest.ExecuteAsync();
            
            if (response.Items != null)
            {
                foreach (var cal in response.Items)
                {
                    calendars.Add(new CalendarInfo
                    {
                        Id = cal.Id,
                        Name = cal.Summary ?? cal.Id,
                        Description = cal.Description,
                        BackgroundColor = cal.BackgroundColor,
                        IsPrimary = cal.Primary ?? false
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch calendar list");
        }

        return calendars;
    }

    /// <summary>
    /// Syncs upcoming events from selected Google Calendars to the local database.
    /// </summary>
    public async Task<int> SyncEventsAsync(int daysAhead = 30)
    {
        var credential = await _authService.GetCredentialAsync();
        if (credential == null)
        {
            _logger.LogWarning("Cannot sync Calendar: No Google credentials found.");
            return 0;
        }

        var service = new CalendarService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "Nora Assistant"
        });

        // Get selected calendars from settings (default to "primary" if none selected)
        var selectedCalsSetting = await _db.AppSettings.FindAsync("SelectedCalendars");
        var calendarIds = new List<string> { "primary" };
        
        if (!string.IsNullOrEmpty(selectedCalsSetting?.Value))
        {
            try
            {
                calendarIds = JsonSerializer.Deserialize<List<string>>(selectedCalsSetting.Value) ?? calendarIds;
            }
            catch { }
        }

        int totalNewEvents = 0;
        int totalUpdatedEvents = 0;

        foreach (var calendarId in calendarIds)
        {
            try
            {
                var request = service.Events.List(calendarId);
                request.TimeMinDateTimeOffset = DateTimeOffset.UtcNow;
                request.TimeMaxDateTimeOffset = DateTimeOffset.UtcNow.AddDays(daysAhead);
                request.ShowDeleted = false;
                request.SingleEvents = true;
                request.OrderBy = EventsResource.ListRequest.OrderByEnum.StartTime;
                request.MaxResults = 100;

                var response = await request.ExecuteAsync();

                if (response.Items != null)
                {
                    foreach (var gcEvent in response.Items)
                    {
                        if (string.IsNullOrEmpty(gcEvent.Id)) continue;

                        // Check if event already exists
                        var existing = await _db.CalendarEvents.FirstOrDefaultAsync(e => e.GoogleCalendarId == gcEvent.Id);

                        if (existing != null)
                        {
                            // Update existing event
                            existing.Title = gcEvent.Summary ?? "Untitled Event";
                            existing.Description = gcEvent.Description;
                            existing.Location = gcEvent.Location;
                            existing.Status = MapStatus(gcEvent.Status);
                            existing.StartTime = ParseEventTime(gcEvent.Start) ?? existing.StartTime;
                            existing.EndTime = ParseEventTime(gcEvent.End);
                            existing.IsAllDay = gcEvent.Start?.Date != null;
                            totalUpdatedEvents++;
                        }
                        else
                        {
                            // Create new event
                            var noraEvent = new CalendarEvent
                            {
                                GoogleCalendarId = gcEvent.Id,
                                Title = gcEvent.Summary ?? "Untitled Event",
                                Description = gcEvent.Description,
                                Location = gcEvent.Location,
                                Status = MapStatus(gcEvent.Status),
                                StartTime = ParseEventTime(gcEvent.Start) ?? DateTime.UtcNow,
                                EndTime = ParseEventTime(gcEvent.End),
                                IsAllDay = gcEvent.Start?.Date != null,
                                CreatedAt = DateTime.UtcNow
                            };

                            _db.CalendarEvents.Add(noraEvent);
                            totalNewEvents++;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync events from calendar {CalendarId}", calendarId);
            }
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Calendar sync complete: {New} new, {Updated} updated from {CalCount} calendars", 
            totalNewEvents, totalUpdatedEvents, calendarIds.Count);

        return totalNewEvents;
    }

    /// <summary>
    /// Creates an event in Google Calendar from a local CalendarEvent.
    /// </summary>
    public async Task<string?> CreateEventInGoogleAsync(CalendarEvent localEvent)
    {
        var credential = await _authService.GetCredentialAsync();
        if (credential == null)
        {
            _logger.LogWarning("Cannot create event: No Google credentials found.");
            return null;
        }

        var service = new CalendarService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "Nora Assistant"
        });

        var gcEvent = new Event
        {
            Summary = localEvent.Title,
            Description = localEvent.Description,
            Location = localEvent.Location,
            Start = new EventDateTime 
            { 
                DateTimeDateTimeOffset = localEvent.IsAllDay ? null : localEvent.StartTime,
                Date = localEvent.IsAllDay ? localEvent.StartTime.ToString("yyyy-MM-dd") : null
            },
            End = new EventDateTime 
            { 
                DateTimeDateTimeOffset = localEvent.IsAllDay ? null : (localEvent.EndTime ?? localEvent.StartTime.AddHours(1)),
                Date = localEvent.IsAllDay ? (localEvent.EndTime ?? localEvent.StartTime.AddDays(1)).ToString("yyyy-MM-dd") : null
            }
        };

        try
        {
            var created = await service.Events.Insert(gcEvent, "primary").ExecuteAsync();
            _logger.LogInformation("Created Google Calendar event: {EventId}", created.Id);

            // Update local event with Google ID
            localEvent.GoogleCalendarId = created.Id;
            await _db.SaveChangesAsync();

            return created.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create Google Calendar event");
            throw;
        }
    }

    private DateTime? ParseEventTime(EventDateTime? eventDateTime)
    {
        if (eventDateTime == null) return null;
        
        // Handle all-day events (Date only)
        if (!string.IsNullOrEmpty(eventDateTime.Date))
        {
            return DateTime.Parse(eventDateTime.Date);
        }
        
        // Handle time-based events
        if (eventDateTime.DateTimeDateTimeOffset.HasValue)
        {
            return eventDateTime.DateTimeDateTimeOffset.Value.UtcDateTime;
        }

        return null;
    }

    private string MapStatus(string? gcStatus)
    {
        return gcStatus?.ToLower() switch
        {
            "confirmed" => "confirmed",
            "tentative" => "tentative",
            "cancelled" => "cancelled",
            _ => "confirmed"
        };
    }
}

/// <summary>
/// Represents a Google Calendar for selection purposes.
/// </summary>
public class CalendarInfo
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? BackgroundColor { get; set; }
    public bool IsPrimary { get; set; }
}
