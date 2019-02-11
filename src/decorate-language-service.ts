import { LanguageService } from "typescript";
import { TsLitPlugin } from "./language-service/ts-lit-plugin";
import { logger } from "./util/logger";

export function decorateLanguageService(languageService: LanguageService, plugin: TsLitPlugin): LanguageService {
	const nextLanguageService: LanguageService = {
		...languageService,
		getCompletionsAtPosition: plugin.getCompletionsAtPosition.bind(plugin),
		getCodeFixesAtPosition: plugin.getCodeFixesAtPosition.bind(plugin),
		getSemanticDiagnostics: plugin.getSemanticDiagnostics.bind(plugin),
		getQuickInfoAtPosition: plugin.getQuickInfoAtPosition.bind(plugin),
		getFormattingEditsForRange: plugin.getFormattingEditsForRange.bind(plugin),
		getDefinitionAndBoundSpan: plugin.getDefinitionAndBoundSpan.bind(plugin),
		getJsxClosingTagAtPosition: plugin.getJsxClosingTagAtPosition.bind(plugin)
	};

	// Wrap all method called to the service in tryCatch and logging.
	if (plugin.config.verbose) {
		for (const methodName of Object.getOwnPropertyNames(nextLanguageService)) {
			const method = (nextLanguageService as any)[methodName];
			(nextLanguageService as any)[methodName] = wrapTryCatch(wrapLog(methodName, method));
		}
	}

	return nextLanguageService;
}

/**
 * Wraps a function in try catch in order to debug the plugin.
 * If the function throws, this function logs the error.
 * @param proxy
 */
function wrapTryCatch<T extends Function>(proxy: T): T {
	return (((...args: unknown[]) => {
		try {
			return proxy(...args);
		} catch (e) {
			logger.error(`Error (${e.stack}) ${e.message}`);
		}
	}) as unknown) as T;
}

/**
 * Wraps a function so that it is logged every time the function called.
 * @param name
 * @param proxy
 */
function wrapLog<T extends Function>(name: string, proxy: T): T {
	return (((...args: unknown[]) => {
		//logger.verbose(`Typescript called ${name}`);
		return proxy(...args);
	}) as unknown) as T;
}
