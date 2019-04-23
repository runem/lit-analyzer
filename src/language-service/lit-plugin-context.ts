import { getUserConfigHtmlCollection } from "../get-html-collection";
import { DefaultLitAnalyzerContext } from "../lit-analyzer/lit-analyzer-context";
import { HtmlDataSourceKind } from "../lit-analyzer/store/html-store/html-data-source-merged";
import { LitPluginConfig } from "../state/lit-plugin-config";
import { logger, LoggingLevel } from "../util/logger";

export class LitPluginContext extends DefaultLitAnalyzerContext {
	logger = logger;

	public updateConfig(config: LitPluginConfig) {
		const hasChangedLogging = this.config.verbose !== config.verbose || this.config.cwd !== config.cwd;

		this._config = config;

		// Setup logging
		logger.cwd = config.cwd;
		logger.level = config.verbose ? LoggingLevel.VERBOSE : LoggingLevel.NONE;

		if (hasChangedLogging) {
			logger.resetLogs();
		}

		// Add user configured HTML5 collection
		const collection = getUserConfigHtmlCollection(config);
		this.htmlStore.absorbCollection(collection, HtmlDataSourceKind.USER);

		logger.debug("Updating the config", config);
	}
}
