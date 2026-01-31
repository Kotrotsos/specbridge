# Project Documentation Generator

## Problem

SpecBridge captures rich requirement information through expert interviews at the feature level. Each feature has its own artifacts (overview, diagrams, rules, variables, edge cases) living in the Studio. However, there's no consolidated view that brings everything together at the project level.

**Current state:**
- Feature-level documentation is detailed but fragmented
- No single document to understand the full project scope
- Stakeholders need to navigate multiple features to get the full picture
- No cross-feature analysis (dependencies, conflicts, patterns)

**Need:**
- One document that tells the complete story
- Suitable for handoff to development teams, stakeholders, or archives
- Highlights relationships between features
- Identifies gaps and inconsistencies across the project

---

## Proposed Solution

A multi-step LLM workflow that generates comprehensive project documentation by:
1. Aggregating all feature data
2. Analyzing patterns and relationships
3. Generating structured sections
4. Assembling a final, polished document

### Document Output

The generated document would be a **Business Requirements Document (BRD)** or **Project Specification Document** containing:

```
1. Executive Summary
   - Project purpose and goals
   - Key stakeholders
   - High-level scope

2. Feature Inventory
   - List of all features with status
   - Feature dependencies map
   - Priority/phase groupings

3. Consolidated Requirements
   - Grouped by domain/theme
   - Cross-referenced to source features
   - Requirement IDs for traceability

4. Business Rules
   - All rules extracted from features
   - Conflict detection (if rules contradict)
   - Rule categories (validation, calculation, workflow)

5. System Behavior
   - Combined flowcharts/diagrams
   - Integration points
   - Data flow overview

6. Edge Cases & Exceptions
   - Aggregated from all features
   - Categorized by severity/likelihood
   - Proposed handling strategies

7. Variables & Data Dictionary
   - All identified variables/entities
   - Data types and constraints
   - Source systems

8. Open Questions & Gaps
   - Unresolved items across features
   - Recommended next steps
   - Risk areas

9. Appendix
   - Glossary of terms
   - Source interview references
   - Change log
```

---

## Workflow Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Project Documentation Workflow               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │  Step 1  │──▶│  Step 2  │──▶│  Step 3  │──▶│  Step 4  │     │
│  │ Collect  │   │ Analyze  │   │ Generate │   │ Assemble │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│       │              │              │              │             │
│       ▼              ▼              ▼              ▼             │
│   Raw Data      Insights &     Section        Final Doc         │
│   Bundle        Structure      Drafts         + Review          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: Data Collection (No LLM)

Gather all raw material from the database:
- Project metadata (name, description, methodology)
- All features with their specifications
- All artifacts (overview, diagrams, rules, variables, edge cases)
- Interview transcripts (messages)
- Status information

**Output:** Structured JSON bundle of all project data

### Step 2: Analysis & Structure (LLM)

First LLM pass to understand the project holistically:

**Prompt focus:**
- Identify themes and domains across features
- Detect dependencies between features
- Find patterns in business rules
- Flag potential conflicts or gaps
- Suggest document structure based on project type

**Output:**
- Thematic groupings
- Dependency graph
- Conflict report
- Recommended sections
- Key insights

### Step 3: Section Generation (LLM - Multiple Passes)

Generate each major section independently. This allows for:
- Focused prompts per section type
- Parallel processing potential
- Easier debugging and regeneration

**Sub-steps:**

| Step | Section | Prompt Focus |
|------|---------|--------------|
| 3a | Executive Summary | Synthesize project goals, scope, value proposition |
| 3b | Feature Inventory | Organize features, show relationships, status |
| 3c | Requirements | Consolidate, dedupe, assign IDs, group by theme |
| 3d | Business Rules | Extract, categorize, detect conflicts |
| 3e | System Behavior | Merge diagrams, describe integrations |
| 3f | Edge Cases | Aggregate, categorize, prioritize |
| 3g | Data Dictionary | Compile variables, define, type |
| 3h | Open Questions | Identify gaps, suggest resolutions |

**Output:** Individual section drafts (markdown)

### Step 4: Assembly & Review (LLM)

Final LLM pass to:
- Combine all sections
- Ensure consistent terminology
- Add cross-references
- Write transitions between sections
- Generate table of contents
- Final quality check

**Output:** Complete project document (markdown)

---

## Delivery Format

### Primary: Markdown Document

Stored as an artifact on the Project model:
- Viewable in-app with proper rendering
- Downloadable as `.md`
- Version history (regenerate and compare)

### Secondary: Export Options

Future additions:
- PDF export (via puppeteer/playwright)
- Word document (via pandoc)
- Confluence/Notion push

---

## User Experience

### Trigger

Add a "Generate Documentation" button on the Project page:

```
┌─────────────────────────────────────────────────┐
│  Project: Customer Portal                       │
│  ─────────────────────────────────────────────  │
│                                                 │
│  [+ Add Feature]  [Generate Documentation]      │
│                                                 │
│  Features (4)                                   │
│  ├── User Authentication                        │
│  ├── Dashboard                                  │
│  ├── Profile Management                         │
│  └── Notifications                              │
└─────────────────────────────────────────────────┘
```

### Generation Flow

1. User clicks "Generate Documentation"
2. Modal shows workflow progress:
   ```
   Generating Project Documentation

   [============================] Step 2/4

   [x] Collecting project data
   [x] Analyzing features and relationships
   [ ] Generating sections (3 of 8)
   [ ] Assembling final document

   Estimated time: 2-3 minutes
   ```
3. On completion, user is taken to document view
4. Option to regenerate or download

### Document View

New route: `/project/[id]/documentation`

- Full rendered markdown view
- Sidebar with section navigation
- "Regenerate" button
- "Download" dropdown (MD, PDF, Word)
- "Last generated" timestamp
- Comparison with previous version (future)

---

## Data Model Changes

### New: ProjectDocument

```prisma
model ProjectDocument {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  content     String   @db.Text  // The markdown content
  version     Int      @default(1)
  status      String   @default("draft")  // draft, final
  metadata    Json?    // Store workflow outputs, section breakdown
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Project Model Update

```prisma
model Project {
  // ... existing fields
  documents   ProjectDocument[]
}
```

---

## Implementation Phases

### Phase 1: Basic Generation (MVP)

- Single "Generate" button
- Sequential workflow execution
- Markdown output stored in database
- Basic view page
- No export options yet

**Scope:**
- Data collection function
- 4-step workflow with prompts
- ProjectDocument model
- Generation API route
- Document view page

### Phase 2: Enhanced UX

- Progress modal with real-time updates
- Section-by-section regeneration
- Download as markdown
- Version history

### Phase 3: Export & Polish

- PDF export
- Word export
- Document comparison
- Template customization

---

## Prompt Strategy

Each LLM step needs a carefully crafted prompt. Key principles:

1. **Context window management** - For large projects, summarize rather than include full transcripts
2. **Structured output** - Request JSON or specific markdown format
3. **Role clarity** - "You are a business analyst creating formal documentation"
4. **Examples** - Include example output format in prompts
5. **Validation** - Each step validates previous step output

### Example: Step 2 (Analysis) Prompt Structure

```
You are a senior business analyst reviewing a software project.

PROJECT DATA:
{projectBundle}

TASK:
Analyze this project and provide:
1. Main themes/domains (group related features)
2. Feature dependencies (which features depend on others)
3. Potential conflicts (rules that may contradict)
4. Gaps (areas that seem incomplete)
5. Recommended document structure

OUTPUT FORMAT:
{
  "themes": [...],
  "dependencies": [...],
  "conflicts": [...],
  "gaps": [...],
  "recommendedSections": [...]
}
```

---

## Open Questions

1. **Regeneration scope** - Allow regenerating individual sections, or always full document?
2. **Manual editing** - Should users be able to edit the generated document?
3. **Template variations** - Different templates for different methodologies (Agile vs BABOK)?
4. **Token limits** - How to handle very large projects that exceed context windows?
5. **Cost** - Multiple LLM calls per generation, need to consider API costs

---

## Next Steps

1. Review and refine this design
2. Create the ProjectDocument model
3. Build the data collection function
4. Write and test prompts for each step
5. Implement the generation API
6. Build the UI components

---

## Summary

This feature transforms SpecBridge from a feature-level documentation tool into a complete project documentation platform. The multi-step LLM workflow ensures quality by:

- Breaking the task into focused steps
- Allowing analysis before generation
- Enabling section-specific optimization
- Providing a final review pass

The deliverable is a professional BRD-style document that consolidates everything captured through expert interviews into a single, comprehensive reference.
