import { SourceFile } from "typescript";
import { ComponentDefinition } from "web-component-analyzer";
import { AnalyzerDependencyStore } from "../analyzer-dependency-store";

export class DefaultAnalyzerDependencyStore implements AnalyzerDependencyStore {
	importedComponentDefinitionsInFile = new Map<string, ComponentDefinition[]>();

	absorbComponentDefinitionsForFile(sourceFile: SourceFile, result: ComponentDefinition[]) {
		this.importedComponentDefinitionsInFile.set(sourceFile.fileName, result);
	}

	/**
	 * Returns if a component for a specific file has been imported.
	 * @param fileName
	 * @param tagName
	 */
	hasTagNameBeenImported(fileName: string, tagName: string): boolean {
		for (const file of this.importedComponentDefinitionsInFile.get(fileName) || []) {
			if (file.tagName === tagName) {
				return true;
			}
		}

		return false;
	}
}
