// Message types for chat
export interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  phase?: InterviewPhase;
  questionNumber?: number;
}

export type InterviewPhase = "understand" | "detail" | "exceptions" | "validate";

export interface InterviewState {
  id: string;
  title: string;
  status: "draft" | "in_progress" | "complete";
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  extractedKnowledge?: ExtractedKnowledge;
}

// Extracted knowledge structure
export interface ExtractedKnowledge {
  metadata: {
    domain: string;
    processName: string;
    complexity: "simple" | "moderate" | "complex";
    interviewDate: string;
  };
  summary: {
    oneLine: string;
    detailed: string;
    keyActors: string[];
    inputs: string[];
    outputs: string[];
  };
  rules: Rule[];
  edgeCases: EdgeCase[];
  ambiguities: Ambiguity[];
  dependencies: Dependency[];
  recommendedArtifacts: {
    decisionTree: { recommended: boolean; reason: string };
    flowchart: { recommended: boolean; reason: string };
    stateDiagram: { recommended: boolean; reason: string };
    pseudoCode: { recommended: boolean; reason: string };
  };
}

export interface Rule {
  id: string;
  description: string;
  formalCondition: string;
  priority: number;
  examples: string[];
  source: string;
}

export interface EdgeCase {
  scenario: string;
  handling: string;
  status: "documented" | "ambiguous" | "missing";
}

export interface Ambiguity {
  issue: string;
  impact: string;
  suggestedQuestion: string;
}

export interface Dependency {
  elementA: string;
  relationship: string;
  elementB: string;
}

// API request/response types
export interface ChatRequest {
  messages: Message[];
  interviewId: string;
}

export interface ChatResponse {
  type: "question" | "complete";
  content: string;
  phase?: InterviewPhase;
  questionNumber?: number;
  extractedKnowledge?: ExtractedKnowledge;
}
