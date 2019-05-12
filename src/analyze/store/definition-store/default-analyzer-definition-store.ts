import { Node, SourceFile } from "typescript";
import { AnalyzeComponentsResult, ComponentDefinition, ComponentDiagnostic } from "web-component-analyzer";
import { AnalyzerDefinitionStore } from "../analyzer-definition-store";

export class DefaultAnalyzerDefinitionStore implements AnalyzerDefinitionStore {
	private analysisResultForFile = new Map<string, AnalyzeComponentsResult>();
	private definitionForTagName = new Map<string, ComponentDefinition>();

	absorbAnalysisResult(sourceFile: SourceFile, result: AnalyzeComponentsResult) {
		this.analysisResultForFile.set(sourceFile.fileName, result);

		result.componentDefinitions.forEach(definition => {
			this.definitionForTagName.set(definition.tagName, definition);
		});
	}

	forgetAnalysisResultForFile(sourceFile: SourceFile) {
		const result = this.analysisResultForFile.get(sourceFile.fileName);
		if (result == null) return;

		result.componentDefinitions.forEach(definition => {
			this.definitionForTagName.delete(definition.tagName);
		});

		this.analysisResultForFile.delete(sourceFile.fileName);
	}

	getAnalysisResultForFile(sourceFile: SourceFile): AnalyzeComponentsResult | undefined {
		return this.analysisResultForFile.get(sourceFile.fileName);
	}

	getAnalysisDiagnosticsInFile(sourceFile: SourceFile): ComponentDiagnostic[] {
		const diagnosticForNode = new Map<Node, ComponentDiagnostic>();
		this.analysisResultForFile.forEach(def =>
			def.diagnostics.forEach(diagnostic => {
				if (diagnostic.node.getSourceFile() === sourceFile) {
					diagnosticForNode.set(diagnostic.node, diagnostic);
				}
			})
		);
		//flatten(Array.from(this.analysisResultForFile.values()).map(def => def.diagnostics.filter(diagnostic => diagnostic.node.getSourceFile() === sourceFile)));
		return Array.from(diagnosticForNode.values());
	}

	getDefinitionsWithDeclarationInFile(sourceFile: SourceFile): ComponentDefinition[] {
		return Array.from(this.definitionForTagName.values()).filter(d =>
			[d.declaration.node, ...(d.declaration.inheritNodes || [])].map(n => n.getSourceFile()).find(sf => sf.fileName === sourceFile.fileName)
		);
	}

	getDefinitionForTagName(tagName: string): ComponentDefinition | undefined {
		return this.definitionForTagName.get(tagName);
	}

	getDefinitionsInFile(sourceFile: SourceFile): ComponentDefinition[] {
		const result = this.analysisResultForFile.get(sourceFile.fileName);
		return (result != null && result.componentDefinitions) || [];
	}
}
