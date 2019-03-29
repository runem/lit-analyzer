import { SourceFile } from "typescript";
import { ComponentDefinition } from "web-component-analyzer";
import { TsLitPluginStore } from "../../state/store";
import { visitDependencies } from "./visit-dependencies";

const map = new WeakMap<SourceFile, ComponentDefinition[]>();

/**
 * Returns a map of component declarations in each file encountered from a source file recursively.
 * @param sourceFile
 * @param store
 */
export function parseDependencies(sourceFile: SourceFile, store: TsLitPluginStore): ComponentDefinition[] {
	let definitions: ComponentDefinition[] = [];
	const project = store.info.project;
	const program = store.info.languageService.getProgram()!;

	visitDependencies(sourceFile, {
		project,
		program,
		ts: store.ts,
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
			return store.getDefinitionsInFile(file);
		},
		addCircularReference(fromFile: SourceFile, toFile: SourceFile): void {}
	});

	return definitions;
}
