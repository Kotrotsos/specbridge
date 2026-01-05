# MVP Features

## MVP Scope Definition

BridgeSpec MVP is a standalone personal project focused on validating the core concept of AI-driven knowledge extraction between domain experts and technical implementers.

## Core Features (Week 1-2)

### Expert Interface

- [x] Expert enters initial description (any domain)
- [x] AI analyzes domain and generates first question
- [x] Adaptive interview (5-10 exchanges)
- [x] Knowledge extraction into structured format
- [x] Free-form text input for answers
- [x] "Tell me more about..." follow-up prompts

### Implementer Interface

- [x] Decision tree visualization (Mermaid diagram)
- [x] Pseudo-code output
- [x] List of edge cases identified
- [x] "Ask a question" input box
- [x] Generate Mermaid decision tree

### Storage

- [x] Simple JSON storage
- [x] One project = one business rule/process
- [x] Single project storage

## Polish Features (Week 3-4)

- [x] Implementer can ask questions about the knowledge
- [x] Show "ambiguities to clarify" section
- [x] Export as markdown
- [x] Multiple projects support
- [x] Async: expert can refine answers over time

## Future (Post-MVP)

- [ ] Multiple output formats (flowchart, state diagram, etc.)
- [ ] Generate actual code (Python, JS, etc.)
- [ ] Integration with Notion/Confluence
- [ ] Collaboration (multiple experts)
- [ ] Version history

## MVP User Flow

```
1. Expert creates new project: "Customer discount calculation"
2. BridgeSpec asks: "What factors determine the discount?"
3. Expert answers in natural language
4. BridgeSpec probes edge cases
5. Expert refines over time (async)
6. Implementer views: decision tree + pseudo-code
7. Implementer asks clarifying questions
8. System points to relevant expert answers
```

## Validation Checklist

Before building:

1. [ ] Write down 3 real scenarios from consulting work where this would have helped
2. [ ] Mock up the expert interview for one scenario (just the questions in a doc)
3. [ ] Show it to 2-3 domain experts and ask: "Would this be easier than explaining it to me in a meeting?"

If they say yes enthusiastically, build it. If lukewarm, refine the concept.

## Success Metrics

### MVP Success Criteria

- Expert can complete an interview in under 15 minutes
- Implementer understands the captured logic without additional meetings
- At least one edge case identified that expert forgot to mention initially
- Generated diagram accurately represents the business logic

### User Feedback Goals

- "This asked questions I wouldn't have thought to mention"
- "The diagram matches how I think about this process"
- "I can use this pseudo-code directly"

## Monetization Options (Post-Traction)

### Free Tier
- 3 processes per account
- Basic diagrams
- Community support

### Pro Tier ($15-30/month)
- Unlimited processes
- Advanced visualizations
- Export to various formats
- Priority support

### Enterprise
- Self-hosted option
- Custom process templates
- White-label
- Integration support

## Launch Strategy

### Phase 1: Build in Public
- Open source the MVP
- Share progress on LinkedIn
- Get feedback from developer community

### Phase 2: Early Adopters
- Offer to existing consulting network
- Free in exchange for feedback
- Collect testimonials

### Phase 3: Productize
- If people want it, add features and pricing
- Could be "BridgeSpec by NxtPhase" for credibility

## Demo Hook

Start with a live example:

"Let me show you how this works. Imagine you're a pricing specialist at a retail company. The tool asks you: 'When do you apply volume discounts?' You answer naturally, and watch as it builds a decision tree, identifies edge cases you didn't mention, and asks smart follow-up questions. Then I'll switch to the implementer view and show you the same knowledge as formalized logic ready for implementation."
