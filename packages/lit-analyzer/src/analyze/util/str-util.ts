/**
 * Compares two strings case insensitive.
 * @param strA
 * @param strB
 */
export function caseInsensitiveEquals(strA: string, strB: string): boolean {
	return strA.localeCompare(strB, undefined, { sensitivity: "accent" }) === 0;
}

export function replacePrefix(str: string, prefix: string): string {
	return str.replace(new RegExp("^" + escapeRegExp(prefix)), "");
}

function escapeRegExp(text: string): string {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
