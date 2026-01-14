# 🤖 Nora Personal Assistant

[![GitHub](https://img.shields.io/badge/GitHub-NoraPersonalAssistant-181717?logo=github)](https://github.com/konradwalsh/NoraPersonalAssistant)
[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Your Personal AI-Powered Digital Assistant.**

> **Documentation Moved**: Detailed documentation, including the [Developer Guide](docs/DEV_GUIDE.md), [Code Map](docs/CODEMAP.md), and [Vision](docs/vision.md), can now be found in the `docs/` directory.

## Overview

NoraAssistant is a local-first, privacy-focused application designed to help you organize your digital life. It connects to your email, calendars, and documents to extract actionable intelligence using advanced AI models.

- 📋 **Extracting obligations** from messages automatically
- 📅 **Detecting deadlines** and creating reminders
- 🚨 **Identifying risks** if actions are ignored
- 📄 **Managing documents** intelligently
- 💰 **Tracking financial commitments**
- 🤖 **Using AI** to understand context and urgency

**This is NOT another email client. This is an obligation detection and action system.**

---

## ✨ Current Features (v0.2 - Alpha)

### ✅ Working Now

- 📧 **Gmail Integration**: OAuth2 authentication, automatic sync, attachment downloads
- 📅 **Google Calendar**: Multi-calendar sync with selective calendar support
- 🤖 **AI Analysis**: Analyze messages with OpenAI GPT-4/GPT-4o (configurable)
- 📊 **Analytics Dashboard**: Real-time AI usage stats and throughput visualization
- 🔔 **Toast Notifications**: Real-time feedback for all actions
- 🎨 **Modern UI**: Premium dark mode with glassmorphism and Framer Motion animations
- 🔍 **Smart Filtering**: Unprocessed, processed, follow-up views
- 📁 **Document Vault**: Attachment management with search and category filters
- ⚡ **Fast Performance**: Optimized with TanStack Query
- ⌨️ **Command Menu**: Cmd+K quick navigation

### 🚧 In Development

- ✅ Auto-task creation from obligations
- 📱 Mobile responsiveness
- 🔌 Plugin system & Home Assistant integration

---

## 🚀 Quick Start

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)

### Installation

```bash
# Clone the repository
git clone https://github.com/konradwalsh/NoraPersonalAssistant.git
cd NoraPersonalAssistant

# Setup backend
cd NoraPA.API
dotnet restore
# Copy example config and add your API keys
cp appsettings.Example.json appsettings.json
# Edit appsettings.json with your OpenAI key and Google OAuth credentials
dotnet ef database update
dotnet run  # Starts on http://localhost:7001

# Setup frontend (in new terminal)
cd NoraPA.Web
npm install
npm run dev  # Starts on http://localhost:7002
```

Visit **<http://localhost:7002>** to use the app!

📖 See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Port 7002)              │
│  • React 19 + TypeScript                                    │
│  • TanStack Query for state management                      │
│  • shadcn/ui + Tailwind CSS for styling                     │
│  • Framer Motion for animations (in progress)               │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                .NET 9 Backend API (Port 7001)               │
│  • ASP.NET Core Minimal APIs                                │
│  • Entity Framework Core                                    │
│  • OpenAI Integration (GPT-4)                               │
│  • Background Jobs (Hangfire - planned)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
│  • Messages, AI Analyses, Obligations, Tasks, Deadlines     │
│  • Entity Relationships, Financial Records                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Tech Stack

### Backend

- **Framework**: .NET 9 (ASP.NET Core Minimal APIs)
- **Database**: PostgreSQL with Entity Framework Core
- **AI**: OpenAI GPT-4 API
- **Jobs**: Hangfire (planned)
- **Logging**: Serilog (planned)

### Frontend

- **Framework**: React 19 with TypeScript
- **Build**: Vite
- **Routing**: React Router 7
- **State**: TanStack Query + Zustand
- **UI**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Notifications**: react-hot-toast

---

## 📊 Progress

**Overall Completion**: ~25% ✅

| Feature | Status | Progress |
| :--- | :--- | :--- |
| Basic CRUD | ✅ Done | 100% |
| AI Analysis | 🟡 Partial | 30% |
| UI/UX | 🟡 Partial | 40% |
| Email Integration | ❌ Not Started | 0% |
| Task Auto-Creation | ❌ Not Started | 0% |
| Entity Extraction | ❌ Not Started | 0% |
| Background Jobs | ❌ Not Started | 0% |

See [PHASE1_IMPROVEMENTS.md](./PHASE1_IMPROVEMENTS.md) for detailed changelog.

---

## 🎨 Design Philosophy

### The Nora Difference

**Other Tools**: "Here's your inbox"
**Nora**: "Here's what you need to do"

**Other Tools**: Summarize emails
**Nora**: Extract obligations, deadlines, and risks

**Other Tools**: You manually create tasks
**Nora**: Auto-creates tasks from AI analysis

### UX Principles

1. **No Pop-ups** - Smooth toasts and slide-ins only
2. **Fluid Motion** - Everything animated with physics
3. **Dark-First** - Beautiful dark mode by default
4. **Keyboard-First** - Every action has a shortcut
5. **Zero Loading States** - Skeleton screens and optimistic updates

---

## 🗺️ Roadmap

### Phase 1: Foundation (✅ 90% Complete)

- [x] Basic message CRUD
- [x] AI analysis integration
- [x] Toast notifications
- [x] Port configuration (7001/7002)
- [x] Error handling
- [ ] Framer Motion animations

### Phase 2: Intelligence (Q1 2026)

- [ ] Enhanced AI extraction (8-section schema)
- [ ] Confidence scoring
- [ ] Auto-task creation pipeline
- [ ] Entity extraction (people, orgs)
- [ ] Deadline management with reminders

### Phase 3: Integration (Q2 2026)

- [ ] Gmail OAuth + sync
- [ ] Google Calendar integration
- [ ] WhatsApp Business API
- [ ] Slack integration
- [ ] Background job processing

### Phase 4: Scale & Polish (Q3 2026)

- [ ] Mobile apps (React Native)
- [ ] Plugin system
- [ ] Multi-tenancy
- [ ] Advanced analytics
- [ ] Self-hosted deployment guides

---

## 📖 Documentation

- **[Vision](./vision.md)**: Complete product vision and specifications
- **[Design System](./docs/DESIGN_SYSTEM.md)**: UI/UX principles, design tokens, and component patterns
- **[Quick Start](./QUICKSTART.md)**: Get up and running in 5 minutes
- **[Phase 1 Changelog](./PHASE1_IMPROVEMENTS.md)**: Recent improvements

---

## 🤝 Contributing

This project is in early alpha. Contributions welcome!

1. Check [vision.md](./vision.md) for the complete product vision
2. Pick a feature from the roadmap
3. Fork, build, test
4. Submit a PR with detailed description

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Powered by [OpenAI](https://openai.com/)
- Inspired by the need to never miss an important deadline again

---

## 🔗 Links

- **Live Demo**: Coming soon
- **Documentation**: [vision.md](./vision.md)
- **Issue Tracker**: GitHub Issues
- **Discord**: Coming soon

---

**Let's make "I forgot" a thing of the past.** 🚀
