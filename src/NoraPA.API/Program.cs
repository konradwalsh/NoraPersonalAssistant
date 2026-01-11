using Microsoft.EntityFrameworkCore;

// Nora Personal Assistant API
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
Console.WriteLine("Adding services...");

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { 
        Title = "Nora Personal Assistant API", 
        Version = "1.0.0",
        Description = "Never miss an obligation, deadline, or important detail again"
    });
});

// Add InMemory database
builder.Services.AddDbContext<NoraPA.Infrastructure.Data.NoraDbContext>(options =>
    options.UseInMemoryDatabase("NoraDev"));

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

Console.WriteLine("Services added. Building app...");

var app = builder.Build();

Console.WriteLine("App built. Configuring middleware...");

// Configure middleware
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => 
{
    Console.WriteLine("Health endpoint called!");
    return Results.Ok(new 
    { 
        status = "healthy", 
        timestamp = DateTime.UtcNow,
        version = "1.0.0",
        database = "InMemory",
        message = "Nora PA API is running!"
    });
});

// Welcome endpoint
app.MapGet("/", () => 
{
    Console.WriteLine("Root endpoint called!");
    return Results.Ok(new
    {
        name = "Nora Personal Assistant API",
        version = "1.0.0",
        description = "Never miss an obligation, deadline, or important detail again",
        status = "running",
        database = "InMemory (demo mode)",
        endpoints = new
        {
            health = "/health",
            swagger = "/swagger",
            messages = "/api/messages",
            obligations = "/api/obligations",
            messagesStats = "/api/messages/stats",
            obligationsStats = "/api/obligations/stats"
        },
        documentation = "Visit /swagger for interactive API documentation"
    });
});

Console.WriteLine("Middleware configured.");
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
