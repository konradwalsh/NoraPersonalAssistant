# Nora PA - Quick Start Guide

## 🚀 Running the Application

### Prerequisites

- .NET 9 SDK
- Node.js 18+
- PostgreSQL (running)

### 1. Start the Backend (API)

```powershell
cd NoraPA.API
dotnet run
```

**Expected Output**:

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:7001
```

### 2. Start the Frontend

Open a **NEW terminal**:

```powershell
cd NoraPA.Web
npm run dev
```

**Expected Output**:

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:7002/
  ➜  Network: use --host to expose
```

### 3. Open in Browser

Navigate to: **<http://localhost:7002>**

---

## ⚙️ Configuration Required

### Backend Configuration

Edit `NoraPA.API/appsettings.json`:

```json
{
  "OpenAI": {
    "ApiKey": "sk-your-key-here",  // ⚠️ REQUIRED
    "Model": "gpt-4"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=nora_db;Username=nora_user;Password=nora_password"
  }
}
```

### Database Setup

```sql
-- Create database and user
CREATE DATABASE nora_db;
CREATE USER nora_user WITH PASSWORD 'nora_password';
GRANT ALL PRIVILEGES ON DATABASE nora_db TO nora_user;
```

Then run migrations:

```powershell
cd NoraPA.API
dotnet ef database update
```

---

## 🧪 Testing the Application

### 1. Test Toast Notifications

1. Go to <http://localhost:7002/inbox>
2. You should see a success toast: "Loaded 0 messages"
3. The toast should disappear after 3 seconds

### 2. Create a Test Message

Use the API directly:

```powershell
curl -X POST http://localhost:7001/api/messages `
  -H "Content-Type: application/json" `
  -d '{
    "source": "test",
    "sourceId": "test-1",
    "fromAddress": "test@example.com",
    "fromName": "Test Sender",
    "subject": "BMW Insurance Policy",
    "bodyPlain": "Your BMW X3 is now covered under policy 7260BMWSI. Coverage: €1500.",
    "receivedAt": "2026-01-12T23:00:00Z"
  }'
```

### 3. Test AI Analysis

1. Refresh the inbox page
2. You should see the test message
3. Click on it to open details
4. Click "Analyze" button
5. You should see:
   - Loading toast: "Starting AI analysis..."
   - Then success toast: "Analysis started successfully"

---

## 🎯 Features to Test

### ✅ Working Features

- [x] Message list display
- [x] Filtering (All/Unprocessed/Processed/Follow-up)
- [x] Sorting (Newest/Oldest/Sender)
- [x] Search messages
- [x] Mark as processed (with toast)
- [x] Flag for follow-up (with toast)
- [x] AI analysis trigger (with toast)
- [x] Toast notifications for all actions
- [x] Error handling with user-friendly messages

### 🚧 Features Not Yet Implemented

- [ ] Gmail integration
- [ ] Automatic background analysis
- [ ] Task auto-creation
- [ ] Entity extraction
- [ ] Framer Motion animations
- [ ] Keyboard shortcuts
- [ ] Dark mode toggle

---

## 🐛 Troubleshooting

### Backend won't start

**Error**: "Connection refused" or "Database does not exist"
**Solution**: Ensure PostgreSQL is running and database is created

### Frontend can't connect to API

**Error**: Network errors in browser console
**Solution**:

1. Verify backend is running on port 7001
2. Check CORS is enabled
3. Verify Vite proxy configuration

### Toast notifications not showing

**Error**: Toasts don't appear
**Solution**:

1. Check browser console for errors
2. Verify react-hot-toast is installed: `npm list react-hot-toast`
3. Refresh the page (Ctrl+Shift+R for hard refresh)

### OpenAI API errors

**Error**: "API key not configured" or "401 Unauthorized"
**Solution**: Add your OpenAI API key to `appsettings.json`

---

## 📁 Project Structure

```
NoraAssistant/
├── NoraPA.API/          # .NET Backend (Port 7001)
│   ├── Program.cs       # API endpoints, CORS, port config
│   ├── AiAnalysisService.cs
│   └── NoraDbContext.cs
├── NoraPA.Core/         # Domain models
│   ├── Message.cs
│   ├── AiAnalysis.cs
│   ├── Obligation.cs
│   └── Task.cs
├── NoraPA.Web/          # React Frontend (Port 7002)
│   └── src/
│       ├── main.tsx     # QueryClient & Toaster setup
│       ├── lib/
│       │   └── api.ts   # API client
│       ├── pages/
│       │   └── Inbox.tsx
│       └── components/
└── vision.md            # Full project vision
```

---

## 🎨 Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Backend API | 7001 | <http://localhost:7001> |
| Frontend | 7002 | <http://localhost:7002> |
| Proxy | - | /api → :7001 |

---

## 💡 Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **API Testing**: Use `/api.http` file in NoraPA.API for testing
3. **OpenAPI**: Visit <http://localhost:7001/openapi/v1.json> for API spec
4. **Console Logs**: Check browser console for detailed error messages
5. **Network Tab**: Use browser DevTools to inspect API calls

---

**Need Help?** Check `PHASE1_IMPROVEMENTS.md` for detailed changelog.
