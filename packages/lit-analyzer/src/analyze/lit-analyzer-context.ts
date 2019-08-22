import * as tsModule from "typescript";
import * as tsServer from "typescript/lib/tsserverlibrary";
import { Program, SourceFile } from "typescript";
import { RuleModule } from "./types/rule-module";
import { LitDiagnostic } from "./types/lit-diagnostic";
import { LitAnalyzerConfig } from "./lit-analyzer-config";
import { LitAnalyzerLogger } from "./lit-analyzer-logger";
import { TextDocument } from "./parse/document/text-document/text-document";
import { AnalyzerDefinitionStore } from "./store/analyzer-definition-store";
import { AnalyzerDependencyStore } from "./store/analyzer-dependency-store";
import { AnalyzerDocumentStore } from "./store/analyzer-document-store";
import { AnalyzerHtmlStore } from "./store/analyzer-html-store";
import { HtmlNode } from "./types/html-node/html-node-types";
import { HtmlNodeAttr } from "./types/html-node/html-node-attr-types";
import { HtmlNodeAttrAssignment } from "./types/html-node/html-node-attr-assignment-types";

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
	readonly rules: RuleModule[];
	readonly reports: LitDiagnostic[];
	updateConfig(config: LitAnalyzerConfig): void;
	updateDependencies(file: SourceFile): void;
	updateComponents(file: SourceFile): void;
	report(data: LitDiagnostic): void;
	hasReports(node: HtmlNode | HtmlNodeAttr | HtmlNodeAttrAssignment): boolean;
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
