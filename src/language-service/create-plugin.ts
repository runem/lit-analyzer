import { setTypescriptModule as setTsIsAssignableModule } from "ts-simple-type";
import * as ts from "typescript/lib/tsserverlibrary";
import { CustomElementExtension } from "../extensions/custom-element-extension";
import { makeConfig } from "../state/config";
import { TsLitPluginStore } from "../state/store";
import { setTypescriptModule } from "../ts-module";
import { logger, LoggingLevel } from "../util/logger";
import { TsLitPlugin } from "./ts-lit-plugin";

/**
 * Creates the custom plugin.
 * @param typescript
 * @param info
 */
export function createPlugin(typescript: typeof ts, info: ts.server.PluginCreateInfo): TsLitPlugin {
	// Cache the typescript module
	setTsIsAssignableModule(typescript);
	setTypescriptModule(typescript);

	// Create the store
	const store = new TsLitPluginStore(typescript, info);
	store.config = makeConfig(info.config);

	// Setup logging
	logger.level = store.config.verbose ? LoggingLevel.ERROR : LoggingLevel.NONE;
	logger.resetLogs();
	logger.verbose("CreateLitTsPlugin called");
	logger.debug("Config", store.config);

	store.extension.addExtension(new CustomElementExtension());

	const prevLanguageService = info.languageService;

	return new TsLitPlugin(prevLanguageService, store);
}
