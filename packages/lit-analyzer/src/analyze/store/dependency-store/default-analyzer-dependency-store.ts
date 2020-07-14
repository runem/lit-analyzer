import { ComponentDefinition } from "web-component-analyzer";
import { AnalyzerDependencyStore } from "../analyzer-dependency-store";

export class DefaultAnalyzerDependencyStore implements AnalyzerDependencyStore {
	importedComponentDefinitionsInFile = new Map<string, ComponentDefinition[]>();

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

	// TODO: write function "hasImportBeenUsed(fileName: string, range: Range): boolean"
	// that loops over all ComponentDefinitions of a file and searches for a Definition with the given range.
	// Somehow we need to track wheter the tagName associated with the importRange is used within the SourceFile
}
