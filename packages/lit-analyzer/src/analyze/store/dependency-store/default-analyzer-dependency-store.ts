import { ComponentDefinition } from "web-component-analyzer";
import { AnalyzerDependencyStore } from "../analyzer-dependency-store";
import { Range } from "../../types/range";
import { SourceFile } from "typescript";
import { ComponentDefinitionWithImport } from "../../parse/parse-dependencies/parse-dependencies";

export class DefaultAnalyzerDependencyStore implements AnalyzerDependencyStore {
	importedComponentDefinitionsInFile = new Map<string, ComponentDefinitionWithImport[]>();

	/**
	 * Returns if a component for a specific file has been imported.
	 * @param fileName
	 * @param tagName
	 */
	hasTagNameBeenImported(fileName: string, tagName: string): boolean {
		for (const componentDefinitionWithImport of this.importedComponentDefinitionsInFile.get(fileName) || []) {
			if (componentDefinitionWithImport.definition.tagName === tagName) {
				return true;
			}
		}

		return false;
	}

	getImportedDefinitionByRangeOfImportStatement(sourceFile: SourceFile, range: Range): ComponentDefinition[] {
		const definitionsOfThisImport: ComponentDefinition[] = [];
		for (const componentDefinitionWithImport of this.importedComponentDefinitionsInFile.get(sourceFile.fileName) || []) {
			const rangeOfDefinition = {
				start: componentDefinitionWithImport.importDeclaration.pos,
				end: componentDefinitionWithImport.importDeclaration.end
			};
			if (rangeOfDefinition.start === range.start && rangeOfDefinition.end === range.end) {
				definitionsOfThisImport.push(componentDefinitionWithImport.definition);
			}
		}
		return definitionsOfThisImport;
	}
}
