/** Lowercase + strip accents, so "lectie" matches "Lecție". */
export function normalize(text: string) {
	return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Case- and accent-insensitive search. Every word of the query must appear in
 * at least one of the given fields (so "array sort" finds "Sort an array").
 */
export function matchesSearch(query: string, ...fields: (string | null | undefined)[]) {
	const words = normalize(query).split(/\s+/).filter(Boolean);
	if (words.length === 0) return true;
	const haystack = normalize(fields.filter(Boolean).join(" "));
	return words.every((w) => haystack.includes(w));
}
