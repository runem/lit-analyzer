import * as tsMod from "typescript";
import * as tsServer from "typescript/lib/tsserverlibrary";
import { Program, SourceFile } from "typescript";
import { RuleModule } from "./types/rule-module";
import { LitAnalyzerConfig } from "./lit-analyzer-config";
import { LitAnalyzerLogger } from "./lit-analyzer-logger";
import { TextDocument } from "./parse/document/text-document/text-document";
import { AnalyzerDefinitionStore } from "./store/analyzer-definition-store";
import { AnalyzerDependencyStore } from "./store/analyzer-dependency-store";
import { AnalyzerDocumentStore } from "./store/analyzer-document-store";
import { AnalyzerHtmlStore } from "./store/analyzer-html-store";

export interface LitAnalyzerContext {
	readonly ts: typeof tsMod;
	readonly program: Program;
	readonly project: tsServer.server.Project | undefined;
	readonly config: LitAnalyzerConfig;
	readonly htmlStore: AnalyzerHtmlStore;
	readonly dependencyStore: AnalyzerDependencyStore;
	readonly documentStore: AnalyzerDocumentStore;
	readonly definitionStore: AnalyzerDefinitionStore;
	readonly logger: LitAnalyzerLogger;
	readonly rules: RuleModule[];
	updateConfig(config: LitAnalyzerConfig): void;
	updateDependencies(file: SourceFile): void;
	updateComponents(file: SourceFile): void;
}

export interface LitAnalyzerRequest extends LitAnalyzerContext {
	file: SourceFile;
	document: TextDocument;
}

export interface LitPluginContextHandler {
	ts?: typeof tsMod;
	getProgram(): Program;
	getProject?(): tsServer.server.Project;
}
