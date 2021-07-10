import { ComponentDefinition } from "web-component-analyzer";
import { AnalyzerDependencyStore } from "../analyzer-dependency-store";
import { SourceFile, ImportDeclaration } from "typescript";
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

	getImportedComponentDefinitionsByImportDeclaration(importDeclaration: ImportDeclaration): ComponentDefinition[] {
		const sourceFile = importDeclaration.parent as SourceFile;
		const definitionsOfThisImport: ComponentDefinition[] = [];
		for (const componentDefinitionWithImport of this.importedComponentDefinitionsInFile.get(sourceFile.fileName) || []) {
			const { importDeclaration: currentImportDeclaration, definition } = componentDefinitionWithImport;

			if (currentImportDeclaration === "rootSourceFile") continue;

			if (currentImportDeclaration === importDeclaration) {
				definitionsOfThisImport.push(definition);
			}
		}
		return definitionsOfThisImport;
	}
}
