# Nora Personal Assistant

**Never miss an obligation, deadline, or important detail again.**

Nora is an open-source, intelligent life management system that extracts signal from noise and transforms your digital communications into structured, actionable intelligence.

## 🎯 What Makes Nora Different

Unlike traditional email clients or task managers, Nora:

- **Extracts obligations** from your messages automatically
- **Detects deadlines** and creates smart reminders
- **Identifies risks** and consequences of inaction
- **Auto-creates tasks** from high-confidence obligations
- **Follows important links** and downloads referenced documents
- **Builds context** by linking related information
- **Prevents duplicates** through intelligent deduplication

## 🚀 Features

### Core Intelligence
- ✅ 8-section AI extraction schema (classification, entities, obligations, deadlines, financial significance, attachments, storage recommendations, confidence scoring)
- ✅ Multi-provider AI support (Claude, OpenAI, Gemini, DeepSeek, Ollama)
- ✅ Automatic task creation from obligations
- ✅ Smart deadline parsing (absolute, relative, recurring)
- ✅ Link intelligence with auto-download
- ✅ Risk detection and consequence analysis
- ✅ Context-aware deduplication

### Integrations
- 📧 Gmail (OAuth)
- 💬 WhatsApp Business API
- 📱 SMS (Twilio)
- 💼 Slack

### User Experience
- 🎨 Beautiful, fluid UI with Framer Motion animations
- 🔍 Natural language search (Cmd/Ctrl+K)
- ⌨️ Keyboard-first design
- 📱 Mobile-responsive
- 🌙 Dark-first theme
- 🎯 Zero pop-ups, only toasts and slide-ins

## 🏗️ Architecture

### Tech Stack

**Backend**
- .NET 9 C# with ASP.NET Core Minimal APIs
- Entity Framework Core (PostgreSQL/SQLite)
- Dapper for performance-critical queries
- SignalR for real-time updates
- Hangfire for background jobs
- Serilog for structured logging

**Frontend**
- React 18 + TypeScript
- Vite build system
- React Router 7
- TanStack Query (React Query)
- Zustand for state management
- Framer Motion for animations
- Radix UI + shadcn/ui components
- Tailwind CSS

**AI/ML**
- Multi-provider LLM support
- Function calling for structured extraction
- pgvector for semantic search
- Embedding models for document similarity

**Data Storage**
- PostgreSQL (primary database)
- Redis (caching, sessions)
- S3-compatible storage (documents)
- Vector embeddings (pgvector)

## 📦 Project Structure

```
NoraPA/
├── src/
│   ├── NoraPA.API/              # ASP.NET Core Web API
│   │   ├── Controllers/         # REST API controllers
│   │   ├── GraphQL/             # GraphQL schema and resolvers
│   │   ├── Hubs/                # SignalR hubs
│   │   ├── Middleware/          # Custom middleware
│   │   └── Program.cs           # Application entry point
│   │
│   ├── NoraPA.Core/             # Core business logic
│   │   ├── Models/              # Domain models
│   │   ├── Services/            # Business services
│   │   │   ├── AI/              # AI extraction services
│   │   │   ├── Integrations/    # Email, WhatsApp, SMS, Slack
│   │   │   ├── Processing/      # Message processing pipeline
│   │   │   └── Tasks/           # Task management
│   │   ├── Interfaces/          # Service interfaces
│   │   └── Extensions/          # Extension methods
│   │
│   ├── NoraPA.Infrastructure/   # Data access and external services
│   │   ├── Data/                # EF Core DbContext
│   │   ├── Repositories/        # Data repositories
│   │   ├── Migrations/          # Database migrations
│   │   └── External/            # External API clients
│   │
│   └── NoraPA.Web/              # React frontend
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── pages/           # Page components
│       │   ├── hooks/           # Custom hooks
│       │   ├── stores/          # Zustand stores
│       │   ├── api/             # API client
│       │   ├── types/           # TypeScript types
│       │   └── utils/           # Utility functions
│       ├── public/              # Static assets
│       └── package.json
│
├── tests/
│   ├── NoraPA.Tests.Unit/       # Unit tests
│   └── NoraPA.Tests.Integration/ # Integration tests
│
├── docker/
│   ├── docker-compose.yml       # Development environment
│   ├── docker-compose.prod.yml  # Production environment
│   └── Dockerfile               # Application container
│
└── docs/
    ├── ARCHITECTURE.md          # Architecture documentation
    ├── API.md                   # API documentation
    ├── DEPLOYMENT.md            # Deployment guide
    └── CONTRIBUTING.md          # Contribution guidelines
```

## 🚀 Quick Start

### Prerequisites

- .NET 9 SDK
- Node.js 20+
- PostgreSQL 16+ (or Docker)
- Redis (or Docker)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/nora-pa.git
cd nora-pa
```

2. **Start infrastructure services**
```bash
docker-compose up -d postgres redis
```

3. **Configure environment**
```bash
cp src/NoraPA.API/appsettings.Development.json.example src/NoraPA.API/appsettings.Development.json
# Edit with your API keys and connection strings
```

4. **Run database migrations**
```bash
cd src/NoraPA.API
dotnet ef database update
```

5. **Start the backend**
```bash
cd src/NoraPA.API
dotnet run
```

6. **Start the frontend**
```bash
cd src/NoraPA.Web
npm install
npm run dev
```

7. **Open your browser**
```
http://localhost:5173
```

### Docker Deployment

```bash
docker-compose up -d
```

This starts:
- Nora API (port 5000)
- Nora Web (port 5173)
- PostgreSQL (port 5432)
- Redis (port 6379)

## 📖 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)

## 🔑 Configuration

### AI Providers

Nora supports multiple AI providers. Configure in `appsettings.json`:

```json
{
  "AI": {
    "Provider": "Claude",
    "Claude": {
      "ApiKey": "your-api-key",
      "Model": "claude-sonnet-4.5"
    },
    "OpenAI": {
      "ApiKey": "your-api-key",
      "Model": "gpt-4"
    },
    "Gemini": {
      "ApiKey": "your-api-key",
      "Model": "gemini-pro"
    },
    "Ollama": {
      "BaseUrl": "http://localhost:11434",
      "Model": "llama3"
    }
  }
}
```

### Email Integration

```json
{
  "Gmail": {
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret",
    "RedirectUri": "http://localhost:5000/auth/gmail/callback"
  }
}
```

## 🎯 Core Concepts

### The 8-Section Extraction Schema

Every message is analyzed through 8 dimensions:

1. **Classification** - Type, domain, importance
2. **Key Entities** - People, organizations, identifiers
3. **Obligations & Actions** - What must be done
4. **Deadlines & Dates** - When it must be done
5. **Financial & Legal Significance** - Costs, risks, conditions
6. **Attachments & Links** - Documents and references
7. **Storage & Organization** - Where to file it
8. **Confidence & Follow-Up** - How certain we are

### Automatic Task Creation

Tasks are auto-created when:
- Confidence score ≥ 85%
- Obligation is marked as mandatory
- Clear action and deadline identified

### Link Intelligence

Nora automatically follows links when messages contain:
- "in conjunction with"
- "please refer to"
- "full terms available at"
- "read together with"

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Original concept by Konrad Walsh
- Powered by Claude Sonnet 4.5
- Built with love for the open source community

## 📞 Support

- 📧 Email: support@nora-pa.com
- 💬 Discord: [Join our community](https://discord.gg/nora-pa)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/nora-pa/issues)

---

**Nora PA - Never miss an obligation again.** 🎯
