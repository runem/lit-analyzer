import { SourceFile } from "typescript";
import { IComponentsInFile } from "../parse-components/component-types";
import { TsLitPluginStore } from "../../state/store";
import { visitDependencies } from "./visit-dependencies";

/**
 * Returns a map of component declarations in each file encountered from a source file recursively.
 * @param sourceFile
 * @param store
 */
export function parseDependencies(sourceFile: SourceFile, store: TsLitPluginStore): Map<string, IComponentsInFile[]> {
	const importedComponentsInFile = new Map(store.importedComponentsInFile);
	const project = store.info.project;
	const program = store.info.languageService.getProgram()!;

	visitDependencies(sourceFile, {
		project,
		program,
		ts: store.ts,
		lockedFiles: [],
		addComponentsForFile(fileName: string, components: IComponentsInFile[], isCircular: boolean) {
			// Only set the result if this isn't a circular import and file is equal to the start file.
			if (!isCircular || fileName === sourceFile.fileName) {
				importedComponentsInFile.set(fileName, components);
			}
		},
		getImportedComponentsInFile(fileName: string) {
			return importedComponentsInFile.get(fileName);
		},
		getComponentsInFile(fileName: string) {
			return store.componentsInFile.get(fileName);
		},
		addCircularReference(fromFileName: string, toFileName: string): void {}
	});

	return importedComponentsInFile;
}
