/**
 * Ouverture et migration de la base SQLite locale.
 */

import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME, LATEST_VERSION, MIGRATIONS } from './schema';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;
  if (current >= LATEST_VERSION) return;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      for (const statement of migration.statements) {
        await db.execAsync(statement);
      }
    });
  }
  // PRAGMA n'accepte pas de paramètre lié : la valeur vient d'une constante interne.
  await db.execAsync(`PRAGMA user_version = ${LATEST_VERSION};`);
}

/** Ouvre la base (une seule fois) et applique les migrations en attente. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await migrate(db);
      return db;
    })();
  }
  return databasePromise;
}

/** Ferme la base — utilisé par la remise à zéro depuis l'espace parent. */
export async function closeDatabase(): Promise<void> {
  if (!databasePromise) return;
  const db = await databasePromise;
  await db.closeAsync();
  databasePromise = null;
}
