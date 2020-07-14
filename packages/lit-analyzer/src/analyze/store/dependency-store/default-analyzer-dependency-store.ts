import { ComponentDefinition } from "web-component-analyzer";
import { AnalyzerDependencyStore } from "../analyzer-dependency-store";
import { Range } from "../../types/range";
import { SourceFile } from "typescript";

export class DefaultAnalyzerDependencyStore implements AnalyzerDependencyStore {
	importedComponentDefinitionsInFile = new Map<string, { def: ComponentDefinition; range: Range }[]>();

	/**
	 * Returns if a component for a specific file has been imported.
	 * @param fileName
	 * @param tagName
	 */
	hasTagNameBeenImported(fileName: string, tagName: string): boolean {
		for (const importedDef of this.importedComponentDefinitionsInFile.get(fileName) || []) {
			if (importedDef.def.tagName === tagName) {
				return true;
			}
		}

		return false;
	}

	getImportedDefinitionByRangeOfImportStatement(sourceFile: SourceFile, range: Range): ComponentDefinition[] {
		const definitionsOfThisImport: ComponentDefinition[] = [];
		for (const importedDef of this.importedComponentDefinitionsInFile.get(sourceFile.fileName) || []) {
			if (importedDef.range.start === range.start && importedDef.range.end === range.end) {
				definitionsOfThisImport.push(importedDef.def);
			}
		}
		return definitionsOfThisImport;
	}
}
