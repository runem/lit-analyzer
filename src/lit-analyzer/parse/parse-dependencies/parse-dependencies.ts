import { SourceFile } from "typescript";
import { ComponentDefinition } from "web-component-analyzer";
import { LitAnalyzerContext } from "../../lit-analyzer-context";
import { visitDependencies } from "./visit-dependencies";

const map = new WeakMap<SourceFile, ComponentDefinition[]>();

/**
 * Returns a map of component declarations in each file encountered from a source file recursively.
 * @param sourceFile
 * @param context
 */
export function parseDependencies(sourceFile: SourceFile, context: LitAnalyzerContext): ComponentDefinition[] {
	let definitions: ComponentDefinition[] = [];

	visitDependencies(sourceFile, {
		project: context.project,
		program: context.program,
		ts: context.ts,
		lockedFiles: [],
		addDefinitionsForFile(file: SourceFile, results: ComponentDefinition[], isCircular: boolean) {
			// Only set the result if this isn't a circular import and file is equal to the start file.
			if (!isCircular) {
				map.set(file, results);
			}

			// Always safe the definitions if the results comes from this file
			if (file === sourceFile) {
				definitions = Array.from(new Set(results));
			}
		},
		getImportedDefinitionsInFile(file: SourceFile) {
			return map.get(file);
		},
		getDefinitionsInFile(file: SourceFile) {
			return context.definitionStore.getDefinitionsInFile(file);
		},
		addCircularReference(fromFile: SourceFile, toFile: SourceFile): void {}
	});

	return definitions;
}
