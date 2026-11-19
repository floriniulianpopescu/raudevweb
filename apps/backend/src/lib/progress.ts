import { COMPLETION_XP, type CompletableType, type CompletionResult, type Progress } from "@raudevweb/shared";
import { prisma } from "./prisma";

/**
 * "Done" ticks on problems and exercises (honor system). Ticking adds COMPLETION_XP to the
 * user's XP and remembers the amount on the completion row; unticking takes that amount back.
 * Each change runs in one transaction, and the completion row is unique per user+item, so
 * double clicks or two tabs can never award or remove XP twice.
 */

export class ItemNotFoundError extends Error {}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Per-type table access, so the logic below is written once. */
const tables = {
  problems: {
    exists: (tx: Tx, id: string) => tx.problem.count({ where: { id } }),
    insert: (tx: Tx, userId: string, id: string, xp: number) =>
      tx.problemCompletion.createMany({ data: [{ userId, problemId: id, xp }], skipDuplicates: true }),
    find: (tx: Tx, userId: string, id: string) =>
      tx.problemCompletion.findUnique({ where: { userId_problemId: { userId, problemId: id } } }),
    remove: (tx: Tx, userId: string, id: string) =>
      tx.problemCompletion.deleteMany({ where: { userId, problemId: id } }),
  },
  exercises: {
    exists: (tx: Tx, id: string) => tx.exercise.count({ where: { id } }),
    insert: (tx: Tx, userId: string, id: string, xp: number) =>
      tx.exerciseCompletion.createMany({ data: [{ userId, exerciseId: id, xp }], skipDuplicates: true }),
    find: (tx: Tx, userId: string, id: string) =>
      tx.exerciseCompletion.findUnique({ where: { userId_exerciseId: { userId, exerciseId: id } } }),
    remove: (tx: Tx, userId: string, id: string) =>
      tx.exerciseCompletion.deleteMany({ where: { userId, exerciseId: id } }),
  },
} satisfies Record<CompletableType, unknown>;

async function userXp(tx: Tx, userId: string) {
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { xp: true } });
  return user.xp;
}

/** Tick an item as done. Already done → nothing changes (xpChange 0). */
export function markDone(type: CompletableType, id: string, userId: string): Promise<CompletionResult> {
  const table = tables[type];
  return prisma.$transaction(async (tx) => {
    if (!(await table.exists(tx, id))) throw new ItemNotFoundError();
    const xp = COMPLETION_XP[type];
    const { count } = await table.insert(tx, userId, id, xp);
    if (count === 1) await tx.user.update({ where: { id: userId }, data: { xp: { increment: xp } } });
    return { done: true, xpChange: count === 1 ? xp : 0, xp: await userXp(tx, userId) };
  });
}

/** Untick an item. Not done → nothing changes. Takes back what the tick gave, never below 0 XP. */
export function markUndone(type: CompletableType, id: string, userId: string): Promise<CompletionResult> {
  const table = tables[type];
  return prisma.$transaction(async (tx) => {
    const row = await table.find(tx, userId, id);
    // deleteMany's count tells us whether *this* request removed it (a concurrent untick gets 0)
    const removed = row ? (await table.remove(tx, userId, id)).count === 1 : false;
    let xpChange = 0;
    if (row && removed) {
      const before = await userXp(tx, userId);
      xpChange = -Math.min(row.xp, before); // an admin may have deducted XP in the meantime
      await tx.$executeRaw`
        UPDATE "user" SET xp = GREATEST(0, xp - ${row.xp}), "updatedAt" = NOW() WHERE id = ${userId}
      `;
    }
    return { done: false, xpChange, xp: await userXp(tx, userId) };
  });
}

/** Everything the user has ticked, with the XP it earned, per type. */
export async function getProgress(userId: string): Promise<Progress> {
  const [problems, exercises] = await Promise.all([
    prisma.problemCompletion.findMany({ where: { userId }, select: { problemId: true, xp: true } }),
    prisma.exerciseCompletion.findMany({ where: { userId }, select: { exerciseId: true, xp: true } }),
  ]);
  const sum = (rows: { xp: number }[]) => rows.reduce((total, r) => total + r.xp, 0);
  return {
    problems: { ids: problems.map((r) => r.problemId), xp: sum(problems) },
    exercises: { ids: exercises.map((r) => r.exerciseId), xp: sum(exercises) },
  };
}
