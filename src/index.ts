import * as ts from "typescript/lib/tsserverlibrary";
import { decorateLanguageService } from "./decorate-language-service";
import { createPlugin } from "./language-service/create-plugin";
import { TsLitPlugin } from "./language-service/ts-lit-plugin";
import { Config, makeConfig } from "./state/config";

const tsHtmlPluginSymbol = Symbol.for("__tsHtmlPlugin__");

let plugin: TsLitPlugin | undefined = undefined;

/**
 * Export a function for the ts-service to initialize our plugin.
 * @param typescript
 */
function init(typescript: { typescript: typeof ts }): ts.server.PluginModule {
	return {
		create: (info: ts.server.PluginCreateInfo) => {
			// Check if the language service is already decorated
			if ((info.languageService as any)[tsHtmlPluginSymbol]) {
				plugin = (info.languageService as any)[tsHtmlPluginSymbol];
				return info.languageService;
			}

			// Create the plugin
			plugin = createPlugin(typescript.typescript, info);

			// Extend existing language service with the plugin functions
			const decoratedService = decorateLanguageService(info.languageService, plugin);

			// Save that we've extended this service to prevent extending it again
			(decoratedService as any)[tsHtmlPluginSymbol] = plugin;

			return decoratedService;
		},

		onConfigurationChanged(config: Partial<Config>) {
			if (plugin == null || config == null) return;
			plugin.config = makeConfig(config);
		}
	};
}

export = init;
