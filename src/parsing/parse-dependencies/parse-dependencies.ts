import { SourceFile } from "typescript";
import { TsLitPluginStore } from "../../state/store";
import { IComponentDefinition } from "../parse-components/component-types";
import { visitDependencies } from "./visit-dependencies";

const map = new WeakMap<SourceFile, IComponentDefinition[]>();

/**
 * Returns a map of component declarations in each file encountered from a source file recursively.
 * @param sourceFile
 * @param store
 */
export function parseDependencies(sourceFile: SourceFile, store: TsLitPluginStore): IComponentDefinition[] {
	let definitions: IComponentDefinition[] = [];
	const project = store.info.project;
	const program = store.info.languageService.getProgram()!;

	visitDependencies(sourceFile, {
		project,
		program,
		ts: store.ts,
		lockedFiles: [],
		addDefinitionsForFile(file: SourceFile, results: IComponentDefinition[], isCircular: boolean) {
			// Only set the result if this isn't a circular import and file is equal to the start file.
			if (!isCircular) {
				map.set(file, results);

				if (file === sourceFile) {
					definitions = results;
				}
			}
		},
		getImportedDefinitionsInFile(file: SourceFile) {
			return map.get(file);
		},
		getDefinitionsInFile(file: SourceFile) {
			return store.definitionsInFile.get(file.fileName);
		},
		addCircularReference(fromFile: SourceFile, toFile: SourceFile): void {}
	});

	return definitions;
}
