import { LitAnalyzer } from "lit-analyzer";
import {
	CodeFixAction,
	CompletionEntryDetails,
	CompletionInfo,
	DefinitionInfoAndBoundSpan,
	Diagnostic,
	JsxClosingTagInfo,
	LanguageService,
	OutliningSpan,
	Program,
	QuickInfo,
	RenameInfo,
	RenameLocation,
	SignatureHelpItems,
	TextChange
} from "typescript";
import { LitPluginContext } from "./lit-plugin-context.js";
import { translateCodeFixes } from "./translate/translate-code-fixes.js";
import { translateCompletionDetails } from "./translate/translate-completion-details.js";
import { translateCompletions } from "./translate/translate-completions.js";
import { translateDefinition } from "./translate/translate-definition.js";
import { translateDiagnostics } from "./translate/translate-diagnostics.js";
import { translateFormatEdits } from "./translate/translate-format-edits.js";
import { translateOutliningSpans } from "./translate/translate-outlining-spans.js";
import { translateQuickInfo } from "./translate/translate-quick-info.js";
import { translateRenameInfo } from "./translate/translate-rename-info.js";
import { translateRenameLocations } from "./translate/translate-rename-locations.js";

export class TsLitPlugin {
	private litAnalyzer = new LitAnalyzer(this.context);

	private get program(): Program {
		return this.prevLangService.getProgram()!;
	}

	constructor(private prevLangService: LanguageService, public readonly context: LitPluginContext) {}

	// All methods in this file use ...args because these methods should override
	// the methods on prevLangService, but that object may come from a future
	// version of TypeScript with more parameters, and we want to pass them
	// through in that case.

	getCompletionEntryDetails(...args: Parameters<LanguageService["getCompletionEntryDetails"]>): CompletionEntryDetails | undefined {
		const [fileName, position, name] = args;
		const file = this.program.getSourceFile(fileName)!;
		const result = this.litAnalyzer.getCompletionDetailsAtPosition(file, position, name);
		return (result && translateCompletionDetails(result, this.context)) || this.prevLangService.getCompletionEntryDetails(...args);
	}

	getCompletionsAtPosition(...args: Parameters<LanguageService["getCompletionsAtPosition"]>): CompletionInfo | undefined {
		const [fileName, position] = args;
		const file = this.program.getSourceFile(fileName)!;
		const result = this.litAnalyzer.getCompletionsAtPosition(file, position);
		return (result && translateCompletions(result)) || this.prevLangService.getCompletionsAtPosition(...args);
	}

	getSemanticDiagnostics(...args: Parameters<LanguageService["getSemanticDiagnostics"]>): Diagnostic[] {
		const [fileName] = args;
		const file = this.program.getSourceFile(fileName)!;

		const result = this.litAnalyzer.getDiagnosticsInFile(file);
		const prevResult = this.prevLangService.getSemanticDiagnostics(...args) || [];

		return [...prevResult, ...translateDiagnostics(result, file, this.context)];
	}

	getDefinitionAndBoundSpan(...args: Parameters<LanguageService["getDefinitionAndBoundSpan"]>): DefinitionInfoAndBoundSpan | undefined {
		const [fileName, position] = args;
		const file = this.program.getSourceFile(fileName)!;
		const definition = this.litAnalyzer.getDefinitionAtPosition(file, position);
		return (definition && translateDefinition(definition)) || this.prevLangService.getDefinitionAndBoundSpan(...args);
	}

	getCodeFixesAtPosition(...args: Parameters<LanguageService["getCodeFixesAtPosition"]>): readonly CodeFixAction[] {
		const [fileName, start, end] = args;
		const file = this.program.getSourceFile(fileName)!;

		const prevResult = this.prevLangService.getCodeFixesAtPosition(...args) || [];
		const codeFixes = translateCodeFixes(this.litAnalyzer.getCodeFixesAtPositionRange(file, { start, end }), file);

		return [...prevResult, ...codeFixes];
	}

	getQuickInfoAtPosition(...args: Parameters<LanguageService["getQuickInfoAtPosition"]>): QuickInfo | undefined {
		const [fileName, position] = args;
		const file = this.program.getSourceFile(fileName)!;
		const quickInfo = this.litAnalyzer.getQuickInfoAtPosition(file, position);
		return (quickInfo && translateQuickInfo(quickInfo)) || this.prevLangService.getQuickInfoAtPosition(...args);
	}

	getOutliningSpans(...args: Parameters<LanguageService["getOutliningSpans"]>): OutliningSpan[] {
		const [fileName] = args;
		const file = this.program.getSourceFile(fileName)!;

		const prev = this.prevLangService.getOutliningSpans(...args);
		const outliningSpans = translateOutliningSpans(this.litAnalyzer.getOutliningSpansInFile(file));

		return [...prev, ...outliningSpans];
	}

	getJsxClosingTagAtPosition(...args: Parameters<LanguageService["getJsxClosingTagAtPosition"]>): JsxClosingTagInfo | undefined {
		const [fileName, position] = args;
		const file = this.program.getSourceFile(fileName)!;
		const result = this.litAnalyzer.getClosingTagAtPosition(file, position);
		return result || this.prevLangService.getJsxClosingTagAtPosition(...args);
	}

	getSignatureHelpItems(...args: Parameters<LanguageService["getSignatureHelpItems"]>): SignatureHelpItems | undefined {
		const result = this.prevLangService.getSignatureHelpItems(...args);

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

	findRenameLocations(...args: Parameters<LanguageService["findRenameLocations"]>): readonly RenameLocation[] | undefined {
		const [fileName, position] = args;
		const file = this.program.getSourceFile(fileName)!;

		const prev = this.prevLangService.findRenameLocations(...args);
		const renameLocations = translateRenameLocations(this.litAnalyzer.getRenameLocationsAtPosition(file, position));

		if (prev == null) {
			return renameLocations;
		}

		return [...prev, ...renameLocations];
	}

	getRenameInfo(...args: Parameters<LanguageService["getRenameInfo"]>): RenameInfo {
		const [fileName, position] = args;
		const file = this.program.getSourceFile(fileName)!;
		const result = this.litAnalyzer.getRenameInfoAtPosition(file, position);
		return (result && translateRenameInfo(result)) || this.prevLangService.getRenameInfo(...args);
	}

	getFormattingEditsForRange(...args: Parameters<LanguageService["getFormattingEditsForRange"]>): TextChange[] {
		const [fileName, , , settings] = args;
		const prev = this.prevLangService.getFormattingEditsForRange(...args);
		// Return previous result if we need to skip formatting.
		if (this.context.config.format.disable) {
			return prev;
		}

		const file = this.program.getSourceFile(fileName)!;
		const edits = translateFormatEdits(this.litAnalyzer.getFormatEditsInFile(file, settings));

		return [...prev, ...edits];
	}
}
