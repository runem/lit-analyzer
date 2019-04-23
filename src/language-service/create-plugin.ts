import * as ts from "typescript";
import * as tsServer from "typescript/lib/tsserverlibrary";
import { getBuiltInHtmlCollection } from "../get-html-collection";
import { HtmlDataSourceKind } from "../lit-analyzer/store/html-store/html-data-source-merged";
import { makeConfig } from "../state/lit-plugin-config";
import { logger, LoggingLevel } from "../util/logger";
import { LitPluginContext } from "./lit-plugin-context";
import { TsLitPlugin } from "./ts-lit-plugin";

/**
 * Creates the custom plugin.
 * @param typescript
 * @param info
 */
export function createPlugin(typescript: typeof ts, info: tsServer.server.PluginCreateInfo): TsLitPlugin {
	// Create the store
	//const store = new TsLitPluginStore(typescript, info);
	//store.config = makeConfig(info.config);

	// Setup logging
	logger.level = LoggingLevel.VERBOSE;
	logger.resetLogs();

	// Add user configured HTML5 collection
	//const userCollection = getUserConfigHtmlCollection(store.config);
	//store.absorbCollection(userCollection, HtmlStoreDataSource.USER);

	const prevLanguageService = info.languageService;

	const context = new LitPluginContext({
		ts: typescript,
		getProgram: () => {
			return info.languageService.getProgram()!;
		},
		getProject: () => {
			return info.project;
		}
	});

	context.updateConfig(makeConfig(info.config));

	// Add all HTML5 tags and attributes
	const builtInCollection = getBuiltInHtmlCollection();
	context.htmlStore.absorbCollection(builtInCollection, HtmlDataSourceKind.BUILD_IN);

	return new TsLitPlugin(prevLanguageService, context);
}
