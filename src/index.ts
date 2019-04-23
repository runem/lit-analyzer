import { setTypescriptModule as setTsIsAssignableModule } from "ts-simple-type";
import * as ts from "typescript";
import * as tsServer from "typescript/lib/tsserverlibrary";
import { decorateLanguageService } from "./decorate-language-service";
import { createPlugin } from "./language-service/create-plugin";
import { TsLitPlugin } from "./language-service/ts-lit-plugin";
import { LitPluginConfig, makeConfig } from "./state/lit-plugin-config";
import { setTypescriptModule } from "./ts-module";
import { logger } from "./util/logger";

const tsHtmlPluginSymbol = Symbol.for("__tsHtmlPlugin__");

let plugin: TsLitPlugin | undefined = undefined;

/**
 * Export a function for the ts-service to initialize our plugin.
 * @param typescript
 */
function init(typescript: { typescript: typeof ts }): tsServer.server.PluginModule {
	// Cache the typescript module
	setTsIsAssignableModule(typescript.typescript);
	setTypescriptModule(typescript.typescript);

	return {
		create: (info: tsServer.server.PluginCreateInfo) => {
			// Check if the language service is already decorated
			if ((info.languageService as any)[tsHtmlPluginSymbol]) {
				plugin = (info.languageService as any)[tsHtmlPluginSymbol];
				return info.languageService;
			}

			// Extend existing language service with the plugin functions
			try {
				// Create the plugin
				plugin = createPlugin(typescript.typescript, info);

				const decoratedService = decorateLanguageService(info.languageService, plugin);

				// Save that we've extended this service to prevent extending it again
				(decoratedService as any)[tsHtmlPluginSymbol] = plugin;

				return decoratedService;
			} catch (e) {
				logger.error("ts-lit-plugin crashed white decorating the language service...", e);

				return info.languageService;
			}
		},

		onConfigurationChanged(config: Partial<LitPluginConfig>) {
			if (plugin == null || config == null) return;
			plugin.context.updateConfig(makeConfig(config));
		}
	};
}

export = init;
