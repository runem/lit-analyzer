import { JsxClosingTagInfo, LanguageService } from "typescript";
import { parseHtmlNodes } from "../../parse-html-nodes/parse-html-nodes";
import { TsHtmlPluginStore } from "../../state/store";
import { getClosingTagFromHtmlTemplates } from "./get-closing-tag-from-html-templates";

/**
 * Returns closing tag information.
 * This makes it possible to auto close tags in templates.
 * @param prevLangService
 * @param store
 */
export const getClosingTagAtPosition = (prevLangService: LanguageService, store: TsHtmlPluginStore) => (fileName: string, position: number): JsxClosingTagInfo | undefined => {
	// Get program and more
	const program = prevLangService.getProgram()!;
	const checker = program.getTypeChecker();
	const sourceFile = program.getSourceFile(fileName)!;

	// Parse html tags in the relevant source file.
	// We want everything to be updated before proceeding.
	const reportResult = parseHtmlNodes(sourceFile, checker, store);
	store.absorbHtmlTemplateResult(sourceFile, reportResult);

	// Get closing tag result
	const htmlTemplates = store.getHtmlTemplatesForFile(fileName);
	const result = getClosingTagFromHtmlTemplates(sourceFile, htmlTemplates, position, store);

	return result || prevLangService.getJsxClosingTagAtPosition(fileName, position);
};
