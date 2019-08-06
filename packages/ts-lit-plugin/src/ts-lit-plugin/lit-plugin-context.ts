import { DefaultLitAnalyzerContext, LitAnalyzerConfig } from "lit-analyzer";
import { logger, LoggingLevel } from "../logger";

export class LitPluginContext extends DefaultLitAnalyzerContext {
	logger = logger;

	public updateConfig(config: LitAnalyzerConfig) {
		const hasChangedLogging = config.logging !== "off" && (this.config.logging !== config.logging || this.config.cwd !== config.cwd);

		// Setup logging
		this.logger.cwd = config.cwd;
		this.logger.level = (() => {
			switch (config.logging) {
				case "off":
					return LoggingLevel.OFF;
				case "verbose":
					return LoggingLevel.VERBOSE;
				default:
					return LoggingLevel.OFF;
			}
		})();

		super.updateConfig(config);

		if (hasChangedLogging) {
			this.logger.resetLogs();
		}

		logger.debug("Updating the config", config);
	}
}
