import * as vscode from "vscode";
import { HSLA, RGBA } from "./color.js";

/**
 * Regex to match colors in a string
 */
//const COLOR_HEX_REGEX = /#[0-9a-fA-F]+/gi;

/**
 * Regex to match sections in a text where a color should be highlighted
 */
const COLOR_SECTION_REGEX = /(css|html)`([\s\S]*?)`/gi;

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

function _parseCaptureGroups(captureGroups: IterableIterator<string>) {
	const values = [];
	for (const captureGroup of captureGroups) {
		const parsedNumber = Number(captureGroup);
		if (parsedNumber || (parsedNumber === 0 && captureGroup.replace(/\s/g, "") !== "")) {
			values.push(parsedNumber);
		}
	}
	return values;
}

/**
 * Takes a provided `range` and `hexValue`, performs some checks, and provides a `vscode.ColorInformation`
 * @param range This is passed onto the `vscode.ColorInformation` and isn't used for parsing
 * @param hexValue A hex formatted color (ex: `#ffffff`)
 * @returns
 */
function _findHexColorInformation(range: vscode.Range | undefined, hexValue: string): vscode.ColorInformation | undefined {
	if (!range) {
		return;
	}
	const parsedHexColor = RGBA.fromHex(hexValue);
	if (!parsedHexColor) {
		return;
	}
	return {
		range: range,
		color: parsedHexColor.toVSCodeColor()
	};
}

/**
 * Takes a provided `range` and `matches`, performs some checks, and provides a `vscode.ColorInformation`
 * @param range This is passed onto the `vscode.ColorInformation` and isn't used for parsing
 * @param matches The parameters in a CSS formatted rgb(...) or rgba(...) notation (ex: `(255,255,255)`, `(255,255,255,0.5)`)
 * @param isAlpha Indicates wether or not the 4th parameter for alpha is expected to be supplied
 * @returns
 */
function _findRGBColorInformation(
	range: vscode.Range | undefined,
	matches: RegExpMatchArray[],
	isAlpha: boolean
): vscode.ColorInformation | undefined {
	if (!range || matches.length !== 1) {
		return;
	}
	const match = matches[0]!;
	const captureGroups = match.values();
	const parsedRegex = _parseCaptureGroups(captureGroups);
	const color = new RGBA(parsedRegex[0], parsedRegex[1], parsedRegex[2], isAlpha ? parsedRegex[3] : 1);
	return {
		range: range,
		color: color.toVSCodeColor()
	};
}

/**
 * Takes a provided `range` and `matches`, performs some checks, and provides a `vscode.ColorInformation`
 * @param range This is passed onto the `vscode.ColorInformation` and isn't used for parsing
 * @param matches The parameters in a CSS formatted hsl(...) or hsla(...) notation (ex: `(360,50%,50%)`, `(360,50%,50%,0.5)`)
 * @param isAlpha Indicates wether or not the 4th parameter for alpha is expected to be supplied
 * @returns
 */
function _findHSLColorInformation(
	range: vscode.Range | undefined,
	matches: RegExpMatchArray[],
	isAlpha: boolean
): vscode.ColorInformation | undefined {
	if (!range || matches.length !== 1) {
		return;
	}
	const match = matches[0]!;
	const captureGroups = match.values();
	const parsedRegex = _parseCaptureGroups(captureGroups);
	const color = new HSLA(parsedRegex[0], parsedRegex[1] / 100, parsedRegex[2] / 100, isAlpha ? parsedRegex[3] : 1);
	return {
		range: range,
		color: color.toRGBA().toVSCodeColor()
	};
}

/**
 * Creates a `vscode.Range` for the `match` in the `document`.
 * @param document Necessary to convert a 1-dimensional index into a 2-dimensional line/column
 * @param documentOffset Necessary to preserve the sub-section being searched (between the css`` template strings)
 * @param match The match found
 * @returns
 */
function _findRange(document: vscode.TextDocument, documentOffset: number, match: RegExpMatchArray): vscode.Range | undefined {
	const index = match.index;
	const length = match[0].length;
	if (!index) {
		return;
	}
	const startPosition = document.positionAt(documentOffset + index);
	const endPosition = document.positionAt(documentOffset + index + length);
	return new vscode.Range(startPosition, endPosition);
}

/**
 * Short-hand of `String.prototype.matchAll(RegExp)`
 * @param text
 * @param regex
 * @returns
 */
function _findMatches(text: string, regex: RegExp): RegExpMatchArray[] {
	return [...text.matchAll(regex)];
}

/**
 * Parses a document a returns color information where appropriate.
 * Various notations of CSS colors are parsed based on:
 * https://github.com/microsoft/vscode/blob/7ead2078eb2a097119e66bd8272155bcc1580667/src/vs/editor/common/languages/defaultDocumentColorsComputer.ts#L101-L138
 * @param document
 */
function findColorsInDocument(document: vscode.TextDocument): vscode.ColorInformation[] {
	const documentText = document.getText();

	const result: vscode.ColorInformation[] = [];

	// Find all sections that can include colors
	const taggedLiteralMatches = getRegexMatches(COLOR_SECTION_REGEX, documentText);
	for (const { text: taggedTemplateText, start: taggedTemplateStart } of taggedLiteralMatches) {
		// Early validation for RGB and HSL
		//const initialValidationRegex = /\b(rgb|rgba|hsl|hsla)(\([0-9\s,.\%]*\))|(#)([A-Fa-f0-9]{3})\b|(#)([A-Fa-f0-9]{4})\b|(#)([A-Fa-f0-9]{6})\b|(#)([A-Fa-f0-9]{8})\b/gm;
		const initialValidationRegex =
			/\b(rgb|rgba|hsl|hsla)(\([0-9\s,.%]*\))|(#)([A-Fa-f0-9]{3})\b|(#)([A-Fa-f0-9]{4})\b|(#)([A-Fa-f0-9]{6})\b|(#)([A-Fa-f0-9]{8})\b/gm;
		const initialValidationMatches = _findMatches(taggedTemplateText, initialValidationRegex);

		// Potential colors have been found, validate the parameters
		if (initialValidationMatches.length > 0) {
			for (const initialMatch of initialValidationMatches) {
				const initialCaptureGroups = initialMatch.filter(captureGroup => captureGroup !== undefined);
				// Refers to the CSS notation to declare the color's format (ex: `#`, `rgb`, `hsl`, etc)
				const colorScheme = initialCaptureGroups[1];
				// Refers to the CSS notation that declares the parameters of the color's format (ex: `ffffff`, `(255,255,255)`, etc)
				const colorParameters = initialCaptureGroups[2];
				if (!colorParameters) {
					continue;
				}
				// Attempts to parse the CSS color based on notation
				let colorInformation: vscode.ColorInformation | undefined;
				if (colorScheme === "rgb") {
					const regexParameters =
						/^\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*\)$/gm;
					colorInformation = _findRGBColorInformation(
						_findRange(document, taggedTemplateStart, initialMatch),
						_findMatches(colorParameters, regexParameters),
						false
					);
				} else if (colorScheme === "rgba") {
					const regexParameters =
						/^\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(0[.][0-9]+|[.][0-9]+|[01][.]0*|[01])\s*\)$/gm;
					colorInformation = _findRGBColorInformation(
						_findRange(document, taggedTemplateStart, initialMatch),
						_findMatches(colorParameters, regexParameters),
						true
					);
				} else if (colorScheme === "hsl") {
					const regexParameters =
						/^\(\s*(36[0]|3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])(deg)*\s*,\s*(100|100[.]0*|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(100|100[.]0*|\d{1,2}[.]\d*|\d{1,2})%\s*\)$/gm;
					colorInformation = _findHSLColorInformation(
						_findRange(document, taggedTemplateStart, initialMatch),
						_findMatches(colorParameters, regexParameters),
						false
					);
				} else if (colorScheme === "hsla") {
					const regexParameters =
						/^\(\s*(36[0]|3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])(deg)*\s*,\s*(100|100[.]0*|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(100|100[.]0*|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(0[.][0-9]+|[.][0-9]+|[01][.]0*|[01])\s*\)$/gm;
					colorInformation = _findHSLColorInformation(
						_findRange(document, taggedTemplateStart, initialMatch),
						_findMatches(colorParameters, regexParameters),
						true
					);
				} else if (colorScheme === "#") {
					colorInformation = _findHexColorInformation(_findRange(document, taggedTemplateStart, initialMatch), colorScheme + colorParameters);
				}
				// If a color was parsed successfully, include it in our result
				if (colorInformation) {
					result.push(colorInformation);
				}
			}
		}
	}

	return result;
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
		// Provide hex, rgba(), and hsla() representations
		const hex = RGBA.fromVSCodeColor(color).formatHex();
		const rgba = RGBA.fromVSCodeColor(color).formatCSS();
		const hsla = HSLA.fromRGBA(RGBA.fromVSCodeColor(color)).formatCSS();
		return [hex, rgba, hsla].map(s => new vscode.ColorPresentation(s));
	}
}
