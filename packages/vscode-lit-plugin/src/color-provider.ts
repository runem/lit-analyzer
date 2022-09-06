import * as vscode from "vscode";

/**
 * Regex to match colors in a string
 */
const COLOR_HEX_REGEX = /#[0-9a-fA-F]+/gi;

/**
 * Regex to match sections in a text where a color should be highlighted
 */
const COLOR_SECTION_REGEX = /(css|html)`([\s\S]*?)`/gi;

/**
 * Convert "rgba" to "hex"
 * @param red
 * @param green
 * @param blue
 * @param alpha
 */
function RGBAToHex({ red, green, blue, alpha }: { red: number; green: number; blue: number; alpha: number }): string {
	const r = red.toString(16).padStart(2, "0");
	const g = green.toString(16).padStart(2, "0");
	const b = blue.toString(16).padStart(2, "0");
	const a = alpha.toString(16).padStart(2, "0");

	return `#${r}${g}${b}${a === "ff" ? "" : a}`;
}

/**
 * Converts "hex" to "rgba"
 * @param hex
 */
function hexToRGBA(hex: string): { red: number; green: number; blue: number; alpha: number } | undefined {
	// Parses "#ffffff" and "#ffffffff"
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
	if (result != null) {
		return {
			red: parseInt(result[1], 16),
			green: parseInt(result[2], 16),
			blue: parseInt(result[3], 16),
			alpha: result[4] == null ? 255 : parseInt(result[4], 16)
		};
	}

	// Parses "#fff" and "#ffff"
	const shorthandResult = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i.exec(hex);
	if (shorthandResult != null) {
		return {
			red: parseInt(shorthandResult[1] + shorthandResult[1], 16),
			green: parseInt(shorthandResult[2] + shorthandResult[2], 16),
			blue: parseInt(shorthandResult[3] + shorthandResult[3], 16),
			alpha: shorthandResult[4] == null ? 255 : parseInt(shorthandResult[4] + shorthandResult[4], 16)
		};
	}

	return undefined;
}

/**
 * Converts a vscode color to a hex
 * @param vscodeColor
 */
function vscodeColorToHex(vscodeColor: vscode.Color): string {
	const { red, green, blue, alpha } = vscodeColor;

	return RGBAToHex({
		red: Math.floor(red * 255),
		green: Math.floor(green * 255),
		blue: Math.floor(blue * 255),
		alpha: Math.floor(alpha * 255)
	});
}

/**
 * Converts a hex to a vscode color
 * @param hex
 */
function hexToVscodeColor(hex: string): vscode.Color | undefined {
	const rgba = hexToRGBA(hex);
	if (rgba == null) return undefined;
	return new vscode.Color(rgba.red / 255, rgba.green / 255, rgba.blue / 255, rgba.alpha / 255);
}

/**
 * Matches a regex on a text and returns all positions where a match was found
 * @param regex
 * @param text
 * @param callback
 */
function getRegexMatches(regex: RegExp, text: string): { start: number; text: string }[] {
	// Find all hex colors in the document
	let match: RegExpExecArray | null = null;

	const matches: { start: number; text: string }[] = [];

	while ((match = regex.exec(text)) != null) {
		const start = match.index;
		matches.push({ start, text: match[0] });
	}

	return matches;
}

/**
 * Parses a document a returns color information where appropriate
 * @param document
 */
function findColorsInDocument(document: vscode.TextDocument): vscode.ColorInformation[] {
	const documentText = document.getText();

	const colors: vscode.ColorInformation[] = [];

	// Find all sections that can include colors
	const taggedLiteralMatches = getRegexMatches(COLOR_SECTION_REGEX, documentText);
	for (const { text: taggedTemplateText, start: taggedTemplateStart } of taggedLiteralMatches) {
		// Find all colors in those sections
		const colorMatches = getRegexMatches(COLOR_HEX_REGEX, taggedTemplateText);

		// Add a color information based on each color found
		for (const { text: hex, start: colorStart } of colorMatches) {
			const color = hexToVscodeColor(hex);
			if (color == null) continue;

			const documentOffset = taggedTemplateStart + colorStart;

			colors.push(
				new vscode.ColorInformation(new vscode.Range(document.positionAt(documentOffset), document.positionAt(documentOffset + hex.length)), color)
			);
		}
	}

	return colors;
}

/**
 * Exports a color provider that makes it possible to highlight colors within "css" and "html" tagged templates.
 */
export class ColorProvider implements vscode.DocumentColorProvider {
	provideDocumentColors(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.ColorInformation[]> {
		return findColorsInDocument(document);
	}

	provideColorPresentations(
		color: vscode.Color,
		context: { document: vscode.TextDocument; range: vscode.Range },
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.ColorPresentation[]> {
		return [new vscode.ColorPresentation(vscodeColorToHex(color))];
	}
}
