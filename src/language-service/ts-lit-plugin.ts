import {
	CodeFixAction,
	CompletionEntryDetails,
	CompletionInfo,
	DefinitionInfoAndBoundSpan,
	FormatCodeOptions,
	FormatCodeSettings,
	GetCompletionsAtPositionOptions,
	JsxClosingTagInfo,
	LanguageService,
	Program,
	QuickInfo,
	SourceFile,
	TextChange,
	UserPreferences
} from "typescript";
import { DiagnosticsContext } from "../diagnostics/diagnostics-context";
import { LitTsService } from "../diagnostics/lit-ts-service";
import { getHtmlData } from "../get-html-data";
import { parseDocumentsInSourceFile } from "../parsing/parse-documents-in-source-file";
import { TextDocument } from "../parsing/text-document/text-document";
import { Config } from "../state/config";
import { TsLitPluginStore } from "../state/store";
import { logger } from "../util/logger";
import { StoreUpdater } from "./store-updater";

export class TsLitPlugin {
	private storeUpdater!: StoreUpdater;
	private litService = new LitTsService();

	get config() {
		return this.store.config;
	}

	set config(config: Config) {
		logger.debug("Updating the config", config);
		this.store.config = config;

		// Add all HTML5 tags and attributes
		const result = getHtmlData(config);
		this.store.absorbHtmlTags(result.tags);
		this.store.absorbGlobalHtmlAttributes(result.globalAttrs);
	}

	private get program(): Program {
		return this.prevLangService.getProgram()!;
	}

	constructor(private prevLangService: LanguageService, private store: TsLitPluginStore) {
		this.storeUpdater = new StoreUpdater(prevLangService, store);
	}

	getCompletionEntryDetails(
		fileName: string,
		position: number,
		name: string,
		formatOptions: FormatCodeOptions | FormatCodeSettings | undefined,
		source: string | undefined,
		preferences: UserPreferences | undefined
	): CompletionEntryDetails | undefined {
		const file = this.program.getSourceFile(fileName)!;
		const completionDetails = this.litService.getCompletionDetails(file, position, name, this.diagnosticContext(file));
		return completionDetails || this.prevLangService.getCompletionEntryDetails(fileName, position, name, formatOptions, source, preferences);
	}

	getCompletionsAtPosition(fileName: string, position: number, options: GetCompletionsAtPositionOptions | undefined): CompletionInfo | undefined {
		const file = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(file, ["cmps"]);

		const completionInfo = this.litService.getCompletions(file, position, this.diagnosticContext(file));

		return completionInfo || this.prevLangService.getCompletionsAtPosition(fileName, position, options);
	}

	getSemanticDiagnostics(fileName: string) {
		const file = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(file);

		const diagnostics = this.litService.getDiagnostics(file, this.diagnosticContext(file));
		const prevResult = this.prevLangService.getSemanticDiagnostics(fileName) || [];

		return [...prevResult, ...diagnostics];
	}

	getDefinitionAndBoundSpan(fileName: string, position: number): DefinitionInfoAndBoundSpan | undefined {
		const file = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(file, ["cmps"]);

		const definition = this.litService.getDefinition(file, position, this.diagnosticContext(file));

		return definition || this.prevLangService.getDefinitionAndBoundSpan(fileName, position);
	}

	getCodeFixesAtPosition(
		fileName: string,
		start: number,
		end: number,
		errorCodes: ReadonlyArray<number>,
		formatOptions: FormatCodeSettings,
		preferences: UserPreferences
	): ReadonlyArray<CodeFixAction> {
		const file = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(file);

		const prevResult = this.prevLangService.getCodeFixesAtPosition(fileName, start, end, errorCodes, formatOptions, preferences) || [];
		const codeFixes = this.litService.getCodeFixes(file, { start, end }, this.diagnosticContext(file));

		return [...prevResult, ...codeFixes];
	}

	getQuickInfoAtPosition(fileName: string, position: number): QuickInfo | undefined {
		const file = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(file);

		const quickInfo = this.litService.getQuickInfo(file, position, this.diagnosticContext(file));

		return quickInfo || this.prevLangService.getQuickInfoAtPosition(fileName, position);
	}

	getJsxClosingTagAtPosition(fileName: string, position: number): JsxClosingTagInfo | undefined {
		const file = this.program.getSourceFile(fileName)!;

		const closingTag = this.litService.getClosingTag(file, position, this.diagnosticContext(file));

		return closingTag || this.prevLangService.getJsxClosingTagAtPosition(fileName, position);
	}

	getFormattingEditsForRange(fileName: string, start: number, end: number, settings: FormatCodeSettings): TextChange[] {
		const prev = this.prevLangService.getFormattingEditsForRange(fileName, start, end, settings);

		// Return previous result if we need to skip formatting.
		if (this.config.format.disable) {
			return prev;
		}

		const file = this.program.getSourceFile(fileName)!;
		const edits = this.litService.format(file, settings, this.diagnosticContext(file));

		return [...prev, ...edits];
	}

	getDocumentAndOffsetAtPosition(sourceFile: SourceFile, position: number): { document: TextDocument | undefined; offset: number } {
		const document = parseDocumentsInSourceFile(
			sourceFile,
			{
				htmlTags: this.store.config.htmlTemplateTags,
				cssTags: this.store.config.cssTemplateTags
			},
			position
		);

		return {
			document,
			offset: document != null ? document.virtualDocument.scPositionToOffset(position) : -1
		};
	}

	/*
	 private getDocumentAtPosition(sourceFile: SourceFile, position: number): TextDocument | undefined {
	 return parseDocumentsInSourceFile(
	 sourceFile,
	 {
	 htmlTags: this.store.config.htmlTemplateTags,
	 cssTags: this.store.config.cssTemplateTags
	 },
	 position
	 );
	 }

	 private getDocumentsInFile(sourceFile: SourceFile) {
	 return parseDocumentsInSourceFile(sourceFile, {
	 htmlTags: this.store.config.htmlTemplateTags,
	 cssTags: this.store.config.cssTemplateTags
	 });
	 }*/

	getDocumentsInFile(sourceFile: SourceFile): TextDocument[] {
		return parseDocumentsInSourceFile(sourceFile, {
			htmlTags: this.store.config.htmlTemplateTags,
			cssTags: this.store.config.cssTemplateTags
		});
	}

	private diagnosticContext(sourceFile: SourceFile): DiagnosticsContext {
		return {
			sourceFile,
			store: this.store,
			checker: this.program.getTypeChecker()
		};
	}
}
