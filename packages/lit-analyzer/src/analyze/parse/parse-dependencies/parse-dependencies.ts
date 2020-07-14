import { SourceFile } from "typescript";
import { ComponentDefinition } from "web-component-analyzer";
import { LitAnalyzerContext } from "../../lit-analyzer-context";
import { visitIndirectImportsFromSourceFile } from "./visit-dependencies";
import { Range } from "../../types/range";

// A cache used to prevent traversing through entire source files multiple times to find direct imports
const DIRECT_IMPORT_CACHE = new WeakMap<SourceFile, Set<SourceFile>>();

// Two caches used to return the result of of a known source file right away
const RESULT_CACHE = new WeakMap<SourceFile, { def: ComponentDefinition; range: Range }[]>();
const IMPORTED_SOURCE_FILES_CACHE = new WeakMap<SourceFile, Map<SourceFile, Range>>();

/**
 * Returns a map of imported component definitions in each file encountered from a source file recursively.
 * @param sourceFile
 * @param context
 */
export function parseDependencies(sourceFile: SourceFile, context: LitAnalyzerContext): { def: ComponentDefinition; range: Range }[] {
	if (RESULT_CACHE.has(sourceFile)) {
		let invalidate = false;

		// Check if the cache has been invalidated
		for (const imports of IMPORTED_SOURCE_FILES_CACHE.get(sourceFile) || []) {
			const [file] = imports;
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
	const definitions = new Set<{ def: ComponentDefinition; range: Range }>();
	for (const imports of importedSourceFiles) {
		const [file, range] = imports;
		for (const def of context.definitionStore.getDefinitionsInFile(file)) {
			definitions.add({ def, range });
		}
	}

	// Cache the result
	const result = Array.from(definitions);
	RESULT_CACHE.set(sourceFile, result);

	return result;
}

/**
 * Returns a map of component declarations in each file encountered from a source file recursively.
 * @param sourceFile
 * @param context
 * @param maxExternalDepth
 * @param minExternalDepth
 */
export function parseAllIndirectImports(
	sourceFile: SourceFile,
	context: LitAnalyzerContext,
	{ maxExternalDepth, maxInternalDepth }: { maxExternalDepth?: number; maxInternalDepth?: number } = {}
): Map<SourceFile, Range> {
	// The Range destribes the location of the direct import statement.
	const importedSourceFiles = new Map<SourceFile, Range>();

	visitIndirectImportsFromSourceFile(sourceFile, {
		project: context.project,
		program: context.program,
		ts: context.ts,
		directImportCache: DIRECT_IMPORT_CACHE,
		maxExternalDepth: maxExternalDepth ?? context.config.maxNodeModuleImportDepth,
		maxInternalDepth: maxInternalDepth ?? context.config.maxProjectImportDepth,
		emitIndirectImport(file: SourceFile, range: Range): boolean {
			if (importedSourceFiles.has(file)) {
				return false;
			}
			importedSourceFiles.set(file, range);
			return true;
		}
	});

	return importedSourceFiles;
}
