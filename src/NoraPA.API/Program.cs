using Microsoft.EntityFrameworkCore;
using NoraPA.Infrastructure.Data;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/nora-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { 
        Title = "Nora Personal Assistant API", 
        Version = "v1",
        Description = "Intelligent life management system that extracts obligations, deadlines, and risks from digital communications"
    });
});

// Configure Database (optional - app can start without it)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var databaseEnabled = !string.IsNullOrEmpty(connectionString);

if (databaseEnabled)
{
    builder.Services.AddDbContext<NoraDbContext>(options =>
    {
        options.UseNpgsql(connectionString!, o =>
        {
            o.UseVector();
            o.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorCodesToAdd: null);
        });
    }, ServiceLifetime.Scoped, ServiceLifetime.Scoped);
}
else
{
    // Add a dummy DbContext for when database is not configured
    builder.Services.AddDbContext<NoraDbContext>(options =>
        options.UseInMemoryDatabase("NoraDev"));
}

// Configure Redis (optional)
var redisConnection = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConnection))
{
    try
    {
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnection;
        });
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Redis configuration failed, continuing without caching");
    }
}

// Configure SignalR
builder.Services.AddSignalR();

// TODO: Add Hangfire when database is properly configured
// builder.Services.AddHangfire(config => config
//     .UsePostgreSqlStorage(connectionString));
// builder.Services.AddHangfireServer();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

// TODO: Add Hangfire dashboard when database is configured
// app.MapHangfireDashboard("/hangfire");

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new 
{ 
    status = "healthy", 
    timestamp = DateTime.UtcNow,
    version = "1.0.0"
}));

// Welcome endpoint
app.MapGet("/", () => Results.Ok(new
{
    name = "Nora Personal Assistant API",
    version = "1.0.0",
    description = "Never miss an obligation, deadline, or important detail again",
    endpoints = new
    {
        health = "/health",
        swagger = "/swagger",
        hangfire = "/hangfire",
        api = "/api"
    }
}));

try
{
    Log.Information("Starting Nora Personal Assistant API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// TODO: Add Hangfire authorization filter when Hangfire is re-enabled
