import { SimpleType, SimpleTypeFunctionParameter, toSimpleType } from "ts-simple-type";
import * as tsMod from "typescript";
import { HostCancellationToken, Program, SourceFile, TypeChecker, SymbolFlags, displayPartsToString, Symbol, Node } from "typescript";
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
import { HtmlDataCollection, HtmlTag, HtmlProp, HtmlAttr } from "./parse/parse-html-data/html-tag.js";
import { parseDependencies } from "./parse/parse-dependencies/parse-dependencies.js";
import { RuleCollection } from "./rule-collection.js";
import { DefaultAnalyzerDefinitionStore } from "./store/definition-store/default-analyzer-definition-store.js";
import { DefaultAnalyzerDependencyStore } from "./store/dependency-store/default-analyzer-dependency-store.js";
import { DefaultAnalyzerDocumentStore } from "./store/document-store/default-analyzer-document-store.js";
import { DefaultAnalyzerHtmlStore } from "./store/html-store/default-analyzer-html-store.js";
import { HtmlDataSourceKind } from "./store/html-store/html-data-source-merged.js";
import { changedSourceFileIterator } from "./util/changed-source-file-iterator.js";
import { lazy } from "./util/general-util.js";

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

		// Refine types using HTMLElementTagNameMap specific to the source file context
		this.refineHtmlCollection(htmlCollection, sourceFile);

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

	/**
	 * Refines the types of the HTML tags in the collection by looking up the tag name in the
	 * HTMLElementTagNameMap interface. This allows resolving generic types that are instanced
	 * in the map (e.g. "my-generic": GenericElement<{ foo: string }>).
	 */
	private refineHtmlCollection(collection: HtmlDataCollection, sourceFile: SourceFile): void {
		const checker = this.checker;
		// Try to find the HTMLElementTagNameMap symbol
		const mapSymbol = (checker as unknown as ExtendedTypeChecker).resolveName("HTMLElementTagNameMap", sourceFile, SymbolFlags.Interface, false);
		if (!mapSymbol) {
			return;
		}

		// Get the type of the map (this includes merged declarations)
		const mapType = checker.getDeclaredTypeOfSymbol(mapSymbol);

		// properties of the map are the tag names
		const mapProperties = checker.getPropertiesOfType(mapType);

		for (const prop of mapProperties) {
			const tagName = prop.getName();

			// Find if we have a tag for this name in our collection
			let tag: HtmlTag | undefined = collection.tags.find(t => t.tagName === tagName);

			// Get the specific type of this element from the map property.
			// We use the property's value declaration to get the type.
			// If there are multiple declarations, one of them should suffice as the interface is merged,
			// but specifically for the property type, we want the type of the member.
			const declaration = prop.valueDeclaration || (prop.declarations && prop.declarations[0]);
			if (!declaration) continue;

			const elementType = checker.getTypeOfSymbolAtLocation(prop, declaration);

			if (!tag) {
				// If the tag is not found, we create it from the type in the map.
				// This handles cases where the element is only declared in the map but not defined in code (or WCA failed to find it).
				tag = {
					tagName,
					attributes: [],
					properties: [],
					events: [],
					slots: [],
					cssParts: [],
					cssProperties: [],
					builtIn: false
				};
				collection.tags.push(tag);

				// Populate properties from the type
				const elementProperties = checker.getPropertiesOfType(elementType);
				for (const symbol of elementProperties) {
					const symbolDecl = symbol.valueDeclaration || (symbol.declarations && symbol.declarations[0]);

					// Skip if declaration is in default lib (e.g. HTMLElement properties) to avoid duplications/noise
					// We assume global/built-in tags cover these.
					if (symbolDecl) {
						const fileName = symbolDecl.getSourceFile().fileName;
						if (fileName.includes("lib.dom.d.ts") || fileName.includes("lib.es5.d.ts")) {
							continue;
						}

						// Also skip methods as they are usually not properties we bind to
						const type = checker.getTypeOfSymbolAtLocation(symbol, symbolDecl);
						if (type.getCallSignatures().length > 0) {
							continue;
						}

						const htmlProp: HtmlProp = {
							kind: "property",
							name: symbol.getName(),
							description: displayPartsToString(symbol.getDocumentationComment(checker)),
							getType: lazy(() => {
								return toSimpleType(type, checker);
							})
						};
						tag.properties.push(htmlProp);

						tag.attributes.push({
							kind: "attribute",
							name: symbol.getName(),
							description: htmlProp.description,
							getType: htmlProp.getType
						} as HtmlAttr);
					}
				}
			}

			// Now we want to update the properties of 'tag' to use 'elementType' for type resolution.
			tag.properties.forEach(htmlProp => {
				// Find the property in the elementType
				const elementPropSymbol = checker.getPropertyOfType(elementType, htmlProp.name);

				if (elementPropSymbol) {
					// We found the property on the instantiated element type.
					// We need to capture the *instantiated* type of this property.

					// We create a new lazy getType function that resolves the type from the instantiated element.
					htmlProp.getType = () => {
						// We need a location to resolve the type. Using the declaration of the property itself is usually best.
						// However, getTypeOfSymbolAtLocation requires a node.
						const propDecl = elementPropSymbol.valueDeclaration || (elementPropSymbol.declarations && elementPropSymbol.declarations[0]);

						let simpleType: SimpleType;
						if (!propDecl) {
							// Fallback if no declaration (e.g. synthetic), though unlikely for class members.
							simpleType = toSimpleType(checker.getTypeOfSymbolAtLocation(elementPropSymbol, declaration), checker);
						} else {
							simpleType = toSimpleType(checker.getTypeOfSymbolAtLocation(elementPropSymbol, propDecl), checker);
						}

						// Attempt to instantiate generic types if the element type is generic
						const simpleElementType = toSimpleType(elementType, checker);
						if (
							simpleElementType.kind === "GENERIC_ARGUMENTS" &&
							simpleElementType.target.kind === "CLASS" &&
							simpleElementType.target.typeParameters
						) {
							const typeParams = simpleElementType.target.typeParameters;
							const typeArgs = simpleElementType.typeArguments;
							if (typeParams.length === typeArgs.length) {
								const map = new Map<string, SimpleType>();
								typeParams.forEach((param, i) => {
									map.set(param.name, typeArgs[i]);
								});
								return substituteSimpleType(simpleType, map);
							}
						}
						return simpleType;
					};
				}
			});
		}
	}
}

/**
 * Internal interface to access private TypeScript APIs.
 * `resolveName` is used to find symbols (like HTMLElementTagNameMap) in a specific scope.
 */
interface ExtendedTypeChecker extends TypeChecker {
	resolveName(name: string, location: Node | undefined, meaning: SymbolFlags, excludeGlobals: boolean): Symbol | undefined;
}

function substituteSimpleType(type: SimpleType, map: Map<string, SimpleType>): SimpleType {
	switch (type.kind) {
		case "GENERIC_PARAMETER":
			return map.get(type.name) || type;
		case "UNION":
			return { ...type, types: type.types.map((t: SimpleType) => substituteSimpleType(t, map)) };
		case "INTERSECTION":
			return { ...type, types: type.types.map((t: SimpleType) => substituteSimpleType(t, map)) };
		case "ARRAY":
			return { ...type, type: substituteSimpleType(type.type, map) };
		case "PROMISE":
			return { ...type, type: substituteSimpleType(type.type, map) };
		case "GENERIC_ARGUMENTS":
			return {
				...type,
				target: substituteSimpleType(type.target, map),
				typeArguments: type.typeArguments.map((t: SimpleType) => substituteSimpleType(t, map))
			};
		case "FUNCTION":
			return {
				...type,
				returnType: type.returnType ? substituteSimpleType(type.returnType, map) : undefined,
				parameters: type.parameters
					? type.parameters.map((p: SimpleTypeFunctionParameter) => ({ ...p, type: substituteSimpleType(p.type, map) }))
					: undefined
			};
		case "METHOD":
			return {
				...type,
				returnType: substituteSimpleType(type.returnType, map),
				parameters: type.parameters.map((p: SimpleTypeFunctionParameter) => ({ ...p, type: substituteSimpleType(p.type, map) }))
			};
		// Add other types as needed
		default:
			return type;
	}
}
