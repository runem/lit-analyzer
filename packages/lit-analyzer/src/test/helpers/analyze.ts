import { Program, SourceFile } from "typescript";
import { DefaultLitAnalyzerContext } from "../../src/analyze/default-lit-analyzer-context";
import { LitAnalyzer } from "../../src/analyze/lit-analyzer";
import { LitAnalyzerConfig, makeConfig } from "../../src/analyze/lit-analyzer-config";
import { LitAnalyzerContext } from "../../src/analyze/lit-analyzer-context";
import { LitDiagnostic } from "../../src/analyze/types/lit-diagnostic";
import { compileFiles, TestFile } from "./compile-files";
import { getCurrentTsModule } from "./ts-test";
import { Range } from "../../src/analyze/types/range";
import { LitCodeFix } from "../../src/analyze/types/lit-code-fix";

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
