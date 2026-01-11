using Microsoft.EntityFrameworkCore;
using NoraPA.Infrastructure.Data;
using Serilog;

// Configure Serilog FIRST - before anything else
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("========================================");
    Log.Information("NORA PA API STARTING");
    Log.Information("========================================");
    Log.Information("Current Time: {Time}", DateTime.UtcNow);
    Log.Information("Environment: {Env}", Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Not Set");
    Log.Information("URLs: {Urls}", Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "Not Set");
    
    var builder = WebApplication.CreateBuilder(args);
    Log.Information("WebApplication.CreateBuilder completed");

    builder.Host.UseSerilog();
    Log.Information("Serilog configured");

    // Add services
    Log.Information("Adding services...");
    
    builder.Services.AddControllers();
    Log.Information("Controllers added");
    
    builder.Services.AddEndpointsApiExplorer();
    Log.Information("Endpoints API Explorer added");
    
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { 
            Title = "Nora Personal Assistant API", 
            Version = "v1"
        });
    });
    Log.Information("Swagger added");

    // Configure Database (InMemory for now)
    builder.Services.AddDbContext<NoraDbContext>(options =>
        options.UseInMemoryDatabase("NoraDev"));
    Log.Information("InMemory database configured");

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
    Log.Information("CORS configured");

    Log.Information("Building application...");
    var app = builder.Build();
    Log.Information("Application built successfully");

    // Configure middleware
    Log.Information("Configuring middleware...");
    
    app.UseSwagger();
    Log.Information("Swagger middleware added");
    
    app.UseSwaggerUI();
    Log.Information("SwaggerUI middleware added");

    app.UseSerilogRequestLogging();
    Log.Information("Serilog request logging added");
    
    app.UseCors("AllowAll");
    Log.Information("CORS middleware added");
    
    app.UseAuthorization();
    Log.Information("Authorization middleware added");
    
    app.MapControllers();
    Log.Information("Controllers mapped");

    // Health check endpoint
    app.MapGet("/health", () => 
    {
        Log.Information("Health check endpoint called");
        return Results.Ok(new 
        { 
            status = "healthy", 
            timestamp = DateTime.UtcNow,
            version = "1.0.0",
            database = "InMemory",
            message = "Nora PA API is running!"
        });
    });
    Log.Information("Health check endpoint mapped");

    // Welcome endpoint
    app.MapGet("/", () => 
    {
        Log.Information("Root endpoint called");
        return Results.Ok(new
        {
            name = "Nora Personal Assistant API",
            version = "1.0.0",
            description = "Never miss an obligation, deadline, or important detail again",
            status = "running",
            endpoints = new
            {
                health = "/health",
                swagger = "/swagger",
                messages = "/api/messages",
                obligations = "/api/obligations"
            }
        });
    });
    Log.Information("Root endpoint mapped");

    Log.Information("========================================");
    Log.Information("ALL CONFIGURATION COMPLETE");
    Log.Information("Starting web server...");
    Log.Information("Listening on: {Urls}", Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://+:5000");
    Log.Information("========================================");
    
    app.Run();
    
    Log.Information("Application stopped normally");
}
catch (Exception ex)
{
    Log.Fatal(ex, "========================================");
    Log.Fatal(ex, "APPLICATION FAILED TO START");
    Log.Fatal(ex, "Exception Type: {Type}", ex.GetType().Name);
    Log.Fatal(ex, "Exception Message: {Message}", ex.Message);
    Log.Fatal(ex, "Stack Trace: {StackTrace}", ex.StackTrace);
    Log.Fatal(ex, "========================================");
    throw;
}
finally
{
    Log.Information("Closing and flushing logs...");
    Log.CloseAndFlush();
}
