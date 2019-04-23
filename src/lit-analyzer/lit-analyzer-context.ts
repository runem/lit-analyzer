import * as tsModule from "typescript";
import { Program, SourceFile, TypeChecker } from "typescript";
import * as tsServer from "typescript/lib/tsserverlibrary";
import { analyzeComponents, analyzeLibDomHtmlElement } from "web-component-analyzer";
import { convertAnalyzeResultToHtmlCollection, convertComponentDeclarationToHtmlTag } from "../parsing/convert-component-definitions-to-html-collection";
import { parseDependencies } from "../parsing/parse-dependencies/parse-dependencies";
import { TextDocument } from "../parsing/text-document/text-document";
import { LitPluginConfig, makeConfig } from "../state/lit-plugin-config";
import { changedSourceFileIterator } from "../util/changed-source-file-iterator";
import { AnalyzerDefinitionStore } from "./store/analyzer-definition-store";
import { AnalyzerDependencyStore } from "./store/analyzer-dependency-store";
import { AnalyzerDocumentStore } from "./store/analyzer-document-store";
import { AnalyzerHtmlStore } from "./store/analyzer-html-store";
import { DefaultAnalyzerDefinitionStore } from "./store/definition-store/default-analyzer-definition-store";
import { DefaultAnalyzerDependencyStore } from "./store/dependency-store/default-analyzer-dependency-store";
import { DefaultAnalyzerDocumentStore } from "./store/document-store/default-analyzer-document-store";
import { DefaultAnalyzerHtmlStore } from "./store/html-store/default-analyzer-html-store";
import { HtmlDataSourceKind } from "./store/html-store/html-data-source-merged";

export interface LitAnalyzerLogger {
	debug(...args: any[]): void;
	error(...args: any[]): void;
	warn(...args: any[]): void;
	verbose(...args: any[]): void;
}

export interface LitAnalyzerContext {
	readonly ts: typeof tsModule;
	readonly program: Program;
	readonly project: tsServer.server.Project;
	readonly config: LitPluginConfig;
	readonly htmlStore: AnalyzerHtmlStore;
	readonly dependencyStore: AnalyzerDependencyStore;
	readonly documentStore: AnalyzerDocumentStore;
	readonly definitionStore: AnalyzerDefinitionStore;
	readonly logger: LitAnalyzerLogger;
	updateConfig(config: LitPluginConfig): void;
	updateDependencies(file: SourceFile): void;
	updateComponents(file: SourceFile): void;
}

export interface LitAnalyzerRequest extends LitAnalyzerContext {
	file: SourceFile;
	document: TextDocument;
}

export interface LitPluginContextHandler {
	ts: typeof tsModule;
	getProgram(): Program;
	getProject(): tsServer.server.Project;
}

export class DefaultLitAnalyzerContext implements LitAnalyzerContext {
	protected componentSourceFileIterator = changedSourceFileIterator();
	protected hasAnalyzedSubclassExtensions = false;
	protected _config: LitPluginConfig = makeConfig({});

	get ts() {
		return this.handler.ts;
	}

	get program(): Program {
		return this.handler.getProgram();
	}

	get project(): tsServer.server.Project {
		return this.handler.getProject();
	}

	get config(): LitPluginConfig {
		return this._config;
	}

	readonly htmlStore = new DefaultAnalyzerHtmlStore();
	readonly dependencyStore = new DefaultAnalyzerDependencyStore();
	readonly documentStore = new DefaultAnalyzerDocumentStore();
	readonly definitionStore = new DefaultAnalyzerDefinitionStore();
	readonly logger = {
		debug(...args): void {},
		error(...args): void {},
		verbose(...args): void {},
		warn(...args): void {}
	} as LitAnalyzerLogger;

	public updateConfig(config: LitPluginConfig) {
		this._config = config;
	}

	updateDependencies(file: SourceFile): void {
		this.findDependenciesInFile(file);
	}

	updateComponents(file: SourceFile): void {
		this.findInvalidatedComponents();
		this.analyzeSubclassExtensions();
	}

	private get checker(): TypeChecker {
		return this.program.getTypeChecker();
	}

	constructor(private handler: LitPluginContextHandler) {}

	private findInvalidatedComponents() {
		const seenFiles = new WeakSet<SourceFile>();
		const invalidatedFiles = new Set<SourceFile>();

		// Find components in all changed files
		for (const sourceFile of this.componentSourceFileIterator(this.program.getSourceFiles())) {
			seenFiles.add(sourceFile);

			this.definitionStore.getDefinitionsWithDeclarationInFile(sourceFile).forEach(definition => {
				const sf = this.program.getSourceFile(definition.node.getSourceFile().fileName);
				if (sf != null) {
					invalidatedFiles.add(sf);
				}
			});

			this.findComponentsInFile(sourceFile);
		}

		for (const sourceFile of invalidatedFiles) {
			if (!seenFiles.has(sourceFile)) {
				this.findComponentsInFile(sourceFile);
			}
		}
	}

	private findComponentsInFile(sourceFile: SourceFile) {
		const analyzeResult = analyzeComponents(sourceFile, {
			checker: this.checker,
			ts: this.ts,
			config: { diagnostics: true, analyzeLibDom: true, excludedDeclarationNames: ["HTMLElement"] }
		});

		// Forget
		const existingResult = this.definitionStore.getAnalysisResultForFile(sourceFile);
		if (existingResult != null) {
			this.htmlStore.forgetCollection(
				{
					tags: existingResult.componentDefinitions.map(d => d.tagName),
					events: existingResult.globalEvents.map(e => e.name),
					attrs: []
				},
				HtmlDataSourceKind.DECLARED
			);
			this.definitionStore.forgetAnalysisResultForFile(sourceFile);
		}

		// Absorb
		this.definitionStore.absorbAnalysisResult(sourceFile, analyzeResult);
		const htmlCollection = convertAnalyzeResultToHtmlCollection(analyzeResult, {
			checker: this.checker,
			addDeclarationPropertiesAsAttributes: true
		});
		this.htmlStore.absorbCollection(htmlCollection, HtmlDataSourceKind.DECLARED);
	}

	private analyzeSubclassExtensions() {
		if (this.hasAnalyzedSubclassExtensions) return;

		const result = analyzeLibDomHtmlElement(this.program, this.ts);
		if (result != null) {
			const extension = convertComponentDeclarationToHtmlTag(result, undefined, { checker: this.checker });
			this.htmlStore.absorbSubclassExtension("HTMLElement", extension);
			this.hasAnalyzedSubclassExtensions = true;
		}
	}

	private findDependenciesInFile(file: SourceFile) {
		if (this.config.skipMissingImports) return;

		// Build a graph of component dependencies
		const res = parseDependencies(file, this);
		this.dependencyStore.importedComponentDefinitionsInFile.set(file.fileName, res);
	}
}
