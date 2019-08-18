import * as tsModule from "typescript";
import * as tsServer from "typescript/lib/tsserverlibrary";
import { Program, SourceFile } from "typescript";
import { LitAnalyzerConfig } from "./lit-analyzer-config";
import { LitAnalyzerLogger } from "./lit-analyzer-logger";
import { TextDocument } from "./parse/document/text-document/text-document";
import { AnalyzerDefinitionStore } from "./store/analyzer-definition-store";
import { AnalyzerDependencyStore } from "./store/analyzer-dependency-store";
import { AnalyzerDocumentStore } from "./store/analyzer-document-store";
import { AnalyzerHtmlStore } from "./store/analyzer-html-store";
import { LitHtmlDiagnostic } from "./types/lit-diagnostic";

export interface LitAnalyzerContext {
	readonly ts: typeof tsModule;
	readonly program: Program;
	readonly project: tsServer.server.Project | undefined;
	readonly config: LitAnalyzerConfig;
	readonly htmlStore: AnalyzerHtmlStore;
	readonly dependencyStore: AnalyzerDependencyStore;
	readonly documentStore: AnalyzerDocumentStore;
	readonly definitionStore: AnalyzerDefinitionStore;
	readonly logger: LitAnalyzerLogger;
	updateConfig(config: LitAnalyzerConfig): void;
	updateDependencies(file: SourceFile): void;
	updateComponents(file: SourceFile): void;
	reports: LitHtmlDiagnostic[];
}

export interface LitAnalyzerRequest extends LitAnalyzerContext {
	file: SourceFile;
	document: TextDocument;
}

export interface LitPluginContextHandler {
	ts?: typeof tsModule;
	getProgram(): Program;
	getProject?(): tsServer.server.Project;
}
