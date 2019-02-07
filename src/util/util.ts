/**
 * Compares two strings case insensitive.
 * @param strA
 * @param strB
 */
import { Range } from "../types/range";
import { VisitContext } from "../virtual-document/visit-tagged-template-nodes";

export function caseInsensitiveCmp(strA: string, strB: string): boolean {
	return strA.match(new RegExp(`^${strB}$`, "i")) != null;
}

/**
 * Returns if a position is within start and end.
 * @param position
 * @param start
 * @param end
 */
export function intersects(position: number | Range, { start, end }: Range): boolean {
	if (typeof position === "number") {
		return start <= position && position <= end;
	} else {
		return start <= position.start && position.end <= end;
	}
}

/**
 * Flattens a nested array
 * @param items
 */
export function flatten<T>(items: T[][]): T[] {
	return items.reduce((acc, item) => [...acc, ...item], []);
}

export function rangeToTSSpan({ start, end }: Range): { start: number; length: number } {
	return { start, length: end - start };
}

export function tsSpanToRange({ start, length }: { start: number; length: number }): Range {
	return { start, end: start + length };
}

export type Newable<T> = { new (...args: any[]): T };

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Checks whether a leading comment includes a given search string.
 * @param text
 * @param context
 * @param pos
 * @param needle
 */
export function leadingCommentsIncludes(text: string, pos: number, needle: string, context: VisitContext): boolean {
	// Get the leading comments to the position.
	const leadingComments = context.store.ts.getLeadingCommentRanges(text, pos);

	// If any leading comments exists, we check whether the needle matches the context of the comment.
	if (leadingComments != null) {
		for (const comment of leadingComments) {
			const commentText = text.substring(comment.pos, comment.end);
			if (commentText.includes(needle)) {
				return true;
			}
		}
	}
	return false;
}
