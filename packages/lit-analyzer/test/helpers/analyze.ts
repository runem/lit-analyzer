import { join } from "path";
import * as ts from "typescript";
import {
	CompilerOptions,
	createProgram,
	createSourceFile,
	getDefaultLibFileName,
	ModuleKind,
	Program,
	ScriptKind,
	ScriptTarget,
	SourceFile,
	sys
} from "typescript";
import { DefaultLitAnalyzerContext } from "../../src/analyze/default-lit-analyzer-context";
import { LitAnalyzer } from "../../src/analyze/lit-analyzer";
import { LitAnalyzerConfig, makeConfig } from "../../src/analyze/lit-analyzer-config";
import { LitDiagnostic } from "../../src/analyze/types/lit-diagnostic";

// tslint:disable:no-any

export interface ITestFile {
	fileName: string;
	text?: string;
	entry?: boolean;
}

export type TestFile = ITestFile | string;

/**
 * Compiles 'virtual' files with Typescript
 * @param {ITestFile[]|TestFile} inputFiles
 * @returns {Promise<{fileName: string, result: AnalyzeComponentsResult}[]>}
 */
export function compileFiles(inputFiles: TestFile[] | TestFile): { program: Program; sourceFile: SourceFile } {
	const cwd = process.cwd();

	const files: ITestFile[] = (Array.isArray(inputFiles) ? inputFiles : [inputFiles])
		.map(file =>
			typeof file === "string"
				? {
						text: file,
						fileName: `auto-generated-${Math.floor(Math.random() * 100000)}.ts`,
						entry: true
				  }
				: file
		)
		.map(file => ({ ...file, fileName: join(cwd, file.fileName) }));

	const entryFile = files.find(file => file.entry === true) || files[0];
	if (entryFile == null) {
		throw new ReferenceError(`No entry could be found`);
	}

	const readFile = (fileName: string): string | undefined => {
		const matchedFile = files.find(currentFile => currentFile.fileName === fileName);
		return matchedFile == null ? undefined : matchedFile.text;
	};
	const fileExists = (fileName: string): boolean => {
		return files.some(currentFile => currentFile.fileName === fileName);
	};

	const compilerOptions: CompilerOptions = {
		module: ModuleKind.ESNext,
		target: ScriptTarget.ESNext,
		allowJs: true,
		sourceMap: false
	};

	const program = createProgram({
		rootNames: files.map(file => file.fileName),
		options: compilerOptions,
		host: {
			writeFile: () => {},
			readFile,
			fileExists,
			getSourceFile(fileName: string, languageVersion: ScriptTarget): SourceFile | undefined {
				const sourceText = this.readFile(fileName);
				if (sourceText == null) return undefined;

				return createSourceFile(fileName, sourceText, languageVersion, true, ScriptKind.TS);
			},

			getCurrentDirectory() {
				return ".";
			},

			getDirectories(directoryName: string) {
				return sys.getDirectories(directoryName);
			},

			getDefaultLibFileName(options: CompilerOptions): string {
				return getDefaultLibFileName(options);
			},

			getCanonicalFileName(fileName: string): string {
				return this.useCaseSensitiveFileNames() ? fileName : fileName.toLowerCase();
			},

			getNewLine(): string {
				return sys.newLine;
			},

			useCaseSensitiveFileNames() {
				return sys.useCaseSensitiveFileNames;
			}
		}
	});

	const entrySourceFile = program.getSourceFile(entryFile.fileName)!;

	return {
		program,
		sourceFile: entrySourceFile
	};
}

/**
 * Prepares both the Typescript program and the LitAnalyzer
 * @param inputFiles
 * @param config
 */
export function prepareAnalyzer(
	inputFiles: TestFile[] | TestFile,
	config: Partial<LitAnalyzerConfig> = {}
): { analyzer: LitAnalyzer; program: Program; sourceFile: SourceFile } {
	const { program, sourceFile } = compileFiles(inputFiles);

	const context = new DefaultLitAnalyzerContext({
		ts: ts,
		getProgram(): Program {
			return program;
		}
	});

	const analyzer = new LitAnalyzer(context);

	context.updateConfig(makeConfig(config));

	return {
		analyzer,
		program,
		sourceFile
	};
}

/**
 * Returns diagnostics in 'virtual' files using the LitAnalyzer
 * @param inputFiles
 * @param config
 */
export function getDiagnostics(inputFiles: TestFile[] | TestFile, config: Partial<LitAnalyzerConfig> = {}): { diagnostics: LitDiagnostic[] } {
	const { analyzer, sourceFile } = prepareAnalyzer(inputFiles, config);

	return {
		diagnostics: analyzer.getDiagnosticsInFile(sourceFile)
	};
}
