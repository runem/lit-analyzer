import { existsSync, readFileSync } from "fs";
import { join } from "path";
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
export function compileFiles(): { program: Program };
export function compileFiles(inputFiles: TestFile[] | TestFile): { program: Program; sourceFile: SourceFile };
export function compileFiles(inputFiles: TestFile[] | TestFile = []): { program: Program; sourceFile?: SourceFile } {
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

	const entryFile = (files.find(file => file.entry === true) || files[0]) as ITestFile | undefined;

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

	const entrySourceFile = entryFile != null && entryFile.fileName != null ? program.getSourceFile(entryFile.fileName) : undefined;

	return {
		program,
		sourceFile: entrySourceFile
	};
}
