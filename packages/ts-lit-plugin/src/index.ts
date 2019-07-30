/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitAnalyzerConfig, makeConfig } from "lit-analyzer";
import * as ts from "typescript";
import * as tsServer from "typescript/lib/tsserverlibrary";
import { decorateLanguageService } from "./decorate-language-service";
import { logger } from "./logger";
import { LitPluginContext } from "./ts-lit-plugin/lit-plugin-context";
import { TsLitPlugin } from "./ts-lit-plugin/ts-lit-plugin";
import { setTypescriptModule } from "./ts-module";

const tsHtmlPluginSymbol = Symbol.for("__tsHtmlPlugin__");

let context: LitPluginContext | undefined = undefined;

/**
 * Export a function for the ts-service to initialize our plugin.
 * @param typescript
 */
function init({ typescript }: { typescript: typeof ts }): tsServer.server.PluginModule {
	// Cache the typescript module
	setTypescriptModule(typescript);

	return {
		create: (info: tsServer.server.PluginCreateInfo) => {
			// Check if the language service is already decorated
			if ((info.languageService as any)[tsHtmlPluginSymbol] != null) {
				return info.languageService;
			}

			// Extend existing language service with the plugin functions
			try {
				context = new LitPluginContext({
					ts: typescript,
					getProgram: () => {
						return info.languageService.getProgram()!;
					},
					getProject: () => {
						return info.project;
					}
				});

				context.updateConfig(makeConfig(info.config));

				const plugin = new TsLitPlugin(info.languageService, context);

				const decoratedService = decorateLanguageService(info.languageService, plugin);

				// Save that we've extended this service to prevent extending it again
				(decoratedService as any)[tsHtmlPluginSymbol] = plugin;

				return decoratedService;
			} catch (e) {
				logger.error("ts-lit-plugin crashed while decorating the language service...", e);

				return info.languageService;
			}
		},

		onConfigurationChanged(config: Partial<LitAnalyzerConfig>) {
			if (context == null || config == null) return;
			context.updateConfig(makeConfig(config));
		}
	};
}

export = init;
