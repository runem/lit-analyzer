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
	UserPreferences
} from "typescript";
import { DiagnosticsContext } from "../diagnostics/diagnostics-context";
import { DiagnosticsService } from "../diagnostics/diagnostics-service";
import { intersectingDocument, TextDocument } from "../parsing/text-document/text-document";
import { Config } from "../state/config";
import { TsLitPluginStore } from "../state/store";
import { Range } from "../types/range";
import { logger } from "../util/logger";
import { StoreUpdater } from "./store-updater";

export class TsLitPlugin {
	private storeUpdater!: StoreUpdater;
	private diagnostics = new DiagnosticsService();

	get config() {
		return this.store.config;
	}

	set config(config: Config) {
		logger.debug("Updating the config", config);
		this.store.config = config;
	}

	private get program(): Program {
		return this.prevLangService.getProgram()!;
	}

	constructor(private prevLangService: LanguageService, private store: TsLitPluginStore) {
		this.storeUpdater = new StoreUpdater(prevLangService, store);
	}

	getCompletionsAtPosition(fileName: string, position: number, options: GetCompletionsAtPositionOptions | undefined): CompletionInfo | undefined {
		const sourceFile = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(sourceFile, ["cmps", "docs"]);

		// Calculates the neighborhood of the cursors position in the html.
		const document = this.getIntersectingDocument(sourceFile, position);
		const completionInfo = document == null ? undefined : this.diagnostics.getCompletionInfoFromDocument(document, position, this.diagnosticContext(sourceFile));

		return completionInfo || this.prevLangService.getCompletionsAtPosition(fileName, position, options);
	}

	getCodeFixesAtPosition(
		fileName: string,
		start: number,
		end: number,
		errorCodes: ReadonlyArray<number>,
		formatOptions: FormatCodeSettings,
		preferences: UserPreferences
	): ReadonlyArray<CodeFixAction> {
		const sourceFile = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(sourceFile);

		const document = this.getIntersectingDocument(sourceFile, { start, end });
		const codeFixes = document == null ? [] : this.diagnostics.getCodeFixesFromDocument(document, start, end, this.diagnosticContext(sourceFile));

		const prevResult = this.prevLangService.getCodeFixesAtPosition(fileName, start, end, errorCodes, formatOptions, preferences) || [];

		return [...prevResult, ...codeFixes];
	}

	getJsxClosingTagAtPosition(fileName: string, position: number): JsxClosingTagInfo | undefined {
		const sourceFile = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(sourceFile, ["docs"]);

		const document = this.getIntersectingDocument(sourceFile, position);
		const closingTag = document == null ? undefined : this.diagnostics.getClosingTagFromDocument(document, position);

		return closingTag || this.prevLangService.getJsxClosingTagAtPosition(fileName, position);
	}

	getDefinitionAndBoundSpan(fileName: string, position: number): DefinitionInfoAndBoundSpan | undefined {
		const sourceFile = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(sourceFile, ["cmps", "docs"]);

		const document = this.getIntersectingDocument(sourceFile, position);
		const definition = document == null ? undefined : this.diagnostics.getDefinitionAndBoundSpanFromDocument(document, position, this.diagnosticContext(sourceFile));

		return definition || this.prevLangService.getDefinitionAndBoundSpan(fileName, position);
	}

	getFormattingEditsForRange(fileName: string, start: number, end: number, settings: FormatCodeSettings): TextChange[] {
		const prev = this.prevLangService.getFormattingEditsForRange(fileName, start, end, settings);

		// Return previous result if we need to skip formatting.
		if (this.config.format.disable) {
			return prev;
		}

		const sourceFile = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(sourceFile, ["docs"]);

		const documents = this.store.getDocumentsForFile(sourceFile);
		const edits = this.diagnostics.getFormattingEditsFromDocuments(documents, settings);

		return [...prev, ...edits];
	}

	getQuickInfoAtPosition(fileName: string, position: number): QuickInfo | undefined {
		const sourceFile = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(sourceFile);

		// Get quick info from extensions.
		const document = this.getIntersectingDocument(sourceFile, position);
		const quickInfo = document == null ? undefined : this.diagnostics.getQuickInfoFromDocument(document, position, this.diagnosticContext(sourceFile));

		return quickInfo || this.prevLangService.getQuickInfoAtPosition(fileName, position);
	}

	getSemanticDiagnostics(fileName: string) {
		const sourceFile = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(sourceFile);

		const documents = this.store.getDocumentsForFile(sourceFile);
		const diagnostics = this.diagnostics.getDiagnosticsFromDocuments(documents, this.diagnosticContext(sourceFile));

		const prevResult = this.prevLangService.getSemanticDiagnostics(fileName) || [];
		return [...prevResult, ...diagnostics];
	}

	private getIntersectingDocument(file: SourceFile, position: number | Range): TextDocument | undefined {
		return intersectingDocument(this.store.getDocumentsForFile(file), position);
	}

	private diagnosticContext(sourceFile: SourceFile): DiagnosticsContext {
		return {
			sourceFile,
			store: this.store,
			checker: this.program.getTypeChecker()
		};
	}
}
