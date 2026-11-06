import type {
  ChallengeInput,
  ContentType,
  LinkContentInput,
  QuizInput,
  QuizSubmission,
  ResourceInput,
} from "@raudevweb/shared";
import { prisma } from "./prisma";

/**
 * Data access for every content type. `admin: true` returns the full data
 * needed by the admin editors (e.g. quiz correct answers).
 */

const linkSelect = { id: true, title: true, description: true, href: true } as const;
const byPosition = { orderBy: { position: "asc" } } as const;

const challengeInclude = {
  problems: { select: linkSelect, orderBy: { title: "asc" } },
  exercises: { select: linkSelect, orderBy: { title: "asc" } },
} as const;

const resourceInclude = {
  links: { select: linkSelect, ...byPosition },
} as const;

const quizInclude = (admin: boolean) =>
  ({
    questions: {
      select: { id: true, question: true, answers: true, correctIndex: admin },
      ...byPosition,
    },
  }) as const;

const newest = { orderBy: { createdAt: "desc" } } as const;

const kindOf = (type: "lessons" | "extras") => (type === "lessons" ? "lesson" : "extra");

// --- read ------------------------------------------------------------------

export async function listContent(type: ContentType, admin = false, limit?: number) {
  const newest = { orderBy: { createdAt: "desc" }, take: limit } as const;
  switch (type) {
    case "problems":
      return prisma.problem.findMany({ select: linkSelect, ...newest });
    case "exercises":
      return prisma.exercise.findMany({ select: linkSelect, ...newest });
    case "challenges":
      return admin
        ? prisma.challenge.findMany({ include: challengeInclude, ...newest })
        : prisma.challenge.findMany({ select: { id: true, title: true, description: true }, ...newest });
    case "quizzes":
      return admin
        ? prisma.quiz.findMany({ include: quizInclude(true), ...newest })
        : prisma.quiz.findMany({ select: { id: true, title: true, description: true }, ...newest });
    case "lessons":
    case "extras":
      return admin
        ? prisma.resource.findMany({ where: { kind: kindOf(type) }, include: resourceInclude, ...newest })
        : prisma.resource.findMany({
            where: { kind: kindOf(type) },
            select: { id: true, title: true, description: true },
            ...newest,
          });
  }
}

export async function getContent(type: ContentType, id: string, admin = false) {
  switch (type) {
    case "problems":
      return prisma.problem.findUnique({ where: { id }, select: linkSelect });
    case "exercises":
      return prisma.exercise.findUnique({ where: { id }, select: linkSelect });
    case "challenges":
      return prisma.challenge.findUnique({ where: { id }, include: challengeInclude });
    case "quizzes":
      return prisma.quiz.findUnique({ where: { id }, include: quizInclude(admin) });
    case "lessons":
    case "extras":
      return prisma.resource.findFirst({ where: { id, kind: kindOf(type) }, include: resourceInclude });
  }
}

// --- write (data is already validated with ContentSchemas[type]) ------------

export async function createContent(type: ContentType, data: unknown) {
  switch (type) {
    case "problems":
      return prisma.problem.create({ data: data as LinkContentInput, select: linkSelect });
    case "exercises":
      return prisma.exercise.create({ data: data as LinkContentInput, select: linkSelect });
    case "challenges": {
      const { problemIds, exerciseIds, ...rest } = data as ChallengeInput;
      return prisma.challenge.create({
        data: {
          ...rest,
          problems: { connect: problemIds.map((id) => ({ id })) },
          exercises: { connect: exerciseIds.map((id) => ({ id })) },
        },
        include: challengeInclude,
      });
    }
    case "quizzes": {
      const { questions, ...rest } = data as QuizInput;
      return prisma.quiz.create({
        data: { ...rest, questions: { create: questions.map((q, position) => ({ ...q, position })) } },
        include: quizInclude(true),
      });
    }
    case "lessons":
    case "extras": {
      const { links, ...rest } = data as ResourceInput;
      return prisma.resource.create({
        data: {
          ...rest,
          kind: kindOf(type),
          links: { create: links.map((l, position) => ({ ...l, position })) },
        },
        include: resourceInclude,
      });
    }
  }
}

/** Full replace of an item (the admin form always sends the whole object). */
export async function updateContent(type: ContentType, id: string, data: unknown) {
  switch (type) {
    case "problems":
      return prisma.problem.update({ where: { id }, data: data as LinkContentInput, select: linkSelect });
    case "exercises":
      return prisma.exercise.update({ where: { id }, data: data as LinkContentInput, select: linkSelect });
    case "challenges": {
      const { problemIds, exerciseIds, ...rest } = data as ChallengeInput;
      return prisma.challenge.update({
        where: { id },
        data: {
          ...rest,
          problems: { set: problemIds.map((id) => ({ id })) },
          exercises: { set: exerciseIds.map((id) => ({ id })) },
        },
        include: challengeInclude,
      });
    }
    case "quizzes": {
      const { questions, ...rest } = data as QuizInput;
      return prisma.quiz.update({
        where: { id },
        data: {
          ...rest,
          questions: {
            deleteMany: {},
            create: questions.map((q, position) => ({ ...q, position })),
          },
        },
        include: quizInclude(true),
      });
    }
    case "lessons":
    case "extras": {
      const { links, ...rest } = data as ResourceInput;
      // Make sure the id belongs to the right kind before touching it
      await prisma.resource.findFirstOrThrow({ where: { id, kind: kindOf(type) } });
      return prisma.resource.update({
        where: { id },
        data: {
          ...rest,
          links: { deleteMany: {}, create: links.map((l, position) => ({ ...l, position })) },
        },
        include: resourceInclude,
      });
    }
  }
}

export async function deleteContent(type: ContentType, id: string) {
  switch (type) {
    case "problems":
      return prisma.problem.delete({ where: { id } });
    case "exercises":
      return prisma.exercise.delete({ where: { id } });
    case "challenges":
      return prisma.challenge.delete({ where: { id } });
    case "quizzes":
      return prisma.quiz.delete({ where: { id } });
    case "lessons":
    case "extras": {
      const { count } = await prisma.resource.deleteMany({ where: { id, kind: kindOf(type) } });
      if (count === 0) throw new NotFoundError();
      return;
    }
  }
}

/** Delete many items of one type. Questions, links and join rows cascade in the DB. */
export async function deleteManyContent(type: ContentType, ids: string[]) {
  const where = { id: { in: ids } };
  switch (type) {
    case "problems":
      return prisma.problem.deleteMany({ where });
    case "exercises":
      return prisma.exercise.deleteMany({ where });
    case "challenges":
      return prisma.challenge.deleteMany({ where });
    case "quizzes":
      return prisma.quiz.deleteMany({ where });
    case "lessons":
    case "extras":
      return prisma.resource.deleteMany({ where: { ...where, kind: kindOf(type) } });
  }
}

// --- quiz grading ------------------------------------------------------------

export async function gradeQuiz(id: string, { answers }: QuizSubmission) {
  const questions = await prisma.quizQuestion.findMany({
    where: { quizId: id },
    select: { correctIndex: true },
    ...byPosition,
  });
  if (questions.length === 0) return null;

  const correct = questions.map((q) => q.correctIndex);
  const score = correct.filter((c, i) => answers[i] === c).length;
  return { score, total: correct.length, correct };
}

export class NotFoundError extends Error {}
