import { LanguageService, QuickInfo } from "typescript";
import { TsHtmlPluginStore } from "../../state/store";
import { getQuickInfoFromHtmlTemplates } from "./get-quick-info-from-html-templates";

/**
 * Returns quick info at position.
 * This makes it possible to get information about tags and attributes on hover.
 * @param prevLangService
 * @param store
 */
export const getQuickInfoAtPosition = (prevLangService: LanguageService, store: TsHtmlPluginStore) => (fileName: string, position: number): QuickInfo | undefined => {
	// Get program and checker
	const program = prevLangService.getProgram()!;
	const checker = program.getTypeChecker();

	// Get quick info from extensions.
	const htmlTemplates = store.getHtmlTemplatesForFile(fileName);
	const quickInfo = getQuickInfoFromHtmlTemplates(position, checker, htmlTemplates, store);

	return quickInfo || prevLangService.getQuickInfoAtPosition(fileName, position);
};
