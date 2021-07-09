import { DefaultLitAnalyzerContext, LitAnalyzerConfig } from "lit-analyzer";
import { logger } from "../logger.js";

export class LitPluginContext extends DefaultLitAnalyzerContext {
	logger = logger;

	public updateConfig(config: LitAnalyzerConfig): void {
		const hasChangedLogging = config.logging !== "off" && (this.config.logging !== config.logging || this.config.cwd !== config.cwd);

		// Setup logging
		this.logger.cwd = config.cwd;

		super.updateConfig(config);

		if (hasChangedLogging) {
			this.logger.resetLogs();
		}

		logger.debug("Updating the config", config);
	}
}
