import { LitAnalyzer } from "lit-analyzer";
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
	OutliningSpan,
	Program,
	QuickInfo,
	RenameInfo,
	RenameInfoOptions,
	RenameLocation,
	SignatureHelpItems,
	SignatureHelpItemsOptions,
	TextChange,
	UserPreferences
} from "typescript";
import { LitPluginContext } from "./lit-plugin-context";
import { translateCodeFixes } from "./translate/translate-code-fixes";
import { translateCompletionDetails } from "./translate/translate-completion-details";
import { translateCompletions } from "./translate/translate-completions";
import { translateDefinition } from "./translate/translate-definition";
import { translateDiagnostics } from "./translate/translate-diagnostics";
import { translateFormatEdits } from "./translate/translate-format-edits";
import { translateOutliningSpans } from "./translate/translate-outlining-spans";
import { translateQuickInfo } from "./translate/translate-quick-info";
import { translateRenameInfo } from "./translate/translate-rename-info";
import { translateRenameLocations } from "./translate/translate-rename-locations";

export class TsLitPlugin {
	private litAnalyzer = new LitAnalyzer(this.context);

	private get program(): Program {
		return this.prevLangService.getProgram()!;
	}

	constructor(private prevLangService: LanguageService, public readonly context: LitPluginContext) {}

	getCompletionEntryDetails(
		fileName: string,
		position: number,
		name: string,
		formatOptions: FormatCodeOptions | FormatCodeSettings | undefined,
		source: string | undefined,
		preferences: UserPreferences | undefined
	): CompletionEntryDetails | undefined {
		const file = this.program.getSourceFile(fileName)!;
		const result = this.litAnalyzer.getCompletionDetailsAtPosition(file, position, name);
		return (
			(result && translateCompletionDetails(result, this.context)) ||
			this.prevLangService.getCompletionEntryDetails(fileName, position, name, formatOptions, source, preferences)
		);
	}

	getCompletionsAtPosition(fileName: string, position: number, options: GetCompletionsAtPositionOptions | undefined): CompletionInfo | undefined {
		const file = this.program.getSourceFile(fileName)!;
		const result = this.litAnalyzer.getCompletionsAtPosition(file, position);
		return (result && translateCompletions(result)) || this.prevLangService.getCompletionsAtPosition(fileName, position, options);
	}

	getSemanticDiagnostics(fileName: string) {
		const file = this.program.getSourceFile(fileName)!;

		const result = this.litAnalyzer.getDiagnosticsInFile(file);
		const prevResult = this.prevLangService.getSemanticDiagnostics(fileName) || [];

		return [...prevResult, ...translateDiagnostics(result, file, this.context)];
	}

	getDefinitionAndBoundSpan(fileName: string, position: number): DefinitionInfoAndBoundSpan | undefined {
		const file = this.program.getSourceFile(fileName)!;
		const definition = this.litAnalyzer.getDefinitionAtPosition(file, position);
		return (definition && translateDefinition(definition)) || this.prevLangService.getDefinitionAndBoundSpan(fileName, position);
	}

	getCodeFixesAtPosition(
		fileName: string,
		start: number,
		end: number,
		errorCodes: readonly number[],
		formatOptions: FormatCodeSettings,
		preferences: UserPreferences
	): readonly CodeFixAction[] {
		const file = this.program.getSourceFile(fileName)!;

		const prevResult = this.prevLangService.getCodeFixesAtPosition(fileName, start, end, errorCodes, formatOptions, preferences) || [];
		const codeFixes = translateCodeFixes(this.litAnalyzer.getCodeFixesAtPositionRange(file, { start, end }), file);

		return [...prevResult, ...codeFixes];
	}

	getQuickInfoAtPosition(fileName: string, position: number): QuickInfo | undefined {
		const file = this.program.getSourceFile(fileName)!;
		const quickInfo = this.litAnalyzer.getQuickInfoAtPosition(file, position);
		return (quickInfo && translateQuickInfo(quickInfo)) || this.prevLangService.getQuickInfoAtPosition(fileName, position);
	}

	getOutliningSpans(fileName: string): OutliningSpan[] {
		const file = this.program.getSourceFile(fileName)!;

		const prev = this.prevLangService.getOutliningSpans(fileName);
		const outliningSpans = translateOutliningSpans(this.litAnalyzer.getOutliningSpansInFile(file));

		return [...prev, ...outliningSpans];
	}

	getJsxClosingTagAtPosition(fileName: string, position: number): JsxClosingTagInfo | undefined {
		const file = this.program.getSourceFile(fileName)!;
		const result = this.litAnalyzer.getClosingTagAtPosition(file, position);
		return result || this.prevLangService.getJsxClosingTagAtPosition(fileName, position);
	}

	getSignatureHelpItems(fileName: string, position: number, options: SignatureHelpItemsOptions | undefined): SignatureHelpItems | undefined {
		const result = this.prevLangService.getSignatureHelpItems(fileName, position, options);

		// Test if the signature is "html" or "css
		// Don't return a signature if trying to show signature for the html/css tagged template literal
		if (result != null && result.items.length === 1) {
			const displayPart = result.items[0].prefixDisplayParts[0];
			if (displayPart.kind === "aliasName" && (displayPart.text === "html" || displayPart.text === "css")) {
				return undefined;
			}
		}

		return result;
	}

	findRenameLocations(
		fileName: string,
		position: number,
		findInStrings: boolean,
		findInComments: boolean,
		providePrefixAndSuffixTextForRename?: boolean
	): readonly RenameLocation[] | undefined {
		const file = this.program.getSourceFile(fileName)!;

		const prev = this.prevLangService.findRenameLocations(fileName, position, findInStrings, findInComments, providePrefixAndSuffixTextForRename);
		const renameLocations = translateRenameLocations(this.litAnalyzer.getRenameLocationsAtPosition(file, position));

		if (prev == null) {
			return renameLocations;
		}

		return [...prev, ...renameLocations];
	}

	getRenameInfo(fileName: string, position: number, options?: RenameInfoOptions): RenameInfo {
		const file = this.program.getSourceFile(fileName)!;
		const result = this.litAnalyzer.getRenameInfoAtPosition(file, position);
		return (result && translateRenameInfo(result)) || this.prevLangService.getRenameInfo(fileName, position, options);
	}

	getFormattingEditsForRange(fileName: string, start: number, end: number, settings: FormatCodeSettings): TextChange[] {
		const prev = this.prevLangService.getFormattingEditsForRange(fileName, start, end, settings);

		// Return previous result if we need to skip formatting.
		if (this.context.config.format.disable) {
			return prev;
		}

		const file = this.program.getSourceFile(fileName)!;
		const edits = translateFormatEdits(this.litAnalyzer.getFormatEditsInFile(file, settings));

		return [...prev, ...edits];
	}
}
