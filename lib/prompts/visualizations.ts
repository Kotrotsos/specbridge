export interface VisualizationPlan {
    id: number;
    type: "flowchart" | "sequenceDiagram" | "stateDiagram" | "erDiagram" | "classDiagram";
    direction?: "TD" | "LR" | "RL" | "BT";
    title: string;
    description: string;
    insertAfterHeading: string;
    relevantContent: string;
}

export const VISUALIZATION_ANALYSIS_SYSTEM_PROMPT = `You are a senior business analyst and technical documentation specialist.
Your task is to analyze a Business Requirements Document and identify where visualizations would significantly improve understanding.

Consider these types of content that benefit from diagrams:
- Process flows and workflows (use flowchart)
- Decision logic and branching paths (use flowchart)
- Actor interactions and communication sequences (use sequenceDiagram)
- Status transitions and lifecycle states (use stateDiagram)
- Data models and entity relationships (use erDiagram)
- System architecture and component relationships (use classDiagram)

Return your analysis as a JSON object.`;

export function buildVisualizationAnalysisPrompt(
    documentContent: string,
    projectName: string,
    projectDescription: string | null
): string {
    return `Analyze the following Business Requirements Document for "${projectName}"${projectDescription ? ` (${projectDescription})` : ""} and identify where Mermaid diagrams would improve understanding.

## Document Content

${documentContent}

---

## Instructions

Identify 3-8 visualization opportunities. For each, determine the best Mermaid diagram type:

- **flowchart**: For processes, workflows, decision trees. Use TD (top-down) for hierarchical flows, LR (left-right) for sequential processes.
- **sequenceDiagram**: For interactions between actors/systems over time, API call flows, user journeys with multiple participants.
- **stateDiagram**: For state machines, status transitions, lifecycle management (e.g., order states, approval workflows).
- **erDiagram**: For data models, entity relationships, database structures mentioned in the document.
- **classDiagram**: For system architecture, component relationships, module dependencies.

Choose the type that best matches the content. Do NOT default to flowchart for everything.

For each visualization, identify the heading in the document where it should be inserted (use the exact heading text from the document).

Return a JSON object in this exact format:
{
  "visualizations": [
    {
      "id": 1,
      "type": "flowchart",
      "direction": "TD",
      "title": "Descriptive Title for the Diagram",
      "description": "What this diagram illustrates and why it adds value",
      "insertAfterHeading": "## Exact Heading From Document",
      "relevantContent": "Brief summary of the document content this diagram covers"
    }
  ]
}

Rules:
- Only suggest visualizations that genuinely add value beyond what the text already conveys
- Each visualization should cover a distinct aspect (no duplicates)
- The title should be specific and descriptive
- insertAfterHeading must match an actual heading in the document (including the ## prefix)
- direction is only needed for flowchart type
- Prioritize process flows and decision logic, as these benefit most from visualization`;
}

export const VISUALIZATION_GENERATION_SYSTEM_PROMPT = `You are a Mermaid diagram specialist. Generate valid, syntactically correct Mermaid diagram code.

Critical syntax rules:

For flowchart:
- Start with: flowchart TD (or LR, RL, BT)
- Process nodes: A[Label Text]
- Decision nodes: B{Question?} - braces MUST be balanced
- Rounded: C(Label)
- Stadium: D([Label])
- Arrows: --> for solid, -.-> for dotted, ==> for thick
- Labels on arrows: -->|label text|
- Node IDs must be simple alphanumeric (A, B, nodeOne) - no spaces or special chars in IDs
- Labels with special characters must be in brackets: A["Label with (parens)"]

For sequenceDiagram:
- Start with: sequenceDiagram
- Define participants: participant User
- Sync message: User->>System: Action
- Async message: User-->>System: Action
- Response: System-->>User: Response
- Notes: Note over User: Text
- Loops: loop Description ... end
- Alt: alt Description ... else Description ... end

For stateDiagram:
- Start with: stateDiagram-v2
- Start state: [*] --> StateName
- End state: StateName --> [*]
- Transitions: StateA --> StateB: event
- State descriptions: state "Description" as s1
- Composite states: state StateName { ... }

For erDiagram:
- Start with: erDiagram
- Entities in CAPS or PascalCase
- Relationships: CUSTOMER ||--o{ ORDER : places
- Cardinality: ||=exactly one, o{=zero or more, |{=one or more, o|=zero or one
- Attributes: ENTITY { type name }

For classDiagram:
- Start with: classDiagram
- Class definition: class ClassName { +method() type attribute }
- Relationships: ClassA --> ClassB
- Inheritance: ClassA <|-- ClassB
- Composition: ClassA *-- ClassB

General rules:
- Keep diagrams readable: 5-15 nodes for flowcharts, 3-8 participants for sequence diagrams
- Use meaningful, concise labels
- Return ONLY the mermaid code, no markdown fencing, no explanation
- Do NOT include \`\`\`mermaid or \`\`\` markers`;

export function buildVisualizationGenerationPrompt(
    viz: VisualizationPlan,
    relevantDocumentSection: string
): string {
    const typeInstructions: Record<string, string> = {
        flowchart: `Generate a flowchart ${viz.direction || "TD"} diagram. Use decision nodes ({}) for branching logic, process nodes ([]) for actions, and clear arrow labels for conditions.`,
        sequenceDiagram: `Generate a sequence diagram showing the interactions between participants. Use proper message types (->> for sync, -->> for async) and include alt/loop blocks where appropriate.`,
        stateDiagram: `Generate a state diagram (stateDiagram-v2) showing state transitions. Include [*] for start/end states and label transitions with triggering events.`,
        erDiagram: `Generate an ER diagram showing entity relationships. Define entities with their key attributes and use proper cardinality notation.`,
        classDiagram: `Generate a class diagram showing component relationships. Include key methods/attributes and use proper relationship notation (inheritance, composition, association).`,
    };

    return `Generate a Mermaid diagram for: "${viz.title}"

Description: ${viz.description}

${typeInstructions[viz.type] || ""}

## Relevant Document Content

${relevantDocumentSection}

## Additional Context

${viz.relevantContent}

Generate the Mermaid code now. Return ONLY valid Mermaid syntax, nothing else.`;
}
