# Deployment Guide

## 🚀 Deployment Options

Nora PA can be deployed in several ways. Choose the option that best fits your needs.

---

## Option 1: Railway (Recommended for Quick Deploy)

Railway provides the easiest deployment with automatic PostgreSQL provisioning.

### Steps:

1. **Sign up at Railway**
   - Go to https://railway.app
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `NoraPersonalAssistant` repository
   - Select branch: `session/agent_94f12001-a53d-467a-b66e-b87fb8c13592`

3. **Add PostgreSQL Database**
   - In your project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically create a database

4. **Configure Environment Variables**
   - Click on your API service
   - Go to "Variables" tab
   - Add:
     ```
     ConnectionStrings__DefaultConnection=${{Postgres.DATABASE_URL}}
     CLAUDE_API_KEY=your_claude_api_key
     ```

5. **Enable pgvector Extension**
   - Click on PostgreSQL service
   - Go to "Data" tab
   - Click "Query"
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`

6. **Deploy**
   - Railway automatically deploys on push
   - Check "Deployments" tab for status
   - Get your URL from "Settings" → "Domains"

### Cost:
- Free: $5/month credit
- Hobby: $5/month (after credit)
- Pro: $20/month

---

## Option 2: Render

Render offers a generous free tier with PostgreSQL included.

### Steps:

1. **Sign up at Render**
   - Go to https://render.com
   - Sign in with GitHub

2. **Create PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Name: `nora-db`
   - Plan: Free
   - Click "Create Database"
   - Note the "Internal Database URL"

3. **Enable pgvector**
   - In database dashboard, click "Connect"
   - Use PSQL command
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`

4. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect GitHub repository
   - Settings:
     - Name: `nora-api`
     - Environment: `Docker`
     - Branch: `session/agent_94f12001-a53d-467a-b66e-b87fb8c13592`
     - Docker Command: (leave default)

5. **Add Environment Variables**
   ```
   ConnectionStrings__DefaultConnection=<Internal Database URL from step 2>
   CLAUDE_API_KEY=your_claude_api_key
   ASPNETCORE_ENVIRONMENT=Production
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Render builds and deploys automatically
   - Get URL from dashboard

### Cost:
- Free tier available (with limitations)
- Starter: $7/month

---

## Option 3: Fly.io

Fly.io offers global edge deployment with generous free tier.

### Steps:

1. **Install flyctl**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Launch App**
   ```bash
   fly launch
   ```
   - Choose app name
   - Select region
   - Don't deploy yet

4. **Create PostgreSQL**
   ```bash
   fly postgres create
   ```
   - Name: `nora-db`
   - Select region (same as app)
   - Note the connection string

5. **Attach Database**
   ```bash
   fly postgres attach nora-db
   ```

6. **Enable pgvector**
   ```bash
   fly postgres connect -a nora-db
   CREATE EXTENSION IF NOT EXISTS vector;
   \q
   ```

7. **Set Secrets**
   ```bash
   fly secrets set CLAUDE_API_KEY=your_api_key
   ```

8. **Deploy**
   ```bash
   fly deploy
   ```

### Cost:
- Free: 3 VMs, 3GB storage
- Paid: Pay as you go

---

## Option 4: Docker Compose (Self-Hosted)

For complete control, deploy with Docker Compose on your own server.

### Prerequisites:
- Server with Docker and Docker Compose
- Domain name (optional)
- SSL certificate (optional, recommended)

### Steps:

1. **Clone Repository**
   ```bash
   git clone https://github.com/konradwalsh/NoraPersonalAssistant.git
   cd NoraPersonalAssistant
   git checkout session/agent_94f12001-a53d-467a-b66e-b87fb8c13592
   ```

2. **Create Environment File**
   ```bash
   cp .env.example .env
   nano .env
   ```
   
   Edit with your values:
   ```
   POSTGRES_PASSWORD=your_secure_password
   CLAUDE_API_KEY=your_claude_api_key
   MINIO_ROOT_PASSWORD=your_secure_password
   ```

3. **Start Services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Run Database Migrations**
   ```bash
   docker exec -it nora-api dotnet ef database update
   ```

5. **Access Application**
   - API: http://your-server:5000
   - Swagger: http://your-server:5000/swagger
   - Hangfire: http://your-server:5000/hangfire

### Optional: Add Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name nora.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Option 5: Kubernetes

For production scale, deploy to Kubernetes.

### Prerequisites:
- Kubernetes cluster
- kubectl configured
- Helm (optional)

### Steps:

1. **Create Namespace**
   ```bash
   kubectl create namespace nora
   ```

2. **Create Secrets**
   ```bash
   kubectl create secret generic nora-secrets \
     --from-literal=postgres-password=your_password \
     --from-literal=claude-api-key=your_api_key \
     -n nora
   ```

3. **Deploy PostgreSQL**
   ```bash
   helm install nora-postgres bitnami/postgresql \
     --set auth.password=your_password \
     --set primary.extendedConfiguration="shared_preload_libraries='vector'" \
     -n nora
   ```

4. **Deploy Application**
   ```bash
   kubectl apply -f k8s/ -n nora
   ```

5. **Expose Service**
   ```bash
   kubectl expose deployment nora-api --type=LoadBalancer --port=80 --target-port=5000 -n nora
   ```

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | `Host=postgres;Port=5432;Database=nora;Username=nora;Password=xxx` |
| `CLAUDE_API_KEY` or `OPENAI_API_KEY` | AI provider API key | `sk-ant-xxx` or `sk-xxx` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `ConnectionStrings__Redis` | Redis connection string | `localhost:6379` |
| `ASPNETCORE_ENVIRONMENT` | Environment name | `Production` |
| `ASPNETCORE_URLS` | URLs to listen on | `http://+:5000` |
| `Gmail__ClientId` | Gmail OAuth client ID | - |
| `Gmail__ClientSecret` | Gmail OAuth secret | - |
| `Storage__MinIO__Endpoint` | MinIO endpoint | `localhost:9000` |

---

## Post-Deployment Steps

### 1. Run Database Migrations

**Railway/Render:**
```bash
# SSH into container
railway run bash  # or render ssh

# Run migrations
dotnet ef database update
```

**Docker Compose:**
```bash
docker exec -it nora-api dotnet ef database update
```

### 2. Enable pgvector Extension

Connect to PostgreSQL and run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Verify Deployment

Check these endpoints:
- Health: `https://your-app.com/health`
- API docs: `https://your-app.com/swagger`
- Hangfire: `https://your-app.com/hangfire`

### 4. Configure Integrations

Set up OAuth callbacks for:
- Gmail: `https://your-app.com/auth/gmail/callback`
- Slack: `https://your-app.com/auth/slack/callback`

---

## Troubleshooting

### Database Connection Failed

**Error:** `Failed to connect to localhost:5432`

**Solution:**
- Ensure PostgreSQL is running
- Check connection string in environment variables
- Verify network connectivity between services

### pgvector Extension Missing

**Error:** `type "vector" does not exist`

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Hangfire Dashboard Not Loading

**Error:** 404 on `/hangfire`

**Solution:**
- Check Hangfire is configured in Program.cs
- Verify PostgreSQL connection (Hangfire uses it for storage)

### Redis Connection Failed

**Error:** `No connection is available`

**Solution:**
- Redis is optional for basic functionality
- Comment out Redis configuration if not needed
- Or ensure Redis is running and accessible

---

## Monitoring

### Health Checks

The API includes a health check endpoint:
```bash
curl https://your-app.com/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-11T21:00:00Z",
  "version": "1.0.0"
}
```

### Logs

**Railway:**
- View in dashboard → "Deployments" → "View Logs"

**Render:**
- View in dashboard → "Logs" tab

**Docker Compose:**
```bash
docker-compose logs -f api
```

### Hangfire Dashboard

Monitor background jobs at:
```
https://your-app.com/hangfire
```

---

## Scaling

### Horizontal Scaling

The application is stateless and can be scaled horizontally:

**Railway:**
- Increase replicas in service settings

**Kubernetes:**
```bash
kubectl scale deployment nora-api --replicas=3 -n nora
```

### Database Scaling

For high load:
- Use connection pooling (already configured)
- Add read replicas
- Enable query caching
- Optimize indexes

---

## Security Checklist

- [ ] Use strong passwords for database
- [ ] Store API keys in environment variables (never in code)
- [ ] Enable HTTPS (use Railway/Render automatic SSL)
- [ ] Configure CORS properly
- [ ] Add authentication to Hangfire dashboard
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

---

## Support

If you encounter issues:
- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review logs
- Open an issue on GitHub
- Join Discord community

---

**Next:** Once deployed, configure your AI provider API key and start processing messages!
