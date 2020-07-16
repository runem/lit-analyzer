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
	const importedSourceFiles = new Set<SourceFileWithImport>();
	visitIndirectImportsFromSourceFile(sourceFile, {
		project: context.project,
		program: context.program,
		ts: context.ts,
		directImportCache: DIRECT_IMPORT_CACHE,
		maxExternalDepth: maxExternalDepth ?? context.config.maxNodeModuleImportDepth,
		maxInternalDepth: maxInternalDepth ?? context.config.maxProjectImportDepth,
		emitIndirectImport(sourceFileWithImport: SourceFileWithImport): boolean {
			// const importSpecifier = sourceFileWithImport.importDeclaration === "rootSourceFile" ?  "rootSourceFile" : sourceFileWithImport.importDeclaration.moduleSpecifier.getText();
			// const key = sourceFileWithImport.sourceFile.fileName + importSpecifier;

			if (importedSourceFiles.has(sourceFileWithImport)) {
				return false;
			} else if (sourceFileWithImport.sourceFile === sourceFile) {
				// The root rootSourceFile gets emitted.
				// In case of a circular dependency, the rootSourceFile can be re-emitted with a (wrongly) set importDeclaration.
				// if (importedSourceFiles.has({ sourceFile: sourceFileWithImport.sourceFile, importDeclaration: "rootSourceFile" })) return false;
			}

			importedSourceFiles.add(sourceFileWithImport);
			return true;
		}
	});

	return importedSourceFiles;
}
