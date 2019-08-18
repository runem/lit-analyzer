import { existsSync, readFileSync } from "fs";
import { join } from "path";
import * as ts from "typescript";
import {
	CompilerHost,
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
import { LitAnalyzerContext } from "../../src/analyze/lit-analyzer-context";
import { LitDiagnostic } from "../../src/analyze/types/lit-diagnostic";

// tslint:disable:no-any

export interface ITestFile {
	fileName?: string;
	text: string;
	entry?: boolean;
	includeLib?: boolean;
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
				: {
						...file,
						fileName: file.fileName || `auto-generated-${Math.floor(Math.random() * 100000)}.ts`
				  }
		)
		.map(file => ({ ...file, fileName: join(cwd, file.fileName) }));

	const entryFile = files.find(file => file.entry === true) || files[0];
	if (entryFile == null) {
		throw new ReferenceError(`No entry could be found`);
	}

	const includeLib = files.find(file => file.includeLib) != null;

	const readFile = (fileName: string): string | undefined => {
		const matchedFile = files.find(currentFile => currentFile.fileName === fileName);
		if (matchedFile != null) {
			return matchedFile.text;
		}

		if (includeLib) {
			fileName = fileName.includes("/") ? fileName : `node_modules/typescript/lib/${fileName}`;
		}

		if (existsSync(fileName)) {
			return readFileSync(fileName, "utf8").toString();
		}

		return undefined;
	};
	const fileExists = (fileName: string): boolean => {
		return files.some(currentFile => currentFile.fileName === fileName);
	};

	const compilerOptions: CompilerOptions = {
		module: ModuleKind.ESNext,
		target: ScriptTarget.ESNext,
		allowJs: true,
		sourceMap: false,
		strict: true // if strict = false, "undefined" and "null" will be removed from type unions.
	};

	const compilerHost: CompilerHost = {
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
	};

	const program = createProgram({
		//rootNames: [...files.map(file => file.fileName!), ...(includeLib ? ["node_modules/typescript/lib/lib.dom.d.ts"] : [])],
		rootNames: files.map(file => file.fileName!),
		options: compilerOptions,
		host: compilerHost
	});

	const entrySourceFile = program.getSourceFile(entryFile.fileName!)!;

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
): { analyzer: LitAnalyzer; program: Program; sourceFile: SourceFile; context: LitAnalyzerContext } {
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
