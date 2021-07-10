import { SourceFile, ImportDeclaration } from "typescript";
import { ComponentDefinition } from "web-component-analyzer";
import { LitAnalyzerContext } from "../../lit-analyzer-context";
import { visitIndirectImportsFromSourceFile } from "./visit-dependencies";

export type ComponentDefinitionWithImport = { definition: ComponentDefinition; importDeclaration: ImportDeclaration | "rootSourceFile" };
export type SourceFileWithImport = { sourceFile: SourceFile; importDeclaration: ImportDeclaration | "rootSourceFile" };

// A cache used to prevent traversing through entire source files multiple times to find direct imports
const DIRECT_IMPORT_CACHE = new WeakMap<SourceFile, Set<SourceFile>>();

// Two caches used to return the result of of a known source file right away
const RESULT_CACHE = new WeakMap<SourceFile, ComponentDefinitionWithImport[]>();
const IMPORTED_SOURCE_FILES_CACHE = new WeakMap<SourceFile, Set<SourceFileWithImport>>();

/**
 * Returns a map of imported component definitions in each file encountered from a source file recursively.
 * @param sourceFile
 * @param context
 */
export function parseDependencies(sourceFile: SourceFile, context: LitAnalyzerContext): ComponentDefinitionWithImport[] {
	if (RESULT_CACHE.has(sourceFile)) {
		let invalidate = false;

		// Check if the cache has been invalidated
		for (const fileWithImport of IMPORTED_SOURCE_FILES_CACHE.get(sourceFile) || []) {
			const { sourceFile: file } = fileWithImport;
			// If we get a SourceFile with a certain fileName but it's not the same reference, the file has been updated
			if (context.program.getSourceFile(file.fileName) !== file) {
				invalidate = true;
				break;
			}
		}

		if (invalidate) {
			RESULT_CACHE.delete(sourceFile);
			IMPORTED_SOURCE_FILES_CACHE.delete(sourceFile);
		} else {
			return RESULT_CACHE.get(sourceFile)!;
		}
	}

	// Get all indirectly imported source files from this the source file
	const importedSourceFiles = parseAllIndirectImports(sourceFile, context);
	IMPORTED_SOURCE_FILES_CACHE.set(sourceFile, importedSourceFiles);

	// Get component definitions from all these source files
	const definitions = new Set<ComponentDefinitionWithImport>();
	for (const importedSourceFile of importedSourceFiles) {
		const { sourceFile, importDeclaration } = importedSourceFile;
		for (const definition of context.definitionStore.getDefinitionsInFile(sourceFile)) {
			definitions.add({ definition, importDeclaration });
		}
	}

	// Cache the result
	const result = Array.from(definitions);
	RESULT_CACHE.set(sourceFile, result);

	return result;
}

/**
 * Returns a set of component declarations in each file encountered from a source file recursively.
 * @param sourceFile
 * @param context
 * @param maxExternalDepth
 * @param minExternalDepth
 */
export function parseAllIndirectImports(
	sourceFile: SourceFile,
	context: LitAnalyzerContext,
	{ maxExternalDepth, maxInternalDepth }: { maxExternalDepth?: number; maxInternalDepth?: number } = {}
): Set<SourceFileWithImport> {
	const importedSourceFiles = new Map<SourceFile, Set<ImportDeclaration | "rootSourceFile">>();
	visitIndirectImportsFromSourceFile(sourceFile, {
		project: context.project,
		program: context.program,
		ts: context.ts,
		directImportCache: DIRECT_IMPORT_CACHE,
		maxExternalDepth: maxExternalDepth ?? context.config.maxNodeModuleImportDepth,
		maxInternalDepth: maxInternalDepth ?? context.config.maxProjectImportDepth,
		emitIndirectImport(sourceFileWithImport: SourceFileWithImport): boolean {
			const { sourceFile, importDeclaration } = sourceFileWithImport;

			if (importedSourceFiles.has(sourceFile)) {
				const importDeclarations = importedSourceFiles.get(sourceFile)!;
				if (importDeclarations.has(importDeclaration) || importDeclarations.has("rootSourceFile")) {
					// Sourcefile has already been visited from this importDeclaration or is the rootSourceFile.
					return false;
				} else {
					// Sourcefile has already been visited from ANOTHER importDeclaration.
					// Adding this importDeclaration to the Set of importDeclarations.
					importDeclarations.add(importDeclaration);
					importedSourceFiles.set(sourceFile, importDeclarations);
					return true;
				}
			}
			// Sourcefile has not been visited yet.
			const importDeclarations = new Set<ImportDeclaration | "rootSourceFile">();
			importDeclarations.add(importDeclaration);
			importedSourceFiles.set(sourceFile, importDeclarations);
			return true;
		}
	});

	const result = new Set<SourceFileWithImport>();
	for (const [sourceFile, importDeclarations] of importedSourceFiles) {
		for (const importDeclaration of importDeclarations) {
			result.add({ sourceFile, importDeclaration });
		}
	}
	return result;
}
