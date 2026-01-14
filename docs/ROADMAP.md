# Nora Assistant - Development Roadmap

This document outlines the strategic plan for Nora Assistant, moving from a smart email processor to a fully autonomous personal agent.

## Phase 1: Foundation & Data Sovereignty (Current Focus)

**Goal:** Establish a robust, local-first system that ingests data, performs basic analysis, and offers a premium user experience.

- [x] **Core Architecture**
  - [x] .NET 8 Web API Backend (Port 7001)
  - [x] React + Vite + Tailwind Frontend (Port 7002)
  - [x] SQLite/PostgreSQL Database Provider Support
  - [x] Secure API Key Management (masked in UI)

- [x] **Communication Hub (Inbox)**
  - [x] Gmail Sync (multipart parsing, HTML rendering)
  - [x] Manual & Auto-Sync Triggers
  - [x] Secure HTML Message Viewing (Sandboxed iFrame)
  - [x] Attachment Downloading

- [x] **AI Intelligence Engine**
  - [x] Multi-Provider Support (OpenAI, Anthropic, Google, DeepSeek, Ollama)
  - [x] Structured Extraction (Summary, Obligations, Deadlines, Entities)
  - [x] Smart Routing (Premium vs. Economy models) *[Basic Impl]*
  - [x] Generic Demo Mode for testing

- [x] **Knowledge Management**
  - [x] **People**: Contact deduplication and management.
  - [x] **Events**: Calendar event extraction and display.
  - [x] **Documents**: Attachment listing and categorization.
  - [x] **Identity**: User profile context (Bio, Career, Household).

- [x] **System Health & Data**
  - [x] Database Export (Backup)
  - [x] **Database Restore (Import)**: Restore system state from backup.
  - [x] **Logs**: Real-time log viewer in Settings.

## Phase 2: Active Assistance & Memory (Next)

**Goal:** Transition from "Reader" to "Doer" and build long-term memory.

- [x] **Interactive "Ask Nora" Agent**
  - Global chat interface to query your data (e.g., "What did John say about the budget last week?").
  - Context-aware answers using current open page data.

- [ ] **Vector Memory (RAG)**
  - Embed emails and documents into a vector database (e.g., Qdrant or local embedding).
  - Semantic search ("Find that invoice from the car mechanic").

- [ ] **Action Automation (The "Hands")**
  - **Draft Replies**: AI-generated email drafts based on context.
  - **Calendar Sync**: Push extracted events to Google Calendar.
  - **Task Sync**: Push obligations to Todoist/Microsoft To Do.

## Phase 3: Connected Ecosystem (Future)

**Goal:** Deep integration with the physical and digital world.

- [ ] **Home Assistant Integration**
  - Bi-directional control: "Nora, turn off the lights if I'm late."
  - Dashboard widgets for Home Assistant entities.

- [ ] **Plugin Architecture**
  - Modular system for community extensions.
  - Nextcloud, Slack, and Discord connectors.

- [ ] **Voice Interface**
  - Real-time voice conversation mode.

## Phase 4: Local Autonomy

**Goal:** reduce reliance on cloud APIs.

- [ ] **Local-First AI**: Optimized prompts for Llama 3 / Mistral (Ollama).
- [ ] **Offline Mode**: Full PWA capabilities.
