import { DefinitionInfoAndBoundSpan, LanguageService } from "typescript";
import { TsHtmlPluginStore } from "../../state/store";
import { getDefinitionAndBoundSpanFromHtmlTemplates } from "./get-definition-and-bound-span-from-html-templates";

/**
 * Returns definitions and bound spans.
 * This makes it possible to "go to definition" for tags and attributes.
 * @param prevLangService
 * @param store
 */
export const getDefinitionAndBoundSpan = (prevLangService: LanguageService, store: TsHtmlPluginStore) => (fileName: string, position: number): DefinitionInfoAndBoundSpan | undefined => {
	const htmlTemplates = store.getHtmlTemplatesForFile(fileName);
	const definition = getDefinitionAndBoundSpanFromHtmlTemplates(position, htmlTemplates, store);
	return definition || prevLangService.getDefinitionAndBoundSpan(fileName, position);
};
