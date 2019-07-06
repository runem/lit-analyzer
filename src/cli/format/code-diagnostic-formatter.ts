import chalk from "chalk";
import { SourceFile } from "typescript";
import { LitDiagnostic } from "../../analyze/types/lit-diagnostic";
import { AnalysisStats, DiagnosticFormatter } from "./diagnostic-formatter";
import { generalReport, markText, relativeFileName, translateRange } from "./util";

export class CodeDiagnosticFormatter implements DiagnosticFormatter {
	report(stats: AnalysisStats): string | undefined {
		return generalReport(stats);
	}

	diagnosticTextForFile(file: SourceFile, diagnostics: LitDiagnostic[]): string | undefined {
		if (diagnostics.length === 0) return undefined;

		const diagnosticText = diagnostics.map(diagnostic => diagnosticTextForFile(file, diagnostic)).join("\n");

		return `
${chalk.underline(`${relativeFileName(file.fileName)}`)}
${diagnosticText}`;
	}
}

function diagnosticTextForFile(file: SourceFile, diagnostic: LitDiagnostic) {
	const textSpan = translateRange(diagnostic.location);

	const MAX_LINE_WIDTH = 50;
	const MIN_MESSAGE_PADDING = 10;

	// Get line and character of start position
	const lineContext = file.getLineAndCharacterOfPosition(textSpan.start);

	// Get start and end position of the line
	let linePositionRange = {
		start: file.getPositionOfLineAndCharacter(lineContext.line, 0),
		end: file.getLineEndOfPosition(textSpan.start)
	};

	// Modify the line position range if the width of the line exceeds MAX_LINE_WIDTH
	if (linePositionRange.end - linePositionRange.start > MAX_LINE_WIDTH) {
		// Calculate even padding to both sides
		const padding = Math.max(MIN_MESSAGE_PADDING, Math.round((MAX_LINE_WIDTH - textSpan.length) / 2));

		// Calculate new start and end position without exceeding the line position range
		const start = Math.max(linePositionRange.start, textSpan.start - padding);
		const end = Math.min(linePositionRange.end, textSpan.start + textSpan.length + padding);

		linePositionRange = { start, end };
	}

	// Get the source file text on the position range
	const lineText = file.getFullText().substring(linePositionRange.start, linePositionRange.end);

	// Highlight the error in the text
	// The highlighting range is offsetted by subtracting the line start position
	const highlightingColorFunction = (str: string) => chalk.black(diagnostic.severity === "error" ? chalk.bgRedBright(str) : chalk.bgYellow(str));

	const markedLine = markText(
		lineText,
		{
			start: textSpan.start - linePositionRange.start,
			length: textSpan.length
		},
		highlightingColorFunction
	).replace(/^\s*/, " ");

	const block = [
		chalk.bold(diagnostic.message),
		`${chalk.gray(`${lineContext.line + 1}:`)} ${markedLine}`,
		diagnostic.source == null ? undefined : chalk.gray(`${diagnostic.source}`)
	]
		.filter(line => line != null)
		.map(line => `    ${line}`)
		.join("\n");

	return `\n${block}\n`;
}
