import * as tsMod from "typescript";
import { Program, SourceFile } from "typescript";
import * as tsServer from "typescript/lib/tsserverlibrary";
import { LitAnalyzerConfig } from "./lit-analyzer-config";
import { LitAnalyzerLogger } from "./lit-analyzer-logger";
import { RuleCollection } from "./rule-collection";
import { AnalyzerDefinitionStore } from "./store/analyzer-definition-store";
import { AnalyzerDependencyStore } from "./store/analyzer-dependency-store";
import { AnalyzerDocumentStore } from "./store/analyzer-document-store";
import { AnalyzerHtmlStore } from "./store/analyzer-html-store";

export interface LitAnalyzerContext {
	readonly ts: typeof tsMod;
	readonly program: Program;
	readonly project: tsServer.server.Project | undefined;
	readonly config: LitAnalyzerConfig;

	// Stores
	readonly htmlStore: AnalyzerHtmlStore;
	readonly dependencyStore: AnalyzerDependencyStore;
	readonly documentStore: AnalyzerDocumentStore;
	readonly definitionStore: AnalyzerDefinitionStore;

	readonly logger: LitAnalyzerLogger;
	readonly rules: RuleCollection;

	readonly currentFile: SourceFile;
	readonly currentRunningTime: number;
	readonly isCancellationRequested: boolean;

	updateConfig(config: LitAnalyzerConfig): void;
	updateDependencies(file: SourceFile): void;
	updateComponents(file: SourceFile): void;

	setContextBase(contextBase: LitAnalyzerContextBaseOptions): void;
}

export interface LitAnalyzerContextBaseOptions {
	file: SourceFile | undefined;
	timeout?: number;
	throwOnCancellation?: boolean;
}

export interface LitPluginContextHandler {
	ts?: typeof tsMod;
	getProgram(): Program;
	getProject?(): tsServer.server.Project;
}
