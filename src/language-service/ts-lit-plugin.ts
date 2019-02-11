import {
	CodeFixAction,
	CompletionInfo,
	DefinitionInfoAndBoundSpan,
	FormatCodeSettings,
	GetCompletionsAtPositionOptions,
	JsxClosingTagInfo,
	LanguageService,
	Program,
	QuickInfo,
	SourceFile,
	TextChange,
	TypeChecker,
	UserPreferences
} from "typescript";
import { HtmlDocumentCollection } from "../html-document/html-document-collection";
import { parseHTMLDocuments } from "../html-document/parse-html-document";
import { parseComponents } from "../parse-components/parse-components";
import { parseDependencies } from "../parse-dependencies/parse-dependencies";
import { Config } from "../state/config";
import { TsLitPluginStore } from "../state/store";
import { changedSourceFileIterator } from "../util/changed-source-file-iterator";
import { getHtmlPositionInHtmlDocument } from "../util/get-html-position";
import { logger } from "../util/logger";
import { flatten } from "../util/util";
import { validateHTMLDocuments } from "../validate-html-document/validate-html-document";
import { parseVirtualDocuments } from "../virtual-document/parse-virtual-documents";
import { VscodeHtmlServiceWrapper } from "../vscode-html-languageservice/vscode-html-service-wrapper";
import { getCodeFixFromHtmlDocument } from "./code-fixes/get-code-fix-from-html-document";
import { getCompletionInfoFromHtmlPosition } from "./completions/get-completions-from-html-position";
import { getDefinitionAndBoundSpanFromHtmlDocument } from "./definition-and-bound-span/get-definition-and-bound-span-from-html-document";
import { getQuickInfoFromHtmlDocument } from "./quick-info/get-quick-info-from-html-document";
import { getDiagnosticsFromHtmlDocuments } from "./semantic-diagnostics/get-diagnostics-from-html-documents";

export class TsLitPlugin {
	currentPrimarySourceFile: SourceFile | undefined;
	primarySourceFileIterator = changedSourceFileIterator();
	secondarySourceFileIterator = changedSourceFileIterator();

	get config() {
		return this.store.config;
	}

	set config(config: Config) {
		logger.verbose("Updating the config", config);
		this.store.config = config;
	}

	private get program(): Program {
		return this.prevLangService.getProgram()!;
	}

	private get checker(): TypeChecker {
		return this.program.getTypeChecker();
	}

	constructor(private prevLangService: LanguageService, private store: TsLitPluginStore) {}

	getCompletionsAtPosition(fileName: string, position: number, options: GetCompletionsAtPositionOptions | undefined): CompletionInfo | undefined {
		this.updateFromFile(fileName);

		const prevResult = this.prevLangService.getCompletionsAtPosition(fileName, position, options);
		if (this.config.disable) return prevResult;

		// Calculates the neighborhood of the cursors position in the html.
		const sourceFile = this.program.getSourceFile(fileName)!;
		const collection = this.store.getDocumentsCollectionForFile(sourceFile);
		const htmlDocument = collection.intersectingHtmlDocument(position);
		if (htmlDocument != null) {
			const cursorPositionResult = getHtmlPositionInHtmlDocument(htmlDocument, position);

			// Get completion info from the extensions
			const completionInfo = getCompletionInfoFromHtmlPosition(cursorPositionResult, this.store);
			if (completionInfo != null) return completionInfo;
		}

		return prevResult;
	}

	getCodeFixesAtPosition(
		fileName: string,
		start: number,
		end: number,
		errorCodes: ReadonlyArray<number>,
		formatOptions: FormatCodeSettings,
		preferences: UserPreferences
	): ReadonlyArray<CodeFixAction> {
		this.updateFromFile(fileName);

		const prevResult = this.prevLangService.getCodeFixesAtPosition(fileName, start, end, errorCodes, formatOptions, preferences) || [];
		if (this.config.disable) return prevResult;

		const sourceFile = this.program.getSourceFile(fileName)!;
		const collection = this.store.getDocumentsCollectionForFile(sourceFile);
		const htmlDocument = collection.intersectingHtmlDocument({ start, end });

		const codeFixes = htmlDocument == null ? [] : getCodeFixFromHtmlDocument(start, end, htmlDocument, this.store);

		return [...prevResult, ...codeFixes];
	}

	getJsxClosingTagAtPosition(fileName: string, position: number): JsxClosingTagInfo | undefined {
		this.updateFromFile(fileName);

		const prevResult = this.prevLangService.getJsxClosingTagAtPosition(fileName, position);
		if (this.config.disable) return prevResult;

		const sourceFile = this.program.getSourceFile(fileName)!;
		const collection = this.store.getDocumentsCollectionForFile(sourceFile);
		const htmlDocument = collection.intersectingHtmlDocument(position);
		if (htmlDocument == null) return prevResult;

		const wrapper = new VscodeHtmlServiceWrapper(htmlDocument);
		const result = wrapper.doTagComplete(position);
		return result || prevResult;
	}

	getDefinitionAndBoundSpan(fileName: string, position: number): DefinitionInfoAndBoundSpan | undefined {
		this.updateFromFile(fileName);

		const prevResult = this.prevLangService.getDefinitionAndBoundSpan(fileName, position);
		if (this.config.disable) return prevResult;

		const sourceFile = this.program.getSourceFile(fileName)!;
		const collection = this.store.getDocumentsCollectionForFile(sourceFile);
		const htmlDocument = collection.intersectingHtmlDocument(position);
		if (htmlDocument == null) return prevResult;

		const definition = getDefinitionAndBoundSpanFromHtmlDocument(position, htmlDocument, this.store);
		return definition || prevResult;
	}

	getFormattingEditsForRange(fileName: string, start: number, end: number, settings: FormatCodeSettings): TextChange[] {
		const prev = this.prevLangService.getFormattingEditsForRange(fileName, start, end, settings);

		// Return previous result if we need to skip formatting.
		if (this.config.disable || this.config.format.disable) {
			return prev;
		}

		this.updateFromFile(fileName);

		const sourceFile = this.program.getSourceFile(fileName)!;
		const collection = this.store.getDocumentsCollectionForFile(sourceFile);

		const edits = flatten(collection.htmlDocuments.map(htmlDocument => new VscodeHtmlServiceWrapper(htmlDocument).format(settings)));

		return [...prev, ...edits];
	}

	getQuickInfoAtPosition(fileName: string, position: number): QuickInfo | undefined {
		this.updateFromFile(fileName);

		const prevResult = this.prevLangService.getQuickInfoAtPosition(fileName, position);
		if (this.config.disable) return prevResult;

		// Get quick info from extensions.
		const sourceFile = this.program.getSourceFile(fileName)!;
		const collection = this.store.getDocumentsCollectionForFile(sourceFile);
		const htmlDocument = collection.intersectingHtmlDocument(position);
		if (htmlDocument == null) return;

		const quickInfo = getQuickInfoFromHtmlDocument(position, htmlDocument, this.checker, this.store);
		return quickInfo || prevResult;
	}

	getSemanticDiagnostics(fileName: string) {
		this.updateFromFile(fileName);

		const prevResult = this.prevLangService.getSemanticDiagnostics(fileName);
		if (this.config.disable) return prevResult;

		const sourceFile = this.program.getSourceFile(fileName)!;
		const collection = this.store.getDocumentsCollectionForFile(sourceFile);
		const diagnostics = getDiagnosticsFromHtmlDocuments(collection, this.store);

		return [...(prevResult || []), ...diagnostics];
	}

	private updateFromFile(file: SourceFile | string) {
		const primarySourceFile = typeof file === "string" ? this.program.getSourceFile(file)! : file;

		// Find components in all changed files
		for (const sourceFile of this.secondarySourceFileIterator(this.program.getSourceFiles())) {
			this.findComponents(sourceFile);
		}

		// Update more detailed information for the primary source file if it has changed
		// Force update if primarySource file has been changed.
		for (const sourceFile of this.currentPrimarySourceFile !== primarySourceFile ? [primarySourceFile] : this.primarySourceFileIterator([primarySourceFile])) {
			this.findDependencies(sourceFile);
			this.findHtmlDocuments(sourceFile);
			this.validateHtmlDocuments(sourceFile);
		}

		this.currentPrimarySourceFile = primarySourceFile;
	}

	private validateHtmlDocuments(sourceFile: SourceFile) {
		const collection = this.store.getDocumentsCollectionForFile(sourceFile);
		for (const { source, reports } of validateHTMLDocuments(collection.htmlDocuments, this.checker, this.store)) {
			this.store.absorbReports(source, reports);
		}
	}

	private findHtmlDocuments(sourceFile: SourceFile) {
		// Parse html tags in the relevant source file
		const textDocuments = parseVirtualDocuments(sourceFile, this.checker, this.store);
		const htmlDocuments = parseHTMLDocuments(textDocuments, this.checker, this.store);

		const collection = new HtmlDocumentCollection(sourceFile, htmlDocuments, this.store.ts);
		this.store.absorbHtmlDocumentCollection(sourceFile, collection);
	}

	private findDependencies(sourceFile: SourceFile) {
		if (this.store.config.skipMissingImports) return;

		// Build a graph of component dependencies
		this.store.importedComponentsInFile = parseDependencies(sourceFile, this.store);
	}

	private findComponents(sourceFile: SourceFile) {
		const componentsFileResult = parseComponents(sourceFile, this.checker);
		this.store.invalidateSourceFile(sourceFile);
		this.store.absorbComponentsInFile(sourceFile, componentsFileResult);
	}
}
