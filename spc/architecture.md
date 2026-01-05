# Architecture

## System Overview

```
+---------------------------------------------------+
|           BridgeSpec Application                   |
+--------------------------+------------------------+
|     Expert Interface     |   Implementer Interface |
|                          |                         |
|  - Conversational Q&A    |  - Knowledge browser    |
|  - Domain terminology    |  - Diagram generator    |
|  - Example submission    |  - Logic formalizer     |
|  - Clarification         |  - Gap identifier       |
|    requests              |  - Query interface      |
+--------------------------+------------------------+
           |                        |
           +------------+-----------+
                        |
                        v
                +---------------+
                |  Knowledge DB  |
                |  - Rules       |
                |  - Examples    |
                |  - Diagrams    |
                |  - Questions   |
                +---------------+
```

## High-Level Flow

```
+-------------------------------------------+
|  EXPERT STARTS                             |
|  "I need to document our customer          |
|   discount calculation logic"              |
+---------------------+---------------------+
                      |
                      v
+-------------------------------------------+
|  BRIDGESPEC ANALYZES                       |
|  - Identifies domain: pricing/finance      |
|  - Recognizes type: calculation logic      |
|  - Generates interview strategy            |
+---------------------+---------------------+
                      |
                      v
+-------------------------------------------+
|  ADAPTIVE INTERVIEW BEGINS                 |
|  Q1: "What factors influence the           |
|       discount amount?"                    |
|  A1: "Customer type, order value,          |
|       promotion status..."                 |
|                                            |
|  Q2: "Walk me through what happens         |
|       when order value is 1000..."         |
|  [Generates follow-ups based on A1]        |
+---------------------+---------------------+
                      |
                      v
+-------------------------------------------+
|  KNOWLEDGE BASE BUILDS                     |
|  - Extracts rules                          |
|  - Identifies edge cases                   |
|  - Maps dependencies                       |
+---------------------+---------------------+
                      |
                      v
+-------------------------------------------+
|  IMPLEMENTER VIEWS                         |
|  - Decision tree diagram                   |
|  - Formalized rules                        |
|  - Test scenarios                          |
|  - Can ask clarifying questions            |
+-------------------------------------------+
```

## Tech Stack

### Recommended Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js + Tailwind CSS | Fast development, modern UI |
| AI | Claude API | Strong at structured extraction |
| Diagrams | Mermaid.js | Text-based, easy to generate |
| Storage | JSON / SQLite | Simple for MVP |
| Hosting | Vercel / Netlify | Deploy in minutes |

### Alternative: Minimal Stack

For rapid prototyping:
- Single HTML file with Tailwind CSS
- Claude API for AI
- LocalStorage or artifact persistent storage

## Component Architecture

### 1. Expert Interface Components

```
ExpertInterface/
  - ProjectCreator       # Create new knowledge capture session
  - InterviewChat        # Conversational Q&A with AI
  - ExampleSubmitter     # Add concrete examples
  - ClarificationPanel   # Respond to follow-up questions
```

### 2. Implementer Interface Components

```
ImplementerInterface/
  - KnowledgeBrowser     # Browse captured knowledge
  - DiagramViewer        # View Mermaid diagrams
  - RulesList            # Formalized rules display
  - EdgeCasesList        # Identified edge cases
  - AmbiguitiesPanel     # Gaps needing clarification
  - QueryInterface       # Ask questions about knowledge
```

### 3. Shared Components

```
Shared/
  - ProjectSelector      # Switch between projects
  - ExportPanel          # Export to markdown, JSON
  - HistoryViewer        # View conversation history
```

## AI Architecture

### Two-Prompt System

1. **Interview Prompt**: Conducts adaptive interviews with domain experts
   - Analyzes initial description
   - Generates contextual questions
   - Probes for edge cases
   - Knows when to go deeper vs move on

2. **Extraction Prompt**: Processes completed interviews
   - Extracts structured knowledge
   - Generates visualizations
   - Identifies ambiguities
   - Creates formalized rules

### Interview Phases

| Phase | Questions | Goal |
|-------|-----------|------|
| UNDERSTAND | 1-3 | Grasp high-level process/rule |
| DETAIL | 4-7 | Extract specific conditions and logic |
| EXCEPTIONS | 8-10 | Identify edge cases and special scenarios |
| VALIDATE | 11-12 | Confirm understanding with examples |

## Storage Schema

### Project

```json
{
  "id": "uuid",
  "name": "Customer Discount Calculation",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "status": "interviewing | processing | complete",
  "expert_description": "Initial description from expert",
  "conversation": [],
  "extracted_knowledge": {}
}
```

### Conversation Entry

```json
{
  "role": "bridgespec | expert",
  "content": "message content",
  "timestamp": "ISO timestamp",
  "phase": "understand | detail | exceptions | validate"
}
```

## Integration Points

### Export Formats
- Markdown documentation
- JSON knowledge base
- Mermaid diagram code
- Pseudo-code rules

### Future Integrations
- Notion (via API)
- Confluence
- GitHub (for code generation)
- Jira (for task creation)
