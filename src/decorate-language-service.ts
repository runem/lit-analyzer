import { LanguageService } from "typescript";
import { TsLitPlugin } from "./language-service/ts-lit-plugin";
import { logger } from "./util/logger";

export function decorateLanguageService(languageService: LanguageService, plugin: TsLitPlugin): LanguageService {
	const nextLanguageService: LanguageService = {
		...languageService,
		getCompletionsAtPosition: plugin.getCompletionsAtPosition.bind(plugin),
		getCompletionEntryDetails: plugin.getCompletionEntryDetails.bind(plugin),
		getSemanticDiagnostics: plugin.getSemanticDiagnostics.bind(plugin),
		getDefinitionAndBoundSpan: plugin.getDefinitionAndBoundSpan.bind(plugin),
		getCodeFixesAtPosition: plugin.getCodeFixesAtPosition.bind(plugin),
		getQuickInfoAtPosition: plugin.getQuickInfoAtPosition.bind(plugin),
		getJsxClosingTagAtPosition: plugin.getJsxClosingTagAtPosition.bind(plugin),
		getFormattingEditsForRange: plugin.getFormattingEditsForRange.bind(plugin)
	};

	// Make sure to call the old service if config.disable === true
	for (const methodName of Object.getOwnPropertyNames(nextLanguageService)) {
		const newMethod = (nextLanguageService as any)[methodName];
		const oldMethod = (languageService as any)[methodName];

		if (newMethod !== oldMethod) {
			(nextLanguageService as any)[methodName] = function() {
				if (plugin.config.disable && oldMethod != null) {
					return oldMethod(...arguments);
				}

				return wrapTryCatch(newMethod, oldMethod)(...arguments);
			};
		}
	}

	// Wrap all method called to the service in tryCatch and logging.
	if (plugin.config.verbose) {
		for (const methodName of Object.getOwnPropertyNames(nextLanguageService)) {
			const method = (nextLanguageService as any)[methodName];
			(nextLanguageService as any)[methodName] = wrapLog(methodName, method);
		}
	}
	return nextLanguageService;
}

/**
 * Wraps a function in try catch in order to debug the plugin.
 * If the function throws, this function logs the error.
 * @param newMethod
 * @param oldMethod
 */
function wrapTryCatch<T extends Function>(newMethod: T, oldMethod: T): T {
	return (((...args: unknown[]) => {
		try {
			return newMethod(...args);
		} catch (e) {
			logger.error(`Error: (${e.stack}) ${e.message}`, e);

			// Always return the old method if anything fails
			// Don't crash everything :-)
			return oldMethod(...args);
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
		/**
		 logger.verbose(`Typescript called ${name}`);
		 const result = proxy(...args);
		 logger.verbose("- result: ", result == null ? "nothing" : Array.isArray(result) ? `Length: ${result.length}` : "defined");
		 return result;
		 /*/
		return proxy(...args);
		/**/
	}) as unknown) as T;
}
