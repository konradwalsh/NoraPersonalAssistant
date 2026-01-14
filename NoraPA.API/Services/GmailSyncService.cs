using Google.Apis.Gmail.v1;
using Google.Apis.Gmail.v1.Data;
using Google.Apis.Services;
using NoraPA.Core;
using Microsoft.EntityFrameworkCore;

namespace NoraPA.API.Services;

public class GmailSyncService
{
    private readonly GoogleAuthService _authService;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly NoraDbContext _db;
    private readonly ILogger<GmailSyncService> _logger;

    public GmailSyncService(GoogleAuthService authService, IServiceScopeFactory scopeFactory, NoraDbContext db, ILogger<GmailSyncService> logger)
    {
        _authService = authService;
        _scopeFactory = scopeFactory;
        _db = db;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task<int> SyncInboxAsync(int maxResults = 10, bool triggerAnalysis = false)
    {
        var credential = await _authService.GetCredentialAsync();
        if (credential == null)
        {
            _logger.LogWarning("Cannot sync Gmail: No credentials found.");
            return 0;
        }

        var service = new GmailService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "Nora Assistant"
        });

        var request = service.Users.Messages.List("me");
        request.LabelIds = new[] { "INBOX" };
        request.MaxResults = maxResults;
        request.IncludeSpamTrash = false;

        var response = await request.ExecuteAsync();
        int newMessagesCount = 0;

        if (response.Messages != null)
        {
            foreach (var msgSummary in response.Messages)
            {
                // Check if already exists
                if (await _db.Messages.AnyAsync(m => m.Source == "Gmail" && m.SourceId == msgSummary.Id))
                {
                    continue;
                }

                var msgDetails = await service.Users.Messages.Get("me", msgSummary.Id).ExecuteAsync();
                var noraMsg = await MapToNoraMessageAsync(service, msgDetails);
                
                _db.Messages.Add(noraMsg);
                await _db.SaveChangesAsync(); // Save to get the ID
                
                newMessagesCount++;

                if (triggerAnalysis)
                {
                    var msgId = noraMsg.Id;
                    _ = System.Threading.Tasks.Task.Run(async () =>
                    {
                        using var scope = _scopeFactory.CreateScope();
                        var backgroundAiService = scope.ServiceProvider.GetRequiredService<AiAnalysisService>();
                        await backgroundAiService.PerformFullAnalysisAsync(msgId);
                    });
                }

                // Process physical attachments
                if (msgDetails.Payload.Parts != null || !string.IsNullOrEmpty(msgDetails.Payload.Filename))
                {
                    await ProcessAttachments(service, msgDetails.Id, noraMsg.Id, msgDetails.Payload.Parts ?? new List<MessagePart> { msgDetails.Payload });
                    await _db.SaveChangesAsync();
                }
            }
        }

        return newMessagesCount;
    }

    private async System.Threading.Tasks.Task<NoraPA.Core.Message> MapToNoraMessageAsync(GmailService service, Google.Apis.Gmail.v1.Data.Message gmailMsg)
    {
        var noraMsg = new NoraPA.Core.Message
        {
            Source = "Gmail",
            SourceId = gmailMsg.Id,
            ReceivedAt = DateTime.UtcNow // Fallback
        };

        var payload = gmailMsg.Payload;
        var headers = payload.Headers;

        noraMsg.Subject = headers.FirstOrDefault(h => h.Name == "Subject")?.Value;
        noraMsg.FromAddress = headers.FirstOrDefault(h => h.Name == "From")?.Value;
        
        // Try to get date
        var dateHeader = headers.FirstOrDefault(h => h.Name == "Date")?.Value;
        if (DateTime.TryParse(dateHeader, out var receivedDate))
        {
            noraMsg.ReceivedAt = receivedDate.ToUniversalTime();
        }

        // Body extraction (Robust extraction of both Plain and HTML)
        if (payload.Parts != null)
        {
            await ExtractBodyPartsAsync(service, gmailMsg.Id, payload.Parts, noraMsg);
        }
        else if (payload.Body != null)
        {
            var data = await GetBodyDataAsync(service, gmailMsg.Id, payload.Body);
            if (data != null)
            {
                var decoded = DecodeGmailData(data);
                if (payload.MimeType == "text/html") noraMsg.BodyHtml = decoded;
                else noraMsg.BodyPlain = decoded;
            }
        }

        return noraMsg;
    }

    private async System.Threading.Tasks.Task ExtractBodyPartsAsync(GmailService service, string gmailMessageId, IList<MessagePart> parts, NoraPA.Core.Message message)
    {
        foreach (var part in parts)
        {
            if (part.MimeType == "text/plain" && string.IsNullOrEmpty(message.BodyPlain))
            {
                var data = await GetBodyDataAsync(service, gmailMessageId, part.Body);
                if (data != null) message.BodyPlain = DecodeGmailData(data);
            }
            else if (part.MimeType == "text/html" && string.IsNullOrEmpty(message.BodyHtml))
            {
                var data = await GetBodyDataAsync(service, gmailMessageId, part.Body);
                if (data != null) message.BodyHtml = DecodeGmailData(data);
            }
            else if (part.Parts != null)
            {
                await ExtractBodyPartsAsync(service, gmailMessageId, part.Parts, message);
            }
        }
    }

    private async System.Threading.Tasks.Task<string?> GetBodyDataAsync(GmailService service, string messageId, MessagePartBody body)
    {
        if (!string.IsNullOrEmpty(body.Data)) return body.Data;
        if (!string.IsNullOrEmpty(body.AttachmentId))
        {
            try 
            {
                var attach = await service.Users.Messages.Attachments.Get("me", messageId, body.AttachmentId).ExecuteAsync();
                return attach.Data;
            } 
            catch (Exception ex) 
            {
                _logger.LogWarning("Failed to fetch body part via attachment: {Message}", ex.Message);
            }
        }
        return null;
    }

    private string DecodeGmailData(string base64Url)
    {
        byte[] data = Convert.FromBase64String(base64Url.Replace('-', '+').Replace('_', '/'));
        return System.Text.Encoding.UTF8.GetString(data);
    }

    private async System.Threading.Tasks.Task ProcessAttachments(GmailService service, string gmailMessageId, long noraMessageId, IList<MessagePart> parts)
    {
        if (parts == null) return;

        foreach (var part in parts)
        {
            if (!string.IsNullOrEmpty(part.Filename))
            {
                var attachmentId = part.Body?.AttachmentId;
                if (!string.IsNullOrEmpty(attachmentId))
                {
                    try
                    {
                        var attachData = await service.Users.Messages.Attachments.Get("me", gmailMessageId, attachmentId).ExecuteAsync();
                        var bytes = Convert.FromBase64String(attachData.Data.Replace('-', '+').Replace('_', '/'));
                        
                        var storagePath = Path.Combine(Directory.GetCurrentDirectory(), "NoraData", "Attachments");
                        if (!Directory.Exists(storagePath)) Directory.CreateDirectory(storagePath);
                        
                        var safeFileName = string.Join("_", part.Filename.Split(Path.GetInvalidFileNameChars()));
                        var localFileName = $"{noraMessageId}_{Guid.NewGuid().ToString().Substring(0,8)}_{safeFileName}";
                        var localPath = Path.Combine(storagePath, localFileName);
                        
                        await File.WriteAllBytesAsync(localPath, bytes);
                        
                        var noraAttachment = new Attachment
                        {
                            MessageId = noraMessageId,
                            Filename = part.Filename,
                            MimeType = part.MimeType,
                            SizeBytes = part.Body.Size ?? bytes.Length,
                            LocalPath = localPath,
                            SourceId = attachmentId
                        };
                        
                        _db.Attachments.Add(noraAttachment);
                        _logger.LogInformation("Saved attachment {Filename} to {Path}", part.Filename, localPath);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to download attachment {Filename}", part.Filename);
                    }
                }
            }
            
            if (part.Parts != null)
            {
                await ProcessAttachments(service, gmailMessageId, noraMessageId, part.Parts);
            }
        }
    }
}
