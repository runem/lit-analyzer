import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { CompilerHost, CompilerOptions, ModuleKind, Program, ScriptKind, ScriptTarget, SourceFile } from "typescript";
import { getCurrentTsModule, getCurrentTsModuleDirectory } from "./ts-test.js";

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
 */
export function compileFiles(inputFiles: TestFile[] | TestFile = []): { program: Program; sourceFile: SourceFile } {
	const ts = getCurrentTsModule();

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
		.map(file => ({ ...file, fileName: file.fileName }));

	const entryFile = files.find(file => file.entry === true) || files[0];

	const includeLib = true; //files.find(file => file.includeLib) != null;

	const readFile = (fileName: string): string | undefined => {
		const matchedFile = files.find(currentFile => currentFile.fileName === fileName);
		if (matchedFile != null) {
			return matchedFile.text;
		}

		if (includeLib) {
			fileName = fileName.match(/[/\\]/) ? fileName : join(getCurrentTsModuleDirectory(), fileName);
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
		strict: true // if strict = false, "undefined" and "null" will be removed from unions types.
	};

	const compilerHost: CompilerHost = {
		writeFile: () => {},
		readFile,
		fileExists,
		getSourceFile(fileName: string, languageVersion: ScriptTarget): SourceFile | undefined {
			const sourceText = this.readFile(fileName);
			if (sourceText == null) return undefined;

			return ts.createSourceFile(fileName, sourceText, languageVersion, true, ScriptKind.TS);
		},

		getCurrentDirectory() {
			return "./";
		},

		getDirectories(directoryName: string) {
			return ts.sys.getDirectories(directoryName);
		},

		getDefaultLibFileName(options: CompilerOptions): string {
			return ts.getDefaultLibFileName(options);
		},

		getCanonicalFileName(fileName: string): string {
			return this.useCaseSensitiveFileNames() ? fileName : fileName.toLowerCase();
		},

		getNewLine(): string {
			return ts.sys.newLine;
		},

		useCaseSensitiveFileNames() {
			return ts.sys.useCaseSensitiveFileNames;
		}
	};

	const program = ts.createProgram({
		//rootNames: [...files.map(file => file.fileName!), "node_modules/typescript/lib/lib.dom.d.ts"],
		rootNames: [
			...files.map(file => file.fileName!),
			...(includeLib
				? [
						"node_modules/typescript/lib/lib.dom.d.ts",
						// We need this to enable `Symbol`.
						// We cannot use "esnext" since it cannot be loaded by TS 4.8.4.
						"node_modules/typescript/lib/lib.es2015.d.ts"
				  ]
				: [])
		],
		//rootNames: files.map(file => file.fileName!),
		options: compilerOptions,
		host: compilerHost
	});

	// We need to overwrite this so the traversal of external modules can be tested.
	program.isSourceFileFromExternalLibrary = (sourceFile: SourceFile): boolean => {
		const filename = sourceFile.fileName;
		return filename.includes("node_modules");
	};

	const entrySourceFile = entryFile.fileName != null ? program.getSourceFile(entryFile.fileName)! : program.getSourceFiles()[0];

	return {
		program,
		sourceFile: entrySourceFile
	};
}
