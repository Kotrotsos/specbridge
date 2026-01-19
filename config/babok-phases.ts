// BABOK phase definitions - shared between client and server

export const BABOK_PHASES = [
  { number: 1, name: "context_stakeholders", label: "Context & Stakeholders", duration: "15 min" },
  { number: 2, name: "current_state", label: "Current State", duration: "20 min" },
  { number: 3, name: "future_state", label: "Future State", duration: "15 min" },
  { number: 4, name: "detailed_rules", label: "Detailed Rules", duration: "30-60 min" },
  { number: 5, name: "validation", label: "Validation & Review", duration: "10-15 min" },
] as const;

export type PhaseNumber = 1 | 2 | 3 | 4 | 5;
export type PhaseName = typeof BABOK_PHASES[number]["name"];
