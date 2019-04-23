import { SourceFile } from "typescript";
import { AnalyzeComponentsResult, ComponentDefinition, ComponentDiagnostic } from "web-component-analyzer";

export interface AnalyzerDefinitionStore {
	getAnalysisResultForFile(sourceFile: SourceFile): AnalyzeComponentsResult | undefined;
	getAnalysisDiagnosticsInFile(sourceFile: SourceFile): ComponentDiagnostic[];
	getDefinitionsWithDeclarationInFile(sourceFile: SourceFile): ComponentDefinition[];
	getDefinitionForTagName(tagName: string): ComponentDefinition | undefined;
	getDefinitionsInFile(sourceFile: SourceFile): ComponentDefinition[];
}
