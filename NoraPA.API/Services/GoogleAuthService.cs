using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Gmail.v1;
using Google.Apis.Util.Store;
using Microsoft.EntityFrameworkCore;
using NoraPA.Core;

namespace NoraPA.API.Services;

public class GoogleAuthService
{
    private readonly IConfiguration _configuration;
    private readonly NoraDbContext _db;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(IConfiguration configuration, NoraDbContext db, ILogger<GoogleAuthService> logger)
    {
        _configuration = configuration;
        _db = db;
        _logger = logger;
    }

    private GoogleAuthorizationCodeFlow GetFlow()
    {
        return new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = new ClientSecrets
            {
                ClientId = _configuration["Google:ClientId"],
                ClientSecret = _configuration["Google:ClientSecret"]
            },
            Scopes = new[] { 
                GmailService.Scope.GmailReadonly, 
                GmailService.Scope.GmailModify,
                "https://www.googleapis.com/auth/calendar.readonly",
                "https://www.googleapis.com/auth/calendar.events"
            },
            DataStore = new NullDataStore() // We will handle persistence manually in DB
        });
    }

    public string GetAuthUrl(string state)
    {
        var flow = GetFlow();
        var redirectUri = _configuration["Google:RedirectUri"];
        var request = flow.CreateAuthorizationCodeRequest(redirectUri);
        var googleRequest = (Google.Apis.Auth.OAuth2.Requests.GoogleAuthorizationCodeRequestUrl)request;
        googleRequest.State = state;
        googleRequest.AccessType = "offline";
        // Build base URL and append prompt=consent to force re-consent for new scopes
        var url = googleRequest.Build().ToString();
        return url + "&prompt=consent";
    }

    public async System.Threading.Tasks.Task ExchangeCodeAsync(string code)
    {
        var flow = GetFlow();
        var redirectUri = _configuration["Google:RedirectUri"];
        var token = await flow.ExchangeCodeForTokenAsync("user", code, redirectUri, CancellationToken.None);

        // Store tokens in AppSettings
        await SaveSettingAsync("GoogleAccessToken", token.AccessToken);
        if (token.RefreshToken != null)
        {
            await SaveSettingAsync("GoogleRefreshToken", token.RefreshToken);
        }
        await SaveSettingAsync("GoogleTokenExpiry", token.IssuedUtc.AddSeconds(token.ExpiresInSeconds ?? 3600).ToString("O"));
        
        _logger.LogInformation("Google tokens successfully exchanged and stored.");
    }

    public async System.Threading.Tasks.Task<UserCredential?> GetCredentialAsync()
    {
        var refreshToken = await GetSettingAsync("GoogleRefreshToken");
        if (string.IsNullOrEmpty(refreshToken)) return null;

        var flow = GetFlow();
        var tokenResponse = new TokenResponse
        {
            RefreshToken = refreshToken
        };

        return new UserCredential(flow, "user", tokenResponse);
    }

    private async System.Threading.Tasks.Task SaveSettingAsync(string key, string value)
    {
        var setting = await _db.AppSettings.FindAsync(key);
        if (setting == null)
        {
            setting = new AppSettings { Key = key, Value = value, UpdatedAt = DateTime.UtcNow };
            _db.AppSettings.Add(setting);
        }
        else
        {
            setting.Value = value;
            setting.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
    }

    private async System.Threading.Tasks.Task<string?> GetSettingAsync(string key)
    {
        var setting = await _db.AppSettings.FindAsync(key);
        return setting?.Value;
    }
}
