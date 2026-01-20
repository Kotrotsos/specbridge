# SpecBridge - Product Specification

## Overview

SpecBridge is a web-based knowledge extraction platform that bridges communication gaps between domain experts and technical implementers. It conducts AI-driven interviews with domain experts to capture business processes, rules, and logic, then generates structured artifacts for developers to understand and implement.

## Problem Statement

When building software systems, there's often a significant communication gap between:
- **Domain Experts**: People who understand the business process deeply but think in business terms
- **Technical Implementers**: Developers who need precise specifications to build accurate solutions

This gap leads to:
- Misunderstood requirements
- Incorrect implementations
- Multiple revision cycles
- Lost domain knowledge when experts leave

## Solution

SpecBridge acts as an intelligent intermediary that:
1. **Captures** knowledge through conversational interviews in business language
2. **Structures** that knowledge into implementation-ready artifacts
3. **Preserves** domain expertise in a reusable format

## Target Users

### Primary: Domain Experts
- Business analysts
- Subject matter experts
- Process owners
- Operations managers

### Secondary: Technical Implementers
- Software developers
- System architects
- QA engineers
- Technical writers

## Core Features

### 1. Guided Interviews

AI-conducted interviews that extract business knowledge through a structured methodology:

**Phase 1: Understand (Questions 1-3)**
- Establish high-level process overview
- Identify triggers, outcomes, and stakeholders
- Use open-ended questions in business language

**Phase 2: Detail (Questions 4-7)**
- Extract specific conditions, thresholds, and formulas
- Capture decision points and calculations
- Request concrete examples with real numbers

**Phase 3: Exceptions (Questions 8-10)**
- Identify edge cases and special scenarios
- Explore rule conflicts and priorities
- Document error handling and boundaries

**Phase 4: Validate (Questions 11-12)**
- Confirm understanding with example scenarios
- Verify extracted logic is accurate
- Identify any missed nuances

### 2. Artifact Generation

On-demand generation of structured documentation:

| Artifact | Purpose | Output Format |
|----------|---------|---------------|
| **Overview** | Comprehensive process summary | Structured document with steps, context, stakeholders |
| **Visualize Diagram** | Visual representation of flow | Mermaid flowchart or sequence diagram |
| **Rules** | Formalized business rules | IF/THEN statements with conditions and actions |
| **Variables** | Data elements and constraints | Variable list with types, ranges, valid values |
| **Edge Cases** | Exception scenarios | Edge case list with handling and open questions |

### 3. Studio Panel

Side-by-side interface for managing artifacts:
- Generate artifacts from interview content
- View and navigate generated artifacts
- Regenerate outdated artifacts when conversation updates
- Delete unwanted artifacts

### 4. Answer Suggestions

AI-generated example answers to help experts articulate their knowledge:
- Contextual suggestions based on current question
- Clickable to insert into response
- Toggleable feature (user preference)

### 5. Starter Prompts

Quick-start templates for common process types:
- Customer discount calculation
- Purchase approval workflow
- Data validation requirements
- Order status transitions

## User Flows

### Expert Interview Flow

```
1. Expert creates new interview
2. Expert describes process in their own words
3. SpecBridge asks clarifying questions (one at a time)
4. Expert answers, optionally using suggestions
5. Repeat until interview complete
6. Expert generates desired artifacts
7. Expert reviews and regenerates if needed
```

### Implementer Consumption Flow

```
1. Implementer accesses completed interview
2. Reviews generated artifacts
3. Uses Overview for context
4. References Diagram for visual understanding
5. Implements Rules as business logic
6. Uses Variables for data model
7. Tests against Edge Cases
```

## Artifact Specifications

### Overview Artifact

```json
{
  "summary": "One paragraph process description",
  "context": "When and why this process runs",
  "steps": [
    {
      "number": 1,
      "action": "What happens",
      "details": "Additional context"
    }
  ],
  "stakeholders": ["Role 1", "Role 2"],
  "edgeCases": ["Exception 1", "Exception 2"],
  "openQuestions": ["Unresolved question 1"]
}
```

### Visualize Diagram Artifact

Two diagram types supported:

**Flowchart**: Decision-based branching diagrams
```
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
```

**Sequence Diagram**: Actor interaction flows
```
sequenceDiagram
    Actor1->>System: Request
    System->>Actor2: Forward
    Actor2-->>System: Response
```

### Rules Artifact

```json
{
  "rules": [
    {
      "condition": "IF customer_type = 'premium'",
      "action": "THEN apply 20% discount",
      "priority": 1,
      "exceptions": "Does not apply to sale items"
    }
  ]
}
```

### Variables Artifact

```json
{
  "variables": [
    {
      "name": "customer_type",
      "type": "enum",
      "possibleValues": ["standard", "premium", "enterprise"],
      "constraints": "Required for all orders"
    }
  ]
}
```

### Edge Cases Artifact

```json
{
  "edgeCases": [
    {
      "scenario": "Customer has multiple discount codes",
      "handling": "Apply highest value discount only",
      "status": "documented"
    }
  ],
  "openQuestions": [
    {
      "question": "What happens if order total is negative after discounts?",
      "impact": "Could cause payment processing errors"
    }
  ]
}
```

## Non-Functional Requirements

### Performance
- Chat responses within 3 seconds
- Artifact generation within 10 seconds
- Page load under 2 seconds

### Scalability
- Support multiple concurrent users
- Handle interviews with 50+ messages
- Store unlimited artifacts per interview

### Security
- User authentication required
- Interview isolation per user
- No cross-user data access

### Usability
- Single-column chat focus during interview
- Resizable panels for artifact review
- Mobile-responsive design
- Keyboard navigation support

## Current Implementation Status

### Completed Features
- Project and feature management hierarchy
- AI-powered conversational interviews
- Real-time artifact generation (Overview, Diagrams, Rules, Variables, Edge Cases)
- Collapsible/resizable sidebars with persistence
- Markdown rendering in chat
- Marketing site with animated demo
- Pricing page (Free/Pro/Enterprise tiers)
- Privacy, Terms, Contact pages
- Investor pitch deck

### Technical Stack
- Next.js 15+ with App Router
- TypeScript
- PostgreSQL + Prisma
- Clerk authentication
- Anthropic Claude API
- Tailwind CSS
- Mermaid.js for diagrams
- Railway deployment

## Future Considerations

### Phase 2 Features (Planned)
- Full BABOK 3.0 compliance with 5-phase interviews
- Tagged knowledge extraction during interviews
- Automated BRD document assembly
- Export to various formats (PDF, DOCX, JSON)
- Multi-expert collaboration per project

### Phase 3 Features
- Integration with project management tools (Jira, Linear)
- API access for programmatic artifact retrieval
- Custom artifact templates
- Team collaboration and sharing
- Version history for artifacts

## Success Metrics

- Time to extract complete process specification
- Accuracy of generated artifacts (user validation)
- User satisfaction scores
- Reduction in implementation revision cycles
