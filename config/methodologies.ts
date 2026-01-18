/**
 * Methodology and Specification Type Definitions
 *
 * Defines the supported methodologies (BABOK, IEEE, Agile, Custom)
 * and their associated specification types.
 */

export type MethodologyId = "agile" | "babok" | "ieee" | "custom";

export type SpecificationType =
  // Agile types
  | "user_story"
  | "epic"
  | "acceptance_criteria"
  // BABOK types
  | "business_requirement"
  | "stakeholder_requirement"
  | "solution_requirement"
  | "transition_requirement"
  // IEEE types
  | "functional_requirement"
  | "non_functional_requirement"
  | "interface_requirement"
  // Custom
  | "custom";

export interface SpecificationTypeConfig {
  id: SpecificationType;
  name: string;
  description: string;
  interviewFocus: string[];
  artifactTypes: string[];
}

export interface MethodologyConfig {
  id: MethodologyId;
  name: string;
  shortName: string;
  description: string;
  color: {
    bg: string;
    text: string;
    border: string;
    accent: string;
  };
  specificationTypes: SpecificationTypeConfig[];
}

// Specification type definitions
const AGILE_SPEC_TYPES: SpecificationTypeConfig[] = [
  {
    id: "user_story",
    name: "User Story",
    description: "A brief description of functionality from the user's perspective",
    interviewFocus: [
      "Who is the user and what is their role?",
      "What does the user want to accomplish?",
      "What value or benefit does this provide?",
      "What are the acceptance criteria?",
    ],
    artifactTypes: ["overview", "acceptance_criteria", "dependencies", "edge_cases"],
  },
  {
    id: "epic",
    name: "Epic",
    description: "A large body of work that can be broken down into smaller stories",
    interviewFocus: [
      "What is the high-level business objective?",
      "Who are the key stakeholders?",
      "What are the main components or themes?",
      "What is the expected timeline and scope?",
    ],
    artifactTypes: ["overview", "story_breakdown", "dependencies", "milestones"],
  },
  {
    id: "acceptance_criteria",
    name: "Acceptance Criteria",
    description: "Specific conditions that must be met for a story to be complete",
    interviewFocus: [
      "What must be true for this to be considered done?",
      "What are the happy path scenarios?",
      "What edge cases should be handled?",
      "What should NOT happen?",
    ],
    artifactTypes: ["criteria_list", "test_scenarios", "edge_cases"],
  },
];

const BABOK_SPEC_TYPES: SpecificationTypeConfig[] = [
  {
    id: "business_requirement",
    name: "Business Requirement",
    description: "High-level statements of goals, objectives, and outcomes",
    interviewFocus: [
      "What business problem are we solving?",
      "What are the strategic objectives?",
      "Who are the stakeholders and what are their interests?",
      "How will success be measured?",
    ],
    artifactTypes: ["overview", "stakeholder_analysis", "success_metrics", "business_rules"],
  },
  {
    id: "stakeholder_requirement",
    name: "Stakeholder Requirement",
    description: "Needs of stakeholders that must be met by the solution",
    interviewFocus: [
      "Who is the stakeholder and what is their role?",
      "What do they need from the solution?",
      "What constraints do they operate under?",
      "How do they interact with the system?",
    ],
    artifactTypes: ["overview", "needs_matrix", "constraints", "interaction_points"],
  },
  {
    id: "solution_requirement",
    name: "Solution Requirement",
    description: "Capabilities the solution must have to meet stakeholder needs",
    interviewFocus: [
      "What capabilities must the solution provide?",
      "What are the functional behaviors?",
      "What quality attributes are required?",
      "What are the design constraints?",
    ],
    artifactTypes: ["overview", "functional_spec", "quality_attributes", "constraints"],
  },
  {
    id: "transition_requirement",
    name: "Transition Requirement",
    description: "Capabilities needed to move from current to future state",
    interviewFocus: [
      "What is the current state?",
      "What is the desired future state?",
      "What needs to happen during transition?",
      "What training or change management is needed?",
    ],
    artifactTypes: ["overview", "gap_analysis", "migration_plan", "training_needs"],
  },
];

const IEEE_SPEC_TYPES: SpecificationTypeConfig[] = [
  {
    id: "functional_requirement",
    name: "Functional Requirement",
    description: "What the system shall do, its behaviors and functions",
    interviewFocus: [
      "What function does the system perform?",
      "What are the inputs and outputs?",
      "What processing occurs?",
      "Under what conditions does this apply?",
    ],
    artifactTypes: ["overview", "use_cases", "data_flow", "state_transitions"],
  },
  {
    id: "non_functional_requirement",
    name: "Non-functional Requirement",
    description: "Quality attributes, constraints, and -ilities of the system",
    interviewFocus: [
      "What performance levels are required?",
      "What security requirements exist?",
      "What reliability and availability is needed?",
      "What scalability is expected?",
    ],
    artifactTypes: ["overview", "quality_metrics", "constraints", "compliance_requirements"],
  },
  {
    id: "interface_requirement",
    name: "Interface Requirement",
    description: "How the system interacts with users, hardware, and other systems",
    interviewFocus: [
      "What external systems does this interact with?",
      "What data is exchanged?",
      "What protocols or formats are used?",
      "What user interface requirements exist?",
    ],
    artifactTypes: ["overview", "interface_spec", "data_formats", "protocols"],
  },
];

const CUSTOM_SPEC_TYPES: SpecificationTypeConfig[] = [
  {
    id: "custom",
    name: "Custom Specification",
    description: "A flexible format for capturing any type of requirement",
    interviewFocus: [
      "What are we trying to define?",
      "Who needs this information?",
      "What decisions will this inform?",
      "What details are most important?",
    ],
    artifactTypes: ["overview", "decision_tree", "rules", "variables", "edge_cases"],
  },
];

// Methodology definitions
export const METHODOLOGIES: MethodologyConfig[] = [
  {
    id: "agile",
    name: "Agile",
    shortName: "AG",
    description: "User-centered approach with stories, epics, and acceptance criteria",
    color: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      accent: "#3b82f6",
    },
    specificationTypes: AGILE_SPEC_TYPES,
  },
  {
    id: "babok",
    name: "BABOK",
    shortName: "BA",
    description: "Business Analysis Body of Knowledge framework for enterprise requirements",
    color: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      accent: "#8b5cf6",
    },
    specificationTypes: BABOK_SPEC_TYPES,
  },
  {
    id: "ieee",
    name: "IEEE 830",
    shortName: "IE",
    description: "Software Requirements Specification standard for formal documentation",
    color: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      accent: "#10b981",
    },
    specificationTypes: IEEE_SPEC_TYPES,
  },
  {
    id: "custom",
    name: "Custom",
    shortName: "CU",
    description: "Flexible format for any type of specification",
    color: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      accent: "#6b7280",
    },
    specificationTypes: CUSTOM_SPEC_TYPES,
  },
];

// Helper functions
export function getMethodology(id: MethodologyId): MethodologyConfig | undefined {
  return METHODOLOGIES.find((m) => m.id === id);
}

export function getSpecificationType(
  methodologyId: MethodologyId,
  typeId: SpecificationType
): SpecificationTypeConfig | undefined {
  const methodology = getMethodology(methodologyId);
  if (!methodology) return undefined;
  return methodology.specificationTypes.find((t) => t.id === typeId);
}

export function getDefaultSpecificationType(methodologyId: MethodologyId): SpecificationType {
  const methodology = getMethodology(methodologyId);
  if (!methodology || methodology.specificationTypes.length === 0) {
    return "user_story";
  }
  return methodology.specificationTypes[0].id;
}

export function getAllSpecificationTypes(): SpecificationTypeConfig[] {
  return METHODOLOGIES.flatMap((m) => m.specificationTypes);
}

export function getSpecificationTypeById(typeId: SpecificationType): SpecificationTypeConfig | undefined {
  return getAllSpecificationTypes().find((t) => t.id === typeId);
}
