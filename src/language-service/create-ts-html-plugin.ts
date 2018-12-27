import { setTypescriptModule as setTsIsAssignableModule } from "ts-simple-type";
import { LanguageService } from "typescript";
import * as ts from "typescript/lib/tsserverlibrary";
import { CustomElementExtension } from "../extensions/custom-element-extension";
import { LitHtmlExtension } from "../extensions/lit-html-extension";
import { UnknownElementExtension } from "../extensions/unknown-element-extension";
import { VanillaHtmlExtension } from "../extensions/vanilla-html-extension";
import { makeConfig } from "../state/config";
import { TsHtmlPluginStore } from "../state/store";
import { logger, LoggingLevel } from "../util/logger";
import { getClosingTagAtPosition } from "./closing-tag-at-position/get-closing-tag-at-position";
import { getCodeFixesAtPosition } from "./code-fixes/get-code-fixes-at-position";
import { getCompletionsAtPosition } from "./completions/get-completions-at-position";
import { getDefinitionAndBoundSpan } from "./definition-and-bound-span/get-definition-and-bound-span";
import { getQuickInfoAtPosition } from "./quick-info/get-quick-info-at-position";
import { getSemanticDiagnostics } from "./semantic-diagnostics/get-semantic-diagnostics";

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
			logger.debug(`Error (${e.stack}) ${e.message}`);
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
export function createTsHtmlPlugin(typescript: typeof ts, info: ts.server.PluginCreateInfo): LanguageService {
	// Cache the typescript module
	setTsIsAssignableModule(typescript);

	// Create the store
	const store = new TsHtmlPluginStore(typescript, info);
	store.config = makeConfig(info.config);

	// Setup logging
	logger.level = store.config.verbose ? LoggingLevel.VERBOSE : LoggingLevel.NONE;
	logger.resetLogs();
	logger.verbose("CreateLitTsPlugin called");
	logger.debug("Config", store.config);

	// Choose extensions based on the config
	switch (store.config.flavor) {
		case "lit-html":
			store.extension.addExtension(new UnknownElementExtension(), new CustomElementExtension(), new LitHtmlExtension());
			break;
		case "vanilla":
			store.extension.addExtension(new UnknownElementExtension(), new CustomElementExtension(), new VanillaHtmlExtension());
			break;
		default:
			logger.debug("Unknown flavor");
			break;
	}

	const prevLanguageService = info.languageService;

	const nextLanguageService: LanguageService = {
		...prevLanguageService,
		getCompletionsAtPosition: getCompletionsAtPosition(prevLanguageService, store),
		getCodeFixesAtPosition: getCodeFixesAtPosition(prevLanguageService, store),
		getSemanticDiagnostics: getSemanticDiagnostics(prevLanguageService, store),
		getQuickInfoAtPosition: getQuickInfoAtPosition(prevLanguageService, store),
		getDefinitionAndBoundSpan: getDefinitionAndBoundSpan(prevLanguageService, store),
		getJsxClosingTagAtPosition: getClosingTagAtPosition(prevLanguageService, store)
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
