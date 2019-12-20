import { SourceFile } from "typescript";
import { AnalyzerResult, ComponentDefinition } from "web-component-analyzer";

export interface AnalyzerDefinitionStore {
	getAnalysisResultForFile(sourceFile: SourceFile): AnalyzerResult | undefined;
	getDefinitionsWithDeclarationInFile(sourceFile: SourceFile): ComponentDefinition[];
	getDefinitionForTagName(tagName: string): ComponentDefinition | undefined;
	getDefinitionsInFile(sourceFile: SourceFile): ComponentDefinition[];
}
