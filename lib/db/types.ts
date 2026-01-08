/**
 * Database Types
 *
 * TypeScript interfaces for all IndexedDB stored data
 */

export interface DBMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string; // ISO string for IndexedDB compatibility
}

export type ArtifactType = "overview" | "decision-tree" | "rules" | "variables" | "edge-cases";
export type ArtifactStatus = "generating" | "complete" | "error";

export interface DBArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  status: ArtifactStatus;
  data: Record<string, unknown> | null;
  error?: string;
  createdAt: string;
}

export interface DBInterview {
  id: string;
  title: string;
  initialDescription: string;
  status: "in_progress" | "complete";
  messages: DBMessage[];
  artifacts: DBArtifact[];
  extractedKnowledge: object | null; // Legacy, kept for migration
  createdAt: string;
  updatedAt: string;
}

export interface DBStarterPrompt {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface DBMigration {
  version: number;
  name: string;
  appliedAt: string;
}

// Database schema version - increment when schema changes
export const DB_NAME = "bridgespec";
export const DB_VERSION = 1;

// Object store names
export const STORES = {
  interviews: "interviews",
  starterPrompts: "starterPrompts",
  migrations: "migrations",
} as const;
