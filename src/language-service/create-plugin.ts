import { setTypescriptModule as setTsIsAssignableModule } from "ts-simple-type";
import { LanguageService } from "typescript";
import * as ts from "typescript/lib/tsserverlibrary";
import { CustomElementExtension } from "../extensions/custom-element-extension";
import { LitHtmlExtension } from "../extensions/lit-html-extension";
import { UnknownElementExtension } from "../extensions/unknown-element-extension";
import { makeConfig } from "../state/config";
import { TsHtmlPluginStore } from "../state/store";
import { logger, LoggingLevel } from "../util/logger";
import { Plugin } from "./plugin";

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

/**
 * Creates the custom plugin.
 * @param typescript
 * @param info
 */
export function createPlugin(typescript: typeof ts, info: ts.server.PluginCreateInfo): LanguageService {
	// Cache the typescript module
	setTsIsAssignableModule(typescript);

	// Create the store
	const store = new TsHtmlPluginStore(typescript, info);
	store.config = makeConfig(info.config);

	// Setup logging
	logger.level = store.config.verbose ? LoggingLevel.ERROR : LoggingLevel.NONE;
	logger.resetLogs();
	logger.verbose("CreateLitTsPlugin called");
	logger.debug("Config", store.config);

	store.extension.addExtension(new UnknownElementExtension(), new CustomElementExtension(), new LitHtmlExtension());

	const prevLanguageService = info.languageService;

	// Don't do anything if the disable config has been enabled
	if (store.config.disable) {
		return prevLanguageService;
	}

	const plugin = new Plugin(prevLanguageService, store);

	const nextLanguageService: LanguageService = {
		...prevLanguageService,
		getCompletionsAtPosition: plugin.getCompletionsAtPosition.bind(plugin),
		getCodeFixesAtPosition: plugin.getCodeFixesAtPosition.bind(plugin),
		getSemanticDiagnostics: plugin.getSemanticDiagnostics.bind(plugin),
		getQuickInfoAtPosition: plugin.getQuickInfoAtPosition.bind(plugin),
		getFormattingEditsForRange: plugin.getFormattingEditsForRange.bind(plugin),
		getDefinitionAndBoundSpan: plugin.getDefinitionAndBoundSpan.bind(plugin),
		getJsxClosingTagAtPosition: plugin.getJsxClosingTagAtPosition.bind(plugin)
	};

	// Wrap all method called to the service in tryCatch and logging.
	if (store.config.verbose) {
		for (const methodName of Object.getOwnPropertyNames(nextLanguageService)) {
			const method = (nextLanguageService as any)[methodName];
			(nextLanguageService as any)[methodName] = wrapTryCatch(wrapLog(methodName, method));
		}
	}

	return nextLanguageService;
}
