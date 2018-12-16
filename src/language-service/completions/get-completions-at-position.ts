import { CompletionInfo, GetCompletionsAtPositionOptions, LanguageService } from "typescript";
import { parseHtmlNodes } from "../../parse-html-nodes/parse-html-nodes";
import { TsHtmlPluginStore } from "../../state/store";
import { getHtmlPositionInSourceFile } from "../../util/get-html-position";
import { getCompletionInfoFromHtmlPosition } from "./get-completions-from-html-position";

/**
 * Returns completions at a position in a file.
 * This makes it possible to provide completions for tags and attributes.
 * @param prevLangService
 * @param store
 */
export const getCompletionsAtPosition = (prevLangService: LanguageService, store: TsHtmlPluginStore) => (
	fileName: string,
	position: number,
	options: GetCompletionsAtPositionOptions | undefined
): CompletionInfo | undefined => {
	// Get info from lang service
	const program = prevLangService.getProgram()!;
	const sourceFile = program.getSourceFile(fileName)!;

	// Parse html tags in the relevant source file
	// We want everything to be updated before proceeding.
	const reportResult = parseHtmlNodes(sourceFile, program.getTypeChecker(), store);
	store.absorbHtmlTemplateResult(sourceFile, reportResult);

	// Calculates the neighborhood of the cursors position in the html.
	const cursorPositionResult = getHtmlPositionInSourceFile(sourceFile, position, store);

	if (cursorPositionResult != null) {
		// Get completion info from the extensions
		const completionInfo = getCompletionInfoFromHtmlPosition(cursorPositionResult, store);
		if (completionInfo != null) return completionInfo;
	}

	return prevLangService.getCompletionsAtPosition(fileName, position, options);
};
