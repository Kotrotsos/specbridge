/**
 * Database Migrations
 *
 * Each migration has a version number and runs sequentially.
 * Migrations handle both schema changes (onupgradeneeded) and data seeding.
 */

import { STARTER_PROMPTS } from "@/config/prompts/interview";
import { DBStarterPrompt, STORES } from "./types";

export interface Migration {
  version: number;
  name: string;
  // Schema changes run during onupgradeneeded
  schema?: (db: IDBDatabase, transaction: IDBTransaction) => void;
  // Data migrations run after database is open
  data?: (db: IDBDatabase) => Promise<void>;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    schema: (db: IDBDatabase) => {
      // Create interviews store
      if (!db.objectStoreNames.contains(STORES.interviews)) {
        const interviewStore = db.createObjectStore(STORES.interviews, {
          keyPath: "id",
        });
        interviewStore.createIndex("status", "status", { unique: false });
        interviewStore.createIndex("createdAt", "createdAt", { unique: false });
        interviewStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }

      // Create starter prompts store
      if (!db.objectStoreNames.contains(STORES.starterPrompts)) {
        const promptStore = db.createObjectStore(STORES.starterPrompts, {
          keyPath: "id",
        });
        promptStore.createIndex("order", "order", { unique: false });
      }

      // Create migrations store to track applied migrations
      if (!db.objectStoreNames.contains(STORES.migrations)) {
        db.createObjectStore(STORES.migrations, { keyPath: "version" });
      }
    },
    data: async (db: IDBDatabase) => {
      // Seed starter prompts from config
      const transaction = db.transaction(STORES.starterPrompts, "readwrite");
      const store = transaction.objectStore(STORES.starterPrompts);

      // Check if already seeded
      const countRequest = store.count();
      const count = await new Promise<number>((resolve, reject) => {
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => reject(countRequest.error);
      });

      if (count === 0) {
        // Seed from config
        const prompts: DBStarterPrompt[] = STARTER_PROMPTS.map((p, index) => ({
          id: `starter-${index + 1}`,
          title: p.title,
          description: p.description,
          order: index,
        }));

        for (const prompt of prompts) {
          store.put(prompt);
        }
      }

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    },
  },
];

/**
 * Get the latest migration version
 */
export function getLatestVersion(): number {
  return Math.max(...migrations.map((m) => m.version), 0);
}

/**
 * Get migrations that need to be applied
 */
export function getMigrationsToApply(currentVersion: number): Migration[] {
  return migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);
}
