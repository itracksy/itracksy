import db from "../db";
import { localStorage } from "../db/schema";
import { eq } from "drizzle-orm";

export const getValue = async (key: string): Promise<string | null> => {
  const result = await db.select().from(localStorage).where(eq(localStorage.key, key));
  return result[0]?.value ?? null;
};

export const setValue = async (key: string, value: string): Promise<void> => {
  await db
    .insert(localStorage)
    .values({
      key,
      value,
      updatedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: localStorage.key,
      set: {
        value,
        updatedAt: Date.now(),
      },
    });
};

export const deleteValue = async (key: string): Promise<void> => {
  await db.delete(localStorage).where(eq(localStorage.key, key));
};

export const getAllValues = async (): Promise<Record<string, string>> => {
  const results = await db.select().from(localStorage);
  const init: Record<string, string> = {};
  return results.reduce((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, init);
};

export const setMultipleValues = async (values: Record<string, string>): Promise<void> => {
  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(values)) {
      await tx
        .insert(localStorage)
        .values({
          key,
          value,
          updatedAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: localStorage.key,
          set: {
            value,
            updatedAt: Date.now(),
          },
        });
    }
  });
};
