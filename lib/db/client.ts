/**
 * IndexedDB Client
 *
 * Handles database connection, migrations, and CRUD operations.
 */

import {
  DB_NAME,
  DB_VERSION,
  STORES,
  DBInterview,
  DBStarterPrompt,
  DBMigration,
} from "./types";
import { migrations, getLatestVersion } from "./migrations";

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open the database and run migrations
 */
export async function openDB(): Promise<IDBDatabase> {
  // Return existing instance if available
  if (dbInstance) {
    return dbInstance;
  }

  // Return pending promise if already opening
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };

    request.onsuccess = async () => {
      dbInstance = request.result;

      // Run data migrations after db is open
      try {
        await runDataMigrations(dbInstance);
        resolve(dbInstance);
      } catch (error) {
        reject(error);
      }
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const transaction = request.transaction!;
      const oldVersion = event.oldVersion;

      // Run schema migrations
      for (const migration of migrations) {
        if (migration.version > oldVersion && migration.schema) {
          migration.schema(db, transaction);
        }
      }
    };
  });

  return dbPromise;
}

/**
 * Run data migrations that haven't been applied yet
 */
async function runDataMigrations(db: IDBDatabase): Promise<void> {
  // Get applied migrations
  const appliedVersions = await getAppliedMigrations(db);
  const maxApplied = Math.max(...appliedVersions, 0);

  // Run pending data migrations
  for (const migration of migrations) {
    if (migration.version > maxApplied && migration.data) {
      await migration.data(db);
      await recordMigration(db, migration.version, migration.name);
    }
  }
}

/**
 * Get list of applied migration versions
 */
async function getAppliedMigrations(db: IDBDatabase): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.migrations, "readonly");
    const store = transaction.objectStore(STORES.migrations);
    const request = store.getAllKeys();

    request.onsuccess = () => resolve(request.result as number[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Record that a migration has been applied
 */
async function recordMigration(
  db: IDBDatabase,
  version: number,
  name: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.migrations, "readwrite");
    const store = transaction.objectStore(STORES.migrations);
    const migration: DBMigration = {
      version,
      name,
      appliedAt: new Date().toISOString(),
    };
    const request = store.put(migration);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============ Interview Operations ============

/**
 * Get all interviews, sorted by updatedAt descending
 */
export async function getAllInterviews(): Promise<DBInterview[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.interviews, "readonly");
    const store = transaction.objectStore(STORES.interviews);
    const request = store.getAll();

    request.onsuccess = () => {
      const interviews = request.result as DBInterview[];
      // Sort by updatedAt descending
      interviews.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      resolve(interviews);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single interview by ID
 */
export async function getInterview(id: string): Promise<DBInterview | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.interviews, "readonly");
    const store = transaction.objectStore(STORES.interviews);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Create a new interview
 */
export async function createInterview(
  interview: Omit<DBInterview, "createdAt" | "updatedAt">
): Promise<DBInterview> {
  const db = await openDB();
  const now = new Date().toISOString();
  const fullInterview: DBInterview = {
    ...interview,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.interviews, "readwrite");
    const store = transaction.objectStore(STORES.interviews);
    const request = store.put(fullInterview);

    request.onsuccess = () => resolve(fullInterview);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update an existing interview
 */
export async function updateInterview(
  id: string,
  updates: Partial<Omit<DBInterview, "id" | "createdAt">>
): Promise<DBInterview | null> {
  const db = await openDB();
  const existing = await getInterview(id);

  if (!existing) {
    return null;
  }

  const updated: DBInterview = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.interviews, "readwrite");
    const store = transaction.objectStore(STORES.interviews);
    const request = store.put(updated);

    request.onsuccess = () => resolve(updated);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an interview
 */
export async function deleteInterview(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.interviews, "readwrite");
    const store = transaction.objectStore(STORES.interviews);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============ Starter Prompts Operations ============

/**
 * Get all starter prompts, sorted by order
 */
export async function getStarterPrompts(): Promise<DBStarterPrompt[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.starterPrompts, "readonly");
    const store = transaction.objectStore(STORES.starterPrompts);
    const index = store.index("order");
    const request = index.getAll();

    request.onsuccess = () => resolve(request.result as DBStarterPrompt[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update a starter prompt
 */
export async function updateStarterPrompt(
  id: string,
  updates: Partial<Omit<DBStarterPrompt, "id">>
): Promise<DBStarterPrompt | null> {
  const db = await openDB();

  // Get existing
  const existing = await new Promise<DBStarterPrompt | null>(
    (resolve, reject) => {
      const transaction = db.transaction(STORES.starterPrompts, "readonly");
      const store = transaction.objectStore(STORES.starterPrompts);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    }
  );

  if (!existing) {
    return null;
  }

  const updated: DBStarterPrompt = { ...existing, ...updates };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.starterPrompts, "readwrite");
    const store = transaction.objectStore(STORES.starterPrompts);
    const request = store.put(updated);

    request.onsuccess = () => resolve(updated);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add a new starter prompt
 */
export async function addStarterPrompt(
  prompt: Omit<DBStarterPrompt, "id">
): Promise<DBStarterPrompt> {
  const db = await openDB();
  const id = `starter-${Date.now()}`;
  const fullPrompt: DBStarterPrompt = { ...prompt, id };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.starterPrompts, "readwrite");
    const store = transaction.objectStore(STORES.starterPrompts);
    const request = store.put(fullPrompt);

    request.onsuccess = () => resolve(fullPrompt);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a starter prompt
 */
export async function deleteStarterPrompt(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.starterPrompts, "readwrite");
    const store = transaction.objectStore(STORES.starterPrompts);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
