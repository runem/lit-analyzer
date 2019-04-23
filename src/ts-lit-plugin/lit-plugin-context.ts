import { getUserConfigHtmlCollection } from "../lit-analyzer/data/get-user-config-html-collection";
import { DefaultLitAnalyzerContext } from "../lit-analyzer/default-lit-analyzer-context";
import { LitAnalyzerConfig } from "../lit-analyzer/lit-analyzer-config";
import { HtmlDataSourceKind } from "../lit-analyzer/store/html-store/html-data-source-merged";
import { logger, LoggingLevel } from "../lit-analyzer/util/logger";

export class LitPluginContext extends DefaultLitAnalyzerContext {
	logger = logger;

	public updateConfig(config: LitAnalyzerConfig) {
		const hasChangedLogging = this.config.verbose !== config.verbose || this.config.cwd !== config.cwd;

		this._config = config;

		// Setup logging
		this.logger.cwd = config.cwd;
		this.logger.level = config.verbose ? LoggingLevel.VERBOSE : LoggingLevel.NONE;

		if (hasChangedLogging) {
			this.logger.resetLogs();
		}

		// Add user configured HTML5 collection
		const collection = getUserConfigHtmlCollection(config);
		this.htmlStore.absorbCollection(collection, HtmlDataSourceKind.USER);

		logger.debug("Updating the config", config);
	}
}
