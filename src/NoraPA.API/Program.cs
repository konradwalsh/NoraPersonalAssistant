using Microsoft.EntityFrameworkCore;
using NoraPA.Infrastructure.Data;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { 
        Title = "Nora Personal Assistant API", 
        Version = "v1"
    });
});

// Configure Database (InMemory for now)
builder.Services.AddDbContext<NoraDbContext>(options =>
    options.UseInMemoryDatabase("NoraDev"));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure middleware
app.UseSwagger();
app.UseSwaggerUI();

app.UseSerilogRequestLogging();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => 
{
    Log.Information("Health check called");
    return Results.Ok(new 
    { 
        status = "healthy", 
        timestamp = DateTime.UtcNow,
        version = "1.0.0",
        database = "InMemory"
    });
});

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
        api = "/api"
    }
}));

try
{
    Log.Information("Starting Nora Personal Assistant API on port 5000");
    Log.Information("Environment: {Environment}", app.Environment.EnvironmentName);
    Log.Information("URLs: {URLs}", builder.Configuration["ASPNETCORE_URLS"] ?? "http://+:5000");
    
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
