// Absolute minimal .NET 9 web app
var builder = WebApplication.CreateBuilder(args);

Console.WriteLine("========================================");
Console.WriteLine("NORA PA API - MINIMAL VERSION");
Console.WriteLine("========================================");
Console.WriteLine($"Time: {DateTime.UtcNow}");
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
Console.WriteLine($"Starting server on: {Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://+:5000"}");
Console.WriteLine("========================================");

app.Run();

Console.WriteLine("App stopped.");
