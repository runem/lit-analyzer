import { LanguageService, SourceFile } from "typescript";
import { parseComponents } from "../../parse-components/parse-components";
import { parseDependencies } from "../../parse-dependencies/parse-dependencies";
import { parseHtmlNodes } from "../../parse-html-nodes/parse-html-nodes";
import { TsHtmlPluginStore } from "../../state/store";
import { validateHtmlTemplate } from "../../validate-html-template/validate-html-template";
import { getDiagnosticsFromHtmlTemplates } from "./get-diagnostics-from-html-templates";

const sourceFileCache = new WeakSet<SourceFile>();

/**
 * Yields source files that have changed since last time this function was called.
 * @param sourceFiles
 */
function* forEachChangedSourceFile(sourceFiles: ReadonlyArray<SourceFile>): Iterable<SourceFile> {
	for (const sourceFile of sourceFiles) {
		if (!sourceFileCache.has(sourceFile)) {
			sourceFileCache.add(sourceFile);
			yield sourceFile;
		}
	}
}

/**
 * Calculates and returns semantic diagnostics for a file.
 * This makes it possible to provide errors and warning in html.
 * @param prevLangService
 * @param store
 */
export const getSemanticDiagnostics = (prevLangService: LanguageService, store: TsHtmlPluginStore) => (fileName: string) => {
	// Get program and checker
	const program = prevLangService.getProgram()!;
	const checker = program.getTypeChecker();
	const sourceFile = program.getSourceFile(fileName)!;

	// Find elements in all files
	for (const sourceFile of forEachChangedSourceFile(program.getSourceFiles())) {
		const customElementFileResult = parseComponents(sourceFile, checker);
		store.invalidateSourceFile(sourceFile);
		store.absorbComponentsInFile(sourceFile, customElementFileResult);
	}

	// Build a graph of element dependencies
	if (!store.config.ignoreImports) {
		store.importedComponentsInFile = parseDependencies(sourceFile, store);
	}

	// Parse html tags in the relevant source file
	const reportResult = parseHtmlNodes(sourceFile, checker, store);
	reportResult.templates.forEach(htmlTemplate => validateHtmlTemplate(htmlTemplate, checker, store));
	store.absorbHtmlTemplateResult(sourceFile, reportResult);

	// Convert html reports to diagnostics using extensions
	const htmlTemplates = store.getHtmlTemplatesForFile(fileName);
	const customDiagnostics = getDiagnosticsFromHtmlTemplates(htmlTemplates, store);

	return [...(prevLangService.getSemanticDiagnostics(fileName) || []), ...customDiagnostics];
};
