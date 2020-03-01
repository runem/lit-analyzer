import * as tsMod from "typescript";
import { Program, SourceFile } from "typescript";
import { LitAnalyzerConfig } from "../../lit-analyzer-config";
import { LitAnalyzerLogger } from "../../lit-analyzer-logger";
import { AnalyzerDefinitionStore } from "../../store/analyzer-definition-store";
import { AnalyzerDependencyStore } from "../../store/analyzer-dependency-store";
import { AnalyzerDocumentStore } from "../../store/analyzer-document-store";
import { AnalyzerHtmlStore } from "../../store/analyzer-html-store";
import { RuleDiagnostic } from "./rule-diagnostic";

export interface RuleModuleContext {
	readonly ts: typeof tsMod;
	readonly program: Program;
	readonly file: SourceFile;

	readonly htmlStore: AnalyzerHtmlStore;
	readonly dependencyStore: AnalyzerDependencyStore;
	readonly documentStore: AnalyzerDocumentStore;
	readonly definitionStore: AnalyzerDefinitionStore;

	readonly logger: LitAnalyzerLogger;
	readonly config: LitAnalyzerConfig;

	report(diagnostic: RuleDiagnostic): void;
	break(): void;
}
