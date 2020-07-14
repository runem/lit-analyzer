import { SourceFile } from "typescript";
import { AnalyzerResult, ComponentDeclaration, ComponentDefinition, visitAllHeritageClauses } from "web-component-analyzer";
import { getDeclarationsInFile } from "../../util/component-util";
import { AnalyzerDefinitionStore } from "../analyzer-definition-store";

export class DefaultAnalyzerDefinitionStore implements AnalyzerDefinitionStore {
	private analysisResultForFile = new Map<string, AnalyzerResult>();
	private definitionForTagName = new Map<string, ComponentDefinition>();

	private intersectingDefinitionsForFile = new Map<string, Set<ComponentDefinition>>();

	absorbAnalysisResult(sourceFile: SourceFile, result: AnalyzerResult): void {
		this.analysisResultForFile.set(sourceFile.fileName, result);

		result.componentDefinitions.forEach(definition => {
			this.definitionForTagName.set(definition.tagName, definition);

			addToSetInMap(this.intersectingDefinitionsForFile, definition.sourceFile.fileName, definition);

			if (definition.declaration == null) {
				return;
			}

			addToSetInMap(this.intersectingDefinitionsForFile, definition.declaration?.sourceFile.fileName, definition);

			visitAllHeritageClauses(definition.declaration, clause => {
				if (clause.declaration != null) {
					addToSetInMap(this.intersectingDefinitionsForFile, clause.declaration.sourceFile.fileName, definition);
				}
			});
		});
	}

	forgetAnalysisResultForFile(sourceFile: SourceFile): void {
		const result = this.analysisResultForFile.get(sourceFile.fileName);
		if (result == null) return;

		result.componentDefinitions.forEach(definition => {
			this.definitionForTagName.delete(definition.tagName);

			this.intersectingDefinitionsForFile.get(definition.sourceFile.fileName)?.delete(definition);

			if (definition.declaration == null) {
				return;
			}

			this.intersectingDefinitionsForFile.get(definition.declaration?.sourceFile.fileName)?.delete(definition);

			visitAllHeritageClauses(definition.declaration, clause => {
				if (clause.declaration != null) {
					this.intersectingDefinitionsForFile.get(clause.declaration.sourceFile.fileName)?.delete(definition);
				}
			});
		});

		this.analysisResultForFile.delete(sourceFile.fileName);
	}

	getAnalysisResultForFile(sourceFile: SourceFile): AnalyzerResult | undefined {
		return this.analysisResultForFile.get(sourceFile.fileName);
	}

	getDefinitionsWithDeclarationInFile(sourceFile: SourceFile): ComponentDefinition[] {
		return Array.from(this.intersectingDefinitionsForFile.get(sourceFile.fileName) || []);
	}

	getComponentDeclarationsInFile(sourceFile: SourceFile): ComponentDeclaration[] {
		const declarations = new Set<ComponentDeclaration>();

		for (const definition of this.intersectingDefinitionsForFile.get(sourceFile.fileName) || []) {
			for (const declaration of getDeclarationsInFile(definition, sourceFile)) {
				declarations.add(declaration);
			}
		}

		return Array.from(declarations);
	}

	getDefinitionForTagName(tagName: string): ComponentDefinition | undefined {
		return this.definitionForTagName.get(tagName);
	}

	getDefinitionsInFile(sourceFile: SourceFile): ComponentDefinition[] {
		const result = this.analysisResultForFile.get(sourceFile.fileName);
		return (result != null && result.componentDefinitions) || [];
	}
}

function addToSetInMap<K, V>(map: Map<K, Set<V>>, key: K, value: V) {
	const set = map.get(key) || new Set();
	set.add(value);
	map.set(key, set);
}
