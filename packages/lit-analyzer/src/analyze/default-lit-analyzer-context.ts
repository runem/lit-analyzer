import * as tsMod from "typescript";
import { Program, SourceFile, TypeChecker } from "typescript";
import * as tsServer from "typescript/lib/tsserverlibrary";
import { analyzeComponents, analyzeLibDomHtmlElement } from "web-component-analyzer";
import { getBuiltInHtmlCollection } from "./data/get-built-in-html-collection";
import { getUserConfigHtmlCollection } from "./data/get-user-config-html-collection";
import noBooleanInAttributeBindingRule from "../rules/no-boolean-in-attribute-binding";
import noComplexAttributeBindingRule from "../rules/no-complex-attribute-binding";
import noExpressionlessPropertyBindingRule from "../rules/no-expressionless-property-binding";
import noIncompatibleTypeBindingRule from "../rules/no-incompatible-type-binding";
import noInvalidDirectiveBindingRule from "../rules/no-invalid-directive-binding";
import noUnintendedMixedBindingRule from "../rules/no-unintended-mixed-binding";
import noNoncallableEventBindingRule from "../rules/no-noncallable-event-binding";
import noNullableAttributeBindingRule from "../rules/no-nullable-attribute-binding";
import noUnknownSlotRule from "../rules/no-unknown-slot";
import noMissingImport from "../rules/no-missing-import";
import noUnclosedTag from "../rules/no-unclosed-tag";
import noUnknownTagName from "../rules/no-unknown-tag-name";
import noUnknownAttribute from "../rules/no-unknown-attribute";
import noUnknownProperty from "../rules/no-unknown-property";
import noUnknownEvent from "../rules/no-unknown-event";
import { RuleModule } from "./types/rule-module";
import { isRuleDisabled, LitAnalyzerConfig, makeConfig } from "./lit-analyzer-config";
import { LitAnalyzerContext, LitPluginContextHandler } from "./lit-analyzer-context";
import { DefaultLitAnalyzerLogger, LitAnalyzerLoggerLevel } from "./lit-analyzer-logger";
import { convertAnalyzeResultToHtmlCollection, convertComponentDeclarationToHtmlTag } from "./parse/convert-component-definitions-to-html-collection";
import { parseDependencies } from "./parse/parse-dependencies/parse-dependencies";
import { DefaultAnalyzerDefinitionStore } from "./store/definition-store/default-analyzer-definition-store";
import { DefaultAnalyzerDependencyStore } from "./store/dependency-store/default-analyzer-dependency-store";
import { DefaultAnalyzerDocumentStore } from "./store/document-store/default-analyzer-document-store";
import { DefaultAnalyzerHtmlStore } from "./store/html-store/default-analyzer-html-store";
import { HtmlDataSourceKind } from "./store/html-store/html-data-source-merged";
import { changedSourceFileIterator } from "./util/changed-source-file-iterator";

const rules: RuleModule[] = [
	noExpressionlessPropertyBindingRule,
	noUnintendedMixedBindingRule,
	noUnknownSlotRule,
	noNoncallableEventBindingRule,
	noNullableAttributeBindingRule,
	noComplexAttributeBindingRule,
	noBooleanInAttributeBindingRule,
	noInvalidDirectiveBindingRule,
	noIncompatibleTypeBindingRule,
	noMissingImport,
	noUnclosedTag,
	noUnknownTagName,
	noUnknownAttribute,
	noUnknownProperty,
	noUnknownEvent
];

export class DefaultLitAnalyzerContext implements LitAnalyzerContext {
	protected componentSourceFileIterator = changedSourceFileIterator();
	protected hasAnalyzedSubclassExtensions = false;
	protected _config: LitAnalyzerConfig = makeConfig({});

	get ts() {
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

	readonly htmlStore = new DefaultAnalyzerHtmlStore();
	readonly dependencyStore = new DefaultAnalyzerDependencyStore();
	readonly documentStore = new DefaultAnalyzerDocumentStore();
	readonly definitionStore = new DefaultAnalyzerDefinitionStore();
	readonly logger = new DefaultLitAnalyzerLogger();

	get rules(): RuleModule[] {
		return rules;
	}

	public updateConfig(config: LitAnalyzerConfig) {
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
		this.htmlStore.absorbCollection(builtInCollection, HtmlDataSourceKind.BUILD_IN);
	}

	private findInvalidatedComponents() {
		const seenFiles = new Set<SourceFile>();
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
				seenFiles.add(sourceFile);
				this.findComponentsInFile(sourceFile);
			}
		}

		this.logger.verbose(`Analyzed ${seenFiles.size} files (${invalidatedFiles.size} invalidated)`);
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
		if (isRuleDisabled(this.config, "no-missing-import")) return;

		// Build a graph of component dependencies
		const res = parseDependencies(file, this);
		this.dependencyStore.importedComponentDefinitionsInFile.set(file.fileName, res);
	}
}
