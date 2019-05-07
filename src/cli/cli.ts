import chalk from "chalk";
import { Program, SourceFile, TextSpan } from "typescript";
import { DefaultLitAnalyzerContext } from "../analyze/default-lit-analyzer-context";
import { LitAnalyzer } from "../analyze/lit-analyzer";
import { makeConfig } from "../analyze/lit-analyzer-config";
import { DocumentRange } from "../analyze/types/lit-range";
import { analyzeGlobs } from "./analyze-globs";
import { readTsLitPluginConfig } from "./compile";
import { LitAnalyzerCliConfig } from "./lit-analyzer-cli-config";
import { parseCliArguments } from "./parse-cli-arguments";

/**
 * The main function of the cli.
 */
export async function cli() {
	const args = parseCliArguments(process.argv.slice(2));
	const glob = args._[0];

	if (args.help) {
		console.log(`Print help`);
	} else if (glob == null) {
		console.log(`Missing glob`);
	} else {
		console.log(`Running`);
	}

	let program: Program | undefined = undefined;
	const context = new DefaultLitAnalyzerContext({
		getProgram() {
			return program!;
		}
	});

	context.updateConfig(readTsLitPluginConfig() || makeConfig());

	const analyzer = new LitAnalyzer(context);

	await analyzeGlobs(glob == null ? [] : [glob], args as LitAnalyzerCliConfig, {
		analyzeSourceFile(file: SourceFile, options: { program: Program }): void {
			console.log(`Analyzing file: ${file.fileName}`);
			program = options.program;
			const result = analyzer.getDiagnosticsInFile(file);
			result.map(r => {
				const textSpan = translateRange(r.location);
				const text = generateSourceFileErrorText(file, textSpan, r.message);
				console.log(text);
			});
		}
	});
}

export function translateRange(range: DocumentRange): TextSpan {
	if (range.document != null) {
		return {
			start: range.document.virtualDocument.offsetToSCPosition(range.start),
			length: range.end - range.start
		};
	}

	return {
		start: range.start,
		length: range.end - range.start
	};
}

export function generateSourceFileErrorText(file: SourceFile, textSpan: TextSpan, message: string) {
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
	const lineText = file.getText().substring(linePositionRange.start, linePositionRange.end);

	// Highlight the error in the text
	// The highlighting range is offsetted by subtracting the line start position
	const markedLine = markText(lineText, {
		start: textSpan.start - linePositionRange.start,
		length: textSpan.length
	}).replace(/^\s*/, " ");

	return `
${chalk.bold(message)}
${chalk.gray(file.fileName.replace(process.cwd(), "."))}
${chalk.gray(`${lineContext.line + 1}:`)} ${markedLine}
`;
}

export function markText(text: string, range: TextSpan): string {
	return text.substring(0, range.start) + chalk.bold(chalk.bgRedBright(text.substr(range.start, range.length))) + text.substring(range.start + range.length);
}
