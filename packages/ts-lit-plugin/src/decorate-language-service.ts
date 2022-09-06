/* eslint-disable @typescript-eslint/no-explicit-any */
import { LanguageService } from "typescript";
import { logger } from "./logger.js";
import { TsLitPlugin } from "./ts-lit-plugin/ts-lit-plugin.js";

export function decorateLanguageService(languageService: LanguageService, plugin: TsLitPlugin): LanguageService {
	const languageServiceExtension: Partial<LanguageService> = {
		getCompletionsAtPosition: plugin.getCompletionsAtPosition.bind(plugin),
		getCompletionEntryDetails: plugin.getCompletionEntryDetails.bind(plugin),
		getSemanticDiagnostics: plugin.getSemanticDiagnostics.bind(plugin),
		getDefinitionAndBoundSpan: plugin.getDefinitionAndBoundSpan.bind(plugin),
		getCodeFixesAtPosition: plugin.getCodeFixesAtPosition.bind(plugin),
		getQuickInfoAtPosition: plugin.getQuickInfoAtPosition.bind(plugin),
		getJsxClosingTagAtPosition: plugin.getJsxClosingTagAtPosition.bind(plugin),
		getRenameInfo: plugin.getRenameInfo.bind(plugin),
		findRenameLocations: plugin.findRenameLocations.bind(plugin),
		getSignatureHelpItems: plugin.getSignatureHelpItems.bind(plugin)
		//getOutliningSpans: plugin.getOutliningSpans.bind(plugin)
		//getFormattingEditsForRange: plugin.getFormattingEditsForRange.bind(plugin)
	};

	const decoratedLanguageService: LanguageService = {
		...languageService,
		...languageServiceExtension
	};

	// Make sure to call the old service if config.disable === true
	for (const methodName of Object.getOwnPropertyNames(languageServiceExtension) as (keyof LanguageService)[]) {
		const newMethod: Function | undefined = decoratedLanguageService[methodName]!;
		const oldMethod: Function | undefined = languageService[methodName];

		decoratedLanguageService[methodName] = function (): any {
			if (plugin.context.config.disable && oldMethod != null) {
				return oldMethod(...arguments);
			}

			return wrapTryCatch(newMethod, oldMethod, methodName)(...arguments);
		};
	}

	// Wrap all method calls to the service in logging and performance measuring
	for (const methodName of Object.getOwnPropertyNames(decoratedLanguageService) as (keyof LanguageService)[]) {
		//const isDecorated = languageServiceExtension[methodName] != null;
		const isDecorated = decoratedLanguageService[methodName] != null;

		if (isDecorated) {
			const method = (decoratedLanguageService as any)[methodName];
			(decoratedLanguageService as any)[methodName] = wrapLog(methodName, method, plugin);
		}
	}
	return decoratedLanguageService;
}

/**
 * Wraps a function in try catch in order to debug the plugin.
 * If the function throws, this function logs the error.
 * @param newMethod
 * @param oldMethod
 * @param methodName
 */
function wrapTryCatch<T extends Function>(newMethod: T, oldMethod: T | undefined, methodName: string): T {
	return ((...args: unknown[]) => {
		try {
			return newMethod(...args);
		} catch (e) {
			let details: string;

			if (e instanceof Error) {
				details = `${e.message}\n${e.stack}`;
			} else {
				details = String(e);
			}
			logger.error(`Error [${methodName}]: ${details}`, e);

			// Always return the old method if anything fails
			// Don't crash everything :-)
			return oldMethod?.(...args);
		}
	}) as unknown as T;
}

/**
 * Wraps a function so that it is logged every time the function called.
 * @param name
 * @param proxy
 * @param plugin
 */
function wrapLog<T extends Function>(name: string, proxy: T, plugin: TsLitPlugin): T {
	return ((...args: unknown[]) => {
		if (plugin.context.config.logging === "verbose") {
			/**/
			const startTime = Date.now();
			logger.verbose(`[${name}] Called`);
			const result = proxy(...args);
			const time = Math.round(Date.now() - startTime);
			logger.verbose(
				`[${name}] Finished (${time}ms): Result: `,
				result == null ? "undefined" : Array.isArray(result) ? `Array: ${result.length} length` : "defined"
			);
			if (time > 100) {
				logger.warn(`[${name}] took long time to complete! (${time}ms)`);
			}
			return result;
		} else {
			return proxy(...args);
		}
	}) as unknown as T;
}
