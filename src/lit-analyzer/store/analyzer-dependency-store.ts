export interface AnalyzerDependencyStore {
	hasTagNameBeenImported(fileName: string, tagName: string): boolean;
}

//importedComponentDefinitionsInFile = new Map<string, ComponentDefinition[]>();

/**
 * Returns if a component for a specific file has been imported.
 * @param fileName
 * @param tagName
 */
/*hasTagNameBeenImported(fileName: string, tagName: string): boolean {
 for (const file of this.importedComponentDefinitionsInFile.get(fileName) || []) {
 if (file.tagName === tagName) {
 return true;
 }
 }

 return false;
 }*/
