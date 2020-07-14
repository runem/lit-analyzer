import { SourceFile } from "typescript";
import { ComponentDefinition } from "web-component-analyzer";
import { Range } from "../types/range";

export interface AnalyzerDependencyStore {
	hasTagNameBeenImported(fileName: string, tagName: string): boolean;
	getImportedDefinitionByRangeOfImportStatement(sourceFile: SourceFile, range: Range): ComponentDefinition[];
}
