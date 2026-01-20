# SpecBridge - Project Context

## What is SpecBridge?

SpecBridge is an AI-powered knowledge extraction platform that bridges the gap between domain experts and technical implementers. It conducts intelligent interviews with experts in their own language, then generates structured artifacts (flowcharts, business rules, edge cases) for developers.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Clerk
- **AI**: Anthropic Claude API
- **Styling**: Tailwind CSS
- **Diagrams**: Mermaid.js
- **Deployment**: Railway

## Project Structure

```
app/
  (app)/              # Authenticated app routes
    layout.tsx        # App layout with collapsible sidebar
    dashboard/        # Project dashboard
    project/[id]/     # Project detail page
    feature/[id]/     # Feature detail page
    interview/[id]/   # Interview chat interface
  (marketing)/        # Public marketing pages
    page.tsx          # Landing page with animated demo
    pricing/          # Pricing page
    use-cases/        # Use case pages
    privacy/          # Privacy policy
    terms/            # Terms of service
    contact/          # Contact page
  actions/            # Server actions
  api/chat/           # Chat API route

components/
  ui/                 # Base UI components
    collapsible-sidebar.tsx  # Resizable/collapsible sidebar
    particle-field.tsx       # Scan lines background effect
  marketing/
    animated-demo.tsx        # Animated chat demo for landing page
  sidebar/            # Sidebar components
  chat/               # Chat interface components
  studio/             # Artifact studio components

lib/
  prompts.ts          # AI prompt templates

prisma/
  schema.prisma       # Database schema

investor/
  specbridge-pitch-deck.pptx  # Investor pitch deck
  create-deck.js              # Deck generation script
```

## Key Features Implemented

### Core App
- Project and feature management
- AI-powered interviews with domain experts
- Artifact generation (Overview, Diagrams, Rules, Variables, Edge Cases)
- Collapsible/resizable sidebars with localStorage persistence
- Markdown rendering in chat messages

### Marketing Site
- Animated landing page with scan lines effect
- Interactive demo showing multiple use cases (auto-cycling)
- Pricing page with three tiers
- Use cases section with categories
- Privacy, Terms, Contact pages

## Current Branch: `ui`

Working on UI improvements and marketing enhancements.

## Deployment

- Uses Railway for deployment
- Requires Node.js 20+
- Deploy command: `railway up`
- Uses `nixpacks.toml` for build configuration

## Database Schema (Key Models)

- **User**: Clerk-authenticated users
- **Organization**: Team/company grouping
- **Project**: Container for features (has methodology: agile/ieee/babok)
- **Feature**: Individual feature being specified
- **Specification**: Interview session with messages
- **Message**: Chat messages in interview
- **Artifact**: Generated documentation (overview, diagram, rules, etc.)

## AI Prompts

All AI prompts are documented in `prompts.md` for evaluation and improvement.

## Design Principles

- Clean, minimal design with warm off-white backgrounds
- No emojis unless explicitly requested
- No serif fonts
- Professional, focused UI
- Mobile-responsive

## Pending Work (BABOK Plan)

There's a plan file at `~/.claude/plans/playful-inventing-floyd.md` for implementing full BABOK 3.0 compliance with:
- 5-phase interview workflow
- Tagged knowledge extraction
- Phase-specific prompts
- BRD document assembly

This is a larger initiative not yet started.

## Common Commands

```bash
# Development
npm run dev

# Database
npx prisma db push
npx prisma studio

# Deploy
railway up

# Git
git push origin ui
```

## Contact

Marco Kotrotsos - marco@specbridge.ai
