import { z } from "zod";

export const HealthCheckResponseSchema = z.object({
  status: z.enum(["ok", "error"]),
  timestamp: z.string(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

export const SignUpInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type SignUpInput = z.infer<typeof SignUpInputSchema>;

export const SignInInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof SignInInputSchema>;

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const UpdateProfileInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long")
      .max(100, "Name must not exceed 100 characters")
      .optional(),
    image: z.string().url("Image must be a valid URL").optional(),
  })
  .refine((data) => data.name !== undefined || data.image !== undefined, {
    message: "Provide at least one field to update",
  })

export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

// ---------------------------------------------------------------------------
// Content (practice + resources)
// ---------------------------------------------------------------------------

export const CONTENT_TYPES = [
  "challenges",
  "problems",
  "exercises",
  "quizzes",
  "lessons",
  "extras",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const QUIZ_QUESTION_COUNT = 5;
export const QUIZ_ANSWER_COUNT = 4;

const title = z.string().trim().min(1, "Title is required").max(200);
const description = z.string().trim().max(5000).default("");
const id = z.string().min(1);
/** Links on these items always point to another website. */
const externalUrl = z
  .string()
  .trim()
  .url("Link must be a full URL")
  .refine((v) => /^https?:\/\//.test(v), { message: "Link must start with http:// or https://" });

/** Problems & exercises: { title, description, href } — open an external website. */
export const LinkContentSchema = z.object({ title, description, href: externalUrl });

/** Challenges: { title, description, problemIds, exerciseIds } — groups problems/exercises. */
export const ChallengeSchema = z
  .object({
    title,
    description,
    problemIds: z.array(id).default([]),
    exerciseIds: z.array(id).default([]),
  })
  .refine((c) => c.problemIds.length + c.exerciseIds.length > 0, {
    message: "A challenge needs at least one problem or exercise",
    path: ["problemIds"],
  });

/** One question: exactly 4 answers, exactly one correct (by index). */
export const QuizQuestionSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(1000),
  answers: z
    .array(z.string().trim().min(1, "Answer can't be empty").max(500))
    .length(QUIZ_ANSWER_COUNT, `Each question needs exactly ${QUIZ_ANSWER_COUNT} answers`),
  correctIndex: z.number().int().min(0).max(QUIZ_ANSWER_COUNT - 1),
});

/** Quizzes: { title, description, questions[5] }. */
export const QuizSchema = z.object({
  title,
  description,
  questions: z
    .array(QuizQuestionSchema)
    .length(QUIZ_QUESTION_COUNT, `A quiz needs exactly ${QUIZ_QUESTION_COUNT} questions`),
});

/** Player's answers: one chosen index per question, in order. */
export const QuizSubmissionSchema = z.object({
  answers: z
    .array(z.number().int().min(0).max(QUIZ_ANSWER_COUNT - 1))
    .length(QUIZ_QUESTION_COUNT),
});

/** A bibliography entry for lessons/extras. */
export const ResourceLinkSchema = z.object({
  title,
  description: z.string().trim().max(500).default(""),
  href: externalUrl,
});

/** Lessons & extras: { title, description, links[] } — a minimal bibliography. */
export const ResourceSchema = z.object({
  title,
  description,
  links: z.array(ResourceLinkSchema).min(1, "Add at least one link").max(50),
});

export const ContentSchemas = {
  challenges: ChallengeSchema,
  problems: LinkContentSchema,
  exercises: LinkContentSchema,
  quizzes: QuizSchema,
  lessons: ResourceSchema,
  extras: ResourceSchema,
} satisfies Record<ContentType, z.ZodTypeAny>;

export type LinkContentInput = z.infer<typeof LinkContentSchema>;
export type ChallengeInput = z.infer<typeof ChallengeSchema>;
export type QuizQuestionInput = z.infer<typeof QuizQuestionSchema>;
export type QuizInput = z.infer<typeof QuizSchema>;
export type QuizSubmission = z.infer<typeof QuizSubmissionSchema>;
export type ResourceLinkInput = z.infer<typeof ResourceLinkSchema>;
export type ResourceInput = z.infer<typeof ResourceSchema>;

// --- API response shapes ---------------------------------------------------

export type LinkItem = { id: string; title: string; description: string; href: string };

export type ChallengeItem = {
  id: string;
  title: string;
  description: string;
  problems: LinkItem[];
  exercises: LinkItem[];
};

/** Public question: no correctIndex (answers are checked server-side). */
export type QuizQuestionPublic = { id: string; question: string; answers: string[] };
export type QuizQuestionAdmin = QuizQuestionPublic & { correctIndex: number };

export type QuizItem = {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestionPublic[];
};
export type QuizItemAdmin = Omit<QuizItem, "questions"> & { questions: QuizQuestionAdmin[] };

export type QuizResult = {
  score: number;
  total: number;
  /** Correct answer index for each question, revealed after submitting. */
  correct: number[];
};

export type ResourceItem = {
  id: string;
  title: string;
  description: string;
  links: LinkItem[];
};

/** Minimal shape every content list item has (for cards). */
export type ContentSummary = { id: string; title: string; description: string; href?: string };

// ---------------------------------------------------------------------------
// XP
// ---------------------------------------------------------------------------

export const XP_ADJUST_LIMIT = 100_000;

/** Admin adds (positive) or deducts (negative) XP. Totals never go below 0. */
export const XpAdjustmentSchema = z.object({
  delta: z
    .number()
    .int("XP must be a whole number")
    .min(-XP_ADJUST_LIMIT)
    .max(XP_ADJUST_LIMIT)
    .refine((n) => n !== 0, { message: "Amount can't be 0" }),
});

export type XpAdjustment = z.infer<typeof XpAdjustmentSchema>;

export type UserXp = { id: string; name: string; email: string; role: string | null; xp: number };

// ---------------------------------------------------------------------------
// Leaderboard (readable by any signed-in user — never includes emails)
// ---------------------------------------------------------------------------

export const LEADERBOARD_DEFAULT_LIMIT = 50;
export const LEADERBOARD_MAX_LIMIT = 100;

export type LeaderboardEntry = {
  /** Competition ranking: ties share a rank (1, 2, 2, 4). */
  rank: number;
  id: string;
  name: string;
  image: string | null;
  xp: number;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  /** The signed-in user's own position, even if outside the top list. */
  me: LeaderboardEntry | null;
  totalUsers: number;
};

// ---------------------------------------------------------------------------
// Bulk admin actions
// ---------------------------------------------------------------------------

export const BULK_MAX = 500;

const bulkIds = z
  .array(z.string().min(1))
  .min(1, "Select at least one item")
  .max(BULK_MAX, `At most ${BULK_MAX} items at once`);

/** POST /api/admin/:type/bulk-delete */
export const BulkDeleteSchema = z.object({ ids: bulkIds });
export type BulkDelete = z.infer<typeof BulkDeleteSchema>;

/** POST /api/admin/users/xp — same delta for every selected user */
export const BulkXpAdjustmentSchema = XpAdjustmentSchema.extend({ ids: bulkIds });
export type BulkXpAdjustment = z.infer<typeof BulkXpAdjustmentSchema>;

export type BulkResult = { count: number };

// ---------------------------------------------------------------------------
// Physical session schedule (shown on /home, edited by admins)
// ---------------------------------------------------------------------------

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)");

export const SessionScheduleSchema = z
  .object({
    /** Name of this week's lesson; empty → shown as "Physical session" */
    title: z.string().trim().max(200).default(""),
    /** 0 = Sunday … 6 = Saturday (same as JS Date.getDay) */
    weekday: z.number().int().min(0).max(6),
    startTime: time,
    endTime: time,
    location: z.string().trim().max(200).default(""),
    note: z.string().trim().max(500).default(""),
    /** First day of the semester (YYYY-MM-DD); week 1 is the week containing it. Null → calendar week. */
    semesterStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .nullable()
      .default(null),
    /** Hide the session for the current week (e.g. holiday) */
    cancelled: z.boolean().default(false),
  })
  .refine((s) => s.endTime > s.startTime, { message: "End time must be after start time", path: ["endTime"] });

export type SessionScheduleInput = z.infer<typeof SessionScheduleSchema>;
export type SessionSchedule = SessionScheduleInput & { updatedAt: string };
