import { setTypescriptModule as setTsIsAssignableModule } from "ts-simple-type";
import * as ts from "typescript";
import * as tsServer from "typescript/lib/tsserverlibrary";
import { getBuiltInHtmlCollection, getUserConfigHtmlCollection } from "../get-html-collection";
import { makeConfig } from "../state/config";
import { HtmlStoreDataSource, TsLitPluginStore } from "../state/store";
import { setTypescriptModule } from "../ts-module";
import { logger, LoggingLevel } from "../util/logger";
import { TsLitPlugin } from "./ts-lit-plugin";

/**
 * Creates the custom plugin.
 * @param typescript
 * @param info
 */
export function createPlugin(typescript: typeof ts, info: tsServer.server.PluginCreateInfo): TsLitPlugin {
	// Cache the typescript module
	setTsIsAssignableModule(typescript);
	setTypescriptModule(typescript);

	// Create the store
	const store = new TsLitPluginStore(typescript, info);
	store.config = makeConfig(info.config);

	// Setup logging
	logger.level = store.config.verbose ? LoggingLevel.VERBOSE : LoggingLevel.NONE;
	logger.cwd = store.config.cwd;
	logger.resetLogs();
	logger.verbose("CreateLitTsPlugin called");
	logger.debug("Config", store.config);

	// Add all HTML5 tags and attributes
	const builtInCollection = getBuiltInHtmlCollection();
	store.absorbCollection(builtInCollection, HtmlStoreDataSource.BUILD_IN);

	// Add user configured HTML5 collection
	const userCollection = getUserConfigHtmlCollection(store.config);
	store.absorbCollection(userCollection, HtmlStoreDataSource.USER);

	const prevLanguageService = info.languageService;

	return new TsLitPlugin(prevLanguageService, store);
}
