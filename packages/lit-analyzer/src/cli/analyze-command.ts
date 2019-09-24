import chalk from "chalk";
import { appendFileSync, writeFileSync } from "fs";
import { Program, SourceFile } from "typescript";
import { DefaultLitAnalyzerContext } from "../analyze/default-lit-analyzer-context";
import { LitAnalyzer } from "../analyze/lit-analyzer";
import { LitAnalyzerConfig, makeConfig } from "../analyze/lit-analyzer-config";
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
		// eslint-disable-next-line no-console
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

	// Read config from tsconfig
	let newConfig = readTsLitPluginConfig();

	// Create a default config
	if (newConfig == null) {
		const configSeed: Partial<LitAnalyzerConfig> = {};

		// Assign "strict" setting from the CLI command (which overwrites tsconfig rules)
		if (config.strict != null) {
			configSeed.strict = config.strict;
		}

		// Assign "logging" based on "debug" option from the CLI command
		configSeed.logging = config.debug ? "verbose" : "off";

		// Make config based on the seed
		newConfig = makeConfig(configSeed);
	}

	// Assign rules from the CLI command (which overwrites tsconfig rules)
	Object.assign(newConfig.rules, config.rules);

	// Set the config on the context
	context.updateConfig(newConfig);

	// Debug config
	context.logger.verbose("Lit Analyzer Configuration", newConfig);

	const analyzer = new LitAnalyzer(context);

	const stats: AnalysisStats = { errors: 0, warnings: 0, filesWithProblems: 0, totalFiles: 0, diagnostics: 0 };

	const formatter = getFormatter(config.format || "code");

	await analyzeGlobs(globs, config, {
		didExpandGlobs(filePaths: string[]): void {
			if (filePaths.length === 0) {
				// eslint-disable-next-line no-console
				console.log(`\n${chalk.red("  ✖ Couldn't find any files to analyze")}`);
			} else {
				// eslint-disable-next-line no-console
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
