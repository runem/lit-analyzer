import chalk from "chalk";
import { appendFileSync, writeFileSync } from "fs";
import { Program, SourceFile } from "typescript";
import { DefaultLitAnalyzerContext } from "../analyze/default-lit-analyzer-context";
import { LitAnalyzer } from "../analyze/lit-analyzer";
import { makeConfig } from "../analyze/lit-analyzer-config";
import { analyzeGlobs } from "./analyze-globs";
import { readTsLitPluginConfig } from "./compile";
import { CodeDiagnosticFormatter } from "./format/code-diagnostic-formatter";
import { AnalysisStats, DiagnosticFormatter } from "./format/diagnostic-formatter";
import { ListDiagnosticFormatter } from "./format/list-diagnostic-formatter";
import { MarkdownDiagnosticFormatter } from "./format/markdown-formatter";
import { FormatterFormat, LitAnalyzerCliConfig } from "./lit-analyzer-cli-config";

function printText(text: string, config: LitAnalyzerCliConfig) {
	if (config.outFile != null) {
		appendFileSync(config.outFile, text);
	} else {
		console.log(text);
	}
}

export async function analyzeCommand(globs: string[], config: LitAnalyzerCliConfig): Promise<boolean> {
	let program: Program | undefined = undefined;
	const context = new DefaultLitAnalyzerContext({
		getProgram() {
			return program!;
		}
	});

	// Read config from tsconfig or create a default config
	const conf = readTsLitPluginConfig() || makeConfig();
	// Assign rules from the CLI command (which overwrites tsconfig rules)
	Object.assign(conf.rules, config.rules);
	// Set the config on the context
	context.updateConfig(conf);

	const analyzer = new LitAnalyzer(context);

	const stats: AnalysisStats = { errors: 0, warnings: 0, filesWithProblems: 0, totalFiles: 0, diagnostics: 0 };

	const formatter = getFormatter(config.format || "code");

	await analyzeGlobs(globs, config, {
		didExpandGlobs(filePaths: string[]): void {
			if (filePaths.length === 0) {
				console.log(`\n${chalk.red("  ✖ Couldn't find any files to analyze")}`);
			} else {
				console.log(`Analyzing ${filePaths.length} files...`);
			}
		},
		willAnalyzeFiles(filePaths: string[]): void {
			// Prepare output file
			if (config.outFile != null) {
				writeFileSync(config.outFile, "");
			}
		},
		analyzeSourceFile(file: SourceFile, options: { program: Program }): void | boolean {
			program = options.program;

			let diagnostics = analyzer.getDiagnosticsInFile(file);
			diagnostics = config.quiet ? diagnostics.filter(d => d.severity === "error") : diagnostics;
			diagnostics = config.failFast && diagnostics.length > 1 ? [diagnostics[0]] : diagnostics;

			const fileDiagnosticsText = formatter.diagnosticTextForFile(file, diagnostics, config);
			if (fileDiagnosticsText != null) {
				printText(fileDiagnosticsText, config);
			}

			stats.diagnostics += diagnostics.length;
			stats.totalFiles += 1;

			if (diagnostics.length > 0) {
				stats.errors += diagnostics.filter(d => d.severity === "error").length;
				stats.warnings += diagnostics.filter(d => d.severity === "warning").length;
				stats.filesWithProblems += 1;

				if (config.failFast) {
					return false;
				}
			}
		}
	});

	const statsText = formatter.report(stats, config);
	if (statsText != null) {
		printText(statsText, config);
	}

	return stats.diagnostics <= (config.maxWarnings || 0) || config.maxWarnings === -1;
}

function getFormatter(format: FormatterFormat): DiagnosticFormatter {
	switch (format) {
		case "list":
			return new ListDiagnosticFormatter();
		case "code":
			return new CodeDiagnosticFormatter();
		case "markdown":
			return new MarkdownDiagnosticFormatter();
		default:
			throw new Error(`Unknown format: '${format}'`);
	}
}
