import { Program, SourceFile } from "typescript";
import { DefaultLitAnalyzerContext } from "../../lib/analyze/default-lit-analyzer-context.js";
import { LitAnalyzer } from "../../lib/analyze/lit-analyzer.js";
import { LitAnalyzerConfig, makeConfig } from "../../lib/analyze/lit-analyzer-config.js";
import { LitAnalyzerContext } from "../../lib/analyze/lit-analyzer-context.js";
import { LitDiagnostic } from "../../lib/analyze/types/lit-diagnostic.js";
import { compileFiles, TestFile } from "./compile-files.js";
import { getCurrentTsModule } from "./ts-test.js";
import { Range } from "../../lib/analyze/types/range.js";
import { LitCodeFix } from "../../lib/analyze/types/lit-code-fix.js";

/**
 * Prepares both the Typescript program and the LitAnalyzer
 * @param inputFiles
 * @param config
 */
export function prepareAnalyzer(
	inputFiles: TestFile[] | TestFile,
	config: Partial<LitAnalyzerConfig> = {}
): { analyzer: LitAnalyzer; program: Program; sourceFile: SourceFile; context: LitAnalyzerContext } {
	const { program, sourceFile } = compileFiles(inputFiles);

	const context = new DefaultLitAnalyzerContext({
		ts: getCurrentTsModule(),
		getProgram(): Program {
			return program;
		}
	});

	const analyzer = new LitAnalyzer(context);

	context.updateConfig(makeConfig(config));

	return {
		analyzer,
		program,
		sourceFile,
		context
	};
}

/**
 * Returns diagnostics in 'virtual' files using the LitAnalyzer
 * @param inputFiles
 * @param config
 */
export function getDiagnostics(
	inputFiles: TestFile[] | TestFile,
	config: Partial<LitAnalyzerConfig> = {}
): { diagnostics: LitDiagnostic[]; program: Program; sourceFile: SourceFile } {
	const { analyzer, sourceFile, program } = prepareAnalyzer(inputFiles, config);

	return {
		diagnostics: analyzer.getDiagnosticsInFile(sourceFile),
		program,
		sourceFile
	};
}

/**
 * Returns code fixes in 'virtual' files using the LitAnalyzer
 * @param inputFiles
 * @param config
 */
export function getCodeFixesAtRange(
	inputFiles: TestFile[] | TestFile,
	range: Range,
	config: Partial<LitAnalyzerConfig> = {}
): { codeFixes: LitCodeFix[]; program: Program; sourceFile: SourceFile } {
	const { analyzer, sourceFile, program } = prepareAnalyzer(inputFiles, config);

	return {
		codeFixes: analyzer.getCodeFixesAtPositionRange(sourceFile, range),
		program,
		sourceFile
	};
}
