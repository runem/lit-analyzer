import {
	CodeFixAction,
	CompletionEntryDetails,
	CompletionInfo,
	DefinitionInfoAndBoundSpan,
	Diagnostic,
	FormatCodeOptions,
	FormatCodeSettings,
	GetCompletionsAtPositionOptions,
	JsxClosingTagInfo,
	LanguageService,
	OutliningSpan,
	Program,
	QuickInfo,
	SourceFile,
	TextChange,
	UserPreferences
} from "typescript";
import { DiagnosticsContext } from "../diagnostics/diagnostics-context";
import { LitTsService } from "../diagnostics/lit-ts-service";
import { getUserConfigHtmlCollection } from "../get-html-collection";
import { Config } from "../state/config";
import { HtmlStoreDataSource, TsLitPluginStore } from "../state/store";
import { logger, LoggingLevel } from "../util/logger";
import { StoreUpdater } from "./store-updater";

export class TsLitPlugin {
	private storeUpdater!: StoreUpdater;
	private litService = new LitTsService();

	get config() {
		return this.store.config;
	}

	set config(config: Config) {
		const hasChangedLogging = this.store.config.verbose !== config.verbose || this.store.config.cwd !== config.cwd;

		this.store.config = config;

		// Setup logging
		logger.cwd = config.cwd;
		logger.level = config.verbose ? LoggingLevel.VERBOSE : LoggingLevel.NONE;

		if (hasChangedLogging) {
			logger.resetLogs();
		}

		// Add user configured HTML5 collection
		const collection = getUserConfigHtmlCollection(config);
		this.store.absorbCollection(collection, HtmlStoreDataSource.USER);

		logger.debug("Updating the config", config);
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
		const analyzeDiagnostics = (this.store.sourceFileDiagnostics.get(file) || []).map(
			diagnostic =>
				({
					file,
					messageText: diagnostic.message,
					category: diagnostic.severity === "warning" ? this.store.ts.DiagnosticCategory.Warning : this.store.ts.DiagnosticCategory.Error,
					start: diagnostic.node.getStart(),
					length: diagnostic.node.getEnd() - diagnostic.node.getStart()
				} as Diagnostic)
		);
		const prevResult = this.prevLangService.getSemanticDiagnostics(fileName) || [];

		return [...prevResult, ...analyzeDiagnostics, ...diagnostics];
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

	getOutliningSpans(fileName: string): OutliningSpan[] {
		const file = this.program.getSourceFile(fileName)!;
		this.storeUpdater.update(file);

		const outliningSpans = this.litService.getOutliningSpans(file, this.diagnosticContext(file));

		const prev = this.prevLangService.getOutliningSpans(fileName);
		return [...prev, ...outliningSpans];
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

	private diagnosticContext(sourceFile: SourceFile): DiagnosticsContext {
		return {
			sourceFile,
			store: this.store,
			checker: this.program.getTypeChecker()
		};
	}
}
