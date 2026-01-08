# SpecBridge - Technical Design Document

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 14.2.0 |
| Language | TypeScript | 5.0 |
| UI Library | React | 18.3.0 |
| Styling | Tailwind CSS | 3.4.0 |
| Components | shadcn/ui | - |
| Database | PostgreSQL | - |
| ORM | Prisma | 7.2.0 |
| Authentication | Clerk | 6.36.6 |
| AI/LLM | OpenAI (gpt-4o) | 4.77.0 |
| Diagrams | Mermaid | 11.12.2 |
| Icons | Lucide React | 0.468.0 |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Navbar    │  │  Dashboard  │  │   Interview Page    │ │
│  │  (Auth UI)  │  │  (List)     │  │  ┌───────┬───────┐  │ │
│  └─────────────┘  └─────────────┘  │  │ Chat  │Studio │  │ │
│                                     │  │ Panel │ Panel │  │ │
│                                     │  └───────┴───────┘  │ │
│                                     └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Server                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │  Server Actions │  │        API Routes               │  │
│  │  (interview.ts) │  │  POST /api/chat                 │  │
│  │  - CRUD ops     │  │  - Chat responses               │  │
│  │  - Messages     │  │  - Suggestions                  │  │
│  │  - Artifacts    │  │  - Artifact extraction          │  │
│  └────────┬────────┘  └────────────────┬────────────────┘  │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌─────────────────┐          ┌─────────────────┐          │
│  │  Prisma Client  │          │  OpenAI Client  │          │
│  └────────┬────────┘          └────────┬────────┘          │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            ▼                            ▼
    ┌───────────────┐            ┌───────────────┐
    │  PostgreSQL   │            │  OpenAI API   │
    │  (Railway)    │            │  (gpt-4o)     │
    └───────────────┘            └───────────────┘
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│    Interview    │
├─────────────────┤
│ id (PK)         │
│ userId          │──────┐
│ title           │      │
│ initialDesc     │      │
│ status          │      │
│ extractedKnow.  │      │
│ createdAt       │      │
│ updatedAt       │      │
└────────┬────────┘      │
         │               │
    ┌────┴────┐          │
    │         │          │
    ▼         ▼          │
┌────────┐ ┌────────┐    │
│Message │ │Artifact│    │
├────────┤ ├────────┤    │
│ id(PK) │ │ id(PK) │    │
│ intId  │ │ intId  │    │
│ role   │ │ type   │    │
│ content│ │ title  │    │
│ time   │ │ status │    │
└────────┘ │ data   │    │
           │ error  │    │
           │ created│    │
           └────────┘    │
                         │
              ┌──────────┘
              │ (Clerk)
              ▼
         ┌─────────┐
         │  User   │
         │(external)│
         └─────────┘
```

### Prisma Schema

```prisma
model Interview {
  id                 String     @id @default(cuid())
  userId             String?    // Clerk user ID
  title              String
  initialDescription String     @default("")
  status             String     @default("in_progress")
  extractedKnowledge Json?
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
  messages           Message[]
  artifacts          Artifact[]
  @@index([userId])
}

model Message {
  id          String    @id @default(cuid())
  interviewId String
  interview   Interview @relation(...)
  role        String    // "assistant" | "user"
  content     String
  timestamp   DateTime  @default(now())
  @@index([interviewId])
}

model Artifact {
  id          String    @id @default(cuid())
  interviewId String
  interview   Interview @relation(...)
  type        String    // overview, decision-tree, rules, variables, edge-cases
  title       String
  status      String    @default("generating")
  data        Json?
  error       String?
  createdAt   DateTime  @default(now())
  @@index([interviewId])
}
```

## Component Architecture

### Page Structure

```
app/
├── layout.tsx              # Root layout with Navbar + ClerkProvider
├── page.tsx                # Dashboard (interview list)
├── interview/
│   └── [id]/
│       └── page.tsx        # Interview workspace
└── api/
    └── chat/
        └── route.ts        # Chat API endpoint
```

### Component Hierarchy

```
RootLayout
├── Navbar
│   ├── Logo (Link to /)
│   └── AuthSection (SignIn/UserButton)
│
├── DashboardPage (/)
│   ├── Header
│   ├── NewInterviewButton
│   └── InterviewList
│       └── InterviewCard (map)
│
└── InterviewPage (/interview/[id])
    └── PanelGroup (horizontal)
        ├── ChatPanel (60%)
        │   ├── Header (title)
        │   └── ChatContainer
        │       ├── MessageList
        │       │   ├── StarterPrompts (empty state)
        │       │   ├── MessageBubble (map)
        │       │   └── LoadingIndicator
        │       ├── AnswerSuggestions
        │       └── ChatInput
        │
        ├── ResizeHandle
        │
        └── StudioPanel (40%)
            ├── Header ("Studio")
            └── StudioContent
                ├── ListView (default)
                │   ├── ArtifactTypeGrid
                │   │   └── ArtifactButton (x5)
                │   └── GeneratedArtifacts
                │       └── ArtifactEntry (map)
                │
                └── DetailView (selected)
                    ├── BackButton
                    ├── ArtifactHeader
                    └── ArtifactContent
                        ├── OverviewContent
                        ├── DiagramContent (Mermaid)
                        ├── RulesContent
                        ├── VariablesContent
                        └── EdgeCasesContent
```

## Data Flow

### Interview Chat Flow

```
User types message
        │
        ▼
┌───────────────────┐
│   ChatInput       │
│   onSubmit()      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  sendMessage()    │
│  (page.tsx)       │
└─────────┬─────────┘
          │
          ├──────────────────────┐
          ▼                      ▼
┌───────────────────┐   ┌───────────────────┐
│  addMessage()     │   │  POST /api/chat   │
│  (server action)  │   │  action: "chat"   │
└─────────┬─────────┘   └─────────┬─────────┘
          │                       │
          ▼                       ▼
┌───────────────────┐   ┌───────────────────┐
│  Prisma INSERT    │   │  OpenAI API       │
│  Message          │   │  gpt-4o           │
└───────────────────┘   └─────────┬─────────┘
                                  │
                                  ▼
                        ┌───────────────────┐
                        │  Response parsed  │
                        │  Check complete   │
                        └─────────┬─────────┘
                                  │
                                  ▼
                        ┌───────────────────┐
                        │  addMessage()     │
                        │  (assistant)      │
                        └─────────┬─────────┘
                                  │
                                  ▼
                        ┌───────────────────┐
                        │  UI Update        │
                        │  (optimistic)     │
                        └───────────────────┘
```

### Artifact Generation Flow

```
User clicks artifact type
        │
        ▼
┌───────────────────┐
│ generateArtifact()│
│ (page.tsx)        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ addArtifact()     │
│ status:generating │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ POST /api/chat    │
│ action: "extract" │
│ artifactType      │
│ settings          │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Build transcript  │
│ Select prompt     │
│ ARTIFACT_PROMPTS  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ OpenAI API        │
│ JSON response     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Parse JSON        │
│ Strip markdown    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ updateArtifact()  │
│ status: complete  │
│ data: JSON        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ UI renders        │
│ ArtifactContent   │
└───────────────────┘
```

## State Management

### Hooks

**useInterview(id)** - Single interview management
```typescript
interface UseInterviewReturn {
  interview: InterviewData | null;
  isLoading: boolean;
  error: Error | null;
  addMessage: (msg) => Promise<void>;
  setTitle: (title) => Promise<void>;
  setInitialDescription: (desc) => Promise<void>;
  setComplete: (knowledge) => Promise<void>;
  addArtifact: (type, title) => Promise<ArtifactData>;
  updateArtifact: (id, updates) => Promise<void>;
  deleteArtifact: (id) => Promise<void>;
  refresh: () => Promise<void>;
}
```

**useInterviews()** - Interview list management
```typescript
interface UseInterviewsReturn {
  interviews: InterviewData[];
  isLoading: boolean;
  error: Error | null;
  deleteInterview: (id) => Promise<void>;
  refresh: () => Promise<void>;
}
```

### State Pattern

- **Server Actions** for all database operations
- **Optimistic updates** for responsive UI
- **Ref-based state** for async operations (avoids stale closures)
- **Local component state** for UI-only state (selected artifact, modals)

## API Design

### POST /api/chat

**Request Body:**
```typescript
{
  messages: Array<{ role: "assistant" | "user", content: string }>;
  initialDescription?: string;
  action?: "chat" | "suggestions" | "extract";
  artifactType?: "overview" | "decision-tree" | "rules" | "variables" | "edge-cases";
  settings?: { diagramType?: "flowchart" | "sequence" };
}
```

**Response (chat):**
```typescript
{ message: string; isComplete: boolean }
```

**Response (suggestions):**
```typescript
{ suggestions: string[] }
```

**Response (extract):**
```typescript
{ knowledge: Record<string, any> }
```

## Authentication Flow

```
┌─────────────────┐
│ Request arrives │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Clerk Middleware│
│ clerkMiddleware()│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Has valid       │ No  │ Redirect to     │
│ session?        ├────►│ sign-in         │
└────────┬────────┘     └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Extract userId  │
│ auth()          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Filter data by  │
│ userId          │
└─────────────────┘
```

**Conditional Auth:**
- App works without Clerk if env vars not set
- Useful for local development and builds

## Prompt Architecture

### Interview System Prompt

Located in `config/prompts/interview.ts`

**Structure:**
1. Role definition (SpecBridge interviewer)
2. Core purpose (knowledge extraction)
3. Interview methodology (4 phases)
4. Question guidelines (one at a time, business language)
5. Domain detection rules
6. Completion criteria
7. Red flags to probe

### Artifact Extraction Prompts

Located in `config/prompts/extraction.ts` and inline in `api/chat/route.ts`

**Prompt per artifact type:**
- Overview: Process documentation structure
- Decision Tree: Mermaid syntax with examples
- Rules: IF/THEN extraction format
- Variables: Data model extraction
- Edge Cases: Exception identification

## Error Handling

### Mermaid Diagram Errors

```
Render attempt
    │
    ▼
┌─────────────┐
│ Try render  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────────┐
│ Success?    │ No  │ Retry (3x)      │
└──────┬──────┘     └────────┬────────┘
       │ Yes                 │
       ▼                     ▼
┌─────────────┐     ┌─────────────────┐
│ Display SVG │     │ Show error +    │
└─────────────┘     │ raw syntax      │
                    └─────────────────┘
```

### API Error Handling

- Try-catch wrapper on all endpoints
- JSON parse fallback to error object
- Markdown code block stripping
- User-friendly error messages

## Security Considerations

1. **Authentication**: Clerk middleware on all routes
2. **Authorization**: userId filtering on all queries
3. **Input Sanitization**: DOMPurify for SVG rendering
4. **API Keys**: Server-side only, never exposed to client
5. **Database**: Prisma parameterized queries (SQL injection prevention)

## Performance Optimizations

1. **Lazy OpenAI initialization**: Avoids build-time errors
2. **Prisma connection pooling**: Implicit via singleton
3. **Optimistic updates**: Immediate UI feedback
4. **Mermaid singleton**: Single initialization
5. **Auto-scroll debouncing**: Smooth scrolling
6. **Panel state persistence**: Via react-resizable-panels

## Environment Configuration

```env
# Required
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...

# Authentication (optional for dev)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

## Deployment

**Railway Configuration:**
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 180
  }
}
```

**Database:**
- Railway PostgreSQL
- Internal URL for production
- Public URL for local development

## File Structure

```
specbridge/
├── app/
│   ├── actions/
│   │   └── interview.ts      # Server actions
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # API endpoint
│   ├── interview/
│   │   └── [id]/
│   │       └── page.tsx      # Interview page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Dashboard
│   └── globals.css           # Global styles
├── components/
│   ├── chat/
│   │   ├── chat-container.tsx
│   │   ├── chat-input.tsx
│   │   ├── message-bubble.tsx
│   │   ├── starter-prompts.tsx
│   │   └── answer-suggestions.tsx
│   ├── ui/                   # shadcn components
│   └── mermaid-diagram.tsx
├── config/
│   ├── prompts/
│   │   ├── interview.ts
│   │   ├── extraction.ts
│   │   └── suggestions.ts
│   └── constants.ts
├── hooks/
│   ├── use-interview.ts
│   ├── use-interviews.ts
│   └── use-starter-prompts.ts
├── lib/
│   ├── prisma.ts             # Prisma client
│   ├── openai.ts             # OpenAI client
│   └── types.ts              # Type definitions
├── prisma/
│   └── schema.prisma         # Database schema
├── middleware.ts             # Clerk middleware
└── railway.json              # Deployment config
```
