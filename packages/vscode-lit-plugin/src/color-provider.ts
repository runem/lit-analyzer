import * as vscode from "vscode";

const COLOR_HEX_REGEX = /#(?:[0-9a-fA-F]{3}){1,2}/gi;

const COLOR_SECTION_REGEX = /(css|html)`([\s\S]*?)`/gi;

function RGBAToHex(red: number, green: number, blue: number, alpha: number): string {
	let r = red.toString(16);
	let g = green.toString(16);
	let b = blue.toString(16);
	let a = alpha.toString(16);

	if (r.length === 1) {
		r = "0" + r;
	}
	if (g.length === 1) {
		g = "0" + g;
	}
	if (b.length === 1) {
		b = "0" + b;
	}
	if (a.length === 1) {
		a = "0" + a;
	}

	return `#${r}${g}${b}${a === "ff" ? "" : a}`;
}

function hexToRGBA(hex: string): { r: number; g: number; b: number; a: number } | undefined {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);

	if (result != null) {
		return {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16),
			a: result[4] == null ? 255 : parseInt(result[4], 16)
		};
	}

	const shorthandResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
	if (shorthandResult != null) {
		return {
			r: parseInt(shorthandResult[1] + shorthandResult[1], 16),
			g: parseInt(shorthandResult[2] + shorthandResult[2], 16),
			b: parseInt(shorthandResult[3] + shorthandResult[3], 16),
			a: 255
		};
	}

	return undefined;
}

function vscodeColorToHex(vscodeColor: vscode.Color): string {
	const { red, green, blue, alpha } = vscodeColor;
	return RGBAToHex(Math.floor(red * 255), Math.floor(green * 255), Math.floor(blue * 255), Math.floor(alpha * 255));
}

function hexToVscodeColor(hex: string): vscode.Color | undefined {
	const rgba = hexToRGBA(hex);
	if (rgba == null) return undefined;
	return new vscode.Color(rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a / 255);
}

/**
 *
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

function findColorsInDocument(document: vscode.TextDocument): vscode.ColorInformation[] {
	const documentText = document.getText();

	const colors: vscode.ColorInformation[] = [];

	// Find all hex colors in the document
	const taggedLiteralMatches = getRegexMatches(COLOR_SECTION_REGEX, documentText);
	for (const { text: taggedTemplateText, start: taggedTemplateStart } of taggedLiteralMatches) {
		const colorMatches = getRegexMatches(COLOR_HEX_REGEX, taggedTemplateText);

		for (const { text: hex, start: colorStart } of colorMatches) {
			const color = hexToVscodeColor(hex);
			if (color == null) continue;

			const documentOffset = taggedTemplateStart + colorStart;

			colors.push(
				new vscode.ColorInformation(new vscode.Range(document.positionAt(documentOffset), document.positionAt(documentOffset + hex.length)), color)
			);
		}
	}

	// Find all built in colors in the document
	/*while ((match = BUILT_IN_COLOR_REGEX.exec(text)) != null) {
	 const start = match.index;
	 const colorName = match[0].toLowerCase();
	 const hex = BUILT_IN_COLOR_MAP.get(colorName);
	 if (hex == null) continue;

	 const color = hexToVscodeColor(hex);
	 if (color == null) continue;

	 colors.push(new vscode.ColorInformation(new vscode.Range(document.positionAt(start), document.positionAt(start + hex.length)), color));
	 }*/

	return colors;
}

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
