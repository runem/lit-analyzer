import { CodeFixAction, FormatCodeSettings, LanguageService, UserPreferences } from "typescript";
import { TsHtmlPluginStore } from "../../state/store";
import { getCodeFixFromHtmlTemplates } from "./get-code-fix-from-html-templates";

/**
 * Returns code fixes a specific position in a file.
 * This makes it possible to provide suggestions as "did you mean"
 * @param prevLangService
 * @param store
 */
export const getCodeFixesAtPosition = (prevLangService: LanguageService, store: TsHtmlPluginStore) => (
	fileName: string,
	start: number,
	end: number,
	errorCodes: ReadonlyArray<number>,
	formatOptions: FormatCodeSettings,
	preferences: UserPreferences
): ReadonlyArray<CodeFixAction> => {
	// Ask extensions for code fixes.
	const htmlTemplates = store.getHtmlTemplatesForFile(fileName);
	const customCodeFixes = getCodeFixFromHtmlTemplates(start, end, htmlTemplates, store);

	return [...(prevLangService.getCodeFixesAtPosition(fileName, start, end, errorCodes, formatOptions, preferences) || []), ...customCodeFixes];
};
