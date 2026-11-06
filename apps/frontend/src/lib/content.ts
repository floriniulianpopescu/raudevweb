import type { ContentType } from "@raudevweb/shared";

export type ContentConfig = {
	type: ContentType; // API endpoint segment
	label: string;
	route: string; // path under /home
	/** true → card opens item.href on another website; false → card opens /home/<route>/:id via <Link> */
	external: boolean;
};

export const CONTENT: Record<ContentType, ContentConfig> = {
	challenges: { type: "challenges", label: "Challenges", route: "challenges", external: false },
	problems: { type: "problems", label: "Problems", route: "problems", external: true },
	exercises: { type: "exercises", label: "Exercises", route: "exercises", external: true },
	quizzes: { type: "quizzes", label: "Quizzes", route: "quizzes", external: false },
	lessons: { type: "lessons", label: "Lessons", route: "lessons", external: false },
	extras: { type: "extras", label: "Extras", route: "extras", external: false },
};
