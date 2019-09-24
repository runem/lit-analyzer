import { async } from "fast-glob";
import { existsSync, lstatSync } from "fs";
import { join } from "path";
import { Diagnostic, flattenDiagnosticMessageText, Program, SourceFile } from "typescript";
import { flatten } from "../analyze/util/general-util";
import { CompileResult, compileTypescript } from "./compile";
import { LitAnalyzerCliConfig } from "./lit-analyzer-cli-config";

//const IGNORE_GLOBS = ["!**/node_modules/**", "!**/web_modules/**"];
const IGNORE_GLOBS: string[] = [];
const DEFAULT_DIR_GLOB = "**/*.{js,jsx,ts,tsx}";

export interface AnalyzeGlobsContext {
	didExpandGlobs?(filePaths: string[]): void;
	willAnalyzeFiles?(filePaths: string[]): void;
	didFindTypescriptDiagnostics?(diagnostics: readonly Diagnostic[], options: { program: Program }): void;
	analyzeSourceFile?(file: SourceFile, options: { program: Program }): void | boolean;
}

/**
 * Parses and analyses all globs and calls some callbacks while doing it.
 * @param globs
 * @param config
 * @param context
 */
export async function analyzeGlobs(globs: string[], config: LitAnalyzerCliConfig, context: AnalyzeGlobsContext = {}): Promise<CompileResult> {
	// Expand the globs
	const filePaths = await expandGlobs(globs);

	if (config.debug) {
		// eslint-disable-next-line no-console
		console.log(filePaths);
	}

	// Callbacks
	if (context.didExpandGlobs != null) context.didExpandGlobs(filePaths);
	if (context.willAnalyzeFiles != null) context.willAnalyzeFiles(filePaths);

	// Parse all the files with typescript
	const { program, files, diagnostics } = compileTypescript(filePaths);

	if (diagnostics.length > 0) {
		if (config.debug) {
			// eslint-disable-next-line no-console
			console.dir(diagnostics.map(d => `${(d.file && d.file.fileName) || "unknown"}: ${flattenDiagnosticMessageText(d.messageText, "\n")}`));
		}

		if (context.didFindTypescriptDiagnostics != null) context.didFindTypescriptDiagnostics(diagnostics, { program });
	}

	// Analyze each file
	for (const file of files) {
		// Analyze
		if (context.analyzeSourceFile != null) {
			const result = context.analyzeSourceFile(file, { program });
			if (result === false) break;
		}
	}

	return { program, diagnostics, files };
}

/**
 * Expands the globs.
 * @param globs
 */
async function expandGlobs(globs: string | string[]): Promise<string[]> {
	globs = Array.isArray(globs) ? globs : [globs];

	return flatten(
		await Promise.all(
			globs.map(g => {
				try {
					// Test if the glob points to a directory.
					// If so, return the result of a new glob that searches for files in the directory excluding node_modules..
					const dirExists = existsSync(g) && lstatSync(g).isDirectory();
					if (dirExists) {
						return async<string>([...IGNORE_GLOBS, join(g, DEFAULT_DIR_GLOB)], {
							absolute: true,
							followSymlinkedDirectories: false
						});
					}
				} catch {
					// Do nothing
				}

				// Return the result of globbing
				return async<string>([...IGNORE_GLOBS, g], {
					absolute: true,
					followSymlinkedDirectories: false
				});
			})
		)
	);
}
