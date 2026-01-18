# SpecBridge: Formal Models & Artifact Structure Brainstorm

## The Vision

SpecBridge bridges domain experts and technical teams through AI-powered interviews. The next evolution is generating **professional-grade requirement artifacts** that match what big consultancies deliver, but accessible to everyone.

---

## Current State

```
Project
  └── Feature
        └── Specification (Interview)
              └── Artifacts (Overview, Decision Tree, Rules, Variables, Edge Cases)
```

Artifacts are currently flat, ephemeral, and tied to a single specification. No formal structure, no traceability, no export formats.

---

## Formal Models to Support

### Tier 1: Core Models (Pro)
1. **BABOK-style Requirements**
   - Business Requirements
   - Stakeholder Requirements
   - Solution Requirements (Functional + Non-functional)
   - Transition Requirements

2. **Use Case Specifications**
   - Actors & System Boundaries
   - Main Success Scenario
   - Extensions/Alternate Flows
   - Pre/Post Conditions

3. **User Story Maps**
   - Epics > Features > Stories
   - INVEST criteria validation
   - Acceptance Criteria generation

### Tier 2: Enterprise Models (Enterprise/Add-on)
4. **IEEE 29148 SRS**
   - Full contractual specification
   - Interface requirements
   - Compliance-ready format

5. **Volere Template**
   - Fit Criteria for each requirement
   - Measurable acceptance tests
   - Requirement shells

6. **Traceability Matrix**
   - Business goal → Requirement → Test case
   - Impact analysis
   - Coverage reports

7. **Goal-Oriented (KAOS/i*)**
   - Goal decomposition diagrams
   - Obstacle identification
   - Resolution strategies

---

## Explorer/Sidebar Restructure Options

### Option A: Deliverables as First-Class Citizens
```
Project
  ├── Features
  │     └── Feature
  │           └── Specifications
  │                 └── Interview sessions
  ├── Requirements (NEW)
  │     ├── Business Requirements
  │     ├── Functional Requirements
  │     └── Non-functional Requirements
  ├── Deliverables (NEW)
  │     ├── Use Case Document
  │     ├── SRS Document
  │     └── User Story Map
  └── Traceability (NEW)
```

**Pros**: Clean separation, deliverables feel important
**Cons**: Disconnected from source interviews

### Option B: Multi-View Specifications
```
Project
  └── Feature
        └── Specification
              ├── Interview (chat + basic artifacts)
              ├── Formal Views (NEW)
              │     ├── Use Cases
              │     ├── Requirements (BABOK)
              │     └── Acceptance Criteria
              └── Exports (NEW)
                    ├── SRS Document
                    └── Volere Template
```

**Pros**: Everything traced to source, clear lineage
**Cons**: Deep nesting, may feel cluttered

### Option C: Project-Level Document Library (Recommended)
```
Project
  ├── Interviews
  │     └── Feature
  │           └── Specification (interview + artifacts)
  └── Documents (NEW - Pro Feature)
        ├── Requirements Spec
        │     └── Links to: [Spec A, Spec B, Spec C]
        ├── Use Case Package
        │     └── Links to: [Spec A, Spec D]
        └── SRS v1.0
              └── Links to: [All Specs]
```

**Pros**:
- Documents aggregate multiple specifications
- Clear "deliverable" concept
- Natural upsell (Free = interviews only, Pro = documents)
- Traceability built-in via links

**Cons**: New mental model for users

---

## Artifact Generation Flow

### Current Flow
```
Interview → AI extracts → Flat artifacts (Overview, Rules, etc.)
```

### Proposed Flow
```
Interview(s) → AI extracts structured data → Knowledge Graph
                                                    ↓
                                    ┌───────────────┼───────────────┐
                                    ↓               ↓               ↓
                              Use Cases      Requirements       Traceability
                                    ↓               ↓               ↓
                              UC Document    SRS Document      Matrix Export
```

The key insight: **Extract once, render many ways**. The AI builds a structured knowledge representation, then different "views" or "documents" are renderings of that same underlying data.

---

## Data Model Changes

### New Entities

```typescript
// A document aggregates knowledge from multiple specifications
interface Document {
  id: string;
  projectId: string;
  type: DocumentType; // 'srs' | 'use_cases' | 'user_stories' | 'babok' | 'volere'
  name: string;
  version: string;
  status: 'draft' | 'review' | 'approved';

  // Links to source specifications
  sourceSpecifications: string[];

  // Rendered content (regenerated when sources change)
  content: DocumentContent;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  exportedAt?: Date;
}

// Structured requirement extracted from interviews
interface Requirement {
  id: string;
  projectId: string;
  sourceSpecificationId: string;

  type: 'business' | 'stakeholder' | 'functional' | 'non_functional' | 'transition';
  category?: string; // e.g., 'security', 'performance', 'usability'

  title: string;
  description: string;
  rationale?: string;

  // Volere-style fit criteria
  fitCriteria?: string;

  // Traceability
  parentRequirementId?: string; // for decomposition
  relatedRequirements: string[];

  // Status
  priority: 'must' | 'should' | 'could' | 'wont';
  status: 'proposed' | 'approved' | 'implemented' | 'verified';
}

// Use case extracted from interviews
interface UseCase {
  id: string;
  projectId: string;
  sourceSpecificationIds: string[];

  name: string;
  actors: string[];
  description: string;

  preconditions: string[];
  postconditions: string[];

  mainFlow: UseCaseStep[];
  alternativeFlows: AlternativeFlow[];

  // Links
  relatedRequirements: string[];
}
```

---

## Monetization Strategy

### Free Tier
- Unlimited interviews
- 3 projects
- Basic artifacts (Overview, Decision Tree, Rules, Variables, Edge Cases)
- Export: Markdown only

### Pro Tier ($19/month)
- Unlimited projects
- **Formal Models**: Use Cases, BABOK Requirements, User Stories
- **Documents**: Create aggregated documents from multiple specs
- Export: Markdown, PDF, Word
- Version history

### Enterprise Tier ($49/month or custom)
- Everything in Pro
- **Compliance Templates**: IEEE 29148 SRS, Volere
- **Traceability Matrix**: Full bi-directional tracing
- **Goal Modeling**: KAOS-style decomposition
- Export: All formats + API access
- Team collaboration (multiple seats)
- Audit trail

---

## UI/UX Considerations

### 1. Document Creation Flow
```
[Create Document] → Select Type → Select Source Specs → Generate → Review/Edit → Export
```

### 2. Artifact Badges
Show which formal models are available for a specification:
```
┌─────────────────────────────────────┐
│ Customer Discount Calculation       │
│ ─────────────────────────────────── │
│ [Overview] [Rules] [Use Case ⭐]    │
│ [Requirements ⭐] [Edge Cases]      │
│                                     │
│ ⭐ = Pro feature                    │
└─────────────────────────────────────┘
```

### 3. Traceability View
Interactive graph showing connections:
```
Business Goal ──→ Stakeholder Need ──→ Requirement ──→ Test Case
     │                   │                  │
     └───────────────────┴──────────────────┴──→ Specification Interview
```

### 4. Document Preview
Side-by-side: Interview on left, formal document on right, updating in real-time as you chat.

---

## Implementation Phases

### Phase 1: Foundation (Current + Immediate)
- [x] Project/Feature/Specification hierarchy
- [x] Interview with basic artifacts
- [x] Pro tier with project limits
- [ ] Extract structured requirements from interviews (enhance AI prompts)

### Phase 2: Formal Artifacts (Pro Feature)
- [ ] Use Case generation from specifications
- [ ] BABOK-style requirement categorization
- [ ] User Story generation with INVEST validation
- [ ] PDF/Word export

### Phase 3: Documents (Pro Feature)
- [ ] Document entity and UI
- [ ] Aggregate multiple specs into one document
- [ ] SRS template
- [ ] Version history

### Phase 4: Enterprise Features
- [ ] Traceability matrix
- [ ] Volere template with fit criteria
- [ ] Goal decomposition diagrams
- [ ] API access
- [ ] Team collaboration

---

## Open Questions

1. **Granularity**: Should formal artifacts live at Specification level or Project level?
   - Spec level: More granular, but can't aggregate
   - Project level: Can aggregate, but loses direct connection

2. **Real-time vs. Snapshot**: Should documents update automatically when source specs change, or be versioned snapshots?
   - Real-time: Always current, but unstable
   - Snapshot: Stable, but may drift from truth

3. **AI Extraction**: Single pass (extract everything at once) or on-demand (generate each formal model separately)?
   - Single pass: Consistent, but expensive
   - On-demand: Cheaper, but may have inconsistencies

4. **Editing**: Can users edit generated formal models, or are they read-only renderings?
   - Editable: More flexible, but breaks traceability
   - Read-only: Clean traceability, but frustrating if AI gets it wrong

---

## Next Steps

1. **Validate demand**: Talk to users about which formal models they'd actually use
2. **Prototype Use Case generation**: Enhance AI prompts to extract use case structure
3. **Design Document UI**: Mockup the document library and creation flow
4. **Define pricing**: Validate $19/month Pro and $49/month Enterprise price points

---

## References

- BABOK Guide v3: https://www.iiba.org/babok-guide/
- IEEE 29148:2018: https://standards.ieee.org/standard/29148-2018.html
- Volere Template: https://www.volere.org/templates/
- Jeff Patton's User Story Mapping: https://www.jpattonassociates.com/user-story-mapping/
