import didYouMean from "didyoumean2";

/**
 * Finds the best match between a string and elements in a list.
 * @param find
 * @param elements
 * @param options
 */
export function findBestMatch(find: string, elements: string[], options: { threshold: number } = { threshold: 0.5 }) {
	const matches = didYouMean(find, elements, options);
	return typeof matches === "string" ? matches : Array.isArray(matches) ? matches[0] : undefined;
}
