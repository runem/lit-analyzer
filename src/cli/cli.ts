import chalk from "chalk";
import { Program, SourceFile, TextSpan } from "typescript";
import { DefaultLitAnalyzerContext } from "../lit-analyzer/default-lit-analyzer-context";
import { LitAnalyzer } from "../lit-analyzer/lit-analyzer";
import { DocumentRange } from "../lit-analyzer/types/lit-range";
import { analyzeGlobs } from "./analyze-globs";

/**
 * The main function of the cli.
 */
export async function cli() {
	const args = process.argv.slice(2);
	const glob = args[0] || "";
	console.log(args);

	let program: Program | undefined = undefined;
	const analyzer = new LitAnalyzer(
		new DefaultLitAnalyzerContext({
			getProgram() {
				return program!;
			}
		})
	);

	await analyzeGlobs([glob], {
		analyzeSourceFile(file: SourceFile, options: { program: Program }): void {
			console.log(`Analyzing file: ${file.fileName}`);
			program = options.program;
			const result = analyzer.getDiagnosticsInFile(file);
			result.map(r => {
				const textSpan = translateRange(r.location);
				const lineContext = file.getLineAndCharacterOfPosition(textSpan.start);

				let linePositionRange = {
					start: file.getPositionOfLineAndCharacter(lineContext.line, 0),
					end: file.getLineEndOfPosition(textSpan.start)
				};

				if (linePositionRange.end - linePositionRange.start > 50) {
					const padding = (50 - textSpan.length) / 2;
					const start = Math.max(linePositionRange.start, textSpan.start - padding);
					const end = Math.min(linePositionRange.end, textSpan.start + textSpan.length + padding);
					linePositionRange = { start, end };
				}

				const lineText = file.getText().substring(linePositionRange.start, linePositionRange.end);
				const markedLine = markText(lineText, {
					start: textSpan.start - linePositionRange.start,
					length: textSpan.length
				}).replace(/^\s*/, " ");

				console.log(``);
				console.log(chalk.bold(r.message));
				console.log(chalk.gray(`${file.fileName.replace(process.cwd(), ".")}:${lineContext.line}`));
				console.log(`${chalk.gray(`${lineContext.line + 1}:`)} ${markedLine}`);
				console.log(``);
			});
		}
	});
}

export function markText(text: string, range: TextSpan): string {
	return text.substring(0, range.start) + chalk.bold(chalk.bgRedBright(text.substr(range.start, range.length))) + text.substring(range.start + range.length);
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
