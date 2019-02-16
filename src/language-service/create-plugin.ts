import { setTypescriptModule as setTsIsAssignableModule } from "ts-simple-type";
import * as ts from "typescript/lib/tsserverlibrary";
import { HTML5_GLOBAL_ATTRIBUTES, HTML5_TAGS, HTML5_VALUE_MAP } from "vscode-html-languageservice/lib/umd/languageFacts/data/html5";
import { parseData } from "../parsing/parse-data/parse-data";
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

	// Add all HTML5 tags and attributes
	const result = parseData({
		version: 1,
		tags: HTML5_TAGS,
		globalAttributes: HTML5_GLOBAL_ATTRIBUTES,
		valueSets: HTML5_VALUE_MAP
	});

	store.absorbHtmlTags(result.tags);
	store.absorbGlobalHtmlAttributes(result.globalAttrs);

	const prevLanguageService = info.languageService;

	return new TsLitPlugin(prevLanguageService, store);
}
