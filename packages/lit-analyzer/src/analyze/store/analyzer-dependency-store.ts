import { ImportDeclaration } from "typescript";
import { ComponentDefinition } from "web-component-analyzer";

export interface AnalyzerDependencyStore {
	hasTagNameBeenImported(fileName: string, tagName: string): boolean;
	getImportedComponentDefinitionsByImportDeclaration(importDeclaration: ImportDeclaration): ComponentDefinition[];
}
