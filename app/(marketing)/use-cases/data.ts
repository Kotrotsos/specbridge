import {
  Shield,
  Users,
  Code,
  Headphones,
  DollarSign,
  Database,
  LucideIcon,
} from "lucide-react";

export interface UseCase {
  title: string;
  description: string;
}

export interface UseCaseCategory {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  color: {
    bg: string;
    text: string;
    border: string;
    light: string;
  };
  useCases: UseCase[];
  benefits: string[];
  example: {
    before: string;
    after: string;
    scenario: string;
  };
}

export const USE_CASE_CATEGORIES: UseCaseCategory[] = [
  {
    slug: "compliance-risk",
    title: "Compliance & Risk",
    shortTitle: "Compliance",
    description:
      "Capture and formalize complex regulatory requirements, risk assessment criteria, and audit documentation for regulated industries.",
    icon: Shield,
    color: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      light: "bg-blue-100",
    },
    useCases: [
      {
        title: "Audit Trail Documentation",
        description:
          "Generate comprehensive audit documentation for regulated industries like finance and healthcare. Capture the reasoning behind decisions, approval hierarchies, and exception handling in formats auditors understand.",
      },
      {
        title: "Risk Decision Trees",
        description:
          "Transform insurance underwriting expertise into clear decision trees. Document risk assessment criteria, scoring thresholds, and escalation triggers that can be reviewed and updated systematically.",
      },
      {
        title: "Policy Interpretation Guides",
        description:
          "Create internal guides that explain how policies should be applied in specific situations. Capture the institutional knowledge of how edge cases are handled.",
      },
    ],
    benefits: [
      "Reduce audit preparation time by 60%",
      "Ensure consistent policy interpretation across teams",
      "Create defensible documentation of decision-making processes",
      "Simplify regulatory change management",
    ],
    example: {
      scenario: "Insurance Underwriting Risk Assessment",
      before:
        '"For high-risk applications, we look at a combination of factors. It depends on the situation. Usually Sarah knows the thresholds."',
      after:
        "A complete decision tree with 23 risk factors, 8 escalation triggers, and documented thresholds for each risk category, ready for regulatory review.",
    },
  },
  {
    slug: "onboarding-knowledge",
    title: "Onboarding & Knowledge Preservation",
    shortTitle: "Onboarding",
    description:
      "Capture institutional knowledge before it walks out the door. Transform expert intuition into documented processes that new team members can learn from.",
    icon: Users,
    color: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      light: "bg-green-100",
    },
    useCases: [
      {
        title: "Departing Expert Knowledge Capture",
        description:
          "Before your senior expert retires or moves on, capture their decades of tacit knowledge. SpecBridge asks the questions they never thought to document.",
      },
      {
        title: "Training Material Generation",
        description:
          "Transform captured knowledge into structured training materials. Generate decision guides, process flows, and scenario-based exercises for new employees.",
      },
      {
        title: "Process Formalization",
        description:
          '"This is how Bob does it" becomes a formal, documented process. Capture the unwritten rules and institutional memory that keep operations running.',
      },
    ],
    benefits: [
      "Reduce new employee ramp-up time by 40%",
      "Preserve critical knowledge when experts leave",
      "Create consistent processes across team members",
      "Build a searchable knowledge base",
    ],
    example: {
      scenario: "Senior Engineer Knowledge Transfer",
      before:
        '"Bob has been handling the pricing exceptions for 15 years. He just knows what to do. We\'re worried about when he retires."',
      after:
        "A 47-page specification covering 12 exception categories, decision criteria, historical precedents, and edge case handling, plus generated training scenarios.",
    },
  },
  {
    slug: "product-teams",
    title: "Product Teams",
    shortTitle: "Product",
    description:
      "Bridge the gap between design intent and developer specs. Ensure features are built exactly as envisioned with complete edge case coverage.",
    icon: Code,
    color: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      light: "bg-purple-100",
    },
    useCases: [
      {
        title: "Feature Requirement Translation",
        description:
          "Transform designer intent into precise developer specifications. Capture the nuances of user interactions, state transitions, and visual behaviors that get lost in handoff.",
      },
      {
        title: "Edge Case Testing Strategy",
        description:
          "Generate comprehensive test scenarios from business requirements. Identify edge cases before development begins, not during QA.",
      },
      {
        title: "Acceptance Criteria Formalization",
        description:
          "Create unambiguous acceptance criteria that leave no room for interpretation. Define exactly what 'done' looks like for every user story.",
      },
    ],
    benefits: [
      "Reduce requirement-related bugs by 50%",
      "Eliminate back-and-forth clarification meetings",
      "Ship features that match stakeholder expectations",
      "Accelerate QA with pre-defined test cases",
    ],
    example: {
      scenario: "E-commerce Checkout Flow",
      before:
        '"Users should be able to apply discount codes. Make it intuitive." (3 rounds of revisions later...)',
      after:
        "Complete specification: 8 discount types, stacking rules, expiration handling, error messages, 34 edge cases, and generated test scenarios.",
    },
  },
  {
    slug: "operations-support",
    title: "Operations & Support",
    shortTitle: "Operations",
    description:
      "Empower support teams with clear decision guides. Reduce escalations and ensure consistent customer experiences.",
    icon: Headphones,
    color: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      light: "bg-orange-100",
    },
    useCases: [
      {
        title: "Troubleshooting Decision Trees",
        description:
          "Create step-by-step troubleshooting guides for customer support teams. Capture the diagnostic logic of your best support engineers.",
      },
      {
        title: "Escalation Criteria Documentation",
        description:
          "Define clear rules for when issues should be escalated, to whom, and with what information. Reduce both over-escalation and missed critical issues.",
      },
      {
        title: "SLA Exception Handling",
        description:
          "Document the rules for SLA exceptions, credits, and goodwill gestures. Ensure consistent and fair treatment across all customer interactions.",
      },
    ],
    benefits: [
      "Reduce average handling time by 25%",
      "Decrease unnecessary escalations by 40%",
      "Improve first-call resolution rates",
      "Ensure consistent customer experience",
    ],
    example: {
      scenario: "Technical Support Escalation",
      before:
        '"Use your judgment on when to escalate. If it feels serious, loop in engineering."',
      after:
        "Decision tree covering 15 issue categories, severity criteria, required diagnostic steps, and escalation paths with SLA timelines.",
    },
  },
  {
    slug: "sales-pricing",
    title: "Sales & Pricing",
    shortTitle: "Sales",
    description:
      "Formalize deal approval logic and pricing exceptions. Empower sales teams while maintaining margin discipline.",
    icon: DollarSign,
    color: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      light: "bg-emerald-100",
    },
    useCases: [
      {
        title: "RFP Response Logic",
        description:
          "Document what triggers custom pricing, special terms, or non-standard offerings. Ensure RFP responses are consistent and defensible.",
      },
      {
        title: "Deal Approval Authority",
        description:
          "Formalize who can approve what, at what thresholds, and under what conditions. Create clear escalation paths for non-standard deals.",
      },
      {
        title: "Discount Exception Frameworks",
        description:
          "Define the rules for when discounts can be offered, maximum thresholds, required justifications, and approval workflows.",
      },
    ],
    benefits: [
      "Accelerate deal approval cycles",
      "Maintain pricing discipline while enabling flexibility",
      "Reduce revenue leakage from unauthorized discounts",
      "Enable self-service for standard scenarios",
    ],
    example: {
      scenario: "Enterprise Deal Approval",
      before:
        '"Check with finance if the discount is too high. It depends on the deal size and who the customer is."',
      after:
        "Complete approval matrix: 6 deal tiers, discount thresholds, required approvers, documentation requirements, and exception criteria.",
    },
  },
  {
    slug: "data-analytics",
    title: "Data & Analytics",
    shortTitle: "Data",
    description:
      "Document the business logic behind your data transformations. Create maintainable data pipelines with clear lineage.",
    icon: Database,
    color: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
      light: "bg-indigo-100",
    },
    useCases: [
      {
        title: "ETL Transformation Logic",
        description:
          "Capture the business rules behind data transformations. Document why data is transformed, not just how, making pipelines maintainable long-term.",
      },
      {
        title: "Data Quality Rule Formalization",
        description:
          "Define what makes data valid, complete, and accurate. Create executable quality rules from business definitions.",
      },
      {
        title: "Warehouse Documentation",
        description:
          "Document fact vs dimension decisions, slowly changing dimension strategies, and aggregation rules in business terms.",
      },
    ],
    benefits: [
      "Reduce data pipeline debugging time",
      "Create self-documenting data transformations",
      "Improve data quality through clear rules",
      "Enable business users to understand data lineage",
    ],
    example: {
      scenario: "Revenue Recognition Logic",
      before:
        '"The revenue calculation is in a stored procedure from 2019. Nobody knows exactly why it does what it does."',
      after:
        "Documented business rules: 7 revenue recognition scenarios, timing rules, adjustment triggers, and edge case handling with test data.",
    },
  },
];

export function getUseCaseBySlug(slug: string): UseCaseCategory | undefined {
  return USE_CASE_CATEGORIES.find((cat) => cat.slug === slug);
}

export function getAdjacentUseCases(
  currentSlug: string
): { prev: UseCaseCategory | null; next: UseCaseCategory | null } {
  const currentIndex = USE_CASE_CATEGORIES.findIndex(
    (cat) => cat.slug === currentSlug
  );
  return {
    prev: currentIndex > 0 ? USE_CASE_CATEGORIES[currentIndex - 1] : null,
    next:
      currentIndex < USE_CASE_CATEGORIES.length - 1
        ? USE_CASE_CATEGORIES[currentIndex + 1]
        : null,
  };
}
