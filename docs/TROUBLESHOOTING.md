# Troubleshooting Guide

## Build Issues

### Issue: "dotnet: not found"

**Problem:** .NET SDK is not installed on your system.

**Solution:**

1. **Install .NET 9 SDK:**
   - **Windows:** Download from [https://dotnet.microsoft.com/download/dotnet/9.0](https://dotnet.microsoft.com/download/dotnet/9.0)
   - **macOS:** 
     ```bash
     brew install dotnet@9
     ```
   - **Linux (Ubuntu/Debian):**
     ```bash
     wget https://dot.net/v1/dotnet-install.sh
     chmod +x dotnet-install.sh
     ./dotnet-install.sh --channel 9.0
     ```

2. **Verify installation:**
   ```bash
   dotnet --version
   # Should output: 9.0.x
   ```

3. **Try building again:**
   ```bash
   dotnet restore
   dotnet build
   ```

### Issue: Build fails with "Project not found"

**Problem:** The API and Infrastructure projects haven't been created yet.

**Solution:** The current codebase only includes the Core library. To build the complete solution:

1. **Create Infrastructure project:**
   ```bash
   dotnet new classlib -n NoraPA.Infrastructure -o src/NoraPA.Infrastructure
   cd src/NoraPA.Infrastructure
   dotnet add reference ../NoraPA.Core/NoraPA.Core.csproj
   ```

2. **Create API project:**
   ```bash
   dotnet new webapi -n NoraPA.API -o src/NoraPA.API
   cd src/NoraPA.API
   dotnet add reference ../NoraPA.Core/NoraPA.Core.csproj
   dotnet add reference ../NoraPA.Infrastructure/NoraPA.Infrastructure.csproj
   ```

3. **Add projects to solution:**
   ```bash
   dotnet sln add src/NoraPA.Infrastructure/NoraPA.Infrastructure.csproj
   dotnet sln add src/NoraPA.API/NoraPA.API.csproj
   ```

### Issue: Docker build fails

**Problem:** Docker is not installed or not running.

**Solution:**

1. **Install Docker:**
   - **Windows/Mac:** Download Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - **Linux:** 
     ```bash
     curl -fsSL https://get.docker.com -o get-docker.sh
     sudo sh get-docker.sh
     ```

2. **Start Docker:**
   - **Windows/Mac:** Open Docker Desktop
   - **Linux:** 
     ```bash
     sudo systemctl start docker
     ```

3. **Verify Docker is running:**
   ```bash
   docker --version
   docker ps
   ```

4. **Build Docker image:**
   ```bash
   docker build -t nora-pa .
   ```

## Deployment Issues

### Issue: "Cannot connect to database"

**Problem:** PostgreSQL is not running or connection string is incorrect.

**Solution:**

1. **Start infrastructure with Docker Compose:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Verify PostgreSQL is running:**
   ```bash
   docker ps | grep postgres
   ```

3. **Check connection string in appsettings.json:**
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=nora;Username=nora;Password=nora_dev_password"
     }
   }
   ```

4. **Test connection:**
   ```bash
   docker exec -it nora-postgres psql -U nora -d nora
   ```

### Issue: "Redis connection failed"

**Problem:** Redis is not running.

**Solution:**

1. **Start Redis:**
   ```bash
   docker-compose up -d redis
   ```

2. **Verify Redis is running:**
   ```bash
   docker exec -it nora-redis redis-cli ping
   # Should output: PONG
   ```

### Issue: GitHub Actions build fails

**Problem:** Workflow configuration or dependencies issue.

**Solution:**

1. **Check workflow logs:**
   - Go to GitHub repository → Actions tab
   - Click on the failed workflow run
   - Review the error messages

2. **Common fixes:**
   - Ensure all project files are committed
   - Verify .NET version in workflow matches project
   - Check for missing NuGet packages

3. **Re-run workflow:**
   - Click "Re-run jobs" in GitHub Actions

## Development Environment Issues

### Issue: "Cannot find module" in frontend

**Problem:** Node modules not installed.

**Solution:**

1. **Install dependencies:**
   ```bash
   cd src/NoraPA.Web
   npm install
   ```

2. **Clear cache if needed:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Issue: Hot reload not working

**Problem:** Vite dev server configuration.

**Solution:**

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Check vite.config.ts:**
   ```typescript
   export default defineConfig({
     server: {
       port: 5173,
       host: true,
       hmr: {
         overlay: true
       }
     }
   })
   ```

## Testing Issues

### Issue: Tests not found

**Problem:** Test projects haven't been created yet.

**Solution:**

1. **Create test project:**
   ```bash
   dotnet new xunit -n NoraPA.Tests.Unit -o tests/NoraPA.Tests.Unit
   cd tests/NoraPA.Tests.Unit
   dotnet add reference ../../src/NoraPA.Core/NoraPA.Core.csproj
   ```

2. **Add to solution:**
   ```bash
   dotnet sln add tests/NoraPA.Tests.Unit/NoraPA.Tests.Unit.csproj
   ```

3. **Run tests:**
   ```bash
   dotnet test
   ```

## Performance Issues

### Issue: AI extraction is slow

**Problem:** Network latency or rate limiting.

**Solution:**

1. **Use prompt caching:**
   - Implement caching in AI service
   - Store extraction results in database

2. **Use local model (Ollama):**
   ```bash
   docker run -d -p 11434:11434 ollama/ollama
   ollama pull llama3
   ```

3. **Batch processing:**
   - Process multiple messages in parallel
   - Use background jobs for non-urgent extractions

### Issue: Database queries are slow

**Problem:** Missing indexes or inefficient queries.

**Solution:**

1. **Add indexes:**
   ```csharp
   modelBuilder.Entity<Message>()
       .HasIndex(m => m.ReceivedAt);
   
   modelBuilder.Entity<Obligation>()
       .HasIndex(o => new { o.Status, o.Priority });
   ```

2. **Use Dapper for read-heavy queries:**
   ```csharp
   var messages = await connection.QueryAsync<Message>(
       "SELECT * FROM messages WHERE received_at > @Date",
       new { Date = DateTime.UtcNow.AddDays(-7) }
   );
   ```

3. **Enable query logging:**
   ```csharp
   optionsBuilder.LogTo(Console.WriteLine, LogLevel.Information);
   ```

## Getting Help

If you're still experiencing issues:

1. **Check existing issues:** [GitHub Issues](https://github.com/konradwalsh/NoraPersonalAssistant/issues)
2. **Ask in Discord:** [Join our community](https://discord.gg/nora-pa)
3. **Email support:** dev@nora-pa.com

## Quick Fixes Checklist

- [ ] .NET 9 SDK installed (`dotnet --version`)
- [ ] Docker running (`docker ps`)
- [ ] PostgreSQL running (`docker-compose ps`)
- [ ] Redis running (`docker exec -it nora-redis redis-cli ping`)
- [ ] Dependencies restored (`dotnet restore`)
- [ ] Environment variables set (check appsettings.json)
- [ ] Migrations applied (`dotnet ef database update`)
- [ ] Node modules installed (`npm install` in Web project)

## Useful Commands

```bash
# Clean and rebuild
dotnet clean
dotnet restore
dotnet build

# Reset database
docker-compose down -v
docker-compose up -d postgres
dotnet ef database update

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Check disk space
docker system df
docker system prune -a  # Clean up unused images

# Restart everything
docker-compose down
docker-compose up -d
```
