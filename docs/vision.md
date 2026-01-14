# Nora Personal Assistant - Complete Vision Prompt

**For AI Agent/Development Team**

---

## Mission Statement

Build **Nora Personal Assistant** - an open-source, intelligent life management system that **never lets you miss an obligation, deadline, or important detail**.

This is NOT another email client. This is NOT a note-taking app.

**Nora is a triage + action detector that extracts signal from noise and transforms your digital life into structured, actionable intelligence.**

---

## Core Philosophy

### The Problem We're Solving

People are drowning in digital communications (email, WhatsApp, SMS, Slack) that contain:

- **Hidden obligations** ("Please confirm within 48 hours")
- **Critical deadlines** ("Coverage expires Jan 15")
- **Important documents** ("Read this policy in conjunction with...")
- **Financial/legal risks** ("Failure to comply may result in...")
- **Scattered assets** (policy numbers, account refs, passwords hints)

**Current tools fail because:**

1. They only summarize, they don't extract obligations
2. They miss context ("read in conjunction with" = must follow link!)
3. They don't detect risk or urgency correctly
4. They don't create actionable tasks automatically
5. They analyze in isolation (no memory, no deduplication)

### What Makes Nora Different

**Nora doesn't ask "What's the summary?"**

**Nora asks:**

1. What obligation does this create?
2. What's the deadline?
3. What action must I take?
4. What's the risk if I ignore this?
5. What documents must I download/store?
6. How does this relate to my existing life records?

---

## The Contract Between Model and World

You are a personal assistant AI acting on behalf of the user.

Your role is NOT to summarise emails casually.
Your role is to extract obligations, assets, deadlines, identifiers, and required actions.

For every email:

- Identify whether the email creates a RECORD, TASK, DEADLINE, or REFERENCE DOCUMENT.
- Detect important links and attachments and mark which must be downloaded or followed.
- Extract structured data suitable for long-term storage.
- Flag anything that could be financially, legally, or operationally important.

If information is missing or ambiguous, explicitly say so.
Do not assume intent. Infer cautiously.

Every message (email, WhatsApp, SMS, Slack) **MUST** be processed through this extraction schema:

### 1. Classification

```json
{
  "type": ["insurance", "policy", "confirmation"],
  "importance": "high",
  "reason": "Creates insurance coverage with identifiers and policy documents"
}
```

> Rule: **If it creates coverage, ownership, access, or liability → high importance**

### 2. Key Entities

```json
{
  "people": ["Konrad Walsh", "Nick Urwin"],
  "organizations": ["BMW Keycare", "Keycare Assistance Limited", "Mapfre"],
  "products_or_services": ["BMW Keycare Insurance"],
  "identifiers": {
    "policy_reference": "7260BMWSI",
    "policyholder": "Konrad Walsh"
  }
}
```

### 3. Obligations and Actions

```json
[
  {
    "action": "Read policy documents",
    "trigger": "Immediately",
    "mandatory": true
  },
  {
    "action": "Attach key fob to keys",
    "trigger": "Upon receipt of key fob",
    "mandatory": true
  },
  {
    "action": "Save emergency helpline number",
    "trigger": "Optional but recommended",
    "mandatory": false
  }
]
```

> This is where you later auto-create reminders or tasks.

### 4. Deadlines and Dates

```json
{
  "policy_effective_date": "2026-01-06",
  "issue_date": "2026-01-08",
  "policy_term": "12 months",
  "claim_notification_deadline": "45 days from loss date"
}
```

Notice: **relative deadlines are preserved**, not flattened.

### 5. Financial or Legal Significance

```json
{
  "financial_exposure": "Insurance coverage up to €1500",
  "conditions": [
    "Key fob must be attached to claimed item",
    "Claim must be notified within 45 days"
  ],
  "risk_if_ignored": "Claim may be rejected"
}
```

This is gold for future-you.

### 6. Attachments and Links

```json
{
  "attachments": [
    {
      "name": "Policy Schedule",
      "required_action": "download_and_store"
    }
  ],
  "links": [
    {
      "description": "Policy Documents portal",
      "url_present": true,
      "required_action": "follow_and_download_policy_booklet",
      "reason": "Policy terms not fully included in email"
    }
  ]
}
```

> Your agent should treat "read in conjunction with" as a **hard signal** to follow links.

### 7. Storage Recommendation

```json
{
  "category": "Insurance",
  "subfolder": "Vehicle/BMW X3",
  "retention": "Long-term",
  "index_fields": [
    "policy_reference",
    "effective_date",
    "cover_limit"
  ]
}
```

### 8. Confidence Notes

```json
{
  "missing_items": ["Actual policy booklet not attached"],
  "assumptions": ["Key fob delivery pending"],
  "follow_up_needed": true
}
```

### Edge Case Handling Examples

**Conflicting Deadlines**:

- Email: "Please respond by Friday, but note our office is closed next Monday"
- Extraction: Identify primary deadline (Friday) and note exception, create reminder for following Tuesday

**Ambiguous Language**:

- Email: "Let's touch base next week"
- Extraction: Flag as low confidence, suggest user clarification, don't auto-create task

**Conditional Obligations**:

- Email: "If you haven't received confirmation, contact us within 7 days"
- Extraction: Create conditional task that monitors for confirmation email

**Multi-Language Content**:

- Email in French: "Veuillez confirmer avant le 15 janvier"
- Extraction: Detect language, translate if needed, extract deadline correctly

**Sarcasm/Irony**:

- Email: "Oh great, another deadline I can totally meet"
- Extraction: Use context and tone analysis to avoid false positives

**Recurring Obligations**:

- Email: "Monthly report due on the 1st"
- Extraction: Create recurring task with proper calendar integration

---

## Intelligent Action Rules

### Link Following Logic

```
IF email contains phrases:
  - "in conjunction with"
  - "please refer to"
  - "full terms available at"
  - "read together with"
  - "subject to terms at"

AND link points to:
  - PDF documents
  - Policy portals
  - Legal terms
  - Financial disclosures

THEN:
  - Mark link as REQUIRED (not optional)
  - Auto-follow link
  - Download referenced documents
  - Extract text from PDFs
  - Re-analyze combined content
  - Store complete document set together
```

### Task Auto-Creation Pipeline

```
FOR EACH obligation in obligations:
  IF confidence >= 0.85 AND mandatory == true:
    CREATE task:
      - Title: obligation.action
      - Due date: parse(obligation.trigger)
      - Priority: calculate(importance, consequence_if_ignored)
      - Context: link_to_source_email
      - Checklist: break down into steps
      - Reminder: set based on trigger type

  IF confidence < 0.85 OR mandatory == false:
    FLAG for human review:
      - Show extracted obligation
      - Ask: "Should I create task for this?"
      - Learn from user response
```

### Deadline Intelligence

```
Absolute deadlines:
  - Parse date
  - Create calendar event
  - Set multiple reminders (2 weeks, 1 week, 1 day)
  - Link to source obligation

Relative deadlines ("45 days from loss date"):
  - Store as rule
  - Monitor for trigger event
  - Calculate absolute date when triggered
  - Create calendar event dynamically
  - Alert user to approaching deadline
```

### Context Awareness & Deduplication

```
BEFORE creating new record:
  1. Check: Does similar record exist?
     - Same entity (policy number, account number)
     - Same organization
     - Same life domain

  2. IF exists:
     - UPDATE existing record
     - ADD new information
     - LINK to new source email
     - DON'T create duplicate

  3. IF new:
     - CREATE record
     - AUTO-LINK to related records
     - BUILD relationship graph
```

---

## Architecture Requirements

### Port Configuration

**All web services must use ports starting at 7001:**

- API Server: `http://localhost:7001`
- Frontend Dev Server: `http://localhost:7002`
- WebSocket/SignalR: `ws://localhost:7001/hubs`
- Additional services: 7003+

This avoids conflicts with common development ports (3000, 5000, 8080) and provides a consistent, memorable port range.

### Tech Stack

**Backend (.NET 9 C#)**

- ASP.NET Core Minimal APIs
- Entity Framework Core (PostgreSQL for production, SQLite for dev)
- Dapper for performance-critical queries
- SignalR for real-time updates
- Hangfire for background jobs (sync, reminders, auto-tasks)
- Serilog for structured logging

**Frontend (React 18 + TypeScript)**

- Vite build system
- React Router 7
- TanStack Query (React Query)
- Zustand for state management
- Framer Motion for animations
- Radix UI for accessible components
- Tailwind CSS for styling
- shadcn/ui component library

**AI/ML**

- Multi-provider support (Claude, OpenAI, Gemini, DeepSeek, Ollama)
- Prompt caching for cost optimization
- Function calling for structured extraction
- Vector database (pgvector) for semantic search
- Embedding models for document similarity

**Data Storage**

- PostgreSQL (primary database)
- Redis (caching, session management)
- S3-compatible storage (documents, attachments)
- Vector embeddings (pgvector extension)

### Rationale for Technical Choices

**Backend (.NET 9 C#)**:

- **ASP.NET Core Minimal APIs**: Lightweight, high-performance APIs with less boilerplate than MVC
- **Entity Framework Core**: Mature ORM with strong PostgreSQL support and migration tools
- **Dapper**: For complex queries requiring performance optimization
- **SignalR**: Real-time updates for live obligation notifications
- **Hangfire**: Reliable background job processing for sync and reminders
- **Serilog**: Structured logging for better observability and debugging

**Frontend (React 18 + TypeScript)**:

- **Vite**: Fast build tool with hot reload for development productivity
- **React Router 7**: Modern routing with data loading and mutation support
- **TanStack Query**: Efficient data fetching with caching and synchronization
- **Zustand**: Lightweight state management without Redux complexity
- **Framer Motion**: Declarative animations for fluid UX
- **Radix UI + shadcn/ui**: Accessible, customizable components

**AI/ML**:

- **Multi-provider support**: Cost optimization and fallback for API outages
- **pgvector**: Native PostgreSQL vector support for semantic search
- **Embedding models**: For document similarity and context-aware deduplication

**Why These Choices**:

- **Performance**: All technologies chosen for high performance and scalability
- **Developer Experience**: Modern tooling reduces development time and bugs
- **Ecosystem Maturity**: Established libraries with strong community support
- **Open Source Alignment**: Technologies that work well in self-hosted environments

### Database Schema (Key Tables)

```sql
-- Messages (unified inbox)
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL, -- 'gmail', 'whatsapp', 'sms', 'slack'
    source_id VARCHAR(255) NOT NULL,
    from_address VARCHAR(255),
    from_name VARCHAR(255),
    to_addresses JSONB,
    subject TEXT,
    body_plain TEXT,
    body_html TEXT,
    received_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ,
    life_domain VARCHAR(50),
    importance VARCHAR(20),
    UNIQUE(source, source_id)
);

-- Extracted obligations
CREATE TABLE obligations (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id),
    action TEXT NOT NULL,
    trigger_type VARCHAR(50), -- 'immediate', 'date', 'event'
    trigger_value TEXT,
    mandatory BOOLEAN DEFAULT false,
    consequence TEXT,
    estimated_time INTERVAL,
    priority INTEGER,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Extracted deadlines
CREATE TABLE deadlines (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id),
    obligation_id BIGINT REFERENCES obligations(id),
    deadline_type VARCHAR(20), -- 'absolute', 'relative', 'recurring'
    deadline_date TIMESTAMPTZ,
    relative_trigger VARCHAR(255),
    relative_duration INTERVAL,
    description TEXT,
    reminders JSONB, -- [{"offset": "2 weeks", "sent": false}]
    critical BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active'
);

-- Entities (people, orgs, products)
CREATE TABLE entities (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50), -- 'person', 'organization', 'product', 'vehicle', 'property'
    name VARCHAR(255) NOT NULL,
    identifiers JSONB, -- {"policy_ref": "123", "vin": "ABC"}
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, name)
);

-- Documents
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id),
    filename VARCHAR(255),
    file_path TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    document_type VARCHAR(50), -- 'policy', 'receipt', 'contract', 'statement'
    importance VARCHAR(20),
    category VARCHAR(50),
    subcategory VARCHAR(50),
    retention_policy VARCHAR(50),
    index_fields JSONB,
    tags TEXT[],
    extracted_text TEXT,
    embedding vector(1536), -- OpenAI embeddings
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial/legal significance
CREATE TABLE financial_records (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id),
    record_type VARCHAR(50), -- 'coverage', 'payment', 'refund', 'fine'
    amount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    conditions JSONB,
    exclusions JSONB,
    risk_level VARCHAR(20),
    risk_explanation TEXT,
    valid_from DATE,
    valid_until DATE
);

-- AI analysis cache
CREATE TABLE ai_analyses (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id),
    provider VARCHAR(50),
    model VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    cost DECIMAL(8,6),
    extraction_result JSONB, -- Full 8-section schema
    confidence_scores JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (auto-created from obligations)
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    obligation_id BIGINT REFERENCES obligations(id),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    priority INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    checklist JSONB,
    context_link TEXT, -- Link back to source message
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Relationships (entity graph)
CREATE TABLE entity_relationships (
    id BIGSERIAL PRIMARY KEY,
    entity_a_id BIGINT REFERENCES entities(id),
    entity_b_id BIGINT REFERENCES entities(id),
    relationship_type VARCHAR(50), -- 'owns', 'insured_by', 'related_to'
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Design (RESTful + GraphQL)

**REST Endpoints** (for CRUD operations):

```
POST   /api/messages/sync          - Trigger sync across all sources
GET    /api/messages                - List messages (paginated, filtered)
GET    /api/messages/:id            - Get message details
POST   /api/messages/:id/analyze    - Trigger AI analysis
GET    /api/messages/:id/extraction - Get extraction results

GET    /api/obligations              - List obligations
POST   /api/obligations              - Create manual obligation
PATCH  /api/obligations/:id/status   - Update status
DELETE /api/obligations/:id          - Cancel obligation

GET    /api/deadlines                - List deadlines (filtered by date range)
GET    /api/deadlines/upcoming       - Get upcoming deadlines
POST   /api/deadlines/:id/remind     - Trigger manual reminder

GET    /api/tasks                    - List tasks
POST   /api/tasks                    - Create manual task
PATCH  /api/tasks/:id               - Update task
DELETE /api/tasks/:id               - Delete task

GET    /api/documents                - List documents
GET    /api/documents/:id/download   - Download document
POST   /api/documents/:id/analyze    - Extract text/metadata
GET    /api/documents/search         - Semantic search

POST   /api/auth/login               - Login
POST   /api/auth/oauth/:provider     - OAuth login
GET    /api/auth/me                  - Get current user
```

**GraphQL** (for complex queries):

```graphql
query GetMessageWithContext($id: ID!) {
  message(id: $id) {
    id
    subject
    body
    receivedAt
    extraction {
      classification {
        type
        lifeDomain
        importance
      }
      entities {
        people
        organizations
        identifiers
      }
      obligations {
        action
        trigger
        mandatory
        consequence
        status
      }
      deadlines {
        deadlineDate
        description
        reminders
      }
      financialSignificance {
        coverageAmount
        riskLevel
      }
    }
    documents {
      filename
      documentType
      importance
    }
    tasks {
      title
      dueDate
      status
    }
  }
}

query GetUpcomingObligations($days: Int!) {
  obligations(
    filter: {
      status: PENDING
      dueBefore: { days: $days }
    }
    orderBy: { field: DUE_DATE, direction: ASC }
  ) {
    action
    dueDate
    priority
    consequence
    sourceMessage {
      subject
      from
    }
  }
}

query SearchDocuments($query: String!, $limit: Int) {
  documentsSearch(query: $query, limit: $limit) {
    id
    filename
    documentType
    similarity
    extractedText
    relatedMessages {
      subject
      receivedAt
    }
  }
}
```

---

## Security and Privacy Considerations

Given that Nora handles sensitive personal data including emails, financial information, legal documents, and personal obligations, security and privacy must be foundational to the architecture.

### Data Protection Principles

- **End-to-End Encryption**: All data at rest and in transit encrypted using AES-256
- **Zero-Knowledge Architecture**: AI processing occurs on encrypted data where possible
- **User Consent**: Explicit, granular permissions for each integration and data type
- **Data Minimization**: Only extract and store what's necessary for obligation detection

### Compliance Requirements

- **GDPR/CCPA Compliance**: Right to erasure, data portability, consent management
- **Audit Logging**: Comprehensive logging of all data access and processing
- **Regular Security Audits**: Third-party penetration testing and code reviews
- **Incident Response**: 24/7 monitoring with automated breach notification

### Technical Security Measures

- **OAuth 2.0 + PKCE**: Secure authentication for all integrations
- **API Rate Limiting**: Protection against abuse and DoS attacks
- **Input Validation**: Sanitization of all incoming data to prevent injection attacks
- **Secure AI Processing**: Isolated AI environments with restricted data access

### Privacy by Design

- **User Control**: Dashboard for managing connected accounts, data retention, and deletion
- **Transparent Processing**: Clear explanations of what data is processed and why
- **Anonymized Analytics**: Usage metrics without exposing personal data
- **Local Processing Option**: Self-hosted version for maximum privacy control

### Cloud Provider Setup

For integrations requiring cloud projects:

- **Google Cloud Project**: Required for Gmail OAuth, Calendar API, and Drive API access
- **Microsoft Azure AD**: For Outlook/Exchange and Microsoft Calendar integration
- **Apple Developer Program**: For iCloud services (limited availability)
- **Multi-Cloud Support**: Allow users to choose providers based on their preferences

---

## Technical Risks and Mitigations

### Integration Challenges

- **WhatsApp Business API**: Designed for business-to-customer messaging, not personal assistant use. Personal numbers require unofficial libraries which are brittle.
- **iMessage/iCloud**: No official read API available. Would require Mac bridge solution, limiting TAM.
- **Email State Sync**: Bidirectional sync with Gmail/Outlook is complex. Start with read-only intelligence layer that pushes to external tools.

**Mitigation**: Begin as "Read-Only Intelligence Layer" pushing to Todoist/Calendar rather than full email client replacement.

### Cost and Latency Issues

- **Every Message Analysis**: Sending all emails (including spam) to expensive LLMs is cost-prohibitive.
- **Solution**: Implement **Router/Triage Model** using cheap local model (BERT) to classify `Is_Transactional?` before expensive extraction.

### AI Hallucination Risk

- **High-Stakes Errors**: Missing obligations can cause legal/financial harm; false positives cause stress.
- **Mitigation**: Always show source email snippets with extractions. Implement user feedback loop for continuous improvement.

### Database Schema Additions

```sql
-- Obligation lineage for superseded tasks
CREATE TABLE obligation_lineage (
    id BIGSERIAL PRIMARY KEY,
    current_obligation_id BIGINT REFERENCES obligations(id),
    previous_obligation_id BIGINT REFERENCES obligations(id),
    relationship_type VARCHAR(50), -- 'supersedes', 'updates', 'corrects'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User feedback for AI training
CREATE TABLE user_feedback (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id),
    extraction_result JSONB,
    user_action VARCHAR(50), -- 'accepted', 'rejected', 'modified'
    user_correction JSONB, -- What the user changed
    feedback_timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## UX/UI Vision: Natural, Delightful, Invisible

### Design Principles

1. **No Pop-ups** - Use disappearing toasts, slide-in panels, inline notifications
2. **Fluid Motion** - Everything animated with Framer Motion (spring physics)
3. **Gesture-Based** - Swipe to delete, pull to refresh, pinch to zoom
4. **Progressive Disclosure** - Show what's needed, hide complexity
5. **Contextual Actions** - Right-click menus, long-press actions
6. **Natural Scrolling** - Smooth physics, momentum, rubber-banding
7. **Haptic Feedback** - On mobile, tactile confirmation of actions
8. **Dark-First** - Beautiful dark theme with subtle gradients
9. **Zero Loading States** - Skeleton screens, optimistic updates
10. **Keyboard-First** - Every action has keyboard shortcut
11. **Accessible-First** - WCAG 2.1 AA compliance, screen reader support, high contrast modes
12. **Internationalization-Ready** - Full i18n support, RTL language handling, localized date/time formatting

### Core UI Requirements (Must Work)

These are non-negotiable features that must function properly:

#### Toast Notification System

**Unified toast notifications across the entire app - NO browser alerts:**

```
┌─────────────────────────────────────────────────────────────┐
│ Toast Types:                                                 │
├─────────────────────────────────────────────────────────────┤
│ ✓ Success  - "Settings saved"         (green, auto-dismiss) │
│ ⚠ Warning  - "API key expiring soon"  (yellow, 5s dismiss)  │
│ ✕ Error    - "Connection failed"      (red, manual dismiss) │
│ ℹ Info     - "Sync in progress..."    (blue, auto-dismiss)  │
└─────────────────────────────────────────────────────────────┘

Implementation:
- Use react-hot-toast or similar library
- Position: top-right corner
- Stack multiple toasts vertically
- Actions that MUST use toasts (not browser alerts):
  • Save settings
  • Test connection (success/failure)
  • Sync started/completed
  • Email analysis complete
  • Task created
  • Any error condition
```

#### Collapsible Setup Guide

**Setup guides must be collapsible so they don't block form inputs:**

```
┌─────────────────────────────────────────────────────────────┐
│ ▼ Setup Guide: Configure Claude API                    [×]  │
├─────────────────────────────────────────────────────────────┤
│ 1. Go to console.anthropic.com                              │
│ 2. Create an API key                                        │
│ 3. Paste below                                              │
│ [Collapse]                                   [Don't show again] │
└─────────────────────────────────────────────────────────────┘

When collapsed:
┌─────────────────────────────────────────────────────────────┐
│ ▶ Setup Guide: Configure Claude API                    [?]  │
└─────────────────────────────────────────────────────────────┘

Requirements:
- Default: Collapsed for returning users, expanded for new users
- Remember collapse state in localStorage
- "Don't show again" option per guide
- Help icon (?) to re-expand when needed
- NEVER block access to form inputs
```

#### Proper Log Level Display

**Show actual log levels with distinct visual styling:**

```
┌─────────────────────────────────────────────────────────────┐
│ Activity Log                                    [Filter ▼]  │
├─────────────────────────────────────────────────────────────┤
│ 10:23:45  DEBUG  Starting email sync...          (gray)     │
│ 10:23:46  INFO   Connected to Gmail API          (blue)     │
│ 10:23:47  INFO   Fetching 50 emails...           (blue)     │
│ 10:23:52  WARN   Rate limit approaching          (yellow)   │
│ 10:23:53  ERROR  Failed to parse email #123      (red)      │
│ 10:23:54  INFO   Sync complete: 49/50 emails     (blue)     │
└─────────────────────────────────────────────────────────────┘

Requirements:
- Color-coded log levels (not all showing as "info")
- Filter by level (show only errors, warnings, etc.)
- Timestamp for each entry
- Expandable details for errors
- Copy log entry to clipboard
- Export logs for debugging
```

#### Working AI Email Analysis

**"Analyze with AI" must display actual results:**

```
┌─────────────────────────────────────────────────────────────┐
│ AI Analysis Results                              [Re-analyze]│
├─────────────────────────────────────────────────────────────┤
│ Classification:                                              │
│   Type: Insurance Policy    Domain: Vehicle                 │
│   Importance: HIGH          Confidence: 94%                 │
│                                                              │
│ Extracted Entities:                                          │
│   👤 People: John Smith (Agent)                              │
│   🏢 Organizations: BMW Keycare, Mapfre Insurance            │
│   🔢 Identifiers: Policy #7260BMWSI, VIN: WBAXXXXX          │
│                                                              │
│ Obligations Found (2):                                       │
│   ⚠ Read policy documents        Due: Immediate             │
│   ⚠ Attach key fob when arrives  Due: On delivery           │
│                                                              │
│ Deadlines:                                                   │
│   📅 Policy renewal: Jan 6, 2027                            │
│                                                              │
│ [Create Tasks]  [Add to Calendar]  [View Raw JSON]          │
└─────────────────────────────────────────────────────────────┘

Requirements:
- Show loading spinner while analyzing
- Display ALL sections from the 8-part extraction schema
- Confidence scores visible
- Actionable buttons (create tasks, add deadlines)
- Option to view raw JSON response
- Error handling with clear messages
```

#### Task Completion Verification

**Users must be able to mark tasks as complete and Nora should learn from completion patterns:**

```json
{
  "completion_methods": [
    "Manual checkbox in task list",
    "Auto-detection from follow-up emails (e.g., 'Payment confirmed')",
    "Calendar event completion",
    "User feedback on AI suggestions"
  ],
  "learning_loop": "Rejected suggestions train the model to avoid similar false positives"
}
```

Requirements:

- Always show source email context for verification
- Implement auto-completion detection from related messages
- User feedback directly improves AI accuracy
- Clear distinction between AI-suggested and user-confirmed tasks

#### Mobile-First Considerations

**Complex multi-column views must adapt gracefully to mobile screens:**

```json
{
  "mobile_adaptations": [
    "Email body hidden behind tab to prioritize extraction",
    "Swipe gestures for quick actions (archive, prioritize)",
    "Simplified task creation flow",
    "Progressive disclosure of AI details"
  ],
  "touch_optimizations": "Large touch targets, gesture-based navigation"
}
```

Requirements:

- Responsive design that works on phones without sacrificing functionality
- Touch-friendly interactions for all core features
- Optimized performance for mobile networks

#### Display Email Content

**Users must be able to read the full email body:**

```
┌─────────────────────────────────────────────────────────────┐
│ From: BMW Keycare <noreply@bmw.ie>                          │
│ To: you@email.com                                           │
│ Date: January 8, 2026 at 10:30 AM                          │
│ Subject: Your BMW X3 Insurance Policy                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Dear Customer,                                               │
│                                                              │
│ Your BMW X3 is now covered under our comprehensive          │
│ insurance policy. Please find attached your policy          │
│ documents which should be read in conjunction with          │
│ the terms available at our portal.                          │
│                                                              │
│ Key details:                                                 │
│ - Policy Reference: 7260BMWSI                               │
│ - Coverage: €1,500                                          │
│ - Effective: January 6, 2026                                │
│                                                              │
│ [Show full email]  [View HTML]  [View Plain Text]           │
└─────────────────────────────────────────────────────────────┘

Requirements:
- Display FULL email body, not just subject/title
- Support both HTML and plain text views
- Toggle between formatted and raw view
- Highlight key phrases (dates, amounts, deadlines)
- Expand/collapse for long emails
- Safe HTML rendering (sanitized)
```

#### Attachment Detection & Display

**Show attachments on emails with download/preview options:**

```
┌─────────────────────────────────────────────────────────────┐
│ Attachments (3)                                             │
├─────────────────────────────────────────────────────────────┤
│ 📄 Policy_Schedule.pdf          127 KB    [Preview] [⬇]    │
│ 📄 Terms_and_Conditions.pdf     2.1 MB    [Preview] [⬇]    │
│ 🖼️ Coverage_Certificate.png     45 KB     [Preview] [⬇]    │
│                                                              │
│ [Download All]                                              │
└─────────────────────────────────────────────────────────────┘

Requirements:
- Detect all attachments from emails
- Show file type icon, name, and size
- Preview capability for common formats (PDF, images)
- Individual and bulk download options
- Indicate if attachment was auto-archived
- Flag potentially important documents (policies, contracts)
```

### Features to Restore (Lost from Original Version)

These features existed before and must be restored:

#### Automatic Email Categorization

- Emails auto-categorized on sync (not just on manual analysis)
- Categories assigned based on sender, content, keywords
- Background processing - user sees categories when they open inbox
- Learning from user corrections

#### Entity Extraction & People Graph

```
┌─────────────────────────────────────────────────────────────┐
│ People & Organizations Found                                 │
├─────────────────────────────────────────────────────────────┤
│ 👤 John Smith                                                │
│    └─ Agent at BMW Keycare                                  │
│    └─ Appears in: 3 emails                                  │
│    └─ Related to: Vehicle Insurance                         │
│                                                              │
│ 🏢 BMW Keycare                                               │
│    └─ Type: Insurance Provider                              │
│    └─ Appears in: 5 emails                                  │
│    └─ Related entities: BMW Ireland, Mapfre                 │
│                                                              │
│ 🔗 Connections:                                              │
│    BMW Keycare ←→ Mapfre Insurance (underwriter)            │
│    John Smith ←→ BMW Keycare (employee)                     │
└─────────────────────────────────────────────────────────────┘

Requirements:
- Extract people, companies, organizations from all emails
- Find commonality (same person across messages)
- Build relationship graph between entities
- Deduplicate (John Smith = J. Smith = john.smith@)
- Show entity profile with all related messages
```

#### Message Connections & Threading

```
┌─────────────────────────────────────────────────────────────┐
│ Related Messages                                             │
├─────────────────────────────────────────────────────────────┤
│ This email is connected to:                                  │
│                                                              │
│ 📧 "Welcome to BMW Keycare" (Jan 5)                         │
│    └─ Same sender, same policy reference                    │
│                                                              │
│ 📧 "Your key fob has shipped" (Jan 7)                       │
│    └─ Same policy, related product                          │
│                                                              │
│ 📅 Calendar: "BMW Service Appointment" (Jan 15)             │
│    └─ Same vehicle                                          │
│                                                              │
│ Connection types: Thread | Same Sender | Same Topic |       │
│                   Same Entity | Same Policy/Reference       │
└─────────────────────────────────────────────────────────────┘

Requirements:
- Auto-detect message threads
- Link messages with same references (policy #, order #)
- Connect messages about same entities
- Show visual connection graph
- Navigate between related items easily
```

### The Mail Section: An Interactive Inbox

The mail section is NOT just a read-only email viewer. It's a **working inbox** where users actively triage, categorize, and convert information into actionable items. Users should feel like they're in control - AI provides suggestions, but the user decides.

#### User-Controlled Categories

```
┌─────────────────────────────────────────────────────────────┐
│ Categories (User-Defined)                                    │
├─────────────────────────────────────────────────────────────┤
│ [+ Add Category]                                             │
│                                                              │
│ 🏠 Home & Family    🚗 Vehicle    💼 Work    💰 Finance     │
│ 🏥 Health          📄 Legal      🛒 Shopping  ⭐ Important   │
│ 🗂️ Archive         🗑️ Trash                                  │
│                                                              │
│ AI will suggest categories, but YOU assign them.            │
│ Drag emails between categories. Bulk-assign with select.    │
└─────────────────────────────────────────────────────────────┘
```

**Category Features:**

- Create custom categories (color, icon, name)
- Set auto-rules (e.g., "Emails from @bankofireland.ie → Finance")
- Nested categories (Finance → Bills, Finance → Investments)
- Smart categories that auto-populate based on AI suggestions
- Category-based notification settings

#### User-Controlled Priority System

```
┌─────────────────────────────────────────────────────────────┐
│ Priority Levels (User Sets, AI Suggests)                     │
├─────────────────────────────────────────────────────────────┤
│ 🔴 Critical  - Needs action TODAY                           │
│ 🟠 High      - Needs action this WEEK                       │
│ 🟡 Medium    - Needs action this MONTH                      │
│ 🟢 Low       - Informational / No deadline                  │
│ ⚪ None      - Not yet triaged                              │
│                                                              │
│ Click priority badge to cycle through. Drag to re-order.    │
│ AI shows suggested priority with confidence %.               │
│ User override teaches the AI for future suggestions.        │
└─────────────────────────────────────────────────────────────┘
```

**Priority Features:**

- One-click priority assignment (keyboard shortcuts: 1-4)
- AI suggests priority with explanation ("Contains deadline Jan 15")
- User can accept/reject AI suggestion (trains the model)
- Priority-based sorting and filtering
- Priority decay notifications ("This was High priority 7 days ago - still relevant?")

#### Send To Task: Convert Information to Action

```
┌─────────────────────────────────────────────────────────────┐
│ Send To Task Panel (Right-click or ⌘+T)                     │
├─────────────────────────────────────────────────────────────┤
│ Create Task From: "BMW Insurance Policy Email"               │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ AI-Suggested Tasks:                                     │ │
│ │ ☐ Read policy documents in full           [Add] [Edit]  │ │
│ │ ☐ Attach key fob to car keys when arrives [Add] [Edit]  │ │
│ │ ☐ Save emergency number to phone          [Add] [Edit]  │ │
│ │                                                         │ │
│ │ [Add All Suggested]  [Create Custom Task]               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Or create your own:                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Task: ___________________________________                │ │
│ │ Due:  [Tomorrow ▼]  Priority: [High ▼]                  │ │
│ │ Project: [Vehicle/BMW ▼]                                │ │
│ │ Notes: [Auto-linked to source email]                    │ │
│ │                                                         │ │
│ │ [Create Task]  [Create & Archive Email]                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Send To Task Features:**

- Quick action: Select text → Right-click → "Create Task from Selection"
- Bulk task creation: AI extracts all obligations, user selects which to create
- Task templates: "Bill Payment", "Document Review", "Appointment Follow-up"
- Auto-link: Task always links back to source email for context
- Smart due dates: AI suggests based on email content ("within 48 hours" → 2 days from now)
- Recurring tasks: "Pay this bill" → Option to make it monthly

#### Interactive Inbox Workflow

```
Typical User Flow:

1. Email arrives → AI analyzes in background
2. User sees email in Inbox with:
   - AI-suggested category (faded, unconfirmed)
   - AI-suggested priority (faded, unconfirmed)
   - AI-extracted action items (collapsed)

3. User interaction options:
   ┌─────────────────────────────────────────────────────────┐
   │ Swipe Right → Quick-set priority (cycles through)       │
   │ Swipe Left  → Archive / Dismiss                         │
   │ Tap         → Open detail view                          │
   │ Long Press  → Multi-select mode                         │
   │ ⌘+Enter     → Accept all AI suggestions                 │
   │ ⌘+T         → Open "Send to Task" panel                 │
   │ ⌘+C         → Set category                              │
   │ 1-4 keys    → Set priority                              │
   └─────────────────────────────────────────────────────────┘

4. After user confirms category/priority:
   - Badge becomes solid (not faded)
   - AI learns from user's choice
   - Email moves to appropriate view

5. "Send to Task" creates tasks that:
   - Link back to email
   - Inherit priority from email (or user overrides)
   - Appear in Tasks view with full context
```

#### Inbox Zero Support

```
┌─────────────────────────────────────────────────────────────┐
│ Inbox Progress                                [15 remaining] │
├─────────────────────────────────────────────────────────────┤
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  45%        │
│                                                              │
│ [Process Next]  [Bulk Actions ▼]  [Smart Sort ▼]            │
│                                                              │
│ Today's Stats:                                               │
│ • 12 emails triaged                                          │
│ • 5 tasks created                                            │
│ • 3 emails archived                                          │
│ • 2 deadlines added to calendar                              │
└─────────────────────────────────────────────────────────────┘
```

**Inbox Zero Features:**

- Progress bar showing untriaged emails
- "Process Next" button for focused triage mode
- Bulk actions: "Archive all newsletters", "Set all from @work.com to Work"
- Smart Sort: Group similar emails for batch processing
- Daily/weekly triage summaries
- Gamification: Streaks, completion badges (optional, can disable)

### Key UI Components

**Inbox View**:

```
┌─────────────────────────────────────────┐
│ 🔍 Search obligations, deadlines...     │ <- Cmd+K spotlight search
├─────────────────────────────────────────┤
│ Filters: All · Pending · Urgent · Done │ <- Animated pill buttons
├─────────────────────────────────────────┤
│ ┌───────────────────────────────────┐  │
│ │ 📧 BMW Insurance Policy           │  │ <- Swipe left = Archive
│ │ BMW Keycare · Jan 8               │  │    Swipe right = Mark done
│ │ 🔴 2 obligations  📅 1 deadline   │  │ <- Badges animate in
│ └───────────────────────────────────┘  │
│ ┌───────────────────────────────────┐  │
│ │ 📧 Electricity Bill Due            │  │
│ │ Electric Ireland · Jan 9           │  │
│ │ 💰 €125  📅 Due Jan 20            │  │
│ └───────────────────────────────────┘  │
│ ┌───────────────────────────────────┐  │
│ │ 📧 Doctor Appointment Reminder     │  │
│ │ Dr. Smith · Jan 10                 │  │
│ │ 📅 Tomorrow 2:30 PM               │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Message Detail** (slides in from right):

```
┌─────────────────────────────────────────┐
│ ← Back          📧 BMW Insurance    ⋮   │ <- Smooth slide transition
├─────────────────────────────────────────┤
│                                          │
│ From: BMW Keycare                        │
│ To: You                                  │
│ Date: Jan 8, 2026                        │
│                                          │
│ [Email body with highlighting]           │ <- Key phrases highlighted
│ Your BMW X3 is now covered...           │
│                                          │
│ ┌──────────────────────────────────┐    │
│ │ 🎯 Extracted Obligations (2)     │    │ <- Expandable sections
│ │ ✓ Read policy documents          │    │ <- Checkboxes auto-create tasks
│ │ ⏱ Attach key fob when received   │    │
│ └──────────────────────────────────┘    │
│ ┌──────────────────────────────────┐    │
│ │ 📅 Deadlines (1)                 │    │
│ │ 📌 Policy renewal: Jan 6, 2027   │    │
│ │    Reminders: 2w, 1w, 1d         │    │
│ └──────────────────────────────────┘    │
│ ┌──────────────────────────────────┐    │
│ │ 📄 Documents (1)                 │    │
│ │ Policy_Schedule.pdf  127 KB      │    │ <- Tap to preview
│ │ [Download] [Archive]             │    │
│ └──────────────────────────────────┘    │
│ ┌──────────────────────────────────┐    │
│ │ 🔗 Important Links (1)           │    │
│ │ Policy portal (REQUIRED)         │    │ <- Marked as required by AI
│ │ [Follow & Download]              │    │
│ └──────────────────────────────────┘    │
│ ┌──────────────────────────────────┐    │
│ │ 💡 AI Insights (95% confidence)  │    │
│ │ • Coverage: €1500                │    │
│ │ • Risk: High if key fob missing  │    │
│ │ • Folder: Vehicle/BMW X3         │    │
│ └──────────────────────────────────┘    │
│                                          │
│ [Create Task] [Archive] [Set Reminder]  │ <- Floating action buttons
└─────────────────────────────────────────┘
```

**Toast Notifications** (disappear after 3s):

```
┌─────────────────────────────────────┐
│ ✓ Task created: Read policy docs   │ <- Slides in from top-right
│   Due: Tomorrow                     │    Fades out after 3s
└─────────────────────────────────────┘
```

**Spotlight Search** (Cmd/Ctrl+K):

```
┌─────────────────────────────────────────┐
│ 🔍 What are you looking for?            │ <- Full-screen overlay
├─────────────────────────────────────────┤
│ insurance docs expiring this month      │ <- Natural language
├─────────────────────────────────────────┤
│ Results:                                 │
│ 📄 BMW Insurance Policy (expires Jan 27)│
│ 📄 Home Insurance (expires Jan 15)      │
│ 📄 Health Insurance (expires Feb 2)     │
└─────────────────────────────────────────┘
```

### Animations & Transitions

**Framer Motion examples**:

```tsx
// Card hover lift
<motion.div
  whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
  transition={{ type: "spring", stiffness: 300 }}
>
  {/* Card content */}
</motion.div>

// Slide-in panel
<motion.div
  initial={{ x: "100%" }}
  animate={{ x: 0 }}
  exit={{ x: "100%" }}
  transition={{ type: "spring", damping: 25, stiffness: 200 }}
>
  {/* Panel content */}
</motion.div>

// Stagger children
<motion.ul
  variants={{
    visible: { transition: { staggerChildren: 0.07 } }
  }}
>
  {items.map(item => (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    />
  ))}
</motion.ul>

// Toast disappearing
<AnimatePresence>
  {showToast && (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
    >
      {/* Toast content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Mobile Gestures

```tsx
// Swipe to delete
<motion.div
  drag="x"
  dragConstraints={{ left: -100, right: 100 }}
  onDragEnd={(e, { offset, velocity }) => {
    if (offset.x < -100) deleteItem();
    if (offset.x > 100) markDone();
  }}
>
  {/* Swipeable item */}
</motion.div>

// Pull to refresh
<motion.div
  drag="y"
  dragConstraints={{ top: 0, bottom: 80 }}
  onDragEnd={(e, { offset }) => {
    if (offset.y > 60) refreshMessages();
  }}
>
  {/* List content */}
</motion.div>
```

---

## Scale & Open Source Strategy

### Multi-Tenancy from Day 1

```
Users → Teams → Organizations

- User: Individual with their own inbox
- Team: Share obligations/deadlines (family, small business)
- Organization: Department-level permissions
```

### Plugin System

```typescript
// Allow community plugins
interface NoraPlugin {
  name: string;
  version: string;
  hooks: {
    onMessageReceived?: (message: Message) => Promise<void>;
    onObligationExtracted?: (obligation: Obligation) => Promise<void>;
    onTaskCreated?: (task: Task) => Promise<void>;
  };
  customExtractors?: {
    name: string;
    pattern: RegExp;
    extract: (match: RegExpMatchArray) => Partial<Extraction>;
  };
}

// Example: Invoice plugin
const invoicePlugin: NoraPlugin = {
  name: "invoice-detector",
  version: "1.0.0",
  hooks: {
    onMessageReceived: async (message) => {
      if (message.subject.toLowerCase().includes("invoice")) {
        // Custom invoice processing
      }
    }
  },
  customExtractors: [{
    name: "invoice-number",
    pattern: /INV-\d{6}/g,
    extract: (match) => ({
      identifiers: { invoice_number: match[0] }
    })
  }]
};
```

### Integration Ecosystem

```
Day 1 Integrations:
- Gmail (OAuth) + Google Calendar
- WhatsApp Business API (messages, media, templates)
- Twilio (SMS, MMS)
- Slack (OAuth)

Phase 2 Integrations:
- Microsoft Outlook/Exchange (email) + Microsoft Calendar
- Microsoft Teams
- Apple iCloud Mail + iCloud Calendar + iMessage
- Telegram
- Discord
- Facebook Messenger
- LinkedIn Messages
- WeChat

Phase 3 Integrations:
- Zapier
- Make (Integromat)
- IFTTT
- Home Assistant
- iOS Shortcuts
- Android Intents
- Banking APIs (for transaction notifications)
- Social Media APIs (Twitter, Instagram for mentions/tags)
```

### Mobile Apps (React Native)

```
Shared codebase:
- Core logic in TypeScript
- React Native for iOS/Android
- Native modules for:
  - Push notifications
  - Biometric auth
  - Document scanning (camera)
  - OCR
  - Haptic feedback
  - Background sync
```

### Deployment Options

```
1. Self-Hosted:
   - Docker Compose (all services)
   - Kubernetes (production scale)
   - One-click deploy (Railway, Render, Fly.io)

2. Cloud SaaS:
   - **Bring Your Own Key (BYOK)**: Users provide their own API keys for maximum privacy
   - Free tier (1 user, 100 messages/month, 1GB storage)
   - Pro tier ($10/month - unlimited)
   - Team tier ($25/month - 5 users)
   - Enterprise (custom pricing)
   - **Enclaves**: Server processes data but cannot persist raw email text

3. On-Premise:
   - Air-gapped deployment
   - LDAP/AD integration
   - Custom LLM endpoint
   - No external dependencies
```

---

## Success Metrics

### User Experience Metrics

- **Time to extract obligation**: <3 seconds (target <2s)
- **False positive rate**: <8% (target <5%)
- **Missed obligation rate**: <2% (target <1%)
- **User correction rate**: <15% (target <10%)
- **Daily active usage**: >60% of days (target >80%)
- **Net Promoter Score (NPS)**: >50
- **User retention (30-day)**: >70%
- **Task completion rate**: >85% of created tasks

### Technical Metrics

- **API response time (p95)**: <600ms (target <500ms)
- **AI extraction accuracy**: >85% (target >90%)
- **Link follow success rate**: >92% (target >95%)
- **Document download success**: >95% (target >98%)
- **Background sync reliability**: >99.5% (target >99.9%)
- **Uptime SLA**: 99.9%

### Business Metrics (for open source traction)

- **GitHub stars**: 2,000 in year 1 (target 5,000)
- **Contributors**: 25+ in year 1 (target 50+)
- **Self-hosted deployments**: 200+ in year 1 (target 500+)
- **SaaS users**: 1,000+ in year 1 (target 2,500+)
- **Monthly recurring revenue**: €10,000+ in year 1

---

## Differentiators from Competition

### vs. Email Clients (Gmail, Outlook)

- **They**: Show emails
- **Nora**: Extracts obligations

### vs. Task Managers (Todoist, Things)

- **They**: You manually create tasks
- **Nora**: Auto-creates from message analysis

### vs. Note Apps (Notion, Evernote)

- **They**: You organize manually
- **Nora**: Auto-categorizes and links

### vs. AI Assistants (Siri, Alexa)

- **They**: Answer questions
- **Nora**: Proactively prevents problems

### vs. Personal CRM (Monica, Dex)

- **They**: Track relationships
- **Nora**: Tracks **obligations** in relationships

---

## Implementation Roadmap

### Phase 1: Core Intelligence (Months 1-4)

- ✅ Enhanced AI extraction (8-section schema)
- ✅ Obligation detection and task creation
- ✅ Deadline parsing and reminders
- ✅ Link intelligence and auto-download
- ✅ Risk detection
- ✅ Context awareness
- Security foundations (encryption, GDPR compliance)

### Phase 2: Essential Integrations (Months 4-6)

- Gmail + Google Calendar integration
- Microsoft Outlook/Exchange + Microsoft Calendar
- WhatsApp Business API
- SMS via Twilio
- Slack integration
- **Intelligent User Profiling**:
  - **Interactive Interview**: Efficient 1-page "Who, What, Where, When" baseline.
  - **Progressive Context Building**: Context-aware questions triggered by app usage (e.g. "What are you hoping to get from Inbox?").
  - **External AI Import**: Paste profiles from other AI bots to bootstrap user context.

### Phase 3: Extended Ecosystem (Months 6-8)

- Apple iCloud Mail + Calendar + iMessage
- Telegram, Discord, Facebook Messenger
- LinkedIn Messages
- Push notifications and proactive alerts
- Natural language queries
- Predictive insights

### Phase 4: Scale & Polish (Months 8-12)

- Mobile apps (React Native)
- Plugin system
- Multi-tenancy
- Advanced analytics
- Performance optimization
- Accessibility and internationalization

### Phase 5: Open Source Launch (Months 12-15)

- Documentation
- Contributor guidelines
- Self-hosted guides
- Community building
- SaaS offering
- Banking and social media integrations

---

## Extensions & Automation Ecosystem (Future Vision)

### 1. Modular Plugin Architecture

Nora is designed to be the central nervous system of your digital life. To avoid monolithic bloat, we will implement a robust plugin system:

- **Service Providers**: Community-built connectors for niche services (e.g., Nextcloud, Notion, Trello).
- **Storage Backends**: Plugins to swap storage providers (S3, MinIO, Dropbox, Local).
- **AI Models**: Drop-in replacements for inference engines.

**Example Use Cases:**

- **Nextcloud Plugin**: Auto-save extracted policy PDFs directly to your private Nextcloud "Documents/Insurance" folder.
- **Notion Plugin**: Sync tasks to a Notion database instead of internal storage.

### 2. Home Assistant Integration (Bi-Directional)

The bridge between digital obligations and physical reality.

**Inbound (HA → Nora):**

- **Context Awareness**: "User is at Home" signal adjusts notification priorities.
- **Triggers**: "Mailbox sensor triggered" -> Creates task "Check physical mail".

**Outbound (Nora → HA):**

- **Entity Surfacing**: Nora exposes entities to HA (e.g., `sensor.nora_status`, `todo.nora_tasks`).
- **Automation Triggers**:
  - *Scenario*: Nora detects an "Urgent Deadline Tomorrow".
  - *Action*: Triggers HA script `script.focus_mode` (dims lights, turns off TV).
- **HACS Addon**: "Core Nora Bridge" to simplify authentication and webhooks.

---

## Prompt for Next AI Agent

**If you're the next AI building Nora PA, start here:**

```
You are building Nora Personal Assistant, an intelligent life management system.

Your mission: Create a system that extracts obligations, deadlines, and risks from
digital communications and transforms them into actionable intelligence.

Reference architecture: Use Konrad PA (in this repo) as a starting point, but enhance
with the full 8-section extraction schema, proactive task creation, and delightful UX.

Key principles:
1. Every message must answer: What obligation? What deadline? What action? What risk?
2. Auto-create tasks from high-confidence obligations (>85%)
3. Follow links marked as required ("in conjunction with")
4. Use context - don't create duplicates, update existing records
5. Natural, fluid UI with Framer Motion animations, no pop-ups
6. Multi-provider AI (Claude, OpenAI, Gemini, DeepSeek, Ollama)
7. Built for scale - multi-tenancy, plugin system, mobile apps
8. Open source first - Docker compose, one-click deploy, extensive docs
9. Security-first: End-to-end encryption, GDPR compliance, user consent
10. Broad integration: Gmail, Outlook, WhatsApp, Calendar, and extensible API
11. Accessible and international: WCAG compliance, i18n support
12. Edge case handling: Ambiguous language, conflicting deadlines, multi-language content

Start by:
1. Creating project structure (NoraPA.API, NoraPA.Core, NoraPA.Web)
2. Implementing enhanced AI extraction (see 8-section schema above)
3. Building obligation → task pipeline
4. Creating beautiful React UI with Framer Motion
5. Testing with real emails (insurance, bills, appointments)

Reference this document for the complete vision. Push boundaries. This should be
better than anything on the market because it's built with a clear mission: never
let users miss an obligation again.

Go build something amazing. The world needs this.
```

---

## Final Words

**Nora PA is not just software. It's a commitment to helping people take back control of their digital lives.**

Every obligation extracted, every deadline caught, every risk flagged - that's a moment of stress prevented, a consequence avoided, a life made easier.

Build it with care. Build it with excellence. Build it for everyone.

**Let's make "I forgot" a thing of the past.**

---

**Document Version**: 1.0
**Date**: January 11, 2026
**For**: AI Agents, Development Teams, Open Source Contributors
**License**: MIT (to be applied to Nora PA)
**Original Concept**: Konrad Walsh
**Powered By**: Claude Sonnet 4.5
