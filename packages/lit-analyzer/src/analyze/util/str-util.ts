/**
 * Compares two strings case insensitive.
 * @param strA
 * @param strB
 */
export function caseInsensitiveEquals(strA: string, strB: string): boolean {
	return strA.localeCompare(strB, undefined, { sensitivity: "accent" }) === 0;
}
