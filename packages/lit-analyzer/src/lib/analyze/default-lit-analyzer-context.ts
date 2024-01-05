import * as tsMod from "typescript";
import { HostCancellationToken, Program, SourceFile, TypeChecker } from "typescript";
import * as tsServer from "typescript/lib/tsserverlibrary.js";
import { analyzeHTMLElement, analyzeSourceFile } from "web-component-analyzer";
import { ALL_RULES } from "../rules/all-rules.js";
import { MAX_RUNNING_TIME_PER_OPERATION } from "./constants.js";
import { getBuiltInHtmlCollection } from "./data/get-built-in-html-collection.js";
import { getUserConfigHtmlCollection } from "./data/get-user-config-html-collection.js";
import { isRuleDisabled, LitAnalyzerConfig, makeConfig } from "./lit-analyzer-config.js";
import { LitAnalyzerContext, LitAnalyzerContextBaseOptions, LitPluginContextHandler } from "./lit-analyzer-context.js";
import { DefaultLitAnalyzerLogger, LitAnalyzerLoggerLevel } from "./lit-analyzer-logger.js";
import {
	convertAnalyzeResultToHtmlCollection,
	convertComponentDeclarationToHtmlTag
} from "./parse/convert-component-definitions-to-html-collection.js";
import { parseDependencies } from "./parse/parse-dependencies/parse-dependencies.js";
import { RuleCollection } from "./rule-collection.js";
import { DefaultAnalyzerDefinitionStore } from "./store/definition-store/default-analyzer-definition-store.js";
import { DefaultAnalyzerDependencyStore } from "./store/dependency-store/default-analyzer-dependency-store.js";
import { DefaultAnalyzerDocumentStore } from "./store/document-store/default-analyzer-document-store.js";
import { DefaultAnalyzerHtmlStore } from "./store/html-store/default-analyzer-html-store.js";
import { HtmlDataSourceKind } from "./store/html-store/html-data-source-merged.js";
import { changedSourceFileIterator } from "./util/changed-source-file-iterator.js";

export class DefaultLitAnalyzerContext implements LitAnalyzerContext {
	protected componentSourceFileIterator = changedSourceFileIterator();
	protected hasAnalyzedSubclassExtensions = false;
	protected _config: LitAnalyzerConfig = makeConfig({});

	get ts(): typeof tsMod {
		return this.handler.ts || tsMod;
	}

	get program(): Program {
		return this.handler.getProgram();
	}

	get project(): tsServer.server.Project | undefined {
		return this.handler.getProject != null ? this.handler.getProject() : undefined;
	}

	get config(): LitAnalyzerConfig {
		return this._config;
	}

	private _currentStartTime = Date.now();
	private _currentTimeout = MAX_RUNNING_TIME_PER_OPERATION;
	get currentRunningTime(): number {
		return Date.now() - this._currentStartTime;
	}

	private _currentCancellationToken: HostCancellationToken | undefined = undefined;
	private _hasRequestedCancellation = false;
	private _throwOnRequestedCancellation = false;
	get isCancellationRequested(): boolean {
		if (this._hasRequestedCancellation) {
			return true;
		}

		if (this._currentCancellationToken == null) {
			// Never cancel if "cancellation token" is not present
			// This means that we are in a CLI context, and are willing to wait for the operation to finish for correctness reasons
			return false;
		}

		if (this._currentCancellationToken?.isCancellationRequested()) {
			if (!this._hasRequestedCancellation) {
				this.logger.error("Cancelling current operation because project host has requested cancellation");
			}

			this._hasRequestedCancellation = true;
		}

		if (this.currentRunningTime > this._currentTimeout) {
			if (!this._hasRequestedCancellation) {
				this.logger.error(
					`Cancelling current operation because it has been running for more than ${this._currentTimeout}ms (${this.currentRunningTime}ms)`
				);
			}

			this._hasRequestedCancellation = true;
		}

		// Throw if necessary
		if (this._hasRequestedCancellation && this._throwOnRequestedCancellation) {
			throw new this.ts.OperationCanceledException();
		}

		return this._hasRequestedCancellation;
	}

	private _currentFile: SourceFile | undefined;
	get currentFile(): SourceFile {
		if (this._currentFile == null) {
			throw new Error("Current file is not set");
		}

		return this._currentFile;
	}

	readonly htmlStore = new DefaultAnalyzerHtmlStore();
	readonly dependencyStore = new DefaultAnalyzerDependencyStore();
	readonly documentStore = new DefaultAnalyzerDocumentStore();
	readonly definitionStore = new DefaultAnalyzerDefinitionStore();
	readonly logger = new DefaultLitAnalyzerLogger();

	private _rules: RuleCollection | undefined;
	get rules(): RuleCollection {
		if (this._rules == null) {
			this._rules = new RuleCollection();
			this._rules.push(...ALL_RULES);
		}

		return this._rules;
	}

	setContextBase({ file, timeout, throwOnCancellation }: LitAnalyzerContextBaseOptions): void {
		this._currentFile = file;
		this._currentStartTime = Date.now();
		this._currentTimeout = timeout ?? MAX_RUNNING_TIME_PER_OPERATION;
		this._currentCancellationToken = this.project?.getCancellationToken();
		this._throwOnRequestedCancellation = throwOnCancellation ?? false;
		this._hasRequestedCancellation = false;
	}

	updateConfig(config: LitAnalyzerConfig): void {
		this._config = config;

		this.logger.level = (() => {
			switch (config.logging) {
				case "off":
					return LitAnalyzerLoggerLevel.OFF;
				case "error":
					return LitAnalyzerLoggerLevel.ERROR;
				case "warn":
					return LitAnalyzerLoggerLevel.WARN;
				case "debug":
					return LitAnalyzerLoggerLevel.DEBUG;
				case "verbose":
					return LitAnalyzerLoggerLevel.VERBOSE;
				default:
					return LitAnalyzerLoggerLevel.OFF;
			}
		})();

		// Add user configured HTML5 collection
		const collection = getUserConfigHtmlCollection(config);
		this.htmlStore.absorbCollection(collection, HtmlDataSourceKind.USER);
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

	constructor(private handler: LitPluginContextHandler) {
		// Add all HTML5 tags and attributes
		const builtInCollection = getBuiltInHtmlCollection();
		this.htmlStore.absorbCollection(builtInCollection, HtmlDataSourceKind.BUILT_IN);
	}

	private findInvalidatedComponents() {
		const startTime = Date.now();

		const seenFiles = new Set<SourceFile>();
		const invalidatedFiles = new Set<SourceFile>();

		const getRunningTime = () => {
			return Date.now() - startTime;
		};

		// Find components in all changed files
		for (const sourceFile of this.componentSourceFileIterator(this.program.getSourceFiles())) {
			if (this.isCancellationRequested) {
				break;
			}

			seenFiles.add(sourceFile);

			// All components definitions that use this file must be invidalited
			this.definitionStore.getDefinitionsWithDeclarationInFile(sourceFile).forEach(definition => {
				const sf = this.program.getSourceFile(definition.sourceFile.fileName);
				if (sf != null) {
					invalidatedFiles.add(sf);
				}
			});

			this.logger.debug(`Analyzing components in ${sourceFile.fileName} (changed) (${getRunningTime()}ms total)`);
			this.findComponentsInFile(sourceFile);
		}

		for (const sourceFile of invalidatedFiles) {
			if (this.isCancellationRequested) {
				break;
			}

			if (!seenFiles.has(sourceFile)) {
				seenFiles.add(sourceFile);

				this.logger.debug(`Analyzing components in ${sourceFile.fileName} (invalidated) (${getRunningTime()}ms total)`);
				this.findComponentsInFile(sourceFile);
			}
		}

		this.logger.verbose(`Analyzed ${seenFiles.size} files (${invalidatedFiles.size} invalidated) in ${getRunningTime()}ms`);
	}

	private findComponentsInFile(sourceFile: SourceFile) {
		const isDefaultLibrary = this.program.isSourceFileDefaultLibrary(sourceFile);
		const isExternalLibrary = this.program.isSourceFileFromExternalLibrary(sourceFile);

		// Only analyzing specific default libs of interest can save us up to 500ms in startup time
		if (
			(isDefaultLibrary && sourceFile.fileName.match(/(lib\.dom\.d\.ts)/) == null) ||
			(isExternalLibrary && sourceFile.fileName.match(/(@types\/node)/) != null)
		) {
			return;
		}

		const analyzeResult = analyzeSourceFile(sourceFile, {
			program: this.program,
			ts: this.ts,
			config: {
				features: ["event", "member", "slot", "csspart", "cssproperty"],
				analyzeGlobalFeatures: !isDefaultLibrary, // Don't analyze global features in lib.dom.d.ts
				analyzeDefaultLib: true,
				analyzeDependencies: true,
				analyzeAllDeclarations: false,
				excludedDeclarationNames: ["HTMLElement"]
			}
		});

		const reg = isDefaultLibrary ? HtmlDataSourceKind.BUILT_IN_DECLARED : HtmlDataSourceKind.DECLARED;

		// Forget
		const existingResult = this.definitionStore.getAnalysisResultForFile(sourceFile);
		if (existingResult != null) {
			this.htmlStore.forgetCollection(
				{
					tags: existingResult.componentDefinitions.map(d => d.tagName),
					global: {
						events: existingResult.globalFeatures?.events.map(e => e.name),
						slots: existingResult.globalFeatures?.slots.map(s => s.name || ""),
						cssParts: existingResult.globalFeatures?.cssParts.map(s => s.name || ""),
						cssProperties: existingResult.globalFeatures?.cssProperties.map(s => s.name || ""),
						attributes: existingResult.globalFeatures?.members.filter(m => m.kind === "attribute").map(m => m.attrName || ""),
						properties: existingResult.globalFeatures?.members.filter(m => m.kind === "property").map(m => m.propName || "")
					}
				},
				reg
			);
			this.definitionStore.forgetAnalysisResultForFile(sourceFile);
		}

		// Absorb
		this.definitionStore.absorbAnalysisResult(sourceFile, analyzeResult);
		const htmlCollection = convertAnalyzeResultToHtmlCollection(analyzeResult, {
			checker: this.checker,
			addDeclarationPropertiesAsAttributes: this.program.isSourceFileFromExternalLibrary(sourceFile)
		});
		this.htmlStore.absorbCollection(htmlCollection, reg);
	}

	private analyzeSubclassExtensions() {
		if (this.hasAnalyzedSubclassExtensions) return;

		const result = analyzeHTMLElement(this.program, this.ts);
		if (result != null) {
			const extension = convertComponentDeclarationToHtmlTag(result, undefined, { checker: this.checker });
			this.htmlStore.absorbSubclassExtension("HTMLElement", extension);
			this.hasAnalyzedSubclassExtensions = true;
		}
	}

	private findDependenciesInFile(file: SourceFile) {
		if (isRuleDisabled(this.config, "no-missing-import")) return;

		// Build a graph of component dependencies
		const res = parseDependencies(file, this);
		this.dependencyStore.absorbComponentDefinitionsForFile(file, res);
	}
}
