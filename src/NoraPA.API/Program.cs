// Absolute minimal .NET 9 web app
Console.WriteLine("========================================");
Console.WriteLine("NORA PA API STARTING");
Console.WriteLine("========================================");

// Get port from environment (Railway uses PORT variable)
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
var urls = $"http://0.0.0.0:{port}";

Console.WriteLine($"Time: {DateTime.UtcNow}");
Console.WriteLine($"Port from env: {port}");
Console.WriteLine($"URLs: {urls}");

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(urls);

Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");
Console.WriteLine($"ContentRoot: {builder.Environment.ContentRootPath}");
Console.WriteLine("Building app...");

var app = builder.Build();

Console.WriteLine("App built. Configuring endpoints...");

app.MapGet("/", () => 
{
    Console.WriteLine("Root endpoint called!");
    return "Nora PA API is running! Visit /health for status.";
});

app.MapGet("/health", () => 
{
    Console.WriteLine("Health endpoint called!");
    return new { status = "healthy", time = DateTime.UtcNow };
});

Console.WriteLine("Endpoints configured.");
Console.WriteLine($"Starting server on: {urls}");
Console.WriteLine("========================================");

try
{
    app.Run();
    Console.WriteLine("App stopped normally.");
}
catch (Exception ex)
{
    Console.WriteLine("========================================");
    Console.WriteLine("FATAL ERROR!");
    Console.WriteLine($"Exception: {ex.GetType().Name}");
    Console.WriteLine($"Message: {ex.Message}");
    Console.WriteLine($"Stack: {ex.StackTrace}");
    Console.WriteLine("========================================");
    throw;
}
